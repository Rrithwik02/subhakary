-- Add availability_status column to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'offline' 
CHECK (availability_status IN ('online', 'offline', 'busy'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_providers_availability_status 
ON public.service_providers(availability_status);

-- Update RLS policies to allow providers to update their own availability status
CREATE POLICY "Providers can update their own availability status"
ON public.service_providers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);