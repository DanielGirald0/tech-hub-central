CREATE POLICY "Admins can delete service requests"
ON public.service_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));