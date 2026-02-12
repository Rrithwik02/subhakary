
-- Fix 1: Add explicit RESTRICTIVE anonymous denial to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: Add explicit RESTRICTIVE anonymous denial to contact_submissions for SELECT
-- (INSERT is intentionally open for contact forms, but reading must require auth)
CREATE POLICY "Deny anonymous read access to contact submissions"
ON public.contact_submissions
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 3: Remove plaintext payment columns and update functions
-- First update the decrypt/get function to only use encrypted columns
CREATE OR REPLACE FUNCTION public.get_provider_payment_details(p_provider_id uuid)
RETURNS TABLE(
  id uuid,
  provider_id uuid,
  payment_method text,
  account_holder_name text,
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  qr_code_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ppd.id,
    ppd.provider_id,
    ppd.payment_method,
    ppd.account_holder_name,
    ppd.bank_name,
    public.decrypt_payment_field(ppd.account_number_encrypted) as account_number,
    public.decrypt_payment_field(ppd.ifsc_code_encrypted) as ifsc_code,
    public.decrypt_payment_field(ppd.upi_id_encrypted) as upi_id,
    ppd.qr_code_url,
    ppd.created_at,
    ppd.updated_at
  FROM provider_payment_details ppd
  WHERE ppd.provider_id = p_provider_id
  AND (
    EXISTS (
      SELECT 1 FROM service_providers sp
      WHERE sp.id = ppd.provider_id
      AND sp.user_id = auth.uid()
    )
    OR
    has_role(auth.uid(), 'admin')
  )
$$;

-- Update encrypt trigger to always clear plaintext immediately
CREATE OR REPLACE FUNCTION public.encrypt_payment_details_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Encrypt and clear plaintext for account number
  IF NEW.account_number IS NOT NULL AND NEW.account_number != '' THEN
    NEW.account_number_encrypted := public.encrypt_payment_field(NEW.account_number);
    NEW.account_number := NULL;
  END IF;
  
  -- Encrypt and clear plaintext for IFSC code
  IF NEW.ifsc_code IS NOT NULL AND NEW.ifsc_code != '' THEN
    NEW.ifsc_code_encrypted := public.encrypt_payment_field(NEW.ifsc_code);
    NEW.ifsc_code := NULL;
  END IF;
  
  -- Encrypt and clear plaintext for UPI ID
  IF NEW.upi_id IS NOT NULL AND NEW.upi_id != '' THEN
    NEW.upi_id_encrypted := public.encrypt_payment_field(NEW.upi_id);
    NEW.upi_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Clear any existing plaintext data that may have slipped through
UPDATE public.provider_payment_details
SET account_number = NULL, ifsc_code = NULL, upi_id = NULL
WHERE account_number IS NOT NULL OR ifsc_code IS NOT NULL OR upi_id IS NOT NULL;
