-- 1. Wedding events (group all bookings/budget/tasks under one wedding)
CREATE TABLE public.wedding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Wedding',
  event_date date,
  city text,
  total_budget numeric,
  wedding_size text CHECK (wedding_size IN ('intimate','mid','grand')),
  wedding_style text CHECK (wedding_style IN ('traditional','modern','luxury','fusion')),
  progress_percent integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their wedding events" ON public.wedding_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_wedding_events_updated BEFORE UPDATE ON public.wedding_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Wedding preferences (from guided quiz)
CREATE TABLE public.wedding_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  budget_min numeric,
  budget_max numeric,
  wedding_size text CHECK (wedding_size IN ('intimate','mid','grand')),
  wedding_style text CHECK (wedding_style IN ('traditional','modern','luxury','fusion')),
  location text,
  event_date date,
  priorities text[] DEFAULT '{}',
  guest_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wedding_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their preferences" ON public.wedding_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_wedding_prefs_updated BEFORE UPDATE ON public.wedding_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Budget categories (planned vs actual per event)
CREATE TABLE public.wedding_budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  category text NOT NULL,
  planned_amount numeric NOT NULL DEFAULT 0,
  actual_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wedding_budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their budget categories" ON public.wedding_budget_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wedding_events e WHERE e.id = event_id AND e.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );
CREATE TRIGGER trg_wedding_budget_updated BEFORE UPDATE ON public.wedding_budget_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Wedding tasks (checklist with timeline)
CREATE TABLE public.wedding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wedding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their tasks" ON public.wedding_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wedding_events e WHERE e.id = event_id AND e.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );
CREATE TRIGGER trg_wedding_tasks_updated BEFORE UPDATE ON public.wedding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Link bookings to a wedding event (optional)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.wedding_events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);

-- 6. Review context tags
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS wedding_budget_range text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS wedding_size text CHECK (wedding_size IN ('intimate','mid','grand'));

-- 7. Bundle transparent pricing
ALTER TABLE public.service_bundles ADD COLUMN IF NOT EXISTS inclusions text[] DEFAULT '{}';
ALTER TABLE public.service_bundles ADD COLUMN IF NOT EXISTS exclusions text[] DEFAULT '{}';
ALTER TABLE public.service_bundles ADD COLUMN IF NOT EXISTS extra_charges jsonb DEFAULT '[]'::jsonb;

-- 8. Helper: seed default checklist when an event is created
CREATE OR REPLACE FUNCTION public.seed_default_wedding_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev_date date := COALESCE(NEW.event_date, (now() + interval '90 days')::date);
BEGIN
  INSERT INTO public.wedding_tasks (event_id, title, category, due_date, sort_order, is_default) VALUES
    (NEW.id, 'Set your wedding budget', 'planning', ev_date - 90, 1, true),
    (NEW.id, 'Finalize guest list', 'planning', ev_date - 80, 2, true),
    (NEW.id, 'Book venue / function hall', 'venue', ev_date - 75, 3, true),
    (NEW.id, 'Book photographer & videographer', 'vendors', ev_date - 60, 4, true),
    (NEW.id, 'Book caterer', 'vendors', ev_date - 55, 5, true),
    (NEW.id, 'Book decorator', 'vendors', ev_date - 50, 6, true),
    (NEW.id, 'Book makeup artist & mehndi', 'vendors', ev_date - 45, 7, true),
    (NEW.id, 'Book pandit / priest', 'vendors', ev_date - 40, 8, true),
    (NEW.id, 'Send invitations', 'planning', ev_date - 30, 9, true),
    (NEW.id, 'Confirm all vendor payments', 'payments', ev_date - 14, 10, true),
    (NEW.id, 'Final headcount to caterer', 'vendors', ev_date - 7, 11, true),
    (NEW.id, 'Wedding day!', 'event', ev_date, 12, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_default_wedding_tasks
  AFTER INSERT ON public.wedding_events
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_wedding_tasks();