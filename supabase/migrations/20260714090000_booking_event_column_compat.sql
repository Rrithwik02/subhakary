-- Keep booking event links compatible across deployed web bundles and newer event workspaces.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS wedding_event_id uuid;

UPDATE public.bookings
SET
  event_id = COALESCE(event_id, wedding_event_id),
  wedding_event_id = COALESCE(wedding_event_id, event_id)
WHERE event_id IS DISTINCT FROM wedding_event_id;

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_wedding_event_id ON public.bookings(wedding_event_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_event_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.wedding_events(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_wedding_event_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_wedding_event_id_fkey
      FOREIGN KEY (wedding_event_id) REFERENCES public.wedding_events(id) ON DELETE SET NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
