begin;
alter table public.business_settings
 add column if not exists cancellation_policy text,
 add column if not exists lateness_policy text,
 add column if not exists guest_policy text;
-- Server-only access to operational settings; public pages expose selected fields.
revoke all on public.business_settings from anon, authenticated;
drop policy if exists public_read on public.business_settings;
-- Explicit service grants also work on projects without default table grants.
grant all on all tables in schema public to service_role;
commit;
