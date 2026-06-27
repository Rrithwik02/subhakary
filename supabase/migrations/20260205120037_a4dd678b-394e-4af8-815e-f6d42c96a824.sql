-- Fix 1: Drop the overly permissive policy that exposes full profile data
-- The get_provider_profile_name() function already exists and returns only safe fields
DROP POLICY IF EXISTS "Authenticated users can view provider profile names" ON public.profiles;

-- Fix 2: Clear the plaintext payment fields since encrypted versions exist
-- The encrypt_payment_details_trigger already encrypts data on insert/update
-- We need to clear plaintext fields to prevent exposure
UPDATE public.provider_payment_details
SET 
  account_number = NULL,
  ifsc_code = NULL,
  upi_id = NULL
WHERE account_number_encrypted IS NOT NULL 
   OR ifsc_code_encrypted IS NOT NULL 
   OR upi_id_encrypted IS NOT NULL;

-- Fix 3: Add a trigger to ensure plaintext fields are always cleared after encryption
CREATE OR REPLACE FUNCTION public.clear_plaintext_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear plaintext fields after encryption to prevent dual storage
  IF NEW.account_number_encrypted IS NOT NULL THEN
    NEW.account_number := NULL;
  END IF;
  
  IF NEW.ifsc_code_encrypted IS NOT NULL THEN
    NEW.ifsc_code := NULL;
  END IF;
  
  IF NEW.upi_id_encrypted IS NOT NULL THEN
    NEW.upi_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS clear_plaintext_after_encrypt ON public.provider_payment_details;

-- Create trigger to run AFTER the encryption trigger
CREATE TRIGGER clear_plaintext_after_encrypt
  BEFORE INSERT OR UPDATE ON public.provider_payment_details
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_plaintext_payment_fields();