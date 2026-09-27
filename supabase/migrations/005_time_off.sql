-- One-off blocked periods (days off, holidays, a few hours) that the braider sets in her dashboard.
begin;
create table if not exists public.time_off(
 id uuid primary key default gen_random_uuid(),
 start_at timestamptz not null,
 end_at timestamptz not null,
 reason text not null default '',
 created_at timestamptz default now(),
 check(end_at>start_at)
);
create index if not exists time_off_start_idx on public.time_off(start_at);
alter table public.time_off enable row level security;
revoke all on public.time_off from anon, authenticated;
grant all on public.time_off to service_role;
commit;
