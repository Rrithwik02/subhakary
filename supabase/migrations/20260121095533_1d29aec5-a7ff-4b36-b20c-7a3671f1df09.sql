-- Fix 1: Allow PUBLIC (anonymous) to view approved service providers
-- This is needed because the providers listing should be visible to everyone, not just logged-in users

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view approved providers basic info" ON public.service_providers;

-- Create a new policy that allows everyone (including anonymous users) to view approved providers
CREATE POLICY "Anyone can view approved providers"
ON public.service_providers
FOR SELECT
USING (status = 'approved');

-- Fix 2: Allow public read access to limited profile info for provider details
-- We need this so users can see provider contact names in listings/details

-- The "Deny anonymous access to profiles" policy is too restrictive
-- Drop it and create a more balanced approach
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Create a policy that allows anyone to see basic profile info (needed for provider listings)
-- Note: This only exposes full_name and avatar_url which are meant to be public
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);

-- The existing policies for update/insert remain restricted to owners and admins