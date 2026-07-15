-- Enrich provider-facing booking customer lookup with profile image data.
-- This keeps the existing booking -> auth.users -> profiles path, but returns
-- the profile image alongside the existing customer details for provider UI.

CREATE OR REPLACE FUNCTION public.get_booking_customer_info(booking_ids uuid[])
RETURNS TABLE (
  booking_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_profile_image text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS booking_id,
    p.full_name AS customer_name,
    p.email AS customer_email,
    p.phone AS customer_phone,
    p.profile_image AS customer_profile_image
  FROM public.bookings b
  JOIN public.profiles p ON b.user_id = p.user_id
  WHERE b.id = ANY(booking_ids)
    AND b.provider_id IN (
      SELECT sp.id
      FROM public.service_providers sp
      WHERE sp.user_id = auth.uid()
    );
END;
$$;
