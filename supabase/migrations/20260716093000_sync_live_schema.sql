create extension if not exists pgcrypto;

-- =========================================================
-- Provider slug generation
-- =========================================================

alter table public.service_providers
  add column if not exists url_slug text;

create or replace function public.generate_provider_slug(p_name text, p_id uuid)
returns text
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  base_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9\\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' or base_slug is null then
    base_slug := 'provider';
  end if;

  final_slug := base_slug;

  while exists (
    select 1
    from public.service_providers
    where url_slug = final_slug
      and id <> p_id
  ) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;

  return final_slug;
end;
$$;

update public.service_providers
set url_slug = public.generate_provider_slug(business_name, id)
where url_slug is null;

alter table public.service_providers
  alter column url_slug set not null;

create unique index if not exists idx_service_providers_url_slug
  on public.service_providers(url_slug);

create or replace function public.auto_generate_provider_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.business_name is distinct from new.business_name) then
    new.url_slug := public.generate_provider_slug(new.business_name, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_generate_provider_slug on public.service_providers;
create trigger trg_auto_generate_provider_slug
before insert or update on public.service_providers
for each row
execute function public.auto_generate_provider_slug();

-- =========================================================
-- Provider payment details encryption helpers
-- =========================================================

alter table public.provider_payment_details
  add column if not exists account_number_encrypted bytea,
  add column if not exists ifsc_code_encrypted bytea,
  add column if not exists upi_id_encrypted bytea;

create or replace function public.encrypt_payment_field(plaintext text)
returns bytea
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if plaintext is null or plaintext = '' then
    return null;
  end if;

  return pgp_sym_encrypt(
    plaintext,
    encode(sha256('payment_encryption_key_saathi'::bytea), 'hex')
  );
end;
$$;

create or replace function public.decrypt_payment_field(ciphertext bytea)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if ciphertext is null then
    return null;
  end if;

  return pgp_sym_decrypt(
    ciphertext,
    encode(sha256('payment_encryption_key_saathi'::bytea), 'hex')
  );
end;
$$;

create or replace function public.get_provider_payment_details(p_provider_id uuid)
returns table(
  id uuid,
  provider_id uuid,
  payment_method text,
  account_holder_name text,
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  qr_code_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    ppd.id,
    ppd.provider_id,
    ppd.payment_method,
    ppd.account_holder_name,
    ppd.bank_name,
    coalesce(
      public.decrypt_payment_field(ppd.account_number_encrypted),
      ppd.account_number
    ) as account_number,
    coalesce(
      public.decrypt_payment_field(ppd.ifsc_code_encrypted),
      ppd.ifsc_code
    ) as ifsc_code,
    coalesce(
      public.decrypt_payment_field(ppd.upi_id_encrypted),
      ppd.upi_id
    ) as upi_id,
    ppd.qr_code_url,
    ppd.created_at,
    ppd.updated_at
  from public.provider_payment_details ppd
  where ppd.provider_id = p_provider_id
    and (
      exists (
        select 1
        from public.service_providers sp
        where sp.id = ppd.provider_id
          and sp.user_id = auth.uid()
      )
      or public.has_role(auth.uid(), 'admin')
    );
$$;

create or replace function public.encrypt_payment_details_trigger()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.account_number is not null and new.account_number <> '' then
    new.account_number_encrypted := public.encrypt_payment_field(new.account_number);
  end if;

  if new.ifsc_code is not null and new.ifsc_code <> '' then
    new.ifsc_code_encrypted := public.encrypt_payment_field(new.ifsc_code);
  end if;

  if new.upi_id is not null and new.upi_id <> '' then
    new.upi_id_encrypted := public.encrypt_payment_field(new.upi_id);
  end if;

  return new;
end;
$$;

drop trigger if exists encrypt_payment_details on public.provider_payment_details;
create trigger encrypt_payment_details
before insert or update on public.provider_payment_details
for each row
execute function public.encrypt_payment_details_trigger();

update public.provider_payment_details
set
  account_number_encrypted = public.encrypt_payment_field(account_number),
  ifsc_code_encrypted = public.encrypt_payment_field(ifsc_code),
  upi_id_encrypted = public.encrypt_payment_field(upi_id)
where account_number_encrypted is null
  and (account_number is not null or ifsc_code is not null or upi_id is not null);

-- =========================================================
-- Storage buckets and policies
-- =========================================================

insert into storage.buckets (id, name, public) values
  ('provider-documents', 'provider-documents', false),
  ('avatars', 'avatars', true),
  ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

update storage.buckets
set
  allowed_mime_types = array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  file_size_limit = 10485760
where id = 'provider-documents';

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  file_size_limit = 5242880
where id = 'avatars';

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  file_size_limit = 5242880
where id = 'review-photos';

drop policy if exists "Users can upload their own provider documents" on storage.objects;
drop policy if exists "Users can view their own provider documents" on storage.objects;
drop policy if exists "Users can delete their own provider documents" on storage.objects;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Anyone can view review photos" on storage.objects;
drop policy if exists "Authenticated users can upload review photos" on storage.objects;
drop policy if exists "Users can delete their own review photos" on storage.objects;

create policy "Users can upload their own provider documents"
  on storage.objects
  for insert
  with check (bucket_id = 'provider-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own provider documents"
  on storage.objects
  for select
  using (bucket_id = 'provider-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin')));

create policy "Users can delete their own provider documents"
  on storage.objects
  for delete
  using (bucket_id = 'provider-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects
  for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view review photos"
  on storage.objects
  for select
  using (bucket_id = 'review-photos');

create policy "Authenticated users can upload review photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'review-photos' and auth.uid() is not null);

create policy "Users can delete their own review photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'review-photos' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- Admin invitation hashing helpers
-- =========================================================

alter table public.admin_invitations
  add column if not exists token_hash text;

create or replace function public.hash_admin_token(raw_token text)
returns text
language sql
immutable
security definer
set search_path = public
as $$
  select encode(sha256(raw_token::bytea), 'hex')
$$;

create or replace function public.hash_admin_invitation_token()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.token is not null and new.token <> '' then
    new.token_hash := public.hash_admin_token(new.token);
  end if;
  return new;
end;
$$;

drop trigger if exists hash_invitation_token on public.admin_invitations;
create trigger hash_invitation_token
before insert on public.admin_invitations
for each row
execute function public.hash_admin_invitation_token();

create or replace function public.claim_admin_invitation(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation admin_invitations%rowtype;
  v_user_email text;
  v_token_hash text;
begin
  select email into v_user_email
  from auth.users
  where id = auth.uid();

  v_token_hash := public.hash_admin_token(p_token);

  select * into v_invitation
  from admin_invitations
  where (token_hash = v_token_hash or token = p_token)
    and email = v_user_email
    and used_at is null
    and expires_at > now();

  if not found then
    return false;
  end if;

  update admin_invitations
  set used_at = now(),
      token = 'CLAIMED'
  where id = v_invitation.id;

  insert into user_roles (user_id, role)
  values (auth.uid(), 'admin')
  on conflict (user_id, role) do nothing;

  insert into security_audit_log (user_id, action, resource_type, resource_id, details)
  values (
    auth.uid(),
    'admin_role_claimed',
    'admin_invitations',
    v_invitation.id::text,
    jsonb_build_object('invitation_email', v_invitation.email, 'invited_by', v_invitation.invited_by)
  );

  return true;
end;
$$;

create or replace function public.cleanup_expired_admin_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from admin_invitations
  where expires_at < now() - interval '30 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

update public.admin_invitations
set token_hash = public.hash_admin_token(token)
where token_hash is null
  and token is not null
  and token <> 'CLAIMED';

-- =========================================================
-- Chat, booking, provider, and discovery RPCs
-- =========================================================

create or replace function public.can_access_chat_message(p_sender_id uuid, p_receiver_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and id in (p_sender_id, p_receiver_id)
  )
$$;

create or replace function public.get_provider_profile_name(p_profile_id uuid)
returns table(full_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name,
    p.avatar_url
  from public.profiles p
  where p.id = p_profile_id
    and exists (
      select 1
      from public.service_providers sp
      where sp.profile_id = p.id
        and sp.status = 'approved'
    )
$$;

create or replace function public.get_provider_contact_info(provider_uuid uuid)
returns table(
  whatsapp_number text,
  address text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sp.whatsapp_number,
    sp.address
  from public.service_providers sp
  where sp.id = provider_uuid
    and sp.status = 'approved'
    and (
      sp.user_id = auth.uid()
      or public.has_role(auth.uid(), 'admin')
      or exists (
        select 1
        from public.bookings b
        where b.provider_id = sp.id
          and b.user_id = auth.uid()
          and b.status = 'accepted'
      )
    )
$$;

create or replace function public.get_public_provider_info(provider_uuid uuid)
returns table (
  id uuid,
  business_name text,
  city text,
  service_cities text[],
  description text,
  rating numeric,
  total_reviews integer,
  is_verified boolean,
  is_premium boolean,
  experience_years integer,
  specializations text[],
  languages text[],
  portfolio_images text[],
  category_id uuid,
  subcategory text,
  service_type text,
  category_name text,
  category_icon text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    sp.id,
    sp.business_name,
    sp.city,
    sp.service_cities,
    sp.description,
    sp.rating,
    sp.total_reviews,
    sp.is_verified,
    sp.is_premium,
    sp.experience_years,
    sp.specializations,
    sp.languages,
    sp.portfolio_images,
    sp.category_id,
    sp.subcategory,
    sp.service_type,
    sc.name as category_name,
    sc.icon as category_icon
  from public.service_providers sp
  left join public.service_categories sc on sp.category_id = sc.id
  where sp.status = 'approved'
    and sp.id = provider_uuid
$$;

create or replace function public.get_booking_participant_profile_ids(p_booking_id uuid)
returns table (customer_profile_id uuid, provider_profile_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select p.id from public.profiles p where p.user_id = b.user_id limit 1) as customer_profile_id,
    coalesce(
      sp.profile_id,
      (select p2.id from public.profiles p2 where p2.user_id = sp.user_id limit 1)
    ) as provider_profile_id
  from public.bookings b
  join public.service_providers sp on sp.id = b.provider_id
  where b.id = p_booking_id
    and (
      b.user_id = auth.uid()
      or sp.user_id = auth.uid()
      or public.has_role(auth.uid(), 'admin'::public.app_role)
    )
$$;

create or replace function public.get_booking_customer_chat_info(booking_ids uuid[])
returns table (
  booking_id uuid,
  customer_user_id uuid,
  customer_profile_id uuid,
  customer_name text,
  customer_profile_image text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.user_id as customer_user_id,
    p.id as customer_profile_id,
    p.full_name as customer_name,
    p.profile_image as customer_profile_image
  from public.bookings b
  join public.profiles p on p.user_id = b.user_id
  where b.id = any(booking_ids)
    and (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      or exists (
        select 1
        from public.service_providers sp
        where sp.id = b.provider_id
          and sp.user_id = auth.uid()
      )
    )
$$;

create or replace function public.get_inquiry_customer_info(conversation_ids uuid[])
returns table (
  conversation_id uuid,
  customer_user_id uuid,
  customer_name text,
  customer_email text,
  customer_profile_image text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ic.id as conversation_id,
    ic.user_id as customer_user_id,
    p.full_name as customer_name,
    p.email as customer_email,
    p.profile_image as customer_profile_image
  from public.inquiry_conversations ic
  join public.service_providers sp on sp.id = ic.provider_id
  join public.profiles p on p.user_id = ic.user_id
  where ic.id = any(conversation_ids)
    and (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      or sp.user_id = auth.uid()
    )
$$;

create or replace function public.get_trending_service_categories()
returns table(name text, slug text, booking_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    sc.name,
    sc.slug,
    count(b.id) as booking_count
  from public.bookings b
  join public.service_providers sp on sp.id = b.provider_id
  join public.service_categories sc on sc.id = sp.category_id
  where b.created_at >= now() - interval '4 weeks'
  group by sc.name, sc.slug
  order by booking_count desc
  limit 5;
$$;

create or replace function public.get_booking_customer_info(booking_ids uuid[])
returns table (
  booking_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_profile_image text
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  return query
  select
    b.id as booking_id,
    p.full_name as customer_name,
    p.email as customer_email,
    p.phone as customer_phone,
    p.profile_image as customer_profile_image
  from public.bookings b
  join public.profiles p on b.user_id = p.user_id
  where b.id = any(booking_ids)
    and b.provider_id in (
      select sp.id
      from public.service_providers sp
      where sp.user_id = auth.uid()
    );
end;
$$;

-- =========================================================
-- Wedding OS core tables and compatibility columns
-- =========================================================

create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  bride_name text not null,
  groom_name text not null,
  title text not null,
  wedding_date date,
  is_estimated_date boolean not null default false,
  budget_range text not null,
  total_budget numeric not null default 0,
  city text not null,
  location text,
  guest_count integer not null default 0,
  wedding_type text not null check (wedding_type = any (array['traditional'::text, 'destination'::text, 'simple'::text, 'grand'::text])),
  cultural_preferences text[] not null default '{}'::text[],
  notes text,
  status text not null default 'planning' check (status = any (array['planning'::text, 'active'::text, 'completed'::text, 'archived'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  role text not null check (role = any (array['owner'::text, 'bride'::text, 'groom'::text, 'parent'::text, 'sibling'::text, 'planner'::text])),
  permission_level text not null default 'edit' check (permission_level = any (array['view'::text, 'comment'::text, 'edit'::text, 'approve'::text])),
  status text not null default 'active' check (status = any (array['pending'::text, 'active'::text, 'removed'::text])),
  created_at timestamptz not null default now(),
  unique (wedding_id, user_id, role)
);

create table if not exists public.wedding_event_vendor_requirements (
  id uuid primary key default gen_random_uuid(),
  wedding_event_id uuid not null references public.wedding_events(id) on delete cascade,
  category_slug text not null,
  category_name text not null,
  required_count integer not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  wedding_event_id uuid references public.wedding_events(id) on delete cascade,
  category_slug text not null,
  category_name text not null,
  planned_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wedding_manual_expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category_name text not null,
  amount numeric not null default 0,
  spent_at date not null default current_date,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  invite_code text not null unique,
  role text not null check (role = any (array['bride'::text, 'groom'::text, 'parent'::text, 'sibling'::text, 'planner'::text])),
  permission_level text not null default 'edit' check (permission_level = any (array['view'::text, 'comment'::text, 'edit'::text, 'approve'::text])),
  expires_at timestamptz,
  is_used boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists wedding_id uuid references public.weddings(id) on delete set null;

alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.wedding_event_vendor_requirements enable row level security;
alter table public.wedding_budget_items enable row level security;
alter table public.wedding_manual_expenses enable row level security;
alter table public.wedding_invitations enable row level security;

create or replace function public.can_access_wedding(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.weddings w
    where w.id = _wedding_id
      and (
        w.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.wedding_members wm
          where wm.wedding_id = w.id
            and wm.user_id = auth.uid()
            and wm.status = 'active'
        )
      )
  )
$$;

create or replace function public.can_manage_wedding(_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.weddings w
    where w.id = _wedding_id
      and w.owner_user_id = auth.uid()
  )
$$;

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
using (public.can_manage_wedding(id));

create policy "Owners can view wedding members"
on public.wedding_members
for select
using (public.can_access_wedding(wedding_id));

create policy "Owners can manage wedding members"
on public.wedding_members
for all
using (public.can_manage_wedding(wedding_id))
with check (public.can_manage_wedding(wedding_id));

create policy "Members can view event requirements"
on public.wedding_event_vendor_requirements
for select
using (
  exists (
    select 1
    from public.wedding_events we
    where we.id = wedding_event_id
      and we.user_id = auth.uid()
  )
);

create policy "Owners can manage event requirements"
on public.wedding_event_vendor_requirements
for all
using (
  exists (
    select 1
    from public.wedding_events we
    where we.id = wedding_event_id
      and we.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.wedding_events we
    where we.id = wedding_event_id
      and we.user_id = auth.uid()
  )
);

create policy "Members can view wedding budgets"
on public.wedding_budget_items
for select
using (public.can_access_wedding(wedding_id));

create policy "Owners can manage wedding budgets"
on public.wedding_budget_items
for all
using (public.can_manage_wedding(wedding_id))
with check (public.can_manage_wedding(wedding_id));

create policy "Members can view manual expenses"
on public.wedding_manual_expenses
for select
using (public.can_access_wedding(wedding_id));

create policy "Owners can manage manual expenses"
on public.wedding_manual_expenses
for all
using (public.can_manage_wedding(wedding_id))
with check (public.can_manage_wedding(wedding_id));

create policy "Owners can view invitations"
on public.wedding_invitations
for select
using (public.can_manage_wedding(wedding_id));

create policy "Owners can manage invitations"
on public.wedding_invitations
for all
using (public.can_manage_wedding(wedding_id))
with check (public.can_manage_wedding(wedding_id));

create policy "Anyone can read invitation details by code"
on public.wedding_invitations
for select
using (is_used = false and (expires_at is null or expires_at > now()));

create or replace function public.seed_default_wedding_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev_date date := coalesce(new.event_date, (now() + interval '90 days')::date);
begin
  insert into public.wedding_tasks (event_id, title, category, due_date, sort_order, is_default) values
    (new.id, 'Set your wedding budget', 'planning', ev_date - 90, 1, true),
    (new.id, 'Finalize guest list', 'planning', ev_date - 80, 2, true),
    (new.id, 'Book venue / function hall', 'venue', ev_date - 75, 3, true),
    (new.id, 'Book photographer & videographer', 'vendors', ev_date - 60, 4, true),
    (new.id, 'Book caterer', 'vendors', ev_date - 55, 5, true),
    (new.id, 'Book decorator', 'vendors', ev_date - 50, 6, true),
    (new.id, 'Book makeup artist & mehndi', 'vendors', ev_date - 45, 7, true),
    (new.id, 'Book pandit / priest', 'vendors', ev_date - 40, 8, true),
    (new.id, 'Send invitations', 'planning', ev_date - 30, 9, true),
    (new.id, 'Confirm all vendor payments', 'payments', ev_date - 14, 10, true),
    (new.id, 'Final headcount to caterer', 'vendors', ev_date - 7, 11, true),
    (new.id, 'Wedding day!', 'event', ev_date, 12, true);
  return new;
end;
$$;

drop trigger if exists trg_seed_default_wedding_tasks on public.wedding_events;
create trigger trg_seed_default_wedding_tasks
after insert on public.wedding_events
for each row execute function public.seed_default_wedding_tasks();

create or replace function public.seed_default_wedding_budget_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  budget numeric := coalesce(new.total_budget, 0);
begin
  insert into public.wedding_budget_categories (event_id, category, planned_amount) values
    (new.id, 'Venue', round(budget * 0.30)),
    (new.id, 'Catering', round(budget * 0.25)),
    (new.id, 'Photography', round(budget * 0.15)),
    (new.id, 'Decor', round(budget * 0.15)),
    (new.id, 'Makeup and Mehndi', round(budget * 0.08)),
    (new.id, 'Music and Entertainment', round(budget * 0.07));
  return new;
end;
$$;

drop trigger if exists trg_seed_default_wedding_budget_categories on public.wedding_events;
create trigger trg_seed_default_wedding_budget_categories
after insert on public.wedding_events
for each row execute function public.seed_default_wedding_budget_categories();

insert into public.wedding_budget_categories (event_id, category, planned_amount)
select e.id, seed.category, round(coalesce(e.total_budget, 0) * seed.weight)
from public.wedding_events e
cross join (
  values
    ('Venue', 0.30::numeric),
    ('Catering', 0.25::numeric),
    ('Photography', 0.15::numeric),
    ('Decor', 0.15::numeric),
    ('Makeup and Mehndi', 0.08::numeric),
    ('Music and Entertainment', 0.07::numeric)
) as seed(category, weight)
where not exists (
  select 1
  from public.wedding_budget_categories c
  where c.event_id = e.id
);

drop trigger if exists update_weddings_updated_at on public.weddings;
create trigger update_weddings_updated_at
before update on public.weddings
for each row execute function public.update_updated_at_column();

drop trigger if exists update_wedding_budget_items_updated_at on public.wedding_budget_items;
create trigger update_wedding_budget_items_updated_at
before update on public.wedding_budget_items
for each row execute function public.update_updated_at_column();

alter table public.wedding_events
  drop constraint if exists wedding_events_wedding_style_check;

alter table public.wedding_events
  add constraint wedding_events_wedding_style_check
  check (wedding_style is null or wedding_style in ('traditional','modern','destination','intimate','royal','minimalist'));

alter table public.wedding_preferences
  drop constraint if exists wedding_preferences_wedding_style_check;

alter table public.wedding_preferences
  add constraint wedding_preferences_wedding_style_check
  check (wedding_style is null or wedding_style in ('traditional','modern','destination','intimate','royal','minimalist'));

alter table public.wedding_tasks
  drop constraint if exists wedding_tasks_status_check;

alter table public.wedding_tasks
  add constraint wedding_tasks_status_check
  check (status in ('pending','in_progress','completed','skipped'));

notify pgrst, 'reload schema';
