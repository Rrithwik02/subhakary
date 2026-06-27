-- Fix: Prevent privilege escalation in service_providers table
-- Approach: Use a trigger to block updates to protected fields by non-admins

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Providers can update their own availability status" ON public.service_providers;

-- Create a validation trigger function that prevents providers from modifying protected fields
CREATE OR REPLACE FUNCTION public.validate_provider_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to update any field
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins (providers), ensure protected fields are not modified
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    RAISE EXCEPTION 'Cannot modify is_verified field';
  END IF;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Cannot modify status field';
  END IF;
  
  IF OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
    RAISE EXCEPTION 'Cannot modify is_premium field';
  END IF;
  
  IF OLD.rating IS DISTINCT FROM NEW.rating THEN
    RAISE EXCEPTION 'Cannot modify rating field';
  END IF;
  
  IF OLD.total_reviews IS DISTINCT FROM NEW.total_reviews THEN
    RAISE EXCEPTION 'Cannot modify total_reviews field';
  END IF;
  
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id field';
  END IF;
  
  -- Additional protection for reviewed_at (should only be set by admins)
  IF OLD.reviewed_at IS DISTINCT FROM NEW.reviewed_at THEN
    RAISE EXCEPTION 'Cannot modify reviewed_at field';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_provider_update_trigger ON public.service_providers;

-- Create the trigger
CREATE TRIGGER validate_provider_update_trigger
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_provider_update();

-- Recreate a simpler provider update policy (actual field protection is in the trigger)
CREATE POLICY "Providers can update their own profile"
ON public.service_providers 
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);