-- Fix service_provider_availability: Require authentication but allow viewing for booking
DROP POLICY IF EXISTS "Anyone can view provider availability" ON public.service_provider_availability;

-- Create new policy: Only authenticated users can view provider availability
CREATE POLICY "Authenticated users can view provider availability"
ON public.service_provider_availability
FOR SELECT
TO authenticated
USING (true);

-- Add a deny policy for anonymous users
CREATE POLICY "Deny anonymous access to provider availability"
ON public.service_provider_availability
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);