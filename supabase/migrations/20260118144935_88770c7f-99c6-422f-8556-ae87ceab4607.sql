-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view approved providers" ON public.service_providers;

-- Create a new policy that allows ANYONE to view approved providers (for public browsing)
-- while still allowing users to see their own applications and admins to see all
CREATE POLICY "Anyone can view approved providers" 
ON public.service_providers 
FOR SELECT 
USING (
  status = 'approved' OR 
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);