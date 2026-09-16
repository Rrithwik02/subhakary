-- Same never-applied migration as chat_messages.delivery_status: the admin
-- additional-services review UI (AdditionalServicesManager.tsx) expects
-- verification_status distinct from status, but only status/category_id
-- ever made it onto the live table.
alter table public.additional_services
  add column if not exists verification_status text default 'pending';

create index if not exists idx_additional_services_verification_status
  on public.additional_services(verification_status);

update public.additional_services
set verification_status = coalesce(verification_status, status, 'pending');
