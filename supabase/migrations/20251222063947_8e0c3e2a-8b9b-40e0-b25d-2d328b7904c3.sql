-- Create table to store completion details filled by provider
CREATE TABLE public.booking_completion_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  amount_charged NUMERIC NOT NULL,
  completion_days INTEGER NOT NULL,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Customer verification fields
  customer_verified_at TIMESTAMP WITH TIME ZONE,
  service_description_verified BOOLEAN,
  service_description_dispute TEXT,
  amount_verified BOOLEAN,
  amount_dispute TEXT,
  completion_days_verified BOOLEAN,
  completion_days_dispute TEXT,
  additional_notes_verified BOOLEAN,
  additional_notes_dispute TEXT,
  
  CONSTRAINT unique_booking_completion UNIQUE (booking_id)
);

-- Enable RLS
ALTER TABLE public.booking_completion_details ENABLE ROW LEVEL SECURITY;

-- Policies for providers to manage their completion details
CREATE POLICY "Providers can create completion details"
ON public.booking_completion_details
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = booking_completion_details.booking_id
    AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can view their completion details"
ON public.booking_completion_details
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = booking_completion_details.booking_id
    AND sp.user_id = auth.uid()
  )
);

CREATE POLICY "Providers can update their completion details"
ON public.booking_completion_details
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = booking_completion_details.booking_id
    AND sp.user_id = auth.uid()
  )
);

-- Policies for customers to view and verify
CREATE POLICY "Customers can view their booking completion details"
ON public.booking_completion_details
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_completion_details.booking_id
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can update verification fields"
ON public.booking_completion_details
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_completion_details.booking_id
    AND b.user_id = auth.uid()
  )
);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_completion_details;