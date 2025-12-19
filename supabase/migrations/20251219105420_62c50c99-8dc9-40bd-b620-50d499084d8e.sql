-- Fix pending reviews visibility - only show approved reviews publicly
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;

-- Only show approved reviews to anonymous users
CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
TO anon
USING (status = 'approved');

-- Authenticated users can view approved reviews + their own + reviews for their provider
CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
TO authenticated
USING (
  status = 'approved' OR
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM service_providers sp 
    WHERE sp.id = reviews.provider_id 
    AND sp.user_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'admin')
);