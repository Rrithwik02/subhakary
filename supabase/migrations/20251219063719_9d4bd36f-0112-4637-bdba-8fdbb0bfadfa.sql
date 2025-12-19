-- Create inquiry_conversations table for pre-booking chat
CREATE TABLE public.inquiry_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  CONSTRAINT inquiry_conversations_user_provider_unique UNIQUE (user_id, provider_id)
);

-- Create inquiry_messages table for messages in inquiry conversations
CREATE TABLE public.inquiry_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.inquiry_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiry_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for inquiry_conversations
CREATE POLICY "Users can view their inquiry conversations"
ON public.inquiry_conversations
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = inquiry_conversations.provider_id 
    AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create inquiry conversations"
ON public.inquiry_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their inquiry conversations"
ON public.inquiry_conversations
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = inquiry_conversations.provider_id 
    AND sp.user_id = auth.uid()
  )
);

-- RLS policies for inquiry_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.inquiry_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM inquiry_conversations ic
    WHERE ic.id = inquiry_messages.conversation_id
    AND (
      auth.uid() = ic.user_id 
      OR EXISTS (
        SELECT 1 FROM service_providers sp 
        WHERE sp.id = ic.provider_id 
        AND sp.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.inquiry_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inquiry_conversations ic
    WHERE ic.id = inquiry_messages.conversation_id
    AND (
      auth.uid() = ic.user_id 
      OR EXISTS (
        SELECT 1 FROM service_providers sp 
        WHERE sp.id = ic.provider_id 
        AND sp.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can mark messages as read"
ON public.inquiry_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM inquiry_conversations ic
    WHERE ic.id = inquiry_messages.conversation_id
    AND (
      auth.uid() = ic.user_id 
      OR EXISTS (
        SELECT 1 FROM service_providers sp 
        WHERE sp.id = ic.provider_id 
        AND sp.user_id = auth.uid()
      )
    )
  )
);

-- Enable realtime for inquiry_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_inquiry_conversations_updated_at
BEFORE UPDATE ON public.inquiry_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();