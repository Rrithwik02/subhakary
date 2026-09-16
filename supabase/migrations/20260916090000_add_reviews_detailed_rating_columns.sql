-- Never applied: supabase/migrations/20251221172426_354865aa-e60a-4527-aa83-bd366d80b787.sql
-- (photos + the four aspect ratings) and 20260425063322_6ff323c1-072c-4ace-9de0-a5c2a64a09f6.sql
-- (wedding_size, wedding_budget_range). ReviewsList.tsx reads/writes all of
-- these for the detailed review breakdown; this is the exact gap flagged in
-- an earlier session's tsc audit of ReviewsList.tsx, now confirmed and
-- fixed via a full schema-drift audit.
alter table public.reviews
  add column if not exists photos text[] default '{}',
  add column if not exists service_quality_rating integer,
  add column if not exists communication_rating integer,
  add column if not exists value_for_money_rating integer,
  add column if not exists punctuality_rating integer,
  add column if not exists wedding_budget_range text,
  add column if not exists wedding_size text;

alter table public.reviews
  drop constraint if exists reviews_wedding_size_check;
alter table public.reviews
  add constraint reviews_wedding_size_check
  check (wedding_size is null or wedding_size in ('intimate','mid','grand'));
