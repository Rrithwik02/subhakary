-- Fix: Remove overly permissive SELECT policy on contact_submissions
-- The "Deny anonymous read access" policy currently allows ALL authenticated users to read contact submissions
-- Only admins should be able to read them (already covered by "Contact: admins can view submissions")

DROP POLICY IF EXISTS "Deny anonymous read access to contact submissions" ON public.contact_submissions;

-- Replace with a restrictive policy that only allows admin reads
CREATE POLICY "Only admins can read contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));