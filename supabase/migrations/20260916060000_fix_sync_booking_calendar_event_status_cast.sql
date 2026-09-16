-- NOTE: a peer session working concurrently on this same project diagnosed
-- and applied this exact fix live (their local commit 6709efc on
-- fix/auth-critical-bugs-and-whatsapp-bot, not yet pushed at the time this
-- file was written). This migration is captured here so this branch is
-- self-consistent; if that commit is pushed later, de-duplicate the two
-- files at merge time — they fix the same two bugs the same way.
--
-- Bug 1 — "function public.validate_booking_request(...) does not exist":
-- bookings.status is the booking_status ENUM. The AFTER INSERT/UPDATE
-- trigger sync_booking_calendar_event() called
-- validate_booking_request(..., new.status, ...) positionally, passing an
-- enum value into a parameter declared `text` (changed from booking_status
-- to text via a prior CREATE OR REPLACE FUNCTION, but this trigger was
-- never updated to match). Postgres has no implicit cast from a
-- user-defined enum to text for function-argument resolution, so every
-- real booking INSERT/UPDATE with status in ('pending','accepted','completed')
-- failed. This was NOT a PostgREST cache issue — a direct .rpc() call
-- always sends plain JSON and resolves fine against the function's current
-- signature; only this trigger's internal positional call was broken.
-- Fixed with new.status::text at that one call site.
--
-- Bug 2 (masked by bug 1 until it was fixed) — "no unique or exclusion
-- constraint matching the ON CONFLICT specification": provider_events has
-- only a PARTIAL unique index on booking_id
-- (idx_provider_events_booking_id, WHERE booking_id IS NOT NULL). This
-- trigger's "ON CONFLICT (booking_id)" didn't repeat that predicate, so
-- Postgres couldn't infer the index as an arbiter on an actual conflict
-- (a second insert/update for the same booking_id). Fixed by adding the
-- matching WHERE clause to the ON CONFLICT specification.
--
-- Verified live: a real INSERT into bookings, then an UPDATE of a tracked
-- column on the same row (to force the ON CONFLICT path), both succeeded
-- end-to-end with correct provider_events side effects; test rows cleaned
-- up afterward.
create or replace function public.sync_booking_calendar_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_start_date date := coalesce(new.start_date, new.service_date);
  v_end_date date := coalesce(new.end_date, new.service_date);
  v_title text;
  v_start_time time;
  v_end_time time;
  v_valid record;
  d date;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    if new.status in ('pending', 'accepted', 'completed') then
      select * into v_valid
      from public.validate_booking_request(
        new.provider_id,
        new.service_date,
        new.service_time,
        new.start_date,
        new.end_date,
        new.time_slot,
        new.status::text,
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

    insert into public.provider_events(
      provider_id, title, event_type, event_date, start_time, end_time,
      all_day, notes, location, source, booking_id, booking_status
    ) values (
      new.provider_id, v_title, 'subhakary_booking', v_start_date, v_start_time, v_end_time,
      v_start_time is null, new.message, null, 'booking', new.id, new.status::text
    )
    on conflict (booking_id) where booking_id is not null do update set
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
      delete from public.service_provider_availability where booking_id = new.id and source = 'booking';
      for d in select generate_series(v_start_date, v_end_date, interval '1 day')::date loop
        insert into public.service_provider_availability(
          provider_id, specific_date, is_blocked, is_available, start_time, end_time, source, booking_id
        ) values (
          new.provider_id, d, true, false, '00:00', '23:59', 'booking', new.id
        )
        on conflict do nothing;
      end loop;
      perform public.queue_provider_event_reminders(new.provider_id, new.id, null, v_start_date, v_title);
    elsif new.status in ('cancelled', 'rejected') then
      delete from public.service_provider_availability where booking_id = new.id and source = 'booking';
      delete from public.provider_events where booking_id = new.id and source = 'booking';
    end if;
  end if;

  return new;
end;
$function$;
