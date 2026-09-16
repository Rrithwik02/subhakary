-- Chat delivery status is used by the UI for sent/delivered/read indicators
-- (src/pages/Chat.tsx / InquiryChat.tsx). This column was defined in
-- supabase/migrations/20260720000000_stabilize_completion_chat_wedding_services.sql
-- but that migration was never actually applied to this project.
alter table public.chat_messages
  add column if not exists delivery_status text default 'sent';

update public.chat_messages
set delivery_status = coalesce(delivery_status, 'sent')
where delivery_status is null;

comment on column public.chat_messages.delivery_status
  is 'Message delivery status: sending, sent, delivered, read';
