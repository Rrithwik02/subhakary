-- Fix 1: Update service_providers to require authentication for viewing approved providers
DROP POLICY IF EXISTS "Users can view approved providers" ON service_providers;
DROP POLICY IF EXISTS "Authenticated users can view approved providers" ON service_providers;

CREATE POLICY "Authenticated users can view approved providers"
ON service_providers
FOR SELECT
USING (
  (status = 'approved' AND auth.uid() IS NOT NULL)
  OR auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Fix 2: Update service_bundles to require authentication for viewing
DROP POLICY IF EXISTS "Anyone can view active bundles" ON service_bundles;
DROP POLICY IF EXISTS "Public can view active bundles" ON service_bundles;
DROP POLICY IF EXISTS "Authenticated users can view active bundles" ON service_bundles;

CREATE POLICY "Authenticated users can view active bundles"
ON service_bundles
FOR SELECT
USING (
  (is_active = true AND auth.uid() IS NOT NULL)
  OR EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = service_bundles.provider_id 
    AND sp.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);