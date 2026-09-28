-- Week-by-week availability she plans ahead (e.g. December weeks in July). A row sets her hours for that date;
-- null times mean closed that day. Dates without a row use her usual week (working_hours).
begin;
create table if not exists public.availability_days(
 date date primary key,
 open_time time,
 close_time time,
 check((open_time is null and close_time is null) or (open_time is not null and close_time>open_time))
);
alter table public.availability_days enable row level security;
revoke all on public.availability_days from anon, authenticated;
grant all on public.availability_days to service_role;
-- Let clients book up to a year ahead; the old default of 60 days hid anything she planned further out.
alter table public.business_settings drop constraint if exists business_settings_window_days_check;
alter table public.business_settings add constraint business_settings_window_days_check check(window_days between 1 and 366);
update public.business_settings set window_days=365 where window_days=60;
commit;
