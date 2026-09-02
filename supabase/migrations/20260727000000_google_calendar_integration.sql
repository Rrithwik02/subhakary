-- Google Calendar integration for provider dashboard
-- Adds private token storage, sync queueing, Google-aware validation,
-- and read-only imported calendar events.

create extension if not exists pgcrypto;

create schema if not exists private;

-- ---------------------------------------------------------
-- Provider event / integration metadata
-- ---------------------------------------------------------

alter table public.provider_events
  add column if not exists external_source_id text,
  add column if not exists external_source_payload jsonb not null default '{}'::jsonb,
  add column if not exists sync_status text not null default 'pending',
  add column if not exists sync_error text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists end_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_events_sync_status_check'
  ) then
    alter table public.provider_events
      add constraint provider_events_sync_status_check
      check (sync_status in ('pending', 'synced', 'error', 'deleted'));
  end if;
end $$;

create unique index if not exists idx_provider_events_external_source
  on public.provider_events (provider_id, source, external_source_id)
  where external_source_id is not null;

alter table public.provider_calendar_integrations
  add column if not exists google_account_name text,
  add column if not exists google_calendar_name text,
  add column if not exists google_calendar_timezone text,
  add column if not exists google_access_token_expires_at timestamptz,
  add column if not exists google_connected_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_imported_at timestamptz,
  add column if not exists last_exported_at timestamptz;

-- ---------------------------------------------------------
-- Private encrypted token storage
-- ---------------------------------------------------------

create table if not exists private.provider_google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.service_providers(id) on delete cascade,
  google_account_email text,
  google_access_token_ciphertext text not null,
  google_refresh_token_ciphertext text,
  access_token_expires_at timestamptz,
  token_scopes text[] not null default '{}'::text[],
  calendar_id text not null default 'primary',
  token_type text not null default 'Bearer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_private_google_calendar_tokens_provider
  on private.provider_google_calendar_tokens (provider_id);

grant usage on schema private to service_role;
grant select, insert, update, delete on private.provider_google_calendar_tokens to service_role;

-- ---------------------------------------------------------
-- Sync queue
-- ---------------------------------------------------------

create table if not exists public.provider_calendar_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  entity_type text not null check (entity_type in ('booking', 'provider_event', 'calendar')),
  operation text not null check (operation in ('upsert', 'delete', 'import', 'refresh')),
  entity_id uuid,
  google_event_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'succeeded', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_provider_calendar_sync_jobs_due
  on public.provider_calendar_sync_jobs (status, next_attempt_at);

create index if not exists idx_provider_calendar_sync_jobs_provider
  on public.provider_calendar_sync_jobs (provider_id, status);

alter table public.provider_calendar_sync_jobs enable row level security;

grant select, insert, update, delete on public.provider_calendar_sync_jobs to service_role;

