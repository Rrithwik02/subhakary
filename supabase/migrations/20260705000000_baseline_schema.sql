create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'provider', 'user');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.provider_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_type text default 'guest',
  address text,
  profile_image text,
  push_token text,
  two_factor_enabled boolean default false
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  business_name text not null,
  category_id uuid references public.service_categories(id),
  description text,
  experience_years integer default 0,
  languages text[] default '{}'::text[],
  city text,
  address text,
  pricing_info text,
  status public.provider_status not null default 'pending',
  is_verified boolean default false,
  rating numeric(2,1) default 0,
  total_reviews integer default 0,
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  profile_id uuid references public.profiles(id),
  service_type text,
  base_price numeric,
  portfolio_link text default ''::text,
  is_premium boolean default false,
  secondary_city text,
  portfolio_images text[] default '{}'::text[],
  specializations text[] default '{}'::text[],
  requires_advance_payment boolean default false,
  advance_payment_percentage integer default 0,
  subcategory text,
  gst_number text,
  whatsapp_number text,
  website_url text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  verification_document_url text,
  logo_url text,
  travel_charges_applicable boolean default false,
  advance_booking_days integer,
  terms_accepted boolean default false,
  terms_accepted_at timestamptz,
  service_cities text[] default '{}'::text[],
  portfolio_tags jsonb default '[]'::jsonb,
  real_wedding_stories jsonb default '[]'::jsonb,
  availability_status text
);

create table if not exists public.provider_documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  file_name text not null,
  verified boolean default false,
  created_at timestamptz not null default now(),
  verification_status text,
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid,
  service_category_id uuid
);

create table if not exists public.additional_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id),
  service_type text not null,
  description text not null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  min_price numeric not null,
  max_price numeric not null,
  portfolio_images text[] default '{}'::text[],
  subcategory text,
  specialization text,
  metadata jsonb default '{}'::jsonb,
  category_id uuid references public.service_categories(id),
  verification_status text,
  verified_at timestamptz,
  verified_by uuid
);

create table if not exists public.service_bundles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id),
  bundle_name text not null,
  description text,
  base_price numeric not null,
  discounted_price numeric not null,
  discount_percentage integer default 0,
  is_active boolean default true,
  min_advance_percentage integer default 30,
  max_guests integer,
  duration_days integer default 1,
  portfolio_images text[] default '{}'::text[],
  terms_conditions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  inclusions text[] default '{}'::text[],
  exclusions text[] default '{}'::text[],
  extra_charges jsonb default '[]'::jsonb
);

create table if not exists public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.service_bundles(id) on delete cascade,
  service_type text not null,
  service_name text not null,
  description text,
  quantity integer default 1,
  individual_price numeric,
  created_at timestamptz default now()
);

create table if not exists public.bundle_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bundle_id uuid not null references public.service_bundles(id),
  event_date date not null,
  guest_count integer,
  total_amount numeric not null,
  advance_amount numeric,
  status text default 'pending',
  special_requirements text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  service_date date not null,
  service_time text,
  message text,
  status public.booking_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  time_slot time without time zone,
  special_requirements text,
  completion_status text default 'pending',
  completion_confirmed_by_customer boolean default false,
  completion_confirmed_by_provider boolean default false,
  payment_preference text default 'pay_now',
  refund_amount numeric default 0,
  cancellation_reason text,
  cancelled_at timestamptz,
  start_date date,
  end_date date,
  total_days integer default 1,
  total_amount numeric,
  provider_payment_requested boolean default false,
  completion_requested_at timestamptz,
  auto_complete_at timestamptz,
  event_id uuid
);

create table if not exists public.booking_completion_details (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  service_description text not null,
  amount_charged numeric not null,
  completion_days integer not null,
  additional_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_verified_at timestamptz,
  service_description_verified boolean,
  service_description_dispute text,
  amount_verified boolean,
  amount_dispute text,
  completion_days_verified boolean,
  completion_days_dispute text,
  additional_notes_verified boolean,
  additional_notes_dispute text
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  rating integer not null,
  review_text text,
  created_at timestamptz not null default now(),
  comment text,
  status text default 'pending',
  photos text[] default '{}'::text[],
  service_quality_rating integer,
  communication_rating integer,
  value_for_money_rating integer,
  punctuality_rating integer,
  wedding_budget_range text,
  wedding_size text
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  message text not null,
  read boolean default false,
  created_at timestamptz default now(),
  delivery_status text
);

create table if not exists public.chat_connections (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  user_id uuid references auth.users(id),
  provider_id uuid references public.service_providers(id),
  user_confirmed boolean default false,
  provider_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  title text not null,
  message text not null,
  type text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email_enabled boolean default true,
  sms_enabled boolean default true,
  push_enabled boolean default true,
  payment_reminders boolean default true,
  booking_updates boolean default true,
  promotional boolean default false,
  frequency text default 'immediate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  provider_id uuid references public.service_providers(id),
  created_at timestamptz default now(),
  unique (user_id, provider_id)
);

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now(),
  status text default 'pending'
);

