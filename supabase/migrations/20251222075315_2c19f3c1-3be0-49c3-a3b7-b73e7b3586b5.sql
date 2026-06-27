-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON public.reviews;

-- Create corrected INSERT policy using profile lookup
CREATE POLICY "Users can create reviews for their completed bookings" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = reviews.user_id AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = reviews.booking_id 
    AND b.user_id = auth.uid() 
    AND b.status = 'completed'::booking_status
  )
);