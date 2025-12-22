
-- Add delivery_status column to chat_messages for tracking message delivery
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'sent';

-- Add comment for documentation
COMMENT ON COLUMN public.chat_messages.delivery_status IS 'Message delivery status: sending, sent, delivered, read';
