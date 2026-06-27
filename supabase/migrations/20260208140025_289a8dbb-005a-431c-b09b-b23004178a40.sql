-- Create a secure function for providers to fetch customer info for their bookings
-- This bypasses RLS to allow providers to see basic customer info for their bookings only
CREATE OR REPLACE FUNCTION get_booking_customer_info(booking_ids uuid[])
RETURNS TABLE (
  booking_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    p.full_name as customer_name,
    p.email as customer_email,
    p.phone as customer_phone
  FROM bookings b
  JOIN profiles p ON b.user_id = p.user_id
  WHERE b.id = ANY(booking_ids)
  AND b.provider_id IN (
    SELECT sp.id FROM service_providers sp 
    WHERE sp.user_id = auth.uid()
  );
END;
$$;