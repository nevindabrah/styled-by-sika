-- Appointment reminders (24 hours and 2 hours before) and text messages.
-- Each column records when that message went out, so the scheduler never sends it twice.
begin;
alter table public.bookings
 add column if not exists reminder_day_sent_at timestamptz,
 add column if not exists reminder_2h_sent_at timestamptz;
alter table public.booking_jobs add column if not exists sms_sent_at timestamptz;
create index if not exists bookings_upcoming_idx on public.bookings(start_at) where status in ('pending_deposit','confirmed');
commit;
