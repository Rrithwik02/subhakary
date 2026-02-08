-- Harden access to sensitive PII in profiles/contact_submissions while preserving required business flows via SECURITY DEFINER functions

-- 1) PROFILES: ensure strict owner/admin read access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile owners can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Owners can read only their own profile
CREATE POLICY "Profiles: owners can view"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Profiles: admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 2) CONTACT SUBMISSIONS: explicitly restrict SELECT to admins only
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Deny anon read access to contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can submit contact form with valid data" ON public.contact_submissions;

CREATE POLICY "Contact: admins can view submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Anyone (anon/authenticated) can submit with validation
CREATE POLICY "Contact: anyone can submit"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (length(TRIM(BOTH FROM name)) > 0)
  AND (length(TRIM(BOTH FROM email)) > 0)
  AND (length(TRIM(BOTH FROM phone)) > 0)
  AND (length(TRIM(BOTH FROM message)) > 0)
  AND (email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
  AND (length(message) <= 5000)
  AND (length(name) <= 200)
  AND (length(phone) <= 20)
);


-- 3) SECURITY DEFINER FUNCTIONS: provide limited, authorized access to basic profile info needed by the app

-- Given a booking, return the customer/provider profile IDs for chat routing.
CREATE OR REPLACE FUNCTION public.get_booking_participant_profile_ids(p_booking_id uuid)
RETURNS TABLE (customer_profile_id uuid, provider_profile_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT p.id FROM public.profiles p WHERE p.user_id = b.user_id LIMIT 1) AS customer_profile_id,
    COALESCE(
      sp.profile_id,
      (SELECT p2.id FROM public.profiles p2 WHERE p2.user_id = sp.user_id LIMIT 1)
    ) AS provider_profile_id
  FROM public.bookings b
  JOIN public.service_providers sp ON sp.id = b.provider_id
  WHERE b.id = p_booking_id
    AND (
      b.user_id = auth.uid()
      OR sp.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    );
$$;

-- For providers: fetch customer display info for specific bookings (name + avatar + profile id).
CREATE OR REPLACE FUNCTION public.get_booking_customer_chat_info(booking_ids uuid[])
RETURNS TABLE (
  booking_id uuid,
  customer_user_id uuid,
  customer_profile_id uuid,
  customer_name text,
  customer_profile_image text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    b.id AS booking_id,
    b.user_id AS customer_user_id,
    p.id AS customer_profile_id,
    p.full_name AS customer_name,
    p.profile_image AS customer_profile_image
  FROM public.bookings b
  JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.id = ANY(booking_ids)
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.service_providers sp
        WHERE sp.id = b.provider_id
          AND sp.user_id = auth.uid()
      )
    );
$$;

-- For providers: fetch customer info for inquiry conversations they own.
CREATE OR REPLACE FUNCTION public.get_inquiry_customer_info(conversation_ids uuid[])
RETURNS TABLE (
  conversation_id uuid,
  customer_user_id uuid,
  customer_name text,
  customer_email text,
  customer_profile_image text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ic.id AS conversation_id,
    ic.user_id AS customer_user_id,
    p.full_name AS customer_name,
    p.email AS customer_email,
    p.profile_image AS customer_profile_image
  FROM public.inquiry_conversations ic
  JOIN public.service_providers sp ON sp.id = ic.provider_id
  JOIN public.profiles p ON p.user_id = ic.user_id
  WHERE ic.id = ANY(conversation_ids)
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR sp.user_id = auth.uid()
    );
$$;