create or replace function public.queue_provider_calendar_sync_job(
  p_provider_id uuid,
  p_entity_type text,
  p_operation text,
  p_entity_id uuid default null,
  p_google_event_id text default null,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_key text := concat_ws(
    ':',
    p_provider_id::text,
    p_entity_type,
    p_operation,
    coalesce(p_entity_id::text, p_google_event_id, 'pending')
  );
begin
  insert into public.provider_calendar_sync_jobs (
    job_key,
    provider_id,
    entity_type,
    operation,
    entity_id,
    google_event_id,
    payload,
    status,
    attempts,
    next_attempt_at,
    last_error
  )
  values (
    v_job_key,
    p_provider_id,
    p_entity_type,
    p_operation,
    p_entity_id,
    p_google_event_id,
    coalesce(p_payload, '{}'::jsonb),
    'pending',
    0,
    now(),
    null
  )
  on conflict (job_key) do update set
    provider_id = excluded.provider_id,
    entity_type = excluded.entity_type,
    operation = excluded.operation,
    entity_id = excluded.entity_id,
    google_event_id = excluded.google_event_id,
    payload = excluded.payload,
    status = 'pending',
    attempts = 0,
    next_attempt_at = now(),
    last_error = null,
    processed_at = null,
    updated_at = now();
end;
$$;

grant execute on function public.queue_provider_calendar_sync_job(uuid, text, text, uuid, text, jsonb) to service_role;

-- ---------------------------------------------------------
-- Google-aware validation helpers
-- ---------------------------------------------------------

create or replace function public.count_provider_occupied_events(
  p_provider_id uuid,
  p_start_date date,
  p_end_date date
)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(count(*), 0)::integer
  from public.provider_events pe
  where pe.provider_id = p_provider_id
    and daterange(pe.event_date, coalesce(pe.end_date, pe.event_date), '[]') && daterange(p_start_date, p_end_date, '[]')
    and (
      (pe.source = 'booking' and pe.booking_status = 'accepted')
      or pe.event_type = 'external_booking'
      or pe.source = 'google_calendar'
    )
    and coalesce(pe.booking_status, 'accepted') not in ('rejected', 'cancelled')
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

  select pe.id, pe.title
    into v_conflicting_event, v_conflicting_message
  from public.provider_events pe
  where pe.provider_id = p_provider_id
    and pe.booking_id is distinct from p_booking_id
    and daterange(pe.event_date, coalesce(pe.end_date, pe.event_date), '[]')
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

  if p_service_time is not null then
    select pe.id, pe.title
      into v_conflicting_event, v_conflicting_message
    from public.provider_events pe
    where pe.provider_id = p_provider_id
      and pe.booking_id is distinct from p_booking_id
      and daterange(pe.event_date, coalesce(pe.end_date, pe.event_date), '[]') && daterange(v_start_date, v_end_date, '[]')
      and coalesce(pe.booking_status, 'accepted') not in ('rejected', 'cancelled')
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

  select public.count_provider_occupied_events(p_provider_id, v_start_date, v_end_date)
    into v_booking_count;

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
      and daterange(pe.event_date, coalesce(pe.end_date, pe.event_date), '[]') &&
          daterange(p_event_date, p_event_date, '[]')
      and (
        pe.source = 'booking'
        or pe.event_type = 'external_booking'
        or pe.source = 'google_calendar'
      )
      and coalesce(pe.booking_status, 'accepted') not in ('rejected', 'cancelled')
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

  select public.count_provider_occupied_events(p_provider_id, p_event_date, p_event_date)
    into v_booking_count;

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
-- Google queue trigger
-- ---------------------------------------------------------

create or replace function public.queue_google_calendar_sync_for_provider_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_sync boolean := false;
  v_operation text;
  v_provider_id uuid;
  v_entity_id uuid;
  v_google_event_id text;
begin
  if tg_op = 'INSERT' then
    v_provider_id := new.provider_id;
    if new.source = 'google_calendar' then
      return new;
    end if;

    if new.source = 'booking'
      or (new.source = 'manual' and new.event_type = 'external_booking')
    then
      v_should_sync := exists (
        select 1
        from public.provider_calendar_integrations pci
        where pci.provider_id = new.provider_id
          and pci.sync_status = 'connected'
          and pci.auto_sync = true
      );

      if v_should_sync and (new.source = 'booking' or coalesce((select pci.sync_scope from public.provider_calendar_integrations pci where pci.provider_id = new.provider_id limit 1), 'all') = 'all') then
        v_operation := 'upsert';
      end if;
    end if;
  elsif tg_op = 'UPDATE' then
    v_provider_id := new.provider_id;

    if new.source = 'google_calendar' then
      return new;
    end if;

    if old.title is not distinct from new.title
      and old.event_type is not distinct from new.event_type
      and old.event_date is not distinct from new.event_date
      and coalesce(old.start_time, time '00:00') is not distinct from coalesce(new.start_time, time '00:00')
      and coalesce(old.end_time, time '00:00') is not distinct from coalesce(new.end_time, time '00:00')
      and old.all_day is not distinct from new.all_day
      and old.location is not distinct from new.location
      and old.notes is not distinct from new.notes
      and old.booking_status is not distinct from new.booking_status
      and old.booking_id is not distinct from new.booking_id
      and old.source is not distinct from new.source
    then
      return new;
    end if;

    if new.source = 'booking'
      or (new.source = 'manual' and new.event_type = 'external_booking')
    then
      v_should_sync := exists (
        select 1
        from public.provider_calendar_integrations pci
        where pci.provider_id = new.provider_id
          and pci.sync_status = 'connected'
          and pci.auto_sync = true
      );

      if v_should_sync and (new.source = 'booking' or coalesce((select pci.sync_scope from public.provider_calendar_integrations pci where pci.provider_id = new.provider_id limit 1), 'all') = 'all') then
        v_operation := 'upsert';
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    v_provider_id := old.provider_id;

    if old.source = 'google_calendar' then
      return old;
    end if;

    if old.source = 'booking'
      or (old.source = 'manual' and old.event_type = 'external_booking')
    then
      v_should_sync := exists (
        select 1
        from public.provider_calendar_integrations pci
        where pci.provider_id = old.provider_id
          and pci.sync_status = 'connected'
          and pci.auto_sync = true
      );

      if v_should_sync and (old.source = 'booking' or coalesce((select pci.sync_scope from public.provider_calendar_integrations pci where pci.provider_id = old.provider_id limit 1), 'all') = 'all') then
        v_operation := 'delete';
      end if;
    end if;
  end if;

  if v_should_sync and v_operation is not null then
    v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
    v_google_event_id := case when tg_op = 'DELETE' then old.external_source_id else new.external_source_id end;

    perform public.queue_provider_calendar_sync_job(
      v_provider_id,
      'provider_event',
      v_operation,
      v_entity_id,
      v_google_event_id,
      jsonb_build_object(
        'provider_event_id', v_entity_id,
        'source', case when tg_op = 'DELETE' then old.source else new.source end,
        'event_type', case when tg_op = 'DELETE' then old.event_type else new.event_type end
      )
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------
-- Calendar RPC payloads with Google fields
-- ---------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'provider_calendar_item'
  ) then
    drop type public.provider_calendar_item cascade;
  end if;
end $$;

create type public.provider_calendar_item as (
  id uuid,
  provider_id uuid,
  title text,
  event_type text,
  event_date date,
  end_date date,
  start_time time without time zone,
  end_time time without time zone,
  all_day boolean,
  notes text,
  location text,
  source text,
  external_source_id text,
  booking_id uuid,
  booking_status text,
  customer_name text,
  customer_phone text,
  is_blocked boolean,
  capacity_limit integer,
  bookings_count integer,
  sync_status text,
  sync_error text,
  created_at timestamptz,
  updated_at timestamptz
);

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
      pe.end_date,
      pe.start_time,
      pe.end_time,
      pe.all_day,
      pe.notes,
      pe.location,
      pe.source,
      pe.external_source_id,
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
          and (
            (pe2.source = 'booking' and pe2.booking_status = 'accepted')
            or pe2.event_type = 'external_booking'
          )
          and pe2.event_date = pe.event_date
      ) as bookings_count,
      pe.sync_status,
      pe.sync_error,
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
      null::date as end_date,
      sa.start_time,
      sa.end_time,
      true as all_day,
      null::text as notes,
      null::text as location,
      sa.source,
      null::text as external_source_id,
      sa.booking_id,
      null::text as booking_status,
      null::text as customer_name,
      null::text as customer_phone,
      true as is_blocked,
      public.get_provider_capacity_limit(sa.provider_id) as capacity_limit,
      0 as bookings_count,
      null::text as sync_status,
      null::text as sync_error,
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
      null::date as end_date,
      sa.start_time,
      sa.end_time,
      true as all_day,
      null::text as notes,
      null::text as location,
      sa.source,
      null::text as external_source_id,
      sa.booking_id,
      null::text as booking_status,
      null::text as customer_name,
      null::text as customer_phone,
      true as is_blocked,
      public.get_provider_capacity_limit(sa.provider_id) as capacity_limit,
      0 as bookings_count,
      null::text as sync_status,
      null::text as sync_error,
      sa.created_at,
      sa.updated_at
    from public.service_provider_availability sa
    cross join date_bounds db
    cross join lateral generate_series(
      db.start_date,
      db.end_date,
      interval '1 day'
    ) as gs(day_date)
    where sa.provider_id = p_provider_id
      and sa.is_blocked = true
      and sa.source = 'recurring'
      and sa.day_of_week is not null
      and sa.day_of_week = extract(dow from gs.day_date)
  )
  select * from booking_events
  union all
  select * from blocked_dates;
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
    coalesce(public.count_provider_occupied_events(p_provider_id, p_for_date, p_for_date), 0) as bookings_count,
    greatest(
      public.get_provider_capacity_limit(p_provider_id) - coalesce(public.count_provider_occupied_events(p_provider_id, p_for_date, p_for_date), 0),
      0
    ) as remaining_capacity,
    (
      coalesce(public.count_provider_occupied_events(p_provider_id, p_for_date, p_for_date), 0) >= public.get_provider_capacity_limit(p_provider_id)
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
        and pe.event_date = p_for_date
        and pe.source <> 'booking'
    ) as manual_event_count,
    (
      select count(*)
      from public.provider_events pe
      where pe.provider_id = p_provider_id
        and daterange(pe.event_date, coalesce(pe.end_date, pe.event_date), '[]') && daterange(p_for_date, p_for_date, '[]')
        and coalesce(pe.booking_status, 'accepted') not in ('rejected', 'cancelled')
        and (
          pe.source = 'booking'
          or pe.event_type = 'external_booking'
          or pe.source = 'google_calendar'
        )
    ) as booking_event_count;
