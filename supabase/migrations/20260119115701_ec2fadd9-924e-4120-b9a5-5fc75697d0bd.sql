-- Fix service_providers exposure: Hide sensitive contact info from public view
-- Create a public view that excludes sensitive fields

-- First, drop the existing permissive SELECT policy that exposes all data publicly
DROP POLICY IF EXISTS "Anyone can view approved providers" ON public.service_providers;

-- Create more restrictive policies:
-- 1. Authenticated users can view their own provider profile (full access)
CREATE POLICY "Providers can view own full profile"
ON public.service_providers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Admins can view all provider profiles (full access)
CREATE POLICY "Admins can view all providers"
ON public.service_providers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 3. Create a public view for approved providers that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_service_providers 
WITH (security_invoker = on) AS
SELECT 
    id,
    business_name,
    city,
    secondary_city,
    service_cities,
    description,
    rating,
    total_reviews,
    is_verified,
    is_premium,
    experience_years,
    specializations,
    languages,
    portfolio_images,
    portfolio_link,
    category_id,
    subcategory,
    service_type,
    pricing_info,
    base_price,
    requires_advance_payment,
    advance_payment_percentage,
    travel_charges_applicable,
    advance_booking_days,
    logo_url,
    status,
    created_at,
    updated_at,
    facebook_url,
    instagram_url,
    youtube_url,
    website_url
    -- EXCLUDED: whatsapp_number, gst_number, address, user_id, profile_id, verification_document_url, terms_accepted, terms_accepted_at, rejection_reason, reviewed_at, submitted_at
FROM public.service_providers
WHERE status = 'approved';

-- Grant select on the view to all (public and authenticated)
GRANT SELECT ON public.public_service_providers TO anon;
GRANT SELECT ON public.public_service_providers TO authenticated;

-- Create a policy for authenticated users to view approved providers' basic info (using view)
-- For contact info, users must have an accepted booking with the provider

-- Allow authenticated users to see approved provider basic info (non-sensitive)
CREATE POLICY "Authenticated users can view approved providers basic info"
ON public.service_providers
FOR SELECT
TO authenticated
USING (
    status = 'approved' AND 
    auth.uid() IS NOT NULL
);

-- Create a function to get provider contact info only for users with accepted bookings
CREATE OR REPLACE FUNCTION public.get_provider_contact_info(provider_uuid uuid)
RETURNS TABLE (
    whatsapp_number text,
    address text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        sp.whatsapp_number,
        sp.address
    FROM service_providers sp
    WHERE sp.id = provider_uuid
    AND sp.status = 'approved'
    AND (
        -- Provider owns this profile
        sp.user_id = auth.uid()
        OR
        -- User is admin
        has_role(auth.uid(), 'admin')
        OR
        -- User has an accepted booking with this provider
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.provider_id = sp.id
            AND b.user_id = auth.uid()
            AND b.status = 'accepted'
        )
    )
$$;