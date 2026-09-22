-- Create a Wedding OS atomically.  The previous browser-side sequence could
-- leave a wedding and events behind when a later RLS-protected insert failed.
--
-- This also replaces the stale requirements policy installed by
-- 20260716093000_sync_live_schema.sql.  Wedding OS events are owned through
-- wedding_id; their legacy user_id is intentionally null.

alter table public.weddings
  add column if not exists creation_key uuid;

alter table public.weddings
  drop constraint if exists weddings_owner_user_id_creation_key_key;

alter table public.weddings
  add constraint weddings_owner_user_id_creation_key_key
  unique (owner_user_id, creation_key);

-- The old planning feature used pending/completed while the Wedding OS UI
-- uses todo/done.  Keep legacy values valid and allow the OS task workflow.
alter table public.wedding_tasks
  drop constraint if exists wedding_tasks_status_check;

alter table public.wedding_tasks
  add constraint wedding_tasks_status_check
  check (status = any (array['pending'::text, 'todo'::text, 'in_progress'::text, 'completed'::text, 'done'::text, 'skipped'::text]));

alter table public.wedding_tasks
  alter column status set default 'todo';

drop policy if exists "Members can view event requirements" on public.wedding_event_vendor_requirements;
drop policy if exists "Owners can manage event requirements" on public.wedding_event_vendor_requirements;

create policy "Members can view event requirements"
on public.wedding_event_vendor_requirements
for select
using (
  exists (
    select 1
    from public.wedding_events event
    where event.id = wedding_event_id
      and event.wedding_id is not null
      and public.can_access_wedding(event.wedding_id)
  )
);

create policy "Owners can manage event requirements"
on public.wedding_event_vendor_requirements
for all
using (
  exists (
    select 1
    from public.wedding_events event
    where event.id = wedding_event_id
      and event.wedding_id is not null
      and public.can_manage_wedding(event.wedding_id)
  )
)
with check (
  exists (
    select 1
    from public.wedding_events event
    where event.id = wedding_event_id
      and event.wedding_id is not null
      and public.can_manage_wedding(event.wedding_id)
  )
);

-- These predate Wedding OS and seed the legacy event_id-based checklist and
-- budget-category tables.  Let legacy events retain that behaviour, but do
-- not create orphaned duplicate rows when a Wedding OS event is inserted.
create or replace function public.seed_default_wedding_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev_date date := coalesce(new.event_date, (now() + interval '90 days')::date);
begin
  if new.wedding_id is not null then
    return new;
  end if;

  insert into public.wedding_tasks (event_id, title, category, due_date, sort_order, is_default) values
    (new.id, 'Set your wedding budget', 'planning', ev_date - 90, 1, true),
    (new.id, 'Finalize guest list', 'planning', ev_date - 80, 2, true),
    (new.id, 'Book venue / function hall', 'venue', ev_date - 75, 3, true),
    (new.id, 'Book photographer & videographer', 'vendors', ev_date - 60, 4, true),
    (new.id, 'Book caterer', 'vendors', ev_date - 55, 5, true),
    (new.id, 'Book decorator', 'vendors', ev_date - 50, 6, true),
    (new.id, 'Book makeup artist & mehndi', 'vendors', ev_date - 45, 7, true),
    (new.id, 'Book pandit / priest', 'vendors', ev_date - 40, 8, true),
    (new.id, 'Send invitations', 'planning', ev_date - 30, 9, true),
    (new.id, 'Confirm all vendor payments', 'payments', ev_date - 14, 10, true),
    (new.id, 'Final headcount to caterer', 'vendors', ev_date - 7, 11, true),
    (new.id, 'Wedding day!', 'event', ev_date, 12, true);
  return new;
end;
$$;

create or replace function public.seed_default_wedding_budget_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  budget numeric := coalesce(new.total_budget, 0);
begin
  if new.wedding_id is not null then
    return new;
  end if;

  insert into public.wedding_budget_categories (event_id, category, planned_amount) values
    (new.id, 'Venue', round(budget * 0.30)),
    (new.id, 'Catering', round(budget * 0.25)),
    (new.id, 'Photography', round(budget * 0.15)),
    (new.id, 'Decor', round(budget * 0.15)),
    (new.id, 'Makeup and Mehndi', round(budget * 0.08)),
    (new.id, 'Music and Entertainment', round(budget * 0.07));
  return new;
end;
$$;

