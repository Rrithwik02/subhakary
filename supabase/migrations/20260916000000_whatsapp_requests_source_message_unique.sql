-- Makes the existing idempotency-recovery logic in createWhatsappRequest()
-- (whatsapp-bot/services/request-management/index.ts) actually effective,
-- and makes it safe for the webhook's conversation-update retry loop
-- (supabase/functions/whatsapp-webhook/index.ts) to call routeMessage()
-- more than once for the same inbound message on an optimistic-concurrency
-- conflict: without this constraint, two writes for the same inbound
-- WhatsApp message (retry, Meta redelivery, or a conversation-update race)
-- would each create a separate request row instead of the second one being
-- recognized as a duplicate and returning the first.
create unique index if not exists whatsapp_requests_source_whatsapp_message_id_key
  on public.whatsapp_requests (source_whatsapp_message_id)
  where source_whatsapp_message_id is not null;
