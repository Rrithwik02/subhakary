
-- Fix 1: Remove overly permissive "Deny anonymous access to profiles" policy
-- This policy with ALL command and qual (auth.uid() IS NOT NULL) actually GRANTS
-- all authenticated users full CRUD access, bypassing owner/admin restrictions.
-- The existing owner-scoped and admin-scoped policies already provide proper access.
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Fix 2: Remove overly permissive "Deny anonymous read access to contact submissions" policy
-- This PERMISSIVE SELECT policy allows any authenticated user to read all submissions.
-- The "Contact: admins can view submissions" policy already provides proper admin-only read access.
DROP POLICY IF EXISTS "Deny anonymous read access to contact submissions" ON public.contact_submissions;