create or replace function public.create_wedding_workspace(
  p_wedding jsonb,
  p_events jsonb,
  p_common_tasks jsonb,
  p_budget_items jsonb,
  p_creation_key uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_wedding_id uuid;
  v_event_id uuid;
  v_event jsonb;
  v_requirement jsonb;
  v_task jsonb;
  v_budget_item jsonb;
  v_event_ids jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a Wedding OS';
  end if;

  if p_creation_key is null then
    raise exception 'A creation key is required to create a Wedding OS';
  end if;

  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) = 0 then
    raise exception 'Select at least one event to create a Wedding OS';
  end if;

  select id into v_wedding_id
  from public.weddings
  where owner_user_id = auth.uid() and creation_key = p_creation_key;

  if v_wedding_id is not null then
    return v_wedding_id;
  end if;

  insert into public.weddings (
    owner_user_id, creation_key, bride_name, groom_name, title, wedding_date,
    is_estimated_date, budget_range, total_budget, city, location, guest_count,
    wedding_type, cultural_preferences, notes
  ) values (
    auth.uid(), p_creation_key, p_wedding->>'brideName', p_wedding->>'groomName',
    p_wedding->>'title', nullif(p_wedding->>'weddingDate', '')::date,
    coalesce((p_wedding->>'isEstimatedDate')::boolean, false), p_wedding->>'budgetRange',
    coalesce((p_wedding->>'totalBudget')::numeric, 0), p_wedding->>'city',
    nullif(p_wedding->>'location', ''), coalesce((p_wedding->>'guestCount')::integer, 0),
    p_wedding->>'weddingType', coalesce(array(select jsonb_array_elements_text(p_wedding->'culturalPreferences')), '{}'::text[]),
    nullif(p_wedding->>'notes', '')
  )
  on conflict (owner_user_id, creation_key) do nothing
  returning id into v_wedding_id;

  if v_wedding_id is null then
    select id into v_wedding_id
    from public.weddings
    where owner_user_id = auth.uid() and creation_key = p_creation_key;
    return v_wedding_id;
  end if;

  insert into public.wedding_members (wedding_id, user_id, display_name, email, role, permission_level, status)
  values (v_wedding_id, auth.uid(), 'Owner', nullif(auth.jwt() ->> 'email', ''), 'owner', 'approve', 'active');

  for v_event in select value from jsonb_array_elements(p_events)
  loop
    insert into public.wedding_events (
      wedding_id, event_type, title, event_date, city, guest_count, budget_allocated, sort_order
    ) values (
      v_wedding_id, v_event->>'eventType', v_event->>'title',
      nullif(v_event->>'eventDate', '')::date, v_event->>'city',
      coalesce((v_event->>'guestCount')::integer, 0), coalesce((v_event->>'budgetAllocated')::numeric, 0),
      coalesce((v_event->>'sortOrder')::integer, 0)
    ) returning id into v_event_id;

    v_event_ids := v_event_ids || jsonb_build_object(v_event->>'eventType', v_event_id::text);

    for v_requirement in select value from jsonb_array_elements(coalesce(v_event->'requirements', '[]'::jsonb))
    loop
      insert into public.wedding_event_vendor_requirements (
        wedding_event_id, category_slug, category_name, required_count
      ) values (
        v_event_id, v_requirement->>'categorySlug', v_requirement->>'categoryName',
        coalesce((v_requirement->>'requiredCount')::integer, 1)
      );
    end loop;

    for v_task in select value from jsonb_array_elements(coalesce(v_event->'tasks', '[]'::jsonb))
    loop
      insert into public.wedding_tasks (wedding_id, wedding_event_id, title, priority, due_date)
      values (
        v_wedding_id, v_event_id, v_task->>'title',
        coalesce(v_task->>'priority', 'medium'), nullif(v_task->>'dueDate', '')::date
      );
    end loop;
  end loop;

  for v_task in select value from jsonb_array_elements(coalesce(p_common_tasks, '[]'::jsonb))
  loop
    insert into public.wedding_tasks (wedding_id, title, priority, due_date)
    values (v_wedding_id, v_task->>'title', coalesce(v_task->>'priority', 'medium'), nullif(v_task->>'dueDate', '')::date);
  end loop;

  for v_budget_item in select value from jsonb_array_elements(coalesce(p_budget_items, '[]'::jsonb))
  loop
    insert into public.wedding_budget_items (
      wedding_id, wedding_event_id, category_slug, category_name, planned_amount
    ) values (
      v_wedding_id, nullif(v_event_ids ->> (v_budget_item->>'eventType'), '')::uuid,
      v_budget_item->>'categorySlug', v_budget_item->>'categoryName',
      coalesce((v_budget_item->>'plannedAmount')::numeric, 0)
    );
  end loop;

  return v_wedding_id;
end;
$$;

revoke all on function public.create_wedding_workspace(jsonb, jsonb, jsonb, jsonb, uuid) from public;
grant execute on function public.create_wedding_workspace(jsonb, jsonb, jsonb, jsonb, uuid) to authenticated;

notify pgrst, 'reload schema';
