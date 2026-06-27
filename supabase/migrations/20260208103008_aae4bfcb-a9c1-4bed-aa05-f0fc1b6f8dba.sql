-- Allow providers to INSERT payment requests for their bookings
CREATE POLICY "Providers can create payments for their bookings"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = payments.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Allow providers to UPDATE their pending payment requests
CREATE POLICY "Providers can update their pending payments"
ON public.payments FOR UPDATE
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = payments.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Allow providers to DELETE pending payment requests
CREATE POLICY "Providers can delete pending payments"
ON public.payments FOR DELETE
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = payments.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Allow users to UPDATE payments during checkout (for status changes)
CREATE POLICY "Users can update their booking payments"
ON public.payments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payments.booking_id 
    AND b.user_id = auth.uid()
  )
);