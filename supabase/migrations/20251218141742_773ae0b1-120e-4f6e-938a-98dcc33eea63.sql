-- Add two_factor_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

-- Create email_otp_codes table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.email_otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('login', 'enable_2fa', 'disable_2fa')),
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email_otp_codes
ALTER TABLE public.email_otp_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own OTP codes (for debugging, optional)
CREATE POLICY "Users can view their own OTP codes"
ON public.email_otp_codes
FOR SELECT
USING (auth.uid() IN (
  SELECT p.user_id FROM profiles p WHERE p.id = email_otp_codes.user_id
));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otp_codes_user_id ON public.email_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otp_codes_code ON public.email_otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_otp_codes_expires_at ON public.email_otp_codes(expires_at);