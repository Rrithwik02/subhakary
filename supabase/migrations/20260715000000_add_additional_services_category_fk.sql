alter table public.additional_services
  add column if not exists category_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'additional_services_category_id_fkey'
  ) then
    alter table public.additional_services
      add constraint additional_services_category_id_fkey
      foreign key (category_id) references public.service_categories(id);
  end if;
end $$;

create index if not exists idx_additional_services_category_id
  on public.additional_services(category_id);

update public.additional_services as a
set category_id = sc.id
from public.service_categories as sc
where a.category_id is null
  and lower(trim(a.service_type)) = lower(trim(sc.name));
