-- The braider turns online booking on and off from her dashboard (previously a hosting setting).
alter table public.business_settings add column if not exists booking_open bool not null default false;