create table if not exists public.service_provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id),
  day_of_week integer,
  start_time time without time zone not null,
  end_time time without time zone not null,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  specific_date date,
  is_blocked boolean default false
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  provider_id uuid references public.service_providers(id),
  service_type text not null,
  description text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.service_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  suggestion_type text not null,
  description text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid references public.service_providers(id),
  service_type text not null,
  description text not null,
  event_date date,
  budget_range text,
  location text not null,
  guest_count integer,
  special_requirements text,
  images text[] default '{}'::text[],
  status text not null default 'pending',
  quoted_amount numeric,
  quoted_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  amount numeric not null,
  payment_type text not null,
  status text default 'pending',
  admin_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  escrow_status text default 'none',
  milestone_number integer default 1,
  provider_requested_amount numeric,
  payment_description text,
  is_provider_requested boolean default false
);

create table if not exists public.payment_schedules (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  payment_plan text not null default 'standard',
  total_milestones integer default 2,
  milestones jsonb not null default '[{"due_date": null, "percentage": 50, "description": "Advance payment"}, {"due_date": null, "percentage": 50, "description": "Final payment"}]'::jsonb,
  current_milestone integer default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_reminders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  milestone_number integer not null,
  reminder_type text not null,
  sent_at timestamptz,
  status text default 'pending',
  next_reminder_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.escrow_payments (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id),
  booking_id uuid not null references public.bookings(id),
  amount numeric not null,
  status text not null default 'held',
  held_at timestamptz not null default now(),
  release_condition text not null default 'completion_confirmation',
  auto_release_date timestamptz,
  released_at timestamptz,
  released_by uuid references auth.users(id),
  dispute_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers(id),
  amount numeric not null,
  net_amount numeric not null,
  payout_method text not null default 'bank_transfer',
  status text not null default 'pending',
  payout_reference text,
  payout_date date,
  processed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_payment_details (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.service_providers(id),
  account_holder_name text,
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  qr_code_url text,
  payment_method text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ceremony_themes (
  id uuid primary key default gen_random_uuid(),
  theme_name text not null,
  ceremony_type text not null,
  color_scheme jsonb not null,
  font_settings jsonb not null,
  decorative_elements jsonb not null,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_theme_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  ceremony_type text not null,
  theme_id uuid references public.ceremony_themes(id),
  custom_settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_payment_details_access_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  provider_id uuid not null,
  accessed_at timestamptz default now()
);

create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  ip_address text,
  user_agent text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references auth.users(id),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  token_hash text
);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  is_active boolean default true,
  source text default 'website'
);

create table if not exists public.email_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  code text not null,
  purpose text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.inquiry_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  booking_id uuid references public.bookings(id) on delete set null,
  unique (user_id, provider_id)
);

create table if not exists public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inquiry_conversations(id) on delete cascade,
  sender_id uuid not null,
  message text not null,
  read boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_application_id uuid references public.service_providers(id) on delete cascade,
  subject text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references auth.users(id)
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'My Wedding',
  event_date date,
  city text,
  total_budget numeric,
  wedding_size text,
  wedding_style text,
  progress_percent integer not null default 0,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wedding_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  budget_min numeric,
  budget_max numeric,
  wedding_size text,
  wedding_style text,
  location text,
  event_date date,
  priorities text[] default '{}'::text[],
  guest_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wedding_budget_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.wedding_events(id) on delete cascade,
  category text not null,
  planned_amount numeric not null default 0,
  actual_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wedding_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.wedding_events(id) on delete cascade,
  title text not null,
  description text,
  category text,
  due_date date,
  status text not null default 'pending',
  sort_order integer not null default 0,
  is_default boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_capacity_rules (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null unique references public.service_categories(slug) on delete cascade,
  max_bookings_per_day integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_manual_expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.wedding_events(id) on delete cascade,
  category_name text not null,
  amount numeric not null default 0,
  spent_at date not null default current_date,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.wedding_events(id) on delete cascade,
  invite_code text not null unique,
  role text not null,
  permission_level text not null default 'edit',
  expires_at timestamptz,
  is_used boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create view public.public_service_providers
with (security_invoker = false)
as
select
  sp.id,
  sp.business_name,
  sp.city,
  sp.secondary_city,
  sp.service_cities,
  sp.description,
  sp.specializations,
  sp.languages,
  sp.portfolio_images,
  sp.portfolio_tags,
  sp.real_wedding_stories,
  sp.portfolio_link,
  sp.experience_years,
  sp.rating,
  sp.total_reviews,
  sp.base_price,
  sp.is_verified,
  sp.status,
  sp.created_at,
  sp.updated_at,
  sp.is_premium,
  sp.category_id,
  sp.subcategory,
  sp.service_type,
  sp.pricing_info,
  sp.logo_url,
  sp.facebook_url,
  sp.instagram_url,
  sp.youtube_url,
  sp.website_url,
  sp.requires_advance_payment,
  sp.advance_payment_percentage,
  sp.travel_charges_applicable,
  sp.advance_booking_days,
  sp.availability_status,
  sp.url_slug
from public.service_providers sp
where sp.status = 'approved';
