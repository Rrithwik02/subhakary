-- ROOT CAUSE: supabase/migrations/20260626093000_wedding_os_core.sql used
-- `CREATE TABLE IF NOT EXISTS public.wedding_events (...)` to introduce the
-- new Wedding OS sub-event model (wedding_id, event_type, budget_allocated,
-- ...). A table named wedding_events already existed from the older,
-- unrelated "Plan Wedding" feature (one row per wedding, keyed by user_id,
-- with wedding_size/wedding_style/is_primary) — so the CREATE silently
-- no-opped and the new Wedding OS columns were never added. Every insert
-- from WeddingOnboarding.tsx (wedding_id, event_type, title, budget_allocated,
-- ...) has been failing with "column not found" ever since.
--
-- Fix: add the missing new-model columns alongside the old ones (nullable,
-- so existing Plan Wedding rows are untouched), and update RLS to grant
-- access via EITHER the old user_id-ownership check or the new
-- wedding_id -> weddings.owner_user_id/wedding_members chain.

alter table public.wedding_events
  alter column user_id drop not null,
  add column if not exists wedding_id uuid references public.weddings(id) on delete cascade,
  add column if not exists event_type text,
  add column if not exists title text,
  add column if not exists event_time time without time zone,
  add column if not exists venue text,
  add column if not exists guest_count integer not null default 0,
  add column if not exists budget_allocated numeric not null default 0,
  add column if not exists notes text,
  add column if not exists checklist_progress integer not null default 0,
  add column if not exists sort_order integer not null default 0;

drop policy if exists "Owners manage their wedding events" on public.wedding_events;

create policy "Owners and wedding members manage wedding events"
on public.wedding_events
for all
using (
  (user_id is not null and auth.uid() = user_id)
  or (wedding_id is not null and public.can_access_wedding(wedding_id))
)
with check (
  (user_id is not null and auth.uid() = user_id)
  or (wedding_id is not null and public.can_manage_wedding(wedding_id))
);
