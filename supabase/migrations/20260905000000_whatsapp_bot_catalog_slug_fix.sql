insert into public.whatsapp_service_questions (service_slug, key, label, type, required, sort_order, options)
values ('function-halls', 'guest_count', 'How many guests are you expecting?', 'number', true, 50, null)
on conflict (service_slug, key) do update set
  label = excluded.label,
  type = excluded.type,
  required = excluded.required,
  sort_order = excluded.sort_order,
  options = excluded.options;
