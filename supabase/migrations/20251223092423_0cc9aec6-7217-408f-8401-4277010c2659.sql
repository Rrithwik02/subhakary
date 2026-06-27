-- Fix Security Issue 1: Restrict service_providers public exposure
-- Only allow viewing non-sensitive fields for approved providers

-- First drop the existing public select policy for service_providers
DROP POLICY IF EXISTS "Anyone can view approved providers" ON public.service_providers;
DROP POLICY IF EXISTS "Public can view approved providers" ON public.service_providers;

-- Create a more restrictive policy that requires authentication for sensitive fields
-- Public users can only see basic info via the get_public_provider_info function
CREATE POLICY "Authenticated users can view approved providers"
ON public.service_providers
FOR SELECT
USING (
  status = 'approved' AND (
    auth.uid() IS NOT NULL OR 
    -- Only allow public access to non-sensitive columns through the existing function
    -- which is already set up to filter sensitive data
    false
  )
);

-- Fix Security Issue 2: Strengthen profiles table protection
-- The existing deny anonymous policy is correct, but let's ensure it's restrictive

-- Update chat_messages to use direct RLS checks instead of custom function
DROP POLICY IF EXISTS "Authenticated users can view their messages" ON public.chat_messages;

CREATE POLICY "Users can view messages where they are sender or receiver"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id IN (chat_messages.sender_id, chat_messages.receiver_id)
  )
);

-- Also add update policy for marking messages as read
DROP POLICY IF EXISTS "Users can update their received messages" ON public.chat_messages;

CREATE POLICY "Users can update messages they received"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = chat_messages.receiver_id
  )
);

-- Create a notification trigger function for customer verification
CREATE OR REPLACE FUNCTION public.notify_provider_on_customer_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  provider_profile_id uuid;
  customer_name text;
  booking_record RECORD;
BEGIN
  -- Only trigger when customer_verified_at changes from null to a value
  IF OLD.customer_verified_at IS NULL AND NEW.customer_verified_at IS NOT NULL THEN
    -- Get booking details
    SELECT b.*, sp.profile_id, sp.business_name
    INTO booking_record
    FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = NEW.booking_id;

    -- Get customer name
    SELECT full_name INTO customer_name
    FROM profiles
    WHERE user_id = booking_record.user_id;

    provider_profile_id := booking_record.profile_id;

    -- Insert notification for provider
    IF provider_profile_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        provider_profile_id,
        'Completion Details Verified',
        COALESCE(customer_name, 'The customer') || ' has verified the completion details for their booking.',
        'completion'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for customer verification notification
DROP TRIGGER IF EXISTS on_customer_verification ON public.booking_completion_details;
CREATE TRIGGER on_customer_verification
  AFTER UPDATE ON public.booking_completion_details
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_provider_on_customer_verification();