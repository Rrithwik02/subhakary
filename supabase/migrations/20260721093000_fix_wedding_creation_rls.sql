-- Harden Wedding OS creation so authenticated users can only create weddings they own.
-- This keeps RLS enabled and removes any dependency on client-supplied ownership values.

-- Normalize ownership at the database boundary.
create or replace function public.set_wedding_owner_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated to create a wedding';
  end if;

  new.owner_user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_set_wedding_owner_user_id on public.weddings;
create trigger trg_set_wedding_owner_user_id
before insert on public.weddings
for each row
execute function public.set_wedding_owner_user_id();

-- Recreate wedding policies explicitly.
alter table public.weddings enable row level security;
drop policy if exists "Owners and members can view weddings" on public.weddings;
drop policy if exists "Users can create weddings" on public.weddings;
drop policy if exists "Owners can update weddings" on public.weddings;

create policy "Owners and members can view weddings"
on public.weddings
for select
using (public.can_access_wedding(id));

create policy "Authenticated users can create weddings"
on public.weddings
for insert
to authenticated
with check (
  auth.uid() is not null
  and owner_user_id = auth.uid()
);

create policy "Owners can update weddings"
on public.weddings
for update
to authenticated
using (public.can_manage_wedding(id))
with check (public.can_manage_wedding(id));

-- Make wedding member access explicit and least-privilege.
alter table public.wedding_members enable row level security;
drop policy if exists "Owners can view wedding members" on public.wedding_members;
drop policy if exists "Owners can manage wedding members" on public.wedding_members;

create policy "Owners can view wedding members"
on public.wedding_members
for select
to authenticated
using (public.can_access_wedding(wedding_id));

create policy "Owners can create wedding members"
on public.wedding_members
for insert
to authenticated
with check (public.can_manage_wedding(wedding_id));

create policy "Owners can update wedding members"
on public.wedding_members
for update
to authenticated
using (public.can_manage_wedding(wedding_id))
with check (public.can_manage_wedding(wedding_id));

create policy "Owners can delete wedding members"
on public.wedding_members
for delete
to authenticated
using (public.can_manage_wedding(wedding_id));

notify pgrst, 'reload schema';
