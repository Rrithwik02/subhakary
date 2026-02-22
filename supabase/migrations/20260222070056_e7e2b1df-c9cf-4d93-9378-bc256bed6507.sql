
-- 1. Add url_slug column
ALTER TABLE public.service_providers ADD COLUMN url_slug text;

-- 2. Create slug generation function
CREATE OR REPLACE FUNCTION public.generate_provider_slug(p_name text, p_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from business name
  base_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use 'provider'
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'provider';
  END IF;
  
  -- Try base slug first
  final_slug := base_slug;
  
  -- Check for uniqueness, append short id suffix if needed
  WHILE EXISTS (SELECT 1 FROM service_providers WHERE url_slug = final_slug AND id != p_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- 3. Backfill existing providers
UPDATE public.service_providers 
SET url_slug = public.generate_provider_slug(business_name, id)
WHERE url_slug IS NULL;

-- 4. Make NOT NULL and UNIQUE
ALTER TABLE public.service_providers ALTER COLUMN url_slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_providers_url_slug ON public.service_providers(url_slug);

-- 5. Create trigger for auto-generation
CREATE OR REPLACE FUNCTION public.auto_generate_provider_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate slug on insert or when business_name changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.business_name IS DISTINCT FROM NEW.business_name) THEN
    NEW.url_slug := public.generate_provider_slug(NEW.business_name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_generate_provider_slug
BEFORE INSERT OR UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_provider_slug();

-- 6. Drop and recreate public_service_providers view WITH url_slug and WITHOUT security_invoker
-- so anon users can access it (view owner bypasses RLS)
DROP VIEW IF EXISTS public.public_service_providers;

CREATE VIEW public.public_service_providers
WITH (security_invoker = false)
AS
SELECT
  sp.id,
  sp.business_name,
  sp.city,
  sp.secondary_city,
  sp.service_cities,
  sp.description,
  sp.specializations,
  sp.languages,
  sp.portfolio_images,
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
FROM service_providers sp
WHERE sp.status = 'approved';

-- 7. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_service_providers TO anon;
GRANT SELECT ON public.public_service_providers TO authenticated;
