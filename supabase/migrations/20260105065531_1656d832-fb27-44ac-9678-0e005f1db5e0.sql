-- Update RLS policy to enforce user ID in path for review photos
DROP POLICY IF EXISTS "Authenticated users can upload review photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also update delete policy to only allow users to delete their own photos
DROP POLICY IF EXISTS "Users can delete their own review photos" ON storage.objects;

CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);