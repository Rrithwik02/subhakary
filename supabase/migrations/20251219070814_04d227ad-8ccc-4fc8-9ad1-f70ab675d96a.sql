-- Create function to notify provider on new inquiry message
CREATE OR REPLACE FUNCTION public.notify_provider_on_inquiry_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  provider_profile_id uuid;
  provider_user_id uuid;
  conversation_provider_id uuid;
  conversation_user_id uuid;
  sender_name text;
BEGIN
  -- Get conversation details
  SELECT ic.provider_id, ic.user_id 
  INTO conversation_provider_id, conversation_user_id
  FROM inquiry_conversations ic
  WHERE ic.id = NEW.conversation_id;

  -- Get provider's user_id and profile_id
  SELECT sp.user_id, sp.profile_id 
  INTO provider_user_id, provider_profile_id
  FROM service_providers sp
  WHERE sp.id = conversation_provider_id;

  -- Only notify provider if message is from customer (not provider's own message)
  IF NEW.sender_id = conversation_user_id THEN
    -- Get sender name
    SELECT full_name INTO sender_name
    FROM profiles
    WHERE user_id = conversation_user_id;

    -- Insert notification for provider
    IF provider_profile_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        provider_profile_id,
        'New Inquiry Message',
        'You have a new message from ' || COALESCE(sender_name, 'a customer'),
        'message'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for new inquiry messages
DROP TRIGGER IF EXISTS on_inquiry_message_notify_provider ON inquiry_messages;
CREATE TRIGGER on_inquiry_message_notify_provider
  AFTER INSERT ON inquiry_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_provider_on_inquiry_message();