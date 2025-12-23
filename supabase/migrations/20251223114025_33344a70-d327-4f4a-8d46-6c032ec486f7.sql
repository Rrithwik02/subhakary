-- Create support tickets table for rejected provider support conversations
CREATE TABLE public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_application_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    closed_by uuid REFERENCES auth.users(id)
);

-- Create support ticket messages table
CREATE TABLE public.support_ticket_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_admin boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view their own support tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets"
ON public.support_tickets FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update support tickets"
ON public.support_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for support_ticket_messages
CREATE POLICY "Users can view messages in their tickets"
ON public.support_ticket_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id = support_ticket_messages.ticket_id
        AND st.user_id = auth.uid()
    )
);

CREATE POLICY "Users can send messages in their tickets"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id = support_ticket_messages.ticket_id
        AND (st.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
        AND st.status = 'open'
    )
);

CREATE POLICY "Admins can view all ticket messages"
ON public.support_ticket_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can send messages in any ticket"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'admin') AND
    auth.uid() = sender_id
);

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;