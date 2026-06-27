-- Fix overly permissive INSERT policies by adding basic validation
-- These tables are intentionally public but should have some basic constraints

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;

-- Create new policies with basic validation for contact_submissions
-- Allow inserts but ensure required fields are not empty
CREATE POLICY "Anyone can submit contact form with valid data"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Ensure required fields have valid content (not empty strings)
  length(trim(name)) > 0 AND
  length(trim(email)) > 0 AND
  length(trim(phone)) > 0 AND
  length(trim(message)) > 0 AND
  -- Basic email format validation
  email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' AND
  -- Rate limiting: prevent spam by limiting message length
  length(message) <= 5000 AND
  length(name) <= 200 AND
  length(phone) <= 20
);

-- Create new policy for newsletter_subscriptions with validation
CREATE POLICY "Anyone can subscribe to newsletter with valid email"
ON public.newsletter_subscriptions
FOR INSERT
TO public
WITH CHECK (
  -- Ensure email is valid format
  length(trim(email)) > 0 AND
  email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' AND
  length(email) <= 255
);