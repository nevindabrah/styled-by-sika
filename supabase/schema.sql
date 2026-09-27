-- Apply once to a fresh Supabase project, then apply migrations and run npm run db:seed. No client can read appointments.
create extension if not exists btree_gist;
create table public.styles(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,description text not null,base_price_cents int not null check(base_price_cents>=0),base_duration_min int not null check(base_duration_min>0),bundles_needed text not null,featured bool default false,active bool default true,sort_order int default 0,image_url text not null);
create table public.length_options(id uuid primary key,slug text unique not null,label text not null,sort_order int default 0);
create table public.size_options(id uuid primary key,slug text unique not null,label text not null,sort_order int default 0);
create table public.style_pricing(style_id uuid references styles,length_id uuid references length_options,size_id uuid references size_options,price_modifier_cents int not null,duration_modifier_min int not null,primary key(style_id,length_id,size_id));
create table public.addons(id uuid primary key,slug text unique not null,name text not null,price_cents int not null check(price_cents>=0),duration_min int default 0 check(duration_min>=0),active bool default true);
create table public.working_hours(weekday int primary key check(weekday between 0 and 6),open_time time,close_time time,check((open_time is null and close_time is null) or (open_time is not null and close_time>open_time)));
create table public.business_settings(id int primary key default 1 check(id=1),timezone text not null default 'America/Toronto',buffer_min int not null default 30 check(buffer_min>=0),minimum_notice_hours int not null default 24 check(minimum_notice_hours>=24),window_days int not null default 60 check(window_days between 1 and 60),deposit_cents int check(deposit_cents>=0),deposit_instructions text,prices_confirmed bool default false,hours_confirmed bool default false,policies_confirmed bool default false);
create table public.bookings(
 id uuid primary key default gen_random_uuid(),reference text unique not null,idempotency_key uuid unique not null,
 status text not null default 'pending_deposit' check(status in ('pending_deposit','confirmed','completed','cancelled','no_show')),
 style_id uuid references styles not null,length_id uuid references length_options not null,size_id uuid references size_options not null,addon_ids uuid[] not null default '{}',
 start_at timestamptz not null,end_at timestamptz not null,blocked_until timestamptz not null,price_cents int not null,duration_min int not null,
 client_name text not null,client_phone text not null,client_email text not null,client_instagram text,client_notes text,admin_notes text,
 google_event_id text,calendar_url text,snapshot jsonb not null,sync_state text not null default 'queued',created_at timestamptz default now(),
 check(end_at>start_at and blocked_until>=end_at),
 exclude using gist(tstzrange(start_at,blocked_until,'[)') with &&) where(status<>'cancelled')
);
create index on bookings(start_at);
create table public.booking_jobs(id uuid primary key default gen_random_uuid(),booking_id uuid references bookings not null,kind text not null check(kind in ('created','confirmed','cancelled')),reason text,attempts int not null default 0,available_at timestamptz not null default now(),lease_until timestamptz,completed_at timestamptz,last_error text,created_at timestamptz default now(),unique(booking_id,kind));
create table public.gallery_images(id uuid primary key default gen_random_uuid(),storage_path text not null,style_id uuid references styles,alt text not null,sort_order int default 0,active bool default true);
create table public.testimonials(id uuid primary key default gen_random_uuid(),client_name text not null,quote text not null,style_id uuid references styles,active bool default true);
create table public.faq(id uuid primary key default gen_random_uuid(),question text not null,answer text not null,sort_order int default 0,active bool default true);
-- A transactional outbox preserves calendar/email work across failed requests and deploys.
create function public.queue_booking_job() returns trigger language plpgsql set search_path=public as $$
begin
 if TG_OP='INSERT' then insert into booking_jobs(booking_id,kind) values(new.id,'created');
 elsif new.status is distinct from old.status and new.status in ('confirmed','cancelled') then insert into booking_jobs(booking_id,kind,reason) values(new.id,new.status,current_setting('app.cancel_reason',true)) on conflict do nothing;
 end if;return new;
end $$;
create trigger booking_job after insert or update on public.bookings for each row execute function public.queue_booking_job();
create function public.claim_booking_job(target uuid default null) returns setof public.booking_jobs language sql security definer set search_path=public as $$
 update booking_jobs set lease_until=now()+interval '3 minutes',attempts=attempts+1 where id=(select j.id from booking_jobs j where j.completed_at is null and j.available_at<=now() and (j.lease_until is null or j.lease_until<now()) and (target is null or j.booking_id=target) and not exists(select 1 from booking_jobs earlier where earlier.booking_id=j.booking_id and earlier.created_at<j.created_at and earlier.completed_at is null) order by j.created_at for update skip locked limit 1) returning *;
$$;
create function public.admin_update_booking(target uuid,new_status text,note text default null,cancel_reason text default null) returns void language plpgsql security definer set search_path=public as $$
declare old_status text;
begin
 select status into old_status from bookings where id=target for update;
 if not found then raise exception 'Booking not found'; end if;
 if new_status is not null and not ((old_status='pending_deposit' and new_status in ('confirmed','cancelled','no_show')) or (old_status='confirmed' and new_status in ('completed','cancelled','no_show'))) then raise exception 'This status change is not allowed'; end if;
 perform set_config('app.cancel_reason',coalesce(cancel_reason,''),true);
 update bookings set status=coalesce(new_status,status),admin_notes=coalesce(note,admin_notes) where id=target;
end $$;
revoke all on function public.claim_booking_job(uuid) from public,anon,authenticated;
revoke all on function public.admin_update_booking(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_booking_job(uuid) to service_role;
grant execute on function public.admin_update_booking(uuid,text,text,text) to service_role;
do $$ declare t text; begin
 foreach t in array array['styles','length_options','size_options','style_pricing','addons','working_hours','business_settings','gallery_images','testimonials','faq','bookings','booking_jobs'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 if t not in ('bookings','booking_jobs') then
 execute format('grant select on public.%I to anon, authenticated',t);
 execute format('create policy public_read on public.%I for select to anon, authenticated using (true)',t);
 end if;
 end loop;
end $$;
