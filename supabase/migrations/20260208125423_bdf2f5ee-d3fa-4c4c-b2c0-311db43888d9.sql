-- Create trigger function to notify customer when provider requests payment
CREATE OR REPLACE FUNCTION public.notify_customer_on_payment_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_profile_id uuid;
  provider_name text;
  booking_record RECORD;
BEGIN
  -- Only trigger when a new payment is inserted with is_provider_requested = true
  IF NEW.is_provider_requested = true AND NEW.status = 'pending' THEN
    -- Get booking and provider details
    SELECT b.user_id, sp.business_name
    INTO booking_record
    FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = NEW.booking_id;

    -- Get customer's profile_id
    SELECT id INTO customer_profile_id
    FROM profiles
    WHERE user_id = booking_record.user_id;

    -- Insert notification for customer
    IF customer_profile_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        customer_profile_id,
        'Payment Request',
        COALESCE(booking_record.business_name, 'A provider') || ' has requested a payment of ₹' || NEW.amount::text || '. Tap to pay now.',
        'payment'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on payments table for INSERT
DROP TRIGGER IF EXISTS notify_customer_on_payment_request_trigger ON payments;
CREATE TRIGGER notify_customer_on_payment_request_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_on_payment_request();

-- Also create trigger for UPDATE (in case payment is edited to become provider-requested)
CREATE OR REPLACE FUNCTION public.notify_customer_on_payment_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_profile_id uuid;
  provider_name text;
  booking_record RECORD;
BEGIN
  -- Only trigger when payment changes from non-provider-requested to provider-requested
  -- Or when amount changes on a pending provider-requested payment
  IF NEW.is_provider_requested = true AND NEW.status = 'pending' THEN
    -- Check if this is a meaningful change (new request or amount update)
    IF (OLD.is_provider_requested = false OR OLD.is_provider_requested IS NULL) OR 
       (OLD.amount IS DISTINCT FROM NEW.amount) THEN
      
      -- Get booking and provider details
      SELECT b.user_id, sp.business_name
      INTO booking_record
      FROM bookings b
      JOIN service_providers sp ON b.provider_id = sp.id
      WHERE b.id = NEW.booking_id;

      -- Get customer's profile_id
      SELECT id INTO customer_profile_id
      FROM profiles
      WHERE user_id = booking_record.user_id;

      -- Insert notification for customer
      IF customer_profile_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          customer_profile_id,
          CASE 
            WHEN OLD.amount IS DISTINCT FROM NEW.amount THEN 'Payment Updated'
            ELSE 'Payment Request'
          END,
          COALESCE(booking_record.business_name, 'A provider') || 
          CASE 
            WHEN OLD.amount IS DISTINCT FROM NEW.amount THEN ' has updated the payment amount to ₹'
            ELSE ' has requested a payment of ₹'
          END || NEW.amount::text || '. Tap to pay now.',
          'payment'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on payments table for UPDATE
DROP TRIGGER IF EXISTS notify_customer_on_payment_update_trigger ON payments;
CREATE TRIGGER notify_customer_on_payment_update_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_on_payment_update();