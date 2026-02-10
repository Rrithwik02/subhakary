
CREATE OR REPLACE FUNCTION public.get_trending_service_categories()
RETURNS TABLE(name text, slug text, booking_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sc.name,
    sc.slug,
    COUNT(b.id) AS booking_count
  FROM bookings b
  JOIN service_providers sp ON sp.id = b.provider_id
  JOIN service_categories sc ON sc.id = sp.category_id
  WHERE b.created_at >= now() - interval '4 weeks'
  GROUP BY sc.name, sc.slug
  ORDER BY booking_count DESC
  LIMIT 5;
$$;
