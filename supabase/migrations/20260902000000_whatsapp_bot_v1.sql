create extension if not exists pgcrypto;

create table if not exists public.whatsapp_services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_service_questions (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null references public.whatsapp_services(slug) on delete cascade,
  key text not null,
  label text not null,
  type text not null check (type in ('text', 'select', 'number', 'date', 'multiselect')),
  required boolean not null default false,
  sort_order integer not null default 100,
  options jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_slug, key)
);

create table if not exists public.whatsapp_service_requirements (
  id uuid primary key default gen_random_uuid(),
  service_slug text not null references public.whatsapp_services(slug) on delete cascade,
  requirement_id text not null,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (service_slug, requirement_id)
);

alter table public.whatsapp_services enable row level security;
alter table public.whatsapp_service_questions enable row level security;
alter table public.whatsapp_service_requirements enable row level security;

insert into public.whatsapp_services (category_id, name, slug, description, icon, sort_order)
select id, name, slug, description, icon,
  case slug
    when 'photography' then 10
    when 'videography' then 20
    when 'catering' then 30
    when 'makeup' then 40
    when 'decorations' then 50
    when 'functionhalls' then 60
    when 'priests' then 70
    else 100
  end
from public.service_categories
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

insert into public.whatsapp_services (name, slug, description, sort_order)
values ('General Service', '_generic', 'General event service questions', 0)
on conflict (slug) do nothing;

insert into public.whatsapp_service_questions (service_slug, key, label, type, required, sort_order, options)
values
  ('_generic', 'location', 'Where is your event taking place?', 'text', true, 10, null),
  ('_generic', 'event_type', 'What type of event is this?', 'select', true, 20, '["Wedding", "Reception", "Engagement", "Haldi", "Mehendi", "Other"]'::jsonb),
  ('_generic', 'event_date', 'What is the event date? (DD/MM/YYYY)', 'date', true, 30, null),
  ('_generic', 'budget_range', 'What is your approximate budget?', 'text', false, 40, null)
on conflict (service_slug, key) do update set
  label = excluded.label, type = excluded.type, required = excluded.required,
  sort_order = excluded.sort_order, options = excluded.options;

insert into public.whatsapp_service_questions (service_slug, key, label, type, required, sort_order, options)
select ws.slug, q.key, q.label, q.type, q.required, q.sort_order, q.options
from public.whatsapp_services ws
cross join (values
  ('event_days', 'How many event days do you need coverage for?', 'number', false, 50, null::jsonb),
  ('guest_count', 'How many guests are you expecting?', 'number', true, 50, null::jsonb),
  ('people_count', 'How many people need this service?', 'number', false, 50, null::jsonb),
  ('food_preference', 'Any food preferences or menu notes?', 'text', false, 60, null::jsonb),
  ('makeup_type', 'What makeup style are you looking for?', 'text', false, 60, null::jsonb),
  ('venue_type', 'What type of venue should we plan for?', 'text', false, 50, null::jsonb),
  ('ceremony_type', 'What ceremony should the priest support?', 'text', false, 50, null::jsonb)
) as q(key, label, type, required, sort_order, options)
where ws.slug in ('photography', 'videography', 'catering', 'makeup', 'decorations', 'functionhalls', 'priests')
  and ((ws.slug in ('photography', 'videography') and q.key = 'event_days')
    or (ws.slug in ('catering', 'functionhalls') and q.key = 'guest_count')
    or (ws.slug = 'catering' and q.key = 'food_preference')
    or (ws.slug = 'makeup' and q.key in ('people_count', 'makeup_type'))
    or (ws.slug = 'decorations' and q.key = 'venue_type')
    or (ws.slug = 'priests' and q.key = 'ceremony_type'))
on conflict (service_slug, key) do update set
  label = excluded.label, type = excluded.type, required = excluded.required,
  sort_order = excluded.sort_order, options = excluded.options;

