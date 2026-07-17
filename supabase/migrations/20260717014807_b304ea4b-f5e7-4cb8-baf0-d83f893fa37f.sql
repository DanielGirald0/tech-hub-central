
-- repair_devices INSERT: require the new device's customer to be linked to an order assigned to the technician
DROP POLICY IF EXISTS "Technicians can insert repair_devices" ON public.repair_devices;
CREATE POLICY "Technicians can insert repair_devices"
ON public.repair_devices
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_customer(customer_id)
);

-- repair_customers UPDATE: enforce ownership post-update as well
DROP POLICY IF EXISTS "Technicians can update linked repair_customers" ON public.repair_customers;
CREATE POLICY "Technicians can update linked repair_customers"
ON public.repair_customers
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_customer(id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_customer(id)
);

-- repair_devices UPDATE: enforce ownership of resulting device + its customer
DROP POLICY IF EXISTS "Technicians can update linked repair_devices" ON public.repair_devices;
CREATE POLICY "Technicians can update linked repair_devices"
ON public.repair_devices
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_device(id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_device(id)
  AND public.tech_owns_repair_customer(customer_id)
);

-- repair_order_photos UPDATE: enforce order ownership post-update to prevent reassignment
DROP POLICY IF EXISTS "Technicians can update linked repair_order_photos" ON public.repair_order_photos;
CREATE POLICY "Technicians can update linked repair_order_photos"
ON public.repair_order_photos
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_order(order_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'technician'::app_role)
  AND public.tech_owns_repair_order(order_id)
);
