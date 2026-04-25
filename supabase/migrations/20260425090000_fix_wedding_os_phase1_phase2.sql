ALTER TABLE public.wedding_events
  DROP CONSTRAINT IF EXISTS wedding_events_wedding_style_check;

ALTER TABLE public.wedding_events
  ADD CONSTRAINT wedding_events_wedding_style_check
  CHECK (wedding_style IS NULL OR wedding_style IN ('traditional','modern','destination','intimate','royal','minimalist'));

ALTER TABLE public.wedding_preferences
  DROP CONSTRAINT IF EXISTS wedding_preferences_wedding_style_check;

ALTER TABLE public.wedding_preferences
  ADD CONSTRAINT wedding_preferences_wedding_style_check
  CHECK (wedding_style IS NULL OR wedding_style IN ('traditional','modern','destination','intimate','royal','minimalist'));

ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS portfolio_tags jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS real_wedding_stories jsonb DEFAULT '[]'::jsonb;

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
  sp.portfolio_tags,
  sp.real_wedding_stories,
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
FROM public.service_providers sp
WHERE sp.status = 'approved';
GRANT SELECT ON public.public_service_providers TO anon;
GRANT SELECT ON public.public_service_providers TO authenticated;

CREATE OR REPLACE FUNCTION public.seed_default_wedding_budget_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  budget numeric := COALESCE(NEW.total_budget, 0);
BEGIN
  INSERT INTO public.wedding_budget_categories (event_id, category, planned_amount) VALUES
    (NEW.id, 'Venue', ROUND(budget * 0.30)),
    (NEW.id, 'Catering', ROUND(budget * 0.25)),
    (NEW.id, 'Photography', ROUND(budget * 0.15)),
    (NEW.id, 'Decor', ROUND(budget * 0.15)),
    (NEW.id, 'Makeup and Mehndi', ROUND(budget * 0.08)),
    (NEW.id, 'Music and Entertainment', ROUND(budget * 0.07));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_default_wedding_budget_categories ON public.wedding_events;
CREATE TRIGGER trg_seed_default_wedding_budget_categories
  AFTER INSERT ON public.wedding_events
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_wedding_budget_categories();

INSERT INTO public.wedding_budget_categories (event_id, category, planned_amount)
SELECT e.id, seed.category, ROUND(COALESCE(e.total_budget, 0) * seed.weight)
FROM public.wedding_events e
CROSS JOIN (
  VALUES
    ('Venue', 0.30::numeric),
    ('Catering', 0.25::numeric),
    ('Photography', 0.15::numeric),
    ('Decor', 0.15::numeric),
    ('Makeup and Mehndi', 0.08::numeric),
    ('Music and Entertainment', 0.07::numeric)
) AS seed(category, weight)
WHERE NOT EXISTS (
  SELECT 1 FROM public.wedding_budget_categories c WHERE c.event_id = e.id
);
