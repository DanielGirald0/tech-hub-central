
-- Add new columns to service_requests for the service request form
ALTER TABLE public.service_requests 
  ADD COLUMN IF NOT EXISTS service_id text,
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS full_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS message text DEFAULT '';

-- Make customer_id nullable so anonymous users can submit
ALTER TABLE public.service_requests ALTER COLUMN customer_id DROP NOT NULL;

-- Allow anonymous (non-authenticated) users to insert service requests
CREATE POLICY "Anyone can insert service requests"
ON public.service_requests
FOR INSERT
TO anon
WITH CHECK (true);
