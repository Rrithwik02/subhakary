-- Add explicit policies to deny anonymous/public access to sensitive tables
-- This ensures RLS cannot be bypassed by unauthenticated requests

-- 1. Profiles table - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 2. Provider payment details - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to payment details" 
ON public.provider_payment_details 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 3. Email OTP codes - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to OTP codes" 
ON public.email_otp_codes 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 4. Newsletter subscriptions - deny anonymous SELECT (keep INSERT)
CREATE POLICY "Deny anonymous read access to newsletter" 
ON public.newsletter_subscriptions 
FOR SELECT 
TO anon
USING (false);

-- 5. Bookings - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to bookings" 
ON public.bookings 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 6. Payments - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to payments" 
ON public.payments 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 7. Chat messages - explicitly deny anonymous access  
CREATE POLICY "Deny anonymous access to chat messages" 
ON public.chat_messages 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 8. Inquiry messages - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to inquiry messages" 
ON public.inquiry_messages 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 9. Quotation requests - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to quotation requests" 
ON public.quotation_requests 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 10. Account deletion requests - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to deletion requests" 
ON public.account_deletion_requests 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 11. Security audit log - explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to audit logs" 
ON public.security_audit_log 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);