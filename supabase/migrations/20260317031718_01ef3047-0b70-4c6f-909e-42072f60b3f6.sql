
-- Add specifications and full_description columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS full_description text DEFAULT ''::text;

-- Fix RLS: allow authenticated users to insert service requests even without matching customer_id
-- Drop the restrictive policy and replace with a permissive one
DROP POLICY IF EXISTS "Users can create own requests" ON public.service_requests;
CREATE POLICY "Authenticated users can insert requests"
ON public.service_requests
FOR INSERT
TO authenticated
WITH CHECK (true);
