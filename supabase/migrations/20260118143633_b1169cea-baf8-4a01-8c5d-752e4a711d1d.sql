-- Fix the audit log INSERT policy to validate user_id matches authenticated user
-- This prevents users from forging audit entries with arbitrary user IDs

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

-- Create a new policy that validates user_id matches the authenticated user
CREATE POLICY "Users can insert their own audit logs" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a trigger to auto-populate user_id from auth.uid() to prevent client tampering
CREATE OR REPLACE FUNCTION public.set_audit_log_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id to the authenticated user's ID, overriding any client-provided value
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on the security_audit_log table
DROP TRIGGER IF EXISTS ensure_audit_log_user_id ON public.security_audit_log;
CREATE TRIGGER ensure_audit_log_user_id
BEFORE INSERT ON public.security_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.set_audit_log_user_id();