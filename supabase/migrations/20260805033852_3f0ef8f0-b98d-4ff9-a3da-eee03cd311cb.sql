DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (
  approved = false
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Technicians can insert repair_orders" ON public.repair_orders;
CREATE POLICY "Technicians can insert repair_orders"
ON public.repair_orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'technician'::app_role)
  AND assigned_technician_id = auth.uid()
  AND tech_owns_repair_customer(customer_id) IS NOT NULL
);