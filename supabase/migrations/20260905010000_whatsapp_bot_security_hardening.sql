-- Preserve existing requests while making new WhatsApp request creation idempotent.
alter table public.whatsapp_requests
  add column if not exists source_whatsapp_message_id text;

create unique index if not exists idx_whatsapp_requests_source_message_id
  on public.whatsapp_requests(source_whatsapp_message_id)
  where source_whatsapp_message_id is not null;

create index if not exists idx_whatsapp_messages_conversation_created_at
  on public.whatsapp_messages(conversation_id, created_at desc);

notify pgrst, 'reload schema';
