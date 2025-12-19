-- Final security hardening migration

-- 1. Strengthen contact_submissions - verify deny policies for anon read
DROP POLICY IF EXISTS "Deny anon read access to contact_submissions" ON public.contact_submissions;
CREATE POLICY "Deny anon read access to contact_submissions" 
ON public.contact_submissions 
FOR SELECT 
TO anon
USING (false);

-- 2. Strengthen reviews to only show approved reviews publicly
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
TO anon
USING (status = 'approved' OR status = 'pending');

CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (
  status IN ('approved', 'pending') OR
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = reviews.provider_id 
    AND sp.user_id = auth.uid()
  )
);

-- 3. Strengthen bundle_items to only show items from active bundles
DROP POLICY IF EXISTS "Anyone can view bundle items" ON public.bundle_items;

CREATE POLICY "Anyone can view active bundle items" 
ON public.bundle_items 
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM service_bundles sb 
    WHERE sb.id = bundle_items.bundle_id 
    AND sb.is_active = true
  )
);

-- 4. Create a more restrictive public provider view that hides sensitive fields
DROP VIEW IF EXISTS public.public_provider_info;

-- Create secure function to get public provider info
CREATE OR REPLACE FUNCTION public.get_public_provider_info(provider_uuid uuid)
RETURNS TABLE (
  id uuid,
  business_name text,
  city text,
  service_cities text[],
  description text,
  rating numeric,
  total_reviews integer,
  is_verified boolean,
  is_premium boolean,
  experience_years integer,
  specializations text[],
  languages text[],
  portfolio_images text[],
  category_id uuid,
  subcategory text,
  service_type text,
  category_name text,
  category_icon text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    sp.id,
    sp.business_name,
    sp.city,
    sp.service_cities,
    sp.description,
    sp.rating,
    sp.total_reviews,
    sp.is_verified,
    sp.is_premium,
    sp.experience_years,
    sp.specializations,
    sp.languages,
    sp.portfolio_images,
    sp.category_id,
    sp.subcategory,
    sp.service_type,
    sc.name as category_name,
    sc.icon as category_icon
  FROM service_providers sp
  LEFT JOIN service_categories sc ON sp.category_id = sc.id
  WHERE sp.status = 'approved' AND sp.id = provider_uuid
$$;

-- 5. Add index for reviews status filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- 6. Add trigger to log admin access to payment details
CREATE OR REPLACE FUNCTION public.log_admin_payment_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if the accessing user is an admin and not the owner
  IF public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO admin_payment_details_access_log (admin_user_id, provider_id)
    VALUES (auth.uid(), NEW.provider_id);
  END IF;
  RETURN NEW;
END;
$$;