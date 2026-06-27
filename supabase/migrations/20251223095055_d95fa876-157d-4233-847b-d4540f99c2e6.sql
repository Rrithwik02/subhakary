-- Add verification fields to provider_documents table
ALTER TABLE public.provider_documents 
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Add admin update policy for provider_documents
CREATE POLICY "Admins can update documents" 
ON public.provider_documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));