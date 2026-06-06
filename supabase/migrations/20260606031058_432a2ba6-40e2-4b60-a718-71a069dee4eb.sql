
-- repair_order_history: scope technician INSERT to assigned orders
DROP POLICY IF EXISTS "Technicians can insert repair_order_history" ON public.repair_order_history;
CREATE POLICY "Technicians can insert repair_order_history"
  ON public.repair_order_history FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'technician'::app_role)
    AND public.tech_owns_repair_order(order_id)
  );

-- repair_order_photos: scope technician INSERT to assigned orders
DROP POLICY IF EXISTS "Technicians can insert repair_order_photos" ON public.repair_order_photos;
CREATE POLICY "Technicians can insert repair_order_photos"
  ON public.repair_order_photos FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'technician'::app_role)
    AND public.tech_owns_repair_order(order_id)
  );

-- repair_customers: technicians should not freely create customer records.
-- Remove blanket technician INSERT; admins keep their existing permissions.
DROP POLICY IF EXISTS "Technicians can insert repair_customers" ON public.repair_customers;

-- Storage: scope technician access to repair-photos by order folder (path: <order_id>/...)
DROP POLICY IF EXISTS "Technicians can read repair-photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can upload repair-photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can update repair-photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can delete repair-photos" ON storage.objects;

CREATE POLICY "Technicians can read assigned repair-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'repair-photos'
    AND public.has_role(auth.uid(), 'technician'::app_role)
    AND public.tech_owns_repair_order(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Technicians can upload assigned repair-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'repair-photos'
    AND public.has_role(auth.uid(), 'technician'::app_role)
    AND public.tech_owns_repair_order(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Technicians can delete assigned repair-photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'repair-photos'
    AND public.has_role(auth.uid(), 'technician'::app_role)
    AND public.tech_owns_repair_order(((storage.foldername(name))[1])::uuid)
  );
