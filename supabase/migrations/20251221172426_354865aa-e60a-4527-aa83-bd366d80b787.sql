-- Add columns for review photos and aspect ratings
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_quality_rating INTEGER,
ADD COLUMN IF NOT EXISTS communication_rating INTEGER,
ADD COLUMN IF NOT EXISTS value_for_money_rating INTEGER,
ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER;

-- Add completion confirmation columns to bookings (if not exists)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS completion_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_complete_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for review photos
CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);