insert into public.whatsapp_service_requirements (service_slug, requirement_id, label, sort_order)
values
  ('photography', 'photography-wedding', 'Wedding Photography', 10),
  ('photography', 'photography-candid', 'Candid Photography', 20),
  ('photography', 'photography-traditional', 'Traditional Photography', 30),
  ('photography', 'photography-prewedding', 'Pre-Wedding Photography', 40),
  ('photography', 'photography-cinematic', 'Cinematic Video', 50),
  ('photography', 'photography-drone', 'Drone Photography', 60),
  ('photography', 'photography-videography', 'Wedding Videography', 70),
  ('videography', 'videography-cinematic', 'Cinematic Video', 10),
  ('videography', 'videography-drone', 'Drone Videography', 20),
  ('videography', 'videography-highlights', 'Highlight Film', 30),
  ('videography', 'videography-full-coverage', 'Full Event Coverage', 40),
  ('catering', 'catering-veg', 'Vegetarian Menu', 10),
  ('catering', 'catering-nonveg', 'Non-Vegetarian Menu', 20),
  ('catering', 'catering-buffet', 'Buffet Service', 30),
  ('catering', 'catering-plated', 'Plated Service', 40),
  ('catering', 'catering-sweets', 'Sweets and Desserts', 50),
  ('makeup', 'makeup-bridal', 'Bridal Makeup', 10),
  ('makeup', 'makeup-groom', 'Groom Makeup', 20),
  ('makeup', 'makeup-hd', 'HD Makeup', 30),
  ('makeup', 'makeup-party', 'Party Makeup', 40),
  ('makeup', 'makeup-hair', 'Hair Styling', 50),
  ('decorations', 'decor-stage', 'Stage Decoration', 10),
  ('decorations', 'decor-floral', 'Floral Decoration', 20),
  ('decorations', 'decor-entrance', 'Entrance Decoration', 30),
  ('decorations', 'decor-mandap', 'Mandap Decoration', 40),
  ('decorations', 'decor-theme', 'Theme Decoration', 50),
  ('functionhalls', 'venue-indoor', 'Indoor Hall', 10),
  ('functionhalls', 'venue-outdoor', 'Outdoor Lawn', 20),
  ('functionhalls', 'venue-banquet', 'Banquet Hall', 30),
  ('functionhalls', 'venue-convention', 'Convention Center', 40),
  ('functionhalls', 'venue-ac', 'AC Hall', 50),
  ('priests', 'priest-vedic', 'Vedic Rituals', 10),
  ('priests', 'priest-marriage', 'Wedding Ceremony', 20),
  ('priests', 'priest-homam', 'Homam / Havan', 30),
  ('priests', 'priest-grihapravesh', 'Griha Pravesh', 40)
on conflict (service_slug, requirement_id) do update set label = excluded.label, sort_order = excluded.sort_order;

create sequence if not exists public.whatsapp_request_code_seq;

create table if not exists public.whatsapp_customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  whatsapp_phone text not null,
  normalized_phone text not null unique,
  display_name text,
  source text not null default 'whatsapp',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.whatsapp_customers(id) on delete cascade,
  conversation_state text not null default 'welcome',
  current_step text,
  state_payload jsonb not null default '{}'::jsonb,
  source text not null default 'whatsapp',
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_whatsapp_conversations_customer_id
  on public.whatsapp_conversations(customer_id);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  whatsapp_message_id text not null unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text',
  body text,
  payload jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'received',
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  customer_id uuid not null references public.whatsapp_customers(id) on delete cascade,
  request_type text not null check (request_type in ('service_request', 'support', 'recommendation')),
  status text not null default 'NEW',
  source text not null default 'whatsapp',
  service_category_id uuid references public.service_categories(id),
  service_category_name text,
  service_category_slug text,
  location_name text,
  event_type text,
  event_date date,
  guest_count integer,
  budget_range text,
  selected_requirement_ids text[] not null default '{}'::text[],
  selected_provider_ids uuid[] not null default '{}'::uuid[],
  recommendation_requested boolean not null default false,
  service_answers jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_requests_customer_created_at
  on public.whatsapp_requests(customer_id, created_at desc);

create index if not exists idx_whatsapp_requests_status
  on public.whatsapp_requests(status);

create table if not exists public.whatsapp_request_providers (
  request_id uuid not null references public.whatsapp_requests(id) on delete cascade,
  provider_id uuid not null references public.service_providers(id) on delete cascade,
  selection_rank integer not null default 1,
  is_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (request_id, provider_id)
);

create table if not exists public.whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.whatsapp_customers(id) on delete set null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  request_id uuid references public.whatsapp_requests(id) on delete set null,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'whatsapp',
  created_at timestamptz not null default now()
);

create or replace function public.set_whatsapp_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_whatsapp_request_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.request_code is null or new.request_code = '' then
    new.request_code := 'SBK-' || lpad(nextval('public.whatsapp_request_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_whatsapp_customers_updated_at on public.whatsapp_customers;
create trigger trg_whatsapp_customers_updated_at
before update on public.whatsapp_customers
for each row execute function public.set_whatsapp_updated_at();

drop trigger if exists trg_whatsapp_conversations_updated_at on public.whatsapp_conversations;
create trigger trg_whatsapp_conversations_updated_at
before update on public.whatsapp_conversations
for each row execute function public.set_whatsapp_updated_at();

drop trigger if exists trg_whatsapp_requests_updated_at on public.whatsapp_requests;
create trigger trg_whatsapp_requests_updated_at
before update on public.whatsapp_requests
for each row execute function public.set_whatsapp_updated_at();

drop trigger if exists trg_generate_whatsapp_request_code on public.whatsapp_requests;
create trigger trg_generate_whatsapp_request_code
before insert on public.whatsapp_requests
for each row execute function public.generate_whatsapp_request_code();

alter table public.whatsapp_customers enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_requests enable row level security;
alter table public.whatsapp_request_providers enable row level security;
alter table public.whatsapp_events enable row level security;

notify pgrst, 'reload schema';
