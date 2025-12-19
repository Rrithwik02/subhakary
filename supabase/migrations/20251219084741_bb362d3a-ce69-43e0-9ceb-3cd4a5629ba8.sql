-- Fix 1: Strengthen profiles table RLS policies
-- Drop existing policies and recreate with stronger protection
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with explicit authenticated user requirement
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Strengthen provider_payment_details RLS policies
DROP POLICY IF EXISTS "Providers can manage their payment details" ON public.provider_payment_details;

-- Create separate policies for SELECT, INSERT, UPDATE, DELETE with explicit checks
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

CREATE POLICY "Admins can view all payment details" 
ON public.provider_payment_details 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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
);

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

-- Fix 3: Strengthen chat_messages RLS policies with direct user checks
DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;

-- Create a security definer function for direct chat message access
CREATE OR REPLACE FUNCTION public.can_access_chat_message(p_sender_id uuid, p_receiver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND id IN (p_sender_id, p_receiver_id)
  )
$$;

CREATE POLICY "Authenticated users can view their messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (public.can_access_chat_message(sender_id, receiver_id));

CREATE POLICY "Authenticated users can send messages" 
ON public.chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND id = chat_messages.sender_id
  )
);

-- Fix 4: Strengthen email_otp_codes RLS policies with direct user check
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.email_otp_codes;

-- Create a security definer function for OTP access
CREATE OR REPLACE FUNCTION public.can_access_otp(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND id = p_user_id
  )
$$;

CREATE POLICY "Authenticated users can view their own OTP codes" 
ON public.email_otp_codes 
FOR SELECT 
TO authenticated
USING (public.can_access_otp(user_id));