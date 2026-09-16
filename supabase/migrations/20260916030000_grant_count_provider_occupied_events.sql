-- validate_booking_request() and get_availability_summary() are both
-- SECURITY INVOKER and call count_provider_occupied_events() internally,
-- but only validate_booking_request/get_provider_capacity_limit/etc. were
-- ever granted EXECUTE (see supabase/migrations/20260724000000_provider_calendar_backend.sql
-- and 20260727000000_google_calendar_integration.sql) — this one function
-- was omitted from both grant lists, so every real booking submission by
-- an authenticated customer hits "permission denied for function
-- count_provider_occupied_events".
grant execute on function public.count_provider_occupied_events(uuid, date, date)
  to authenticated, anon, service_role;
