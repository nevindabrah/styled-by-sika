-- Everything the braider edits from her dashboard: categories, photos and the website text.
-- Services stay in `styles`, add-ons in `addons`. Photos are uploaded to the public Storage bucket `photos`
-- (created by `npm run db:seed`); only their public URLs are stored here.
begin;
create table if not exists public.categories(
 slug text primary key,
 label text not null,
 short text not null default '',
 sort_order int not null default 0,
 active bool not null default true
);
create table if not exists public.style_photos(
 id uuid primary key default gen_random_uuid(),
 category text not null,
 storage_path text,
 url text not null,
 alt text not null default '',
 width int not null check(width>0),
 height int not null check(height>0),
 own bool not null default false,
 sort_order int not null default 0,
 created_at timestamptz default now()
);
-- The seed matches built-in photos by URL.
create unique index if not exists style_photos_url_key on public.style_photos(url);
create table if not exists public.site_content(
 key text primary key,
 value jsonb not null,
 updated_at timestamptz default now()
);
alter table public.styles alter column image_url set default '';
alter table public.styles alter column bundles_needed set default '';
do $$ declare t text; begin
 foreach t in array array['categories','style_photos','site_content'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
commit;
