

# Plan: Auto-Block Dates When Bookings Are Accepted

## What we're building
When a provider accepts a booking, automatically block that date in `service_provider_availability` so no new bookings can be made for the same date. If a booking is cancelled or rejected, unblock the date (unless other bookings exist on that date).

## Changes

### 1. Database trigger (migration)
Create a trigger function `auto_block_booking_date()` on the `bookings` table:
- **On status change to `accepted`**: Insert a record into `service_provider_availability` with `is_blocked = true` and `specific_date = service_date` (if one doesn't already exist for that provider + date).
- **On status change to `cancelled` or `rejected`**: Check if any other accepted bookings exist for that provider + date. If none, delete the auto-blocked availability record.
- Mark auto-blocked records with a distinguishing approach (e.g., `start_time = '00:00'` and `end_time = '23:59'` is already the convention).

### 2. Update booking form validation (`Checkout.tsx`)
- Before submitting a booking, check `service_provider_availability` for the selected date to see if it's blocked.
- Also check if the selected date falls on a recurring blocked day of week.
- Show an error message if the date is unavailable.

### 3. No UI changes needed for provider calendar
- `ProviderAvailabilityCalendar` already reads from `service_provider_availability` and shows blocked dates as "Unavailable" — it will automatically reflect the auto-blocked dates.
- `BookingCalendar` (provider dashboard) also reads blocked dates and will show them correctly.

## Technical Details

**Trigger SQL:**
```sql
CREATE OR REPLACE FUNCTION auto_block_booking_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  -- When booking is accepted, block the date
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO service_provider_availability 
      (provider_id, specific_date, is_blocked, is_available, start_time, end_time)
    VALUES 
      (NEW.provider_id, NEW.service_date, true, false, '00:00', '23:59')
    ON CONFLICT DO NOTHING; -- avoid duplicates
  END IF;

  -- When booking is cancelled/rejected, unblock if no other accepted bookings
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.status = 'accepted' THEN
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE provider_id = NEW.provider_id 
        AND service_date = NEW.service_date 
        AND status = 'accepted' 
        AND id != NEW.id
    ) THEN
      DELETE FROM service_provider_availability
      WHERE provider_id = NEW.provider_id
        AND specific_date = NEW.service_date
        AND is_blocked = true;
    END IF;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_auto_block_booking_date
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_block_booking_date();
```

**Checkout validation** — add a check before booking submission in the checkout page to query availability and warn if the date is blocked.

### Files changed
- **New migration**: Auto-block trigger on bookings table
- **`src/pages/Checkout.tsx`**: Add date availability check before submission

