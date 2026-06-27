-- 1. Booking Capacity Rules per Category
CREATE TABLE IF NOT EXISTS public.booking_capacity_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL UNIQUE REFERENCES public.service_categories(slug) ON DELETE CASCADE,
  max_bookings_per_day integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_capacity_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view capacity rules"
  ON public.booking_capacity_rules
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage capacity rules"
  ON public.booking_capacity_rules
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- 2. Manual/Out-of-Platform Expenses
CREATE TABLE IF NOT EXISTS public.wedding_manual_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category_name text NOT NULL, -- e.g. 'Clothing', 'Gold', 'Invites'
  amount numeric NOT NULL DEFAULT 0,
  spent_at date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_manual_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view manual expenses"
  ON public.wedding_manual_expenses
  FOR SELECT
  USING (public.can_access_wedding(wedding_id));

CREATE POLICY "Owners can manage manual expenses"
  ON public.wedding_manual_expenses
  FOR ALL
  USING (public.can_manage_wedding(wedding_id))
  WITH CHECK (public.can_manage_wedding(wedding_id));


-- 3. Shareable Unique Workspace Invitations (WhatsApp-friendly)
CREATE TABLE IF NOT EXISTS public.wedding_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['bride'::text, 'groom'::text, 'parent'::text, 'sibling'::text, 'planner'::text])),
  permission_level text NOT NULL DEFAULT 'edit' CHECK (permission_level = ANY (ARRAY['view'::text, 'comment'::text, 'edit'::text, 'approve'::text])),
  expires_at timestamp with time zone,
  is_used boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view invitations"
  ON public.wedding_invitations
  FOR SELECT
  USING (public.can_manage_wedding(wedding_id));

CREATE POLICY "Owners can manage invitations"
  ON public.wedding_invitations
  FOR ALL
  USING (public.can_manage_wedding(wedding_id))
  WITH CHECK (public.can_manage_wedding(wedding_id));

CREATE POLICY "Anyone can read invitation details by code"
  ON public.wedding_invitations
  FOR SELECT
  USING (is_used = false AND (expires_at IS NULL OR expires_at > now()));
