
-- Allow admins to view all additional services (including pending ones for verification)
CREATE POLICY "Admins can view all additional services"
ON public.additional_services
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update additional services (for verification workflow)
CREATE POLICY "Admins can update additional services"
ON public.additional_services
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
