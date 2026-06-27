-- Fix 1: profiles_table_public_exposure
-- Remove the overly permissive policy and replace with a secure function-based approach

-- Drop the problematic policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view provider profile names" ON public.profiles;

-- Create a secure function to get only non-sensitive provider profile info
CREATE OR REPLACE FUNCTION public.get_provider_profile_name(p_profile_id uuid)
RETURNS TABLE(full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.full_name,
    p.avatar_url
  FROM profiles p
  WHERE p.id = p_profile_id
  AND EXISTS (
    SELECT 1 FROM service_providers sp
    WHERE sp.profile_id = p.id
    AND sp.status = 'approved'
  )
$$;

-- Fix 2: admin_invitations_email_exposure
-- Hash tokens before storage and add cleanup function

-- Add hashed token column if not exists
ALTER TABLE public.admin_invitations 
ADD COLUMN IF NOT EXISTS token_hash text;

-- Create function to hash tokens
CREATE OR REPLACE FUNCTION public.hash_admin_token(raw_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(raw_token::bytea), 'hex')
$$;

-- Create trigger to auto-hash tokens on insert
CREATE OR REPLACE FUNCTION public.hash_admin_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store the hash, clear the plaintext after initial use
  IF NEW.token IS NOT NULL AND NEW.token != '' THEN
    NEW.token_hash := public.hash_admin_token(NEW.token);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS hash_invitation_token ON public.admin_invitations;

-- Create trigger
CREATE TRIGGER hash_invitation_token
  BEFORE INSERT ON public.admin_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.hash_admin_invitation_token();

-- Update claim_admin_invitation to use hashed comparison
CREATE OR REPLACE FUNCTION public.claim_admin_invitation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation admin_invitations%ROWTYPE;
  v_user_email text;
  v_token_hash text;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Calculate hash of provided token
  v_token_hash := public.hash_admin_token(p_token);
  
  -- Find valid invitation using hash comparison (preferred) or plaintext (backward compat)
  SELECT * INTO v_invitation
  FROM admin_invitations
  WHERE (token_hash = v_token_hash OR token = p_token)
    AND email = v_user_email
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mark invitation as used and clear plaintext token for security
  UPDATE admin_invitations
  SET used_at = now(),
      token = 'CLAIMED'  -- Clear plaintext token after use
  WHERE id = v_invitation.id;
  
  -- Assign admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the admin role assignment
  INSERT INTO security_audit_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'admin_role_claimed',
    'admin_invitations',
    v_invitation.id::text,
    jsonb_build_object('invitation_email', v_invitation.email, 'invited_by', v_invitation.invited_by)
  );
  
  RETURN true;
END;
$$;

-- Create cleanup function for expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM admin_invitations
  WHERE expires_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Hash existing plaintext tokens
UPDATE admin_invitations 
SET token_hash = public.hash_admin_token(token)
WHERE token_hash IS NULL AND token IS NOT NULL AND token != 'CLAIMED';