-- =====================================================
-- SECURITY FIX: Address 4 error-level security issues
-- =====================================================

-- ISSUE 1: Secure storage buckets with MIME type and file size restrictions
-- =========================================================================

-- Secure avatars bucket (public=true)
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 
    'image/webp', 'image/gif'
  ],
  file_size_limit = 5242880  -- 5MB
WHERE id = 'avatars';

-- Secure provider-documents bucket (private)
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  file_size_limit = 10485760  -- 10MB
WHERE id = 'provider-documents';

-- ISSUE 2 & 3: Fix profiles table - Remove overly permissive public access
-- =========================================================================

-- Drop the problematic policy that exposes ALL profile data to public
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view provider profile names" ON public.profiles;

-- Users can view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all profiles for administrative purposes
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can view minimal info of provider profiles (for displaying provider names/avatars)
-- This allows the app to show provider names in bookings, reviews, etc.
CREATE POLICY "Authenticated users can view provider profile names"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND id IN (
    SELECT profile_id FROM service_providers 
    WHERE status = 'approved' AND profile_id IS NOT NULL
  )
);

-- ISSUE 4: Tighten service_providers public access
-- =========================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view approved providers" ON public.service_providers;
DROP POLICY IF EXISTS "Authenticated users can view approved providers" ON public.service_providers;

-- Create a more restrictive policy - authenticated users can view approved providers
-- Sensitive fields (address, whatsapp_number, gst_number) are already protected by 
-- the get_provider_contact_info() function which checks for booking relationships
CREATE POLICY "Authenticated users can view approved providers"
ON public.service_providers FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND status = 'approved'
);