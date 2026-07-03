
CREATE POLICY "Staff can manage repair-order-pdfs" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'repair-order-pdfs' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'repair-order-pdfs' AND public.is_staff(auth.uid()));
