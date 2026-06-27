
-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Providers can create completion details" ON public.booking_completion_details;
DROP POLICY IF EXISTS "Providers can update their completion details" ON public.booking_completion_details;
DROP POLICY IF EXISTS "Providers can view their completion details" ON public.booking_completion_details;
DROP POLICY IF EXISTS "Customers can view their booking completion details" ON public.booking_completion_details;
DROP POLICY IF EXISTS "Customers can update verification fields" ON public.booking_completion_details;

-- Create fixed RLS policies for booking_completion_details
-- Providers can create completion details (using auth.uid() to match service_providers.user_id)
CREATE POLICY "Providers can create completion details" 
ON public.booking_completion_details 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = booking_completion_details.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Providers can view their completion details
CREATE POLICY "Providers can view their completion details" 
ON public.booking_completion_details 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = booking_completion_details.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Providers can update their completion details
CREATE POLICY "Providers can update their completion details" 
ON public.booking_completion_details 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = booking_completion_details.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Customers can view completion details for their bookings (using auth.uid() to match bookings.user_id)
CREATE POLICY "Customers can view their booking completion details" 
ON public.booking_completion_details 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_completion_details.booking_id 
    AND b.user_id = auth.uid()
  )
);

-- Customers can update verification fields for their bookings
CREATE POLICY "Customers can update verification fields" 
ON public.booking_completion_details 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_completion_details.booking_id 
    AND b.user_id = auth.uid()
  )
);
