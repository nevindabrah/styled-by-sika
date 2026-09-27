-- Some services (miracle knots) take a range of hours; the calendar blocks the longest.
alter table public.styles add column if not exists base_duration_max_min int check(base_duration_max_min is null or base_duration_max_min>=base_duration_min);