$$;

-- ---------------------------------------------------------
-- Booking and event triggers
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
      end_date,
      start_time,
      end_time,
      all_day,
      notes,
      location,
      source,
      booking_id,
      booking_status,
      sync_status
    )
    values (
      new.provider_id,
      v_title,
      'subhakary_booking',
      v_start_date,
      v_end_date,
      v_start_time,
      v_end_time,
      v_start_time is null,
      new.message,
      null,
      'booking',
      new.id,
      new.status::text,
      'pending'
    )
    on conflict (booking_id) do update set
      provider_id = excluded.provider_id,
      title = excluded.title,
      event_type = excluded.event_type,
      event_date = excluded.event_date,
      end_date = excluded.end_date,
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
    if new.source = 'google_calendar' then
      return new;
    end if;

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

drop trigger if exists trg_sync_provider_event_on_change on public.provider_events;
create trigger trg_sync_provider_event_on_change
after insert or update of provider_id, title, event_type, event_date, end_date, start_time, end_time, all_day, notes, location, source
on public.provider_events
for each row
execute function public.sync_provider_event_on_change();

drop trigger if exists trg_queue_google_calendar_sync on public.provider_events;
create trigger trg_queue_google_calendar_sync
after insert or update or delete on public.provider_events
for each row
execute function public.queue_google_calendar_sync_for_provider_event();

-- ---------------------------------------------------------
-- RLS policy updates
-- ---------------------------------------------------------

drop policy if exists "Providers can manage own provider events" on public.provider_events;
create policy "Providers can manage own provider events"
on public.provider_events
for all
using (
  ((public.is_provider_owner(provider_id) and source not in ('booking', 'google_calendar')))
  or public.has_role(auth.uid(), 'admin'::public.app_role)
)
with check (
  ((public.is_provider_owner(provider_id) and source not in ('booking', 'google_calendar')))
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ---------------------------------------------------------
-- Grants
-- ---------------------------------------------------------

grant select, insert, update, delete on public.provider_events to authenticated, service_role;
grant select, insert, update, delete on public.provider_time_slots to authenticated, service_role;
grant select, insert, update, delete on public.provider_calendar_integrations to authenticated, service_role;
grant select, insert, update, delete on public.provider_event_reminders to authenticated, service_role;
grant select, insert, update, delete on public.booking_capacity_rules to authenticated, service_role;
grant select, insert, update on public.notification_preferences to authenticated, service_role;
grant select, insert, update, delete on public.provider_calendar_sync_jobs to service_role;

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
