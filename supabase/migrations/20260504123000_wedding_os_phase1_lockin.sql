ALTER TABLE public.wedding_events
  ADD COLUMN IF NOT EXISTS health_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_summary text;

ALTER TABLE public.inquiry_conversations
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.wedding_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_service_date date,
  ADD COLUMN IF NOT EXISTS couple_budget numeric,
  ADD COLUMN IF NOT EXISTS guest_count integer,
  ADD COLUMN IF NOT EXISTS preferred_style text,
  ADD COLUMN IF NOT EXISTS priority_notes text,
  ADD COLUMN IF NOT EXISTS negotiation_status text NOT NULL DEFAULT 'researching',
  ADD COLUMN IF NOT EXISTS fit_score integer,
  ADD COLUMN IF NOT EXISTS budget_fit_label text;

CREATE INDEX IF NOT EXISTS idx_inquiry_conversations_event_id ON public.inquiry_conversations(event_id);

CREATE TABLE IF NOT EXISTS public.inquiry_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.inquiry_conversations(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'proposed',
  created_by uuid NOT NULL,
  valid_until date,
  version_no integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiry_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view inquiry quotes"
ON public.inquiry_quotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.inquiry_conversations ic
    WHERE ic.id = inquiry_quotes.conversation_id
      AND (
        auth.uid() = ic.user_id
        OR EXISTS (
          SELECT 1
          FROM public.service_providers sp
          WHERE sp.id = ic.provider_id
            AND sp.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Participants can create inquiry quotes"
ON public.inquiry_quotes
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1
    FROM public.inquiry_conversations ic
    WHERE ic.id = inquiry_quotes.conversation_id
      AND (
        auth.uid() = ic.user_id
        OR EXISTS (
          SELECT 1
          FROM public.service_providers sp
          WHERE sp.id = ic.provider_id
            AND sp.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Participants can update inquiry quotes"
ON public.inquiry_quotes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.inquiry_conversations ic
    WHERE ic.id = inquiry_quotes.conversation_id
      AND (
        auth.uid() = ic.user_id
        OR EXISTS (
          SELECT 1
          FROM public.service_providers sp
          WHERE sp.id = ic.provider_id
            AND sp.user_id = auth.uid()
        )
      )
  )
);

CREATE TABLE IF NOT EXISTS public.wedding_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.inquiry_conversations(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.service_providers(id) ON DELETE SET NULL,
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'document',
  file_name text NOT NULL,
  file_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view wedding documents"
ON public.wedding_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.wedding_events we
    WHERE we.id = wedding_documents.event_id
      AND we.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.service_providers sp
    WHERE sp.id = wedding_documents.provider_id
      AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can upload wedding documents"
ON public.wedding_documents
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND (
    EXISTS (
      SELECT 1
      FROM public.wedding_events we
      WHERE we.id = wedding_documents.event_id
        AND we.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.service_providers sp
      WHERE sp.id = wedding_documents.provider_id
        AND sp.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Participants can delete their wedding documents"
ON public.wedding_documents
FOR DELETE
USING (
  auth.uid() = uploaded_by
  AND (
    EXISTS (
      SELECT 1
      FROM public.wedding_events we
      WHERE we.id = wedding_documents.event_id
        AND we.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.service_providers sp
      WHERE sp.id = wedding_documents.provider_id
        AND sp.user_id = auth.uid()
    )
  )
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-documents', 'wedding-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their wedding documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'wedding-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their wedding documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'wedding-documents'
  AND EXISTS (
    SELECT 1
    FROM public.wedding_documents wd
    WHERE wd.file_path = name
      AND (
        EXISTS (
          SELECT 1
          FROM public.wedding_events we
          WHERE we.id = wd.event_id
            AND we.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.service_providers sp
          WHERE sp.id = wd.provider_id
            AND sp.user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "Users can delete their wedding documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'wedding-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
