-- Never applied: supabase/migrations/20260425063322_6ff323c1-072c-4ace-9de0-a5c2a64a09f6.sql
-- ProviderBundleManager.tsx / ProviderBundles.tsx read/write all three;
-- this is the exact gap flagged in an earlier session's tsc audit of
-- ProviderBundles.tsx, now confirmed and fixed via a full schema-drift audit.
alter table public.service_bundles
  add column if not exists inclusions text[] default '{}',
  add column if not exists exclusions text[] default '{}',
  add column if not exists extra_charges jsonb default '[]'::jsonb;
