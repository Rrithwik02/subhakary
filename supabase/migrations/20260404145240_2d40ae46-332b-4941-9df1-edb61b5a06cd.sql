
CREATE OR REPLACE FUNCTION public.validate_provider_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow admins to update any field
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins (providers), ensure protected fields are not modified
  IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
    RAISE EXCEPTION 'Cannot modify is_verified field';
  END IF;
  
  -- Allow resubmission: user can set status from 'rejected' to 'pending'
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (OLD.status = 'rejected' AND NEW.status = 'pending') THEN
      RAISE EXCEPTION 'Cannot modify status field';
    END IF;
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
  
  -- Allow clearing reviewed_at during resubmission (rejected -> pending)
  IF OLD.reviewed_at IS DISTINCT FROM NEW.reviewed_at THEN
    IF NOT (OLD.status = 'rejected' AND NEW.status = 'pending') THEN
      RAISE EXCEPTION 'Cannot modify reviewed_at field';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
