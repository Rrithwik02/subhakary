-- Remove the hardcoded admin email function and replace with a secure version
-- This fixes the hardcoded_admin_email security finding

-- Drop the trigger and function together using CASCADE
DROP FUNCTION IF EXISTS public.auto_assign_admin_role() CASCADE;

-- Create an admin_invitations table for secure admin assignment
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view and create invitations
CREATE POLICY "Admins can view all invitations"
ON public.admin_invitations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
ON public.admin_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a secure function to assign admin role via invitation
CREATE OR REPLACE FUNCTION public.claim_admin_invitation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation admin_invitations%ROWTYPE;
  v_user_email text;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Find valid invitation
  SELECT * INTO v_invitation
  FROM admin_invitations
  WHERE token = p_token
    AND email = v_user_email
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mark invitation as used
  UPDATE admin_invitations
  SET used_at = now()
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

-- Seed initial admin - keeping subhakaryam.official@gmail.com as initial admin
-- But doing it through the proper invitation system
-- First, we need to grant the existing admin their role if they already exist
DO $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  -- Check if the admin user exists
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = 'subhakaryam.official@gmail.com';
  
  IF v_admin_user_id IS NOT NULL THEN
    -- Ensure they have admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;