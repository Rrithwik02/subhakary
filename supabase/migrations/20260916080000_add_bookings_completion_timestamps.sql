-- Never applied: supabase/migrations/20251221172426_354865aa-e60a-4527-aa83-bd366d80b787.sql
-- defines these for the booking-completion flow (CompletionDetailsForm.tsx
-- writes both when a provider marks a booking complete). Found via a full
-- schema-drift audit cross-checking every ADD COLUMN in supabase/migrations/
-- against live information_schema.
alter table public.bookings
  add column if not exists completion_requested_at timestamptz,
  add column if not exists auto_complete_at timestamptz;
