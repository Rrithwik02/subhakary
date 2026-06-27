-- Fix security issues with RLS policies

-- 1. Fix profiles table deny policy (remove WITH CHECK, keep only USING)
-- The issue is that having both USING and WITH CHECK set to false creates a logical contradiction
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;

-- Create a proper deny policy for anonymous access (using USING only)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- 2. Fix provider_payment_details deny policy (same issue)
DROP POLICY IF EXISTS "Deny all anonymous access to payment details" ON public.provider_payment_details;

-- Create a proper deny policy for anonymous access
CREATE POLICY "Deny anonymous access to payment details"
ON public.provider_payment_details
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- 3. Fix admin_invitations - add explicit deny policy for anonymous and non-admin users
-- First, add a deny policy for anonymous users
CREATE POLICY "Deny anonymous access to admin invitations"
ON public.admin_invitations
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- Also add a deny policy for SELECT by non-admin authenticated users
-- (admins already have their own SELECT policy that uses has_role check)
CREATE POLICY "Deny non-admin access to admin invitations"
ON public.admin_invitations
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));