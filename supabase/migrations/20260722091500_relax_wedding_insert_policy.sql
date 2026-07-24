-- Allow authenticated wedding creation to rely on the database trigger for ownership.
-- The trigger still hard-sets owner_user_id to auth.uid(), so this keeps least privilege
-- while avoiding brittle dependence on client-supplied ownership values.

alter table public.weddings enable row level security;

drop policy if exists "Authenticated users can create weddings" on public.weddings;

create policy "Authenticated users can create weddings"
on public.weddings
for insert
to authenticated
with check (auth.uid() is not null);

notify pgrst, 'reload schema';
