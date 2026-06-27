-- Add MIME type and file size restrictions to the review-photos bucket
-- This prevents users from uploading malicious files or extremely large files

UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  file_size_limit = 5242880 -- 5MB in bytes
WHERE id = 'review-photos';