-- Remap imported public data onto the live Supabase auth users.
-- The exported public tables were imported with historical user IDs, while the
-- live project has the Google auth users under new IDs. This migration keeps the
-- public records intact but relinks them to the current auth users by email.

update public.profiles
set user_id = '7df46d08-fa20-4dda-9de0-03ec1962f967',
    updated_at = now()
where lower(email) = lower('rrithwikrrishi2002@gmail.com');

update public.profiles
set user_id = '922dd515-a90e-4978-9c15-d4453b69978d',
    updated_at = now()
where lower(email) = lower('mreshwarkumar@gmail.com');

update public.profiles
set user_id = '9a63972f-34bb-4954-8c6a-57a17c6c96fc',
    updated_at = now()
where lower(email) = lower('subhakaryam.official@gmail.com');

update public.service_providers
set user_id = '7df46d08-fa20-4dda-9de0-03ec1962f967'
where business_name = 'Rrishi Photography Services(Sample one)';

insert into public.profiles (user_id, email, full_name, avatar_url, user_type)
select
  a.id,
  a.email,
  coalesce(a.raw_user_meta_data ->> 'full_name', a.raw_user_meta_data ->> 'name'),
  a.raw_user_meta_data ->> 'avatar_url',
  coalesce(p.user_type, 'guest')
from auth.users a
left join public.profiles p on p.user_id = a.id
where p.user_id is null
on conflict (user_id) do update
set email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

insert into public.user_roles (user_id, role)
select a.id, 'user'::public.app_role
from auth.users a
where not exists (
  select 1
  from public.user_roles ur
  where ur.user_id = a.id
    and ur.role = 'user'
)
on conflict do nothing;

insert into public.user_roles (user_id, role)
values ('7df46d08-fa20-4dda-9de0-03ec1962f967', 'provider'::public.app_role)
on conflict do nothing;

insert into public.user_roles (user_id, role)
values ('9a63972f-34bb-4954-8c6a-57a17c6c96fc', 'admin'::public.app_role)
on conflict do nothing;
