-- Fix Security Definer View issue by recreating view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_provider_info;

CREATE VIEW public.public_provider_info 
WITH (security_invoker = true) AS
SELECT 
  sp.id,
  sp.business_name,
  sp.city,
  sp.service_cities,
  sp.description,
  sp.rating,
  sp.total_reviews,
  sp.pricing_info,
  sp.base_price,
  sp.is_verified,
  sp.is_premium,
  sp.experience_years,
  sp.specializations,
  sp.languages,
  sp.portfolio_images,
  sp.instagram_url,
  sp.facebook_url,
  sp.youtube_url,
  sp.website_url,
  sp.category_id,
  sp.subcategory,
  sp.service_type,
  sc.name as category_name,
  sc.icon as category_icon
FROM service_providers sp
LEFT JOIN service_categories sc ON sp.category_id = sc.id
WHERE sp.status = 'approved';