-- Same never-applied-migration pattern as verification_status (see
-- 20260916020000): this table's admin review UI (AdminDashboard.tsx)
-- reads/writes verified_at/verified_by, defined in
-- supabase/migrations/20260109075603_e5f7dc81-df7d-4b23-947d-5c332eee3627.sql
-- but never applied live. Found via a full schema-drift audit cross-checking
-- every ADD COLUMN in supabase/migrations/ against live information_schema.
alter table public.additional_services
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid;
