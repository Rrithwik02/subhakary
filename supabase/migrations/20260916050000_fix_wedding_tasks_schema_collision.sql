-- Same collision as wedding_events: wedding_tasks already existed (old
-- shape: event_id -> wedding_events.id, no wedding_id/priority), so the
-- new CREATE TABLE IF NOT EXISTS in wedding_os_core.sql no-opped here too.
-- WeddingOnboarding.tsx / WeddingEventWorkspace.tsx insert wedding_id,
-- wedding_event_id, and priority, none of which existed.
alter table public.wedding_tasks
  alter column event_id drop not null,
  add column if not exists wedding_id uuid references public.weddings(id) on delete cascade,
  add column if not exists wedding_event_id uuid references public.wedding_events(id) on delete cascade,
  add column if not exists priority text not null default 'medium';

alter table public.wedding_tasks
  drop constraint if exists wedding_tasks_priority_check;
alter table public.wedding_tasks
  add constraint wedding_tasks_priority_check
  check (priority = any (array['low'::text, 'medium'::text, 'high'::text]));

drop policy if exists "Owners manage their tasks" on public.wedding_tasks;

create policy "Owners and wedding members manage tasks"
on public.wedding_tasks
for all
using (
  (event_id is not null and exists (
    select 1 from public.wedding_events e
    where e.id = wedding_tasks.event_id and e.user_id = auth.uid()
  ))
  or (wedding_id is not null and public.can_access_wedding(wedding_id))
)
with check (
  (event_id is not null and exists (
    select 1 from public.wedding_events e
    where e.id = wedding_tasks.event_id and e.user_id = auth.uid()
  ))
  or (wedding_id is not null and public.can_manage_wedding(wedding_id))
);
