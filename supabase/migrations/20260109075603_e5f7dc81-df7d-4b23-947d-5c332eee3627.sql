-- 1. Add Videography category
INSERT INTO service_categories (name, slug, description, icon)
VALUES ('Videography', 'videography', 'Professional video coverage for all events', 'Video');

-- 2. Add service_category_id to provider_documents for linking documents to specific services
ALTER TABLE provider_documents 
ADD COLUMN IF NOT EXISTS service_category_id uuid REFERENCES service_categories(id);

-- 3. Add verification fields to additional_services table
ALTER TABLE additional_services
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES service_categories(id),
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_by uuid;

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_additional_services_category_id ON additional_services(category_id);
CREATE INDEX IF NOT EXISTS idx_additional_services_verification_status ON additional_services(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_service_category ON provider_documents(service_category_id);