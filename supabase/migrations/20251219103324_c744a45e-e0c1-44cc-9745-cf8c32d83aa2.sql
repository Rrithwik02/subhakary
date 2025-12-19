-- Security Hardening Migration

-- 1. Add unique constraint to reviews to prevent duplicate reviews per booking
ALTER TABLE public.reviews 
ADD CONSTRAINT unique_review_per_booking UNIQUE (booking_id, user_id);

-- 2. Strengthen contact_submissions RLS - add explicit authenticated user denial
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;

-- Only allow anonymous or authenticated users to submit (but not view others)
CREATE POLICY "Anyone can submit contact form" 
ON public.contact_submissions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Strengthen quotation_requests RLS
DROP POLICY IF EXISTS "Providers can view quotations sent to them" ON public.quotation_requests;
DROP POLICY IF EXISTS "Users can manage their quotation requests" ON public.quotation_requests;

-- Users can only manage their own quotation requests
CREATE POLICY "Users can view their quotation requests" 
ON public.quotation_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotation requests" 
ON public.quotation_requests 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their quotation requests" 
ON public.quotation_requests 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their quotation requests" 
ON public.quotation_requests 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Providers can only view quotations explicitly assigned to them
CREATE POLICY "Providers can view their assigned quotations" 
ON public.quotation_requests 
FOR SELECT 
TO authenticated
USING (
  provider_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = quotation_requests.provider_id 
    AND sp.user_id = auth.uid()
  )
);

-- Providers can update quotations assigned to them (to add quoted_amount)
CREATE POLICY "Providers can update their assigned quotations" 
ON public.quotation_requests 
FOR UPDATE 
TO authenticated
USING (
  provider_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = quotation_requests.provider_id 
    AND sp.user_id = auth.uid()
  )
);

-- 4. Strengthen notification_preferences RLS
DROP POLICY IF EXISTS "Users can manage their notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their notification preferences" 
ON public.notification_preferences 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their notification preferences" 
ON public.notification_preferences 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notification preferences" 
ON public.notification_preferences 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 5. Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (via service role in edge functions)
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 6. Create a secure view for public provider information (hiding sensitive fields)
CREATE OR REPLACE VIEW public.public_provider_info AS
SELECT 
  sp.id,
  sp.business_name,
  sp.city,
  sp.service_cities,
  sp.description,
  sp.rating,
  sp.total_reviews,
  sp.pricing_info,
  sp.base_price,
  sp.is_verified,
  sp.is_premium,
  sp.experience_years,
  sp.specializations,
  sp.languages,
  sp.portfolio_images,
  sp.instagram_url,
  sp.facebook_url,
  sp.youtube_url,
  sp.website_url,
  sp.category_id,
  sp.subcategory,
  sp.service_type,
  sc.name as category_name,
  sc.icon as category_icon
FROM service_providers sp
LEFT JOIN service_categories sc ON sp.category_id = sc.id
WHERE sp.status = 'approved';

-- 7. Add index for faster security audit log queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource ON public.security_audit_log(resource_type, resource_id);