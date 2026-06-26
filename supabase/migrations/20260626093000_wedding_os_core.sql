-- Core Wedding OS entities
CREATE TABLE IF NOT EXISTS public.weddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bride_name text NOT NULL,
  groom_name text NOT NULL,
  title text NOT NULL,
  wedding_date date,
  is_estimated_date boolean NOT NULL DEFAULT false,
  budget_range text NOT NULL,
  total_budget numeric NOT NULL DEFAULT 0,
  city text NOT NULL,
  location text,
  guest_count integer NOT NULL DEFAULT 0,
  wedding_type text NOT NULL CHECK (wedding_type = ANY (ARRAY['traditional'::text, 'destination'::text, 'simple'::text, 'grand'::text])),
  cultural_preferences text[] NOT NULL DEFAULT '{}'::text[],
  notes text,
  status text NOT NULL DEFAULT 'planning' CHECK (status = ANY (ARRAY['planning'::text, 'active'::text, 'completed'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wedding_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email text,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'bride'::text, 'groom'::text, 'parent'::text, 'sibling'::text, 'planner'::text])),
  permission_level text NOT NULL DEFAULT 'edit' CHECK (permission_level = ANY (ARRAY['view'::text, 'comment'::text, 'edit'::text, 'approve'::text])),
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'removed'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (wedding_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS public.wedding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  event_date date,
  event_time time without time zone,
  venue text,
  city text,
  guest_count integer NOT NULL DEFAULT 0,
  budget_allocated numeric NOT NULL DEFAULT 0,
  notes text,
  checklist_progress integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wedding_event_vendor_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_event_id uuid NOT NULL REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  category_name text NOT NULL,
  required_count integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wedding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  wedding_event_id uuid REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'todo' CHECK (status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text])),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wedding_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  wedding_event_id uuid REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  category_name text NOT NULL,
  planned_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS wedding_id uuid REFERENCES public.weddings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS wedding_event_id uuid REFERENCES public.wedding_events(id) ON DELETE SET NULL;

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_event_vendor_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_budget_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_wedding(_wedding_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.weddings w
    WHERE w.id = _wedding_id
      AND (
        w.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.wedding_members wm
          WHERE wm.wedding_id = w.id
            AND wm.user_id = auth.uid()
            AND wm.status = 'active'
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_wedding(_wedding_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.weddings w
    WHERE w.id = _wedding_id
      AND w.owner_user_id = auth.uid()
  )
$$;

CREATE POLICY "Owners and members can view weddings"
ON public.weddings
FOR SELECT
USING (public.can_access_wedding(id));

CREATE POLICY "Users can create weddings"
ON public.weddings
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update weddings"
ON public.weddings
FOR UPDATE
USING (public.can_manage_wedding(id));

CREATE POLICY "Owners can view wedding members"
ON public.wedding_members
FOR SELECT
USING (public.can_access_wedding(wedding_id));

CREATE POLICY "Owners can manage wedding members"
ON public.wedding_members
FOR ALL
USING (public.can_manage_wedding(wedding_id))
WITH CHECK (public.can_manage_wedding(wedding_id));

CREATE POLICY "Members can view wedding events"
ON public.wedding_events
FOR SELECT
USING (public.can_access_wedding(wedding_id));

CREATE POLICY "Owners can manage wedding events"
ON public.wedding_events
FOR ALL
USING (public.can_manage_wedding(wedding_id))
WITH CHECK (public.can_manage_wedding(wedding_id));

CREATE POLICY "Members can view event requirements"
ON public.wedding_event_vendor_requirements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.wedding_events we
    WHERE we.id = wedding_event_id
      AND public.can_access_wedding(we.wedding_id)
  )
);

CREATE POLICY "Owners can manage event requirements"
ON public.wedding_event_vendor_requirements
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.wedding_events we
    WHERE we.id = wedding_event_id
      AND public.can_manage_wedding(we.wedding_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.wedding_events we
    WHERE we.id = wedding_event_id
      AND public.can_manage_wedding(we.wedding_id)
  )
);

CREATE POLICY "Members can view wedding tasks"
ON public.wedding_tasks
FOR SELECT
USING (public.can_access_wedding(wedding_id));

CREATE POLICY "Owners can manage wedding tasks"
ON public.wedding_tasks
FOR ALL
USING (public.can_manage_wedding(wedding_id))
WITH CHECK (public.can_manage_wedding(wedding_id));

CREATE POLICY "Members can view wedding budgets"
ON public.wedding_budget_items
FOR SELECT
USING (public.can_access_wedding(wedding_id));

CREATE POLICY "Owners can manage wedding budgets"
ON public.wedding_budget_items
FOR ALL
USING (public.can_manage_wedding(wedding_id))
WITH CHECK (public.can_manage_wedding(wedding_id));

CREATE TRIGGER update_weddings_updated_at
BEFORE UPDATE ON public.weddings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_events_updated_at
BEFORE UPDATE ON public.wedding_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_tasks_updated_at
BEFORE UPDATE ON public.wedding_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_budget_items_updated_at
BEFORE UPDATE ON public.wedding_budget_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
