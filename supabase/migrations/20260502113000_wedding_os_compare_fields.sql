alter table public.service_bundles
  add column if not exists response_time_hours integer,
  add column if not exists cancellation_policy text;
