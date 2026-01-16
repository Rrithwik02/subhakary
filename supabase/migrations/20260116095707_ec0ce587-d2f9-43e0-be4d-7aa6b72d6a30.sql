-- Drop existing policies to recreate with stronger security
DROP POLICY IF EXISTS "Deny anonymous access to payment details" ON public.provider_payment_details;
DROP POLICY IF EXISTS "Admins can view all payment details" ON public.provider_payment_details;
DROP POLICY IF EXISTS "Providers can view their own payment details" ON public.provider_payment_details;
DROP POLICY IF EXISTS "Providers can insert their own payment details" ON public.provider_payment_details;
DROP POLICY IF EXISTS "Providers can update their own payment details" ON public.provider_payment_details;
DROP POLICY IF EXISTS "Providers can delete their own payment details" ON public.provider_payment_details;

-- Create RESTRICTIVE deny policy for anonymous role (this actually blocks access)
CREATE POLICY "Deny all anonymous access to payment details"
ON public.provider_payment_details
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Providers can only view their own payment details
CREATE POLICY "Providers can view their own payment details"
ON public.provider_payment_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.id = provider_payment_details.provider_id
    AND sp.user_id = auth.uid()
  )
);

-- Providers can insert their own payment details
CREATE POLICY "Providers can insert their own payment details"
ON public.provider_payment_details
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.id = provider_payment_details.provider_id
    AND sp.user_id = auth.uid()
  )
);

-- Providers can update their own payment details (with proper WITH CHECK)
CREATE POLICY "Providers can update their own payment details"
ON public.provider_payment_details
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.id = provider_payment_details.provider_id
    AND sp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.id = provider_payment_details.provider_id
    AND sp.user_id = auth.uid()
  )
);

-- Providers can delete their own payment details
CREATE POLICY "Providers can delete their own payment details"
ON public.provider_payment_details
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.id = provider_payment_details.provider_id
    AND sp.user_id = auth.uid()
  )
);

-- Admins can view all payment details for administrative purposes
CREATE POLICY "Admins can view all payment details"
ON public.provider_payment_details
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update payment details for administrative purposes
CREATE POLICY "Admins can update all payment details"
ON public.provider_payment_details
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));