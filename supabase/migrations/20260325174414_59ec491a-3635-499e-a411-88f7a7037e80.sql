
CREATE OR REPLACE FUNCTION public.auto_block_booking_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  -- When booking is accepted, block the date
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO service_provider_availability 
      (provider_id, specific_date, is_blocked, is_available, start_time, end_time)
    VALUES 
      (NEW.provider_id, NEW.service_date, true, false, '00:00', '23:59')
    ON CONFLICT DO NOTHING;
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
  EXECUTE FUNCTION public.auto_block_booking_date();
