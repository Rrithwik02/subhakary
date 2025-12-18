-- Create notification trigger function for new bookings (notify provider)
CREATE OR REPLACE FUNCTION public.notify_provider_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_profile_id uuid;
  customer_name text;
BEGIN
  -- Get provider's profile_id
  SELECT profile_id INTO provider_profile_id
  FROM service_providers
  WHERE id = NEW.provider_id;

  -- Get customer name
  SELECT full_name INTO customer_name
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Insert notification for provider
  IF provider_profile_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      provider_profile_id,
      'New Booking Request',
      'You have a new booking request from ' || COALESCE(customer_name, 'a customer') || ' for ' || NEW.service_date::text,
      'booking'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create notification trigger function for booking status changes
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_profile_id uuid;
  provider_name text;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get customer's profile_id
  SELECT id INTO customer_profile_id
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Get provider name
  SELECT business_name INTO provider_name
  FROM service_providers
  WHERE id = NEW.provider_id;

  -- Insert notification based on new status
  IF customer_profile_id IS NOT NULL THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        customer_profile_id,
        'Booking Accepted',
        COALESCE(provider_name, 'The provider') || ' has accepted your booking for ' || NEW.service_date::text || '. You can now chat with them!',
        'booking'
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        customer_profile_id,
        'Booking Rejected',
        COALESCE(provider_name, 'The provider') || ' could not accept your booking. ' || COALESCE('Reason: ' || NEW.rejection_reason, 'Please try another provider.'),
        'booking'
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        customer_profile_id,
        'Booking Completed',
        'Your booking with ' || COALESCE(provider_name, 'the provider') || ' has been completed. Please leave a review!',
        'booking'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create notification trigger function for new reviews (notify provider)
CREATE OR REPLACE FUNCTION public.notify_provider_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_profile_id uuid;
  reviewer_name text;
BEGIN
  -- Get provider's profile_id
  SELECT profile_id INTO provider_profile_id
  FROM service_providers
  WHERE id = NEW.provider_id;

  -- Get reviewer name
  SELECT full_name INTO reviewer_name
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Insert notification for provider
  IF provider_profile_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      provider_profile_id,
      'New Review Received',
      COALESCE(reviewer_name, 'A customer') || ' left you a ' || NEW.rating || '-star review!',
      'review'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_provider_on_booking();

DROP TRIGGER IF EXISTS on_booking_status_changed ON bookings;
CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_booking_status_change();

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_provider_on_review();