DROP POLICY IF EXISTS "Public can read product-images" ON storage.objects;

CREATE POLICY "Admins can read product-images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::app_role));