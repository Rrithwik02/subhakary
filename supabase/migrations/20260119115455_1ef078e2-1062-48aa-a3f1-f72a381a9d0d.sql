-- Fix RLS policies: Change "Deny anonymous access" policies from USING (false) to proper authentication check
-- This fixes the security errors where RESTRICTIVE policies with USING(false) could create access issues

-- Fix profiles table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix bookings table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to bookings" ON public.bookings;
CREATE POLICY "Deny anonymous access to bookings"
ON public.bookings
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix provider_payment_details table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to payment details" ON public.provider_payment_details;
CREATE POLICY "Deny anonymous access to payment details"
ON public.provider_payment_details
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix payments table - Drop and recreate the deny anonymous policy  
DROP POLICY IF EXISTS "Deny anonymous access to payments" ON public.payments;
CREATE POLICY "Deny anonymous access to payments"
ON public.payments
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix chat_messages table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to chat messages" ON public.chat_messages;
CREATE POLICY "Deny anonymous access to chat messages"
ON public.chat_messages
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix inquiry_messages table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to inquiry messages" ON public.inquiry_messages;
CREATE POLICY "Deny anonymous access to inquiry messages"
ON public.inquiry_messages
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix email_otp_codes table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to OTP codes" ON public.email_otp_codes;
CREATE POLICY "Deny anonymous access to OTP codes"
ON public.email_otp_codes
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix security_audit_log table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to audit logs" ON public.security_audit_log;
CREATE POLICY "Deny anonymous access to audit logs"
ON public.security_audit_log
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix quotation_requests table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to quotation requests" ON public.quotation_requests;
CREATE POLICY "Deny anonymous access to quotation requests"
ON public.quotation_requests
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix account_deletion_requests table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Deny anonymous access to deletion requests"
ON public.account_deletion_requests
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix admin_invitations table - Drop and recreate the deny anonymous policy
DROP POLICY IF EXISTS "Deny anonymous access to admin invitations" ON public.admin_invitations;
CREATE POLICY "Deny anonymous access to admin invitations"
ON public.admin_invitations
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);