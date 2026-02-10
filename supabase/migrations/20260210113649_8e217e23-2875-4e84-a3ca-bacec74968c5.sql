
-- Fix 1: Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Deny anonymous access to contact_submissions (read)
CREATE POLICY "Deny anonymous read access to contact submissions"
ON public.contact_submissions
FOR SELECT
USING (auth.uid() IS NOT NULL);
