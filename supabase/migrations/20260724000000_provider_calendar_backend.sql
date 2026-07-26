-- Provider calendar backend architecture
-- Adds provider events, booking source tracking, conflict validation,
-- reminder queues, time-slot configuration, and Google Calendar prep.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Core calendar tables
-- ---------------------------------------------------------

create table if not exists public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('subhakary_booking', 'external_booking', 'personal_event', 'vacation', 'holiday', 'leave')),
  event_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  all_day boolean not null default false,
  notes text,
  location text,
  source text not null default 'manual' check (source in ('manual', 'booking', 'import', 'google_calendar')),
  booking_id uuid references public.bookings(id) on delete cascade,
  booking_status text check (booking_status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_provider_events_booking_id
  on public.provider_events (booking_id)
  where booking_id is not null;

create index if not exists idx_provider_events_provider_date
  on public.provider_events (provider_id, event_date, source);

create index if not exists idx_provider_events_provider_type
  on public.provider_events (provider_id, event_type, source);

alter table public.service_provider_availability
  add column if not exists source text not null default 'manual',
  add column if not exists booking_id uuid references public.bookings(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_provider_availability_source_check'
  ) then
    alter table public.service_provider_availability
      add constraint service_provider_availability_source_check
      check (source in ('manual', 'booking', 'recurring'));
  end if;
end $$;

create index if not exists idx_service_provider_availability_provider_source_date
  on public.service_provider_availability (provider_id, source, specific_date, day_of_week);

create unique index if not exists idx_service_provider_availability_booking_block
  on public.service_provider_availability (booking_id, specific_date)
  where booking_id is not null and specific_date is not null;

create table if not exists public.provider_time_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  slot_kind text not null check (slot_kind in ('morning', 'afternoon', 'evening', 'custom')),
  slot_name text not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  max_capacity integer not null default 1 check (max_capacity > 0),
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_provider_time_slots_provider_kind_name
  on public.provider_time_slots (provider_id, slot_kind, slot_name);

create index if not exists idx_provider_time_slots_provider_enabled
  on public.provider_time_slots (provider_id, is_enabled, sort_order);

create table if not exists public.provider_calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.service_providers(id) on delete cascade,
  integration_name text not null default 'google_calendar',
  google_account_email text,
  google_calendar_id text,
  sync_status text not null default 'disconnected' check (sync_status in ('disconnected', 'connected', 'syncing', 'error')),
  sync_scope text not null default 'all' check (sync_scope in ('all', 'bookings_only')),
  auto_sync boolean not null default true,
  import_external boolean not null default false,
  last_synced_at timestamptz,
  sync_cursor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_event_reminders (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  provider_event_id uuid references public.provider_events(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('one_day_before', 'event_day')),
  reminder_channel text not null check (reminder_channel in ('email', 'push', 'notification')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  delivery_attempts integer not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_provider_event_reminders_unique
  on public.provider_event_reminders (coalesce(provider_event_id, booking_id), reminder_type, reminder_channel);

create index if not exists idx_provider_event_reminders_due
  on public.provider_event_reminders (status, scheduled_for);

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'provider_calendar_item'
  ) then
    create type public.provider_calendar_item as (
      id uuid,
      provider_id uuid,
      title text,
      event_type text,
      event_date date,
      start_time time without time zone,
      end_time time without time zone,
      all_day boolean,
      notes text,
      location text,
      source text,
      booking_id uuid,
      booking_status text,
      customer_name text,
      customer_phone text,
      is_blocked boolean,
      capacity_limit integer,
      bookings_count integer,
      created_at timestamptz,
      updated_at timestamptz
    );
  end if;
end $$;

-- ---------------------------------------------------------
-- Capacity rules reuse and provider-specific overrides
-- ---------------------------------------------------------

alter table public.booking_capacity_rules
  add column if not exists provider_id uuid references public.service_providers(id) on delete cascade,
  add column if not exists service_label text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'booking_capacity_rules_category_slug_key'
  ) then
    alter table public.booking_capacity_rules
      drop constraint booking_capacity_rules_category_slug_key;
  end if;
end $$;

create unique index if not exists idx_booking_capacity_rules_default_category
  on public.booking_capacity_rules (category_slug)
  where provider_id is null;

create unique index if not exists idx_booking_capacity_rules_provider_category
  on public.booking_capacity_rules (provider_id, category_slug)
  where provider_id is not null;

-- Seed default category rules only when a category exists and no default row is present.
insert into public.booking_capacity_rules (category_slug, max_bookings_per_day)
select sc.slug, 1
from public.service_categories sc
where not exists (
  select 1
  from public.booking_capacity_rules bcr
  where bcr.provider_id is null
    and bcr.category_slug = sc.slug
);

-- ---------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------

create or replace function public.is_provider_owner(p_provider_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.service_providers sp
    where sp.id = p_provider_id
      and sp.user_id = auth.uid()
  )
$$;

create or replace function public.get_provider_capacity_limit(p_provider_id uuid)
returns integer
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_category_slug text;
  v_capacity integer;
begin
  select sc.slug
    into v_category_slug
  from public.service_providers sp
  left join public.service_categories sc on sc.id = sp.category_id
  where sp.id = p_provider_id;

  select coalesce(candidate.max_bookings_per_day, 1)
    into v_capacity
  from (
    select max_bookings_per_day, 2 as priority
    from public.booking_capacity_rules
    where provider_id = p_provider_id
      and category_slug = v_category_slug
    union all
    select max_bookings_per_day, 1 as priority
    from public.booking_capacity_rules
    where provider_id is null
      and category_slug = v_category_slug
  ) candidate
  order by candidate.priority desc
  limit 1;

  return coalesce(v_capacity, 1);
end;
$$;

create or replace function public.validate_booking_request(
  p_provider_id uuid,
  p_service_date date,
  p_service_time text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_time_slot time without time zone default null,
  p_status text default 'pending',
  p_booking_id uuid default null
)
returns table (
  valid boolean,
  conflict_type text,
  message text,
  conflicting_id uuid,
  capacity_limit integer,
  bookings_count integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_start_date date := coalesce(p_start_date, p_service_date);
  v_end_date date := coalesce(p_end_date, p_service_date);
  v_capacity_limit integer := public.get_provider_capacity_limit(p_provider_id);
  v_booking_count integer := 0;
  v_conflicting_event uuid;
  v_conflicting_message text;
begin
  valid := true;
  conflict_type := null;
  message := null;
  conflicting_id := null;
  capacity_limit := v_capacity_limit;
  bookings_count := 0;

  if p_provider_id is null or v_start_date is null then
    valid := false;
    conflict_type := 'invalid_request';
    message := 'Provider and service date are required.';
    return next;
    return;
  end if;

  -- Manual blocked dates or provider leave/holiday entries
  select pe.id, pe.title
    into v_conflicting_event, v_conflicting_message
  from public.provider_events pe
  where pe.provider_id = p_provider_id
    and pe.booking_id is distinct from p_booking_id
    and daterange(pe.event_date, coalesce(pe.event_date, pe.event_date), '[]')
        && daterange(v_start_date, v_end_date, '[]')
    and pe.event_type in ('vacation', 'holiday', 'leave')
  order by pe.created_at desc
  limit 1;

  if v_conflicting_event is not null then
    valid := false;
    conflict_type := 'blocked_date';
    conflicting_id := v_conflicting_event;
    message := format('Date is blocked by "%s".', coalesce(v_conflicting_message, 'provider event'));
    return next;
    return;
  end if;

  select sa.id, sa.specific_date::text
    into v_conflicting_event, v_conflicting_message
  from public.service_provider_availability sa
  where sa.provider_id = p_provider_id
    and sa.is_blocked = true
    and sa.source in ('manual', 'recurring')
    and (
      (sa.specific_date is not null and sa.specific_date between v_start_date and v_end_date)
      or (sa.day_of_week is not null and sa.day_of_week = extract(dow from v_start_date))
    )
  limit 1;

  if v_conflicting_event is not null then
    valid := false;
    conflict_type := 'blocked_date';
    conflicting_id := v_conflicting_event;
    message := 'Date is blocked by provider availability settings.';
    return next;
    return;
  end if;

  -- Time overlap against accepted/active booking events and manual events.
  if p_service_time is not null then
    select pe.id, pe.title
      into v_conflicting_event, v_conflicting_message
    from public.provider_events pe
    where pe.provider_id = p_provider_id
      and pe.booking_id is distinct from p_booking_id
      and pe.event_date between v_start_date and v_end_date
      and coalesce(pe.booking_status, 'accepted') in ('pending', 'accepted', 'completed')
      and (
        pe.all_day = true
        or (
          pe.start_time is not null
          and pe.end_time is not null
          and p_time_slot is not null
          and (
            (p_time_slot < pe.end_time) and (coalesce(nullif(p_service_time, '')::time, p_time_slot) + interval '1 minute')::time > pe.start_time
          )
        )
      )
    order by pe.created_at desc
    limit 1;

    if v_conflicting_event is not null then
      valid := false;
      conflict_type := 'time_overlap';
      conflicting_id := v_conflicting_event;
      message := format('Time overlaps with "%s".', coalesce(v_conflicting_message, 'another event'));
      return next;
      return;
    end if;
  end if;

  -- Booking capacity based on accepted bookings only.
  select count(*)
    into v_booking_count
  from public.provider_events pe
  where pe.provider_id = p_provider_id
    and pe.source = 'booking'
    and pe.booking_status = 'accepted'
    and pe.event_date between v_start_date and v_end_date
    and pe.id is distinct from p_booking_id;

  bookings_count := v_booking_count;

  if p_status in ('pending', 'accepted') and v_booking_count >= v_capacity_limit then
    valid := false;
    conflict_type := 'capacity_reached';
    message := format('Daily capacity reached (%s/%s).', v_booking_count, v_capacity_limit);
    return next;
    return;
  end if;

  return next;
end;
$$;

create or replace function public.validate_provider_event_request(
  p_provider_id uuid,
  p_event_type text,
  p_event_date date,
  p_start_time time without time zone default null,
  p_end_time time without time zone default null,
  p_all_day boolean default false,
  p_provider_event_id uuid default null
)
returns table (
  valid boolean,
  conflict_type text,
  message text,
  conflicting_id uuid,
  capacity_limit integer,
  bookings_count integer
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_capacity integer := public.get_provider_capacity_limit(p_provider_id);
  v_booking_count integer := 0;
  v_conflict uuid;
  v_message text;
begin
  valid := true;
  conflict_type := null;
  message := null;
  conflicting_id := null;
  capacity_limit := v_capacity;
  bookings_count := 0;

  if p_provider_id is null or p_event_date is null then
    valid := false;
    conflict_type := 'invalid_request';
    message := 'Provider and event date are required.';
    return next;
    return;
  end if;

  select sa.id, sa.specific_date::text
    into v_conflict, v_message
  from public.service_provider_availability sa
  where sa.provider_id = p_provider_id
    and sa.is_blocked = true
    and sa.source in ('manual', 'recurring')
    and (
      (sa.specific_date is not null and sa.specific_date = p_event_date)
      or (sa.day_of_week is not null and sa.day_of_week = extract(dow from p_event_date))
    )
  limit 1;

  if v_conflict is not null then
    valid := false;
    conflict_type := 'blocked_date';
    conflicting_id := v_conflict;
    message := 'Date is blocked by provider availability settings.';
    return next;
    return;
  end if;

  if p_event_type in ('vacation', 'holiday', 'leave') or p_all_day then
    select pe.id, pe.title
      into v_conflict, v_message
    from public.provider_events pe
    where pe.provider_id = p_provider_id
      and pe.id is distinct from p_provider_event_id
      and daterange(pe.event_date, coalesce(pe.event_date, pe.event_date), '[]') &&
          daterange(p_event_date, p_event_date, '[]')
      and pe.source = 'booking'
      and coalesce(pe.booking_status, 'accepted') in ('pending', 'accepted', 'completed')
    limit 1;

    if v_conflict is not null then
      valid := false;
      conflict_type := 'blocked_date';
      conflicting_id := v_conflict;
      message := format('Date is already occupied by "%s".', coalesce(v_message, 'another booking'));
      return next;
      return;
    end if;
  end if;

  if not p_all_day and p_start_time is not null and p_end_time is not null then
    select pe.id, pe.title
      into v_conflict, v_message
    from public.provider_events pe
    where pe.provider_id = p_provider_id
      and pe.id is distinct from p_provider_event_id
      and pe.event_date = p_event_date
      and (
        pe.all_day = true
        or (
          pe.start_time is not null
          and pe.end_time is not null
          and p_start_time < pe.end_time
          and p_end_time > pe.start_time
        )
      )
    order by pe.created_at desc
    limit 1;

    if v_conflict is not null then
      valid := false;
      conflict_type := 'time_overlap';
      conflicting_id := v_conflict;
      message := format('Time overlaps with "%s".', coalesce(v_message, 'another event'));
      return next;
      return;
    end if;
  end if;

  select count(*)
    into v_booking_count
  from public.provider_events pe
  where pe.provider_id = p_provider_id
    and pe.source = 'booking'
    and pe.booking_status = 'accepted'
    and pe.event_date = p_event_date
    and pe.booking_id is distinct from p_booking_id;

  bookings_count := v_booking_count;

  if p_event_type in ('external_booking', 'vacation', 'holiday', 'leave') and v_booking_count >= v_capacity then
    valid := false;
    conflict_type := 'capacity_reached';
    message := format('Daily capacity reached (%s/%s).', v_booking_count, v_capacity);
    return next;
    return;
  end if;

  return next;
end;
$$;

-- ---------------------------------------------------------
-- Calendar RPCs
-- ---------------------------------------------------------

create or replace function public.get_provider_calendar(
  p_provider_id uuid,
  p_start_date date default null,
  p_end_date date default null
)
returns setof public.provider_calendar_item
language sql
stable
security invoker
set search_path = public
as $$
  with date_bounds as (
    select
      coalesce(p_start_date, current_date - interval '90 days')::date as start_date,
      coalesce(p_end_date, current_date + interval '180 days')::date as end_date
  ),
  booking_events as (
    select
      pe.id,
      pe.provider_id,
      pe.title,
      pe.event_type,
      pe.event_date,
      pe.start_time,
      pe.end_time,
      pe.all_day,
      pe.notes,
      pe.location,
      pe.source,
      pe.booking_id,
      pe.booking_status,
      p.full_name as customer_name,
      p.phone as customer_phone,
      false as is_blocked,
      public.get_provider_capacity_limit(pe.provider_id) as capacity_limit,
      (
        select count(*)
        from public.provider_events pe2
        where pe2.provider_id = pe.provider_id
          and pe2.source = 'booking'
          and pe2.booking_status = 'accepted'
          and pe2.event_date = pe.event_date
      ) as bookings_count,
      pe.created_at,
      pe.updated_at
    from public.provider_events pe
    left join public.bookings b on b.id = pe.booking_id
    left join public.profiles p on p.user_id = b.user_id
    cross join date_bounds db
    where pe.provider_id = p_provider_id
      and pe.event_date between db.start_date and db.end_date
  ),
  blocked_dates as (
    select
      sa.id,
      sa.provider_id,
      case
        when sa.source = 'recurring' then 'Recurring Block'
        else 'Blocked Date'
      end as title,
      'blocked_date' as event_type,
      coalesce(sa.specific_date, current_date) as event_date,
      sa.start_time,
      sa.end_time,
      true as all_day,
      null::text as notes,
      null::text as location,
      sa.source,
      sa.booking_id,
      null::text as booking_status,
      null::text as customer_name,
      null::text as customer_phone,
      true as is_blocked,
      public.get_provider_capacity_limit(sa.provider_id) as capacity_limit,
      0 as bookings_count,
      sa.created_at,
      sa.updated_at
    from public.service_provider_availability sa
    cross join date_bounds db
    where sa.provider_id = p_provider_id
      and sa.is_blocked = true
      and sa.source = 'manual'
      and sa.specific_date is not null
      and sa.specific_date between db.start_date and db.end_date
    union all
    select
      sa.id,
      sa.provider_id,
      case
        when sa.source = 'recurring' then 'Recurring Block'
        else 'Blocked Date'
      end as title,
      'blocked_date' as event_type,
      gs.day_date::date as event_date,
      sa.start_time,
      sa.end_time,
      true as all_day,
      null::text as notes,
      null::text as location,
      sa.source,
      sa.booking_id,
      null::text as booking_status,
      null::text as customer_name,
      null::text as customer_phone,
      true as is_blocked,
      public.get_provider_capacity_limit(sa.provider_id) as capacity_limit,
      0 as bookings_count,
      sa.created_at,
      sa.updated_at
    from public.service_provider_availability sa
    cross join date_bounds db
    cross join lateral generate_series(db.start_date, db.end_date, interval '1 day') as gs(day_date)
    where sa.provider_id = p_provider_id
      and sa.is_blocked = true
      and sa.source = 'recurring'
      and sa.specific_date is null
      and sa.day_of_week = extract(dow from gs.day_date)
  )
  select * from booking_events
  union all
  select * from blocked_dates
  order by event_date asc, coalesce(start_time, '00:00'::time) asc, created_at asc;
$$;

create or replace function public.get_provider_events(
  p_provider_id uuid,
  p_start_date date default null,
  p_end_date date default null
)
returns setof public.provider_calendar_item
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.get_provider_calendar(p_provider_id, p_start_date, p_end_date);
$$;

create or replace function public.get_today_events(p_provider_id uuid)
returns setof public.provider_calendar_item
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.get_provider_calendar(p_provider_id, current_date, current_date);
$$;

create or replace function public.get_tomorrow_events(p_provider_id uuid)
returns setof public.provider_calendar_item
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.get_provider_calendar(p_provider_id, current_date + 1, current_date + 1);
$$;

create or replace function public.get_upcoming_events(p_provider_id uuid, p_limit integer default 10)
returns setof public.provider_calendar_item
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.get_provider_calendar(p_provider_id, current_date, current_date + 90)
  order by event_date asc, coalesce(start_time, '00:00'::time) asc, created_at asc
  limit coalesce(p_limit, 10);
$$;

create or replace function public.get_availability_summary(
  p_provider_id uuid,
  p_for_date date default current_date
)
returns table (
  provider_id uuid,
  for_date date,
  capacity_limit integer,
  bookings_count integer,
  remaining_capacity integer,
  is_fully_booked boolean,
  is_blocked boolean,
  blocked_source_count integer,
  manual_event_count integer,
  booking_event_count integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p_provider_id,
    p_for_date,
    public.get_provider_capacity_limit(p_provider_id) as capacity_limit,
    coalesce((
      select count(*)
      from public.provider_events pe
      where pe.provider_id = p_provider_id
        and pe.source = 'booking'
        and pe.booking_status = 'accepted'
        and pe.event_date = p_for_date
    ), 0) as bookings_count,
    greatest(
      public.get_provider_capacity_limit(p_provider_id) - coalesce((
        select count(*)
        from public.provider_events pe
        where pe.provider_id = p_provider_id
          and pe.source = 'booking'
          and pe.booking_status = 'accepted'
          and pe.event_date = p_for_date
      ), 0),
      0
    ) as remaining_capacity,
    (
      coalesce((
        select count(*)
        from public.provider_events pe
        where pe.provider_id = p_provider_id
          and pe.source = 'booking'
          and pe.booking_status = 'accepted'
          and pe.event_date = p_for_date
      ), 0) >= public.get_provider_capacity_limit(p_provider_id)
    ) as is_fully_booked,
    exists (
      select 1
      from public.service_provider_availability sa
      where sa.provider_id = p_provider_id
        and sa.is_blocked = true
        and sa.source in ('manual', 'recurring')
        and (
          sa.specific_date = p_for_date
          or sa.day_of_week = extract(dow from p_for_date)
        )
    ) as is_blocked,
    (
      select count(*)
      from public.service_provider_availability sa
      where sa.provider_id = p_provider_id
        and sa.is_blocked = true
        and sa.source in ('manual', 'recurring')
    ) as blocked_source_count,
    (
      select count(*)
      from public.provider_events pe
      where pe.provider_id = p_provider_id
        and pe.source <> 'booking'
        and pe.event_date = p_for_date
    ) as manual_event_count,
    (
      select count(*)
      from public.provider_events pe
      where pe.provider_id = p_provider_id
        and pe.source = 'booking'
        and pe.event_date = p_for_date
    ) as booking_event_count;
$$;

-- ---------------------------------------------------------
-- Reminder queueing
-- ---------------------------------------------------------

create or replace function public.queue_provider_event_reminders(
  p_provider_id uuid,
  p_booking_id uuid default null,
  p_provider_event_id uuid default null,
  p_event_date date default null,
  p_event_title text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preferences record;
  v_now timestamptz := now();
  v_target_date date := coalesce(p_event_date, current_date);
  v_provider_email_time text;
begin
  select
    np.email_enabled,
    np.push_enabled,
    coalesce(np.booking_updates, true) as booking_updates,
    coalesce(np.schedule_reminders, true) as schedule_reminders,
    coalesce(np.reminder_day_before, true) as reminder_day_before,
    coalesce(np.reminder_event_day, true) as reminder_event_day,
    coalesce(np.schedule_email_timing, '24h') as schedule_email_timing,
    coalesce(np.schedule_summary_time, '08:00'::time) as schedule_summary_time
  into v_preferences
  from public.service_providers sp
  left join public.notification_preferences np on np.user_id = sp.user_id
  where sp.id = p_provider_id
  limit 1;

  v_provider_email_time := coalesce(v_preferences.schedule_email_timing, '24h');

  if coalesce(v_preferences.schedule_reminders, true) = false then
    return;
  end if;

  if coalesce(v_preferences.reminder_day_before, true) then
    insert into public.provider_event_reminders (
      provider_id,
      booking_id,
      provider_event_id,
      reminder_type,
      reminder_channel,
      scheduled_for,
      status,
      payload
    )
    values (
      p_provider_id,
      p_booking_id,
      p_provider_event_id,
      'one_day_before',
      'notification',
      (v_target_date::timestamp - interval '1 day' + coalesce(v_preferences.schedule_summary_time, '08:00'::time)),
      'pending',
      jsonb_build_object('title', p_event_title, 'event_date', v_target_date)
    )
    on conflict do nothing;

    insert into public.provider_event_reminders (
      provider_id,
      booking_id,
      provider_event_id,
      reminder_type,
      reminder_channel,
      scheduled_for,
      status,
      payload
    )
    values (
      p_provider_id,
      p_booking_id,
      p_provider_event_id,
      'one_day_before',
      'email',
      (v_target_date::timestamp - interval '1 day' + coalesce(v_preferences.schedule_summary_time, '08:00'::time)),
      'pending',
      jsonb_build_object('title', p_event_title, 'event_date', v_target_date)
    )
    on conflict do nothing;
  end if;

  if coalesce(v_preferences.reminder_event_day, true) then
    insert into public.provider_event_reminders (
      provider_id,
      booking_id,
      provider_event_id,
      reminder_type,
      reminder_channel,
      scheduled_for,
      status,
      payload
    )
    values (
      p_provider_id,
      p_booking_id,
      p_provider_event_id,
      'event_day',
      'notification',
      (v_target_date::timestamp + coalesce(v_preferences.schedule_summary_time, '08:00'::time)),
      'pending',
      jsonb_build_object('title', p_event_title, 'event_date', v_target_date)
    )
    on conflict do nothing;

    insert into public.provider_event_reminders (
      provider_id,
      booking_id,
      provider_event_id,
      reminder_type,
      reminder_channel,
      scheduled_for,
      status,
      payload
    )
    values (
      p_provider_id,
      p_booking_id,
      p_provider_event_id,
      'event_day',
      'email',
      (v_target_date::timestamp + coalesce(v_preferences.schedule_summary_time, '08:00'::time)),
      'pending',
      jsonb_build_object('title', p_event_title, 'event_date', v_target_date)
    )
    on conflict do nothing;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- Booking / event sync triggers
-- ---------------------------------------------------------

create or replace function public.sync_booking_calendar_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start_date date := coalesce(new.start_date, new.service_date);
  v_end_date date := coalesce(new.end_date, new.service_date);
  v_title text;
  v_start_time time;
  v_end_time time;
  v_valid record;
  d date;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    if new.status in ('pending', 'accepted', 'completed') then
      select * into v_valid
      from public.validate_booking_request(
        new.provider_id,
        new.service_date,
        new.service_time,
        new.start_date,
        new.end_date,
        new.time_slot,
        new.status,
        new.id
      );

      if coalesce(v_valid.valid, true) = false then
        raise exception 'Booking conflict: %', coalesce(v_valid.message, 'unable to save booking');
      end if;
    end if;

    v_title := coalesce(
      (select we.name from public.wedding_events we where we.id = coalesce(new.event_id, new.wedding_event_id)),
      'Subhakary Booking'
    );
    v_start_time := case when nullif(new.service_time, '') is null then null else nullif(new.service_time, '')::time end;
    v_end_time := case when v_start_time is null then null else (v_start_time + interval '1 hour')::time end;

    insert into public.provider_events (
      provider_id,
      title,
      event_type,
      event_date,
      start_time,
      end_time,
      all_day,
      notes,
      location,
      source,
      booking_id,
      booking_status
    )
    values (
      new.provider_id,
      v_title,
      'subhakary_booking',
      v_start_date,
      v_start_time,
      v_end_time,
      v_start_time is null,
      new.message,
      null,
      'booking',
      new.id,
      new.status::text
    )
    on conflict (booking_id) do update set
      provider_id = excluded.provider_id,
      title = excluded.title,
      event_type = excluded.event_type,
      event_date = excluded.event_date,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      all_day = excluded.all_day,
      notes = excluded.notes,
      location = excluded.location,
      booking_status = excluded.booking_status,
      updated_at = now();

    if new.status = 'accepted' then
      delete from public.service_provider_availability
      where booking_id = new.id
        and source = 'booking';

      for d in
        select generate_series(v_start_date, v_end_date, interval '1 day')::date
      loop
        insert into public.service_provider_availability (
          provider_id,
          specific_date,
          is_blocked,
          is_available,
          start_time,
          end_time,
          source,
          booking_id
        )
        values (
          new.provider_id,
          d,
          true,
          false,
          '00:00',
          '23:59',
          'booking',
          new.id
        )
        on conflict do nothing;
      end loop;

      perform public.queue_provider_event_reminders(
        new.provider_id,
        new.id,
        null,
        v_start_date,
        v_title
      );
    elsif new.status in ('cancelled', 'rejected') then
      delete from public.service_provider_availability
      where booking_id = new.id
        and source = 'booking';

      delete from public.provider_events
      where booking_id = new.id
        and source = 'booking';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_provider_event_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valid record;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    select * into v_valid
    from public.validate_provider_event_request(
      new.provider_id,
      new.event_type,
      new.event_date,
      new.start_time,
      new.end_time,
      new.all_day,
      new.id
    );

    if coalesce(v_valid.valid, true) = false then
      raise exception 'Schedule conflict: %', coalesce(v_valid.message, 'unable to save provider event');
    end if;

    insert into public.provider_event_reminders (
      provider_id,
      provider_event_id,
      reminder_type,
      reminder_channel,
      scheduled_for,
      status,
      payload
    )
    values (
      new.provider_id,
      new.id,
      'event_day',
      'notification',
      new.event_date::timestamp + time '08:00',
      'pending',
      jsonb_build_object('title', new.title, 'event_type', new.event_type)
    )
    on conflict do nothing;

    if new.event_type in ('external_booking', 'vacation', 'holiday', 'leave') then
      perform public.queue_provider_event_reminders(
        new.provider_id,
        null,
        new.id,
        new.event_date,
        new.title
      );
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------

alter table public.provider_events enable row level security;
alter table public.provider_time_slots enable row level security;
alter table public.provider_calendar_integrations enable row level security;
alter table public.provider_event_reminders enable row level security;
alter table public.booking_capacity_rules enable row level security;

drop policy if exists "Providers can view own provider events" on public.provider_events;
create policy "Providers can view own provider events"
on public.provider_events
for select
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can manage own provider events" on public.provider_events;
create policy "Providers can manage own provider events"
on public.provider_events
for all
using (
  public.is_provider_owner(provider_id)
  and source <> 'booking'
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  (public.is_provider_owner(provider_id) and source <> 'booking')
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can view own time slots" on public.provider_time_slots;
create policy "Providers can view own time slots"
on public.provider_time_slots
for select
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can manage own time slots" on public.provider_time_slots;
create policy "Providers can manage own time slots"
on public.provider_time_slots
for all
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can view own integrations" on public.provider_calendar_integrations;
create policy "Providers can view own integrations"
on public.provider_calendar_integrations
for select
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can manage own integrations" on public.provider_calendar_integrations;
create policy "Providers can manage own integrations"
on public.provider_calendar_integrations
for all
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can view own event reminders" on public.provider_event_reminders;
create policy "Providers can view own event reminders"
on public.provider_event_reminders
for select
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can manage own event reminders" on public.provider_event_reminders;
create policy "Providers can manage own event reminders"
on public.provider_event_reminders
for all
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can view capacity rules" on public.booking_capacity_rules;
create policy "Providers can view capacity rules"
on public.booking_capacity_rules
for select
using (
  provider_id is null
  or public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Providers can manage own capacity rules" on public.booking_capacity_rules;
create policy "Providers can manage own capacity rules"
on public.booking_capacity_rules
for all
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Booking-generated rows are internal only; preserve direct provider/public access to manual availability.
drop policy if exists "Anyone can view provider availability" on public.service_provider_availability;
create policy "Anyone can view provider availability"
on public.service_provider_availability
for select
using (true);

drop policy if exists "Providers can manage their availability" on public.service_provider_availability;
create policy "Providers can manage their availability"
on public.service_provider_availability
for all
using (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  public.is_provider_owner(provider_id)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Booking rows already have RLS from previous migrations; add no new customer exposure.

-- Notification preferences enhancements for calendar reminders.
alter table public.notification_preferences
  add column if not exists schedule_reminders boolean not null default true,
  add column if not exists reminder_day_before boolean not null default true,
  add column if not exists reminder_event_day boolean not null default true,
  add column if not exists schedule_email_timing text not null default '24h' check (schedule_email_timing in ('1h', '24h', '48h')),
  add column if not exists schedule_summary_time time without time zone not null default '08:00';

-- ---------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------

drop trigger if exists update_provider_events_updated_at on public.provider_events;
create trigger update_provider_events_updated_at
before update on public.provider_events
for each row execute function public.update_updated_at_column();

drop trigger if exists update_provider_time_slots_updated_at on public.provider_time_slots;
create trigger update_provider_time_slots_updated_at
before update on public.provider_time_slots
for each row execute function public.update_updated_at_column();

drop trigger if exists update_provider_calendar_integrations_updated_at on public.provider_calendar_integrations;
create trigger update_provider_calendar_integrations_updated_at
before update on public.provider_calendar_integrations
for each row execute function public.update_updated_at_column();

drop trigger if exists update_provider_event_reminders_updated_at on public.provider_event_reminders;
create trigger update_provider_event_reminders_updated_at
before update on public.provider_event_reminders
for each row execute function public.update_updated_at_column();

drop trigger if exists update_booking_capacity_rules_updated_at on public.booking_capacity_rules;
create trigger update_booking_capacity_rules_updated_at
before update on public.booking_capacity_rules
for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------
-- Booking and calendar sync triggers
-- ---------------------------------------------------------

drop trigger if exists trg_sync_booking_calendar_event on public.bookings;
create trigger trg_sync_booking_calendar_event
after insert or update of status, service_date, service_time, start_date, end_date, time_slot, event_id, wedding_event_id
on public.bookings
for each row
execute function public.sync_booking_calendar_event();

drop trigger if exists trg_sync_provider_event_on_change on public.provider_events;
create trigger trg_sync_provider_event_on_change
after insert or update of provider_id, title, event_type, event_date, start_time, end_time, all_day, notes, location, source
on public.provider_events
for each row
execute function public.sync_provider_event_on_change();

-- ---------------------------------------------------------
-- Grants for new public schema objects
-- ---------------------------------------------------------

grant select, insert, update, delete on public.provider_events to authenticated, service_role;
grant select, insert, update, delete on public.provider_time_slots to authenticated, service_role;
grant select, insert, update, delete on public.provider_calendar_integrations to authenticated, service_role;
grant select, insert, update, delete on public.provider_event_reminders to authenticated, service_role;
grant select, insert, update, delete on public.booking_capacity_rules to authenticated, service_role;
grant select, insert, update on public.notification_preferences to authenticated, service_role;

grant execute on function public.get_provider_calendar(uuid, date, date) to authenticated, anon, service_role;
grant execute on function public.get_provider_events(uuid, date, date) to authenticated, anon, service_role;
grant execute on function public.get_today_events(uuid) to authenticated, anon, service_role;
grant execute on function public.get_tomorrow_events(uuid) to authenticated, anon, service_role;
grant execute on function public.get_upcoming_events(uuid, integer) to authenticated, anon, service_role;
grant execute on function public.get_availability_summary(uuid, date) to authenticated, anon, service_role;
grant execute on function public.validate_booking_request(uuid, date, text, date, date, time, text, uuid) to authenticated, anon, service_role;
grant execute on function public.validate_provider_event_request(uuid, text, date, time, time, boolean, uuid) to authenticated, service_role;
grant execute on function public.get_provider_capacity_limit(uuid) to authenticated, service_role;
grant execute on function public.queue_provider_event_reminders(uuid, uuid, uuid, date, text) to service_role;

notify pgrst, 'reload schema';
