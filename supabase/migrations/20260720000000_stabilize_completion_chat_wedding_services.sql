-- Keep the live schema aligned with the app's booking completion, chat, wedding,
-- and additional-services flows.

-- Chat delivery status is used by the UI for sent/delivered/read indicators.
alter table public.chat_messages
  add column if not exists delivery_status text default 'sent';

update public.chat_messages
set delivery_status = coalesce(delivery_status, 'sent')
where delivery_status is null;

comment on column public.chat_messages.delivery_status
  is 'Message delivery status: sending, sent, delivered, read';

-- Additional services need to be visible to admins across old and new rows.
alter table public.additional_services
  add column if not exists status text default 'pending',
  add column if not exists verification_status text default 'pending',
  add column if not exists category_id uuid references public.service_categories(id);

create index if not exists idx_additional_services_category_id
  on public.additional_services(category_id);

create index if not exists idx_additional_services_verification_status
  on public.additional_services(verification_status);

update public.additional_services
set
  status = coalesce(status, verification_status, 'pending'),
  verification_status = coalesce(verification_status, status, 'pending');

alter table public.additional_services enable row level security;

drop policy if exists "Providers can manage their additional services" on public.additional_services;
drop policy if exists "Anyone can view approved additional services" on public.additional_services;
drop policy if exists "Admins can view all additional services" on public.additional_services;
drop policy if exists "Admins can update additional services" on public.additional_services;

create policy "Providers can manage their additional services"
on public.additional_services
for all
using (
  exists (
    select 1
    from public.service_providers sp
    where sp.id = additional_services.provider_id
      and sp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.service_providers sp
    where sp.id = additional_services.provider_id
      and sp.user_id = auth.uid()
  )
);

create policy "Anyone can view approved additional services"
on public.additional_services
for select
using (coalesce(verification_status, status) = 'approved');

create policy "Admins can view all additional services"
on public.additional_services
for select
using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update additional services"
on public.additional_services
for update
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));

-- Wedding creation should succeed for signed-in users.
alter table public.weddings enable row level security;

drop policy if exists "Owners and members can view weddings" on public.weddings;
drop policy if exists "Users can create weddings" on public.weddings;
drop policy if exists "Owners can update weddings" on public.weddings;

create policy "Owners and members can view weddings"
on public.weddings
for select
using (public.can_access_wedding(id));

create policy "Users can create weddings"
on public.weddings
for insert
with check (auth.uid() = owner_user_id);

create policy "Owners can update weddings"
on public.weddings
for update
using (public.can_manage_wedding(id))
with check (public.can_manage_wedding(id));
