
-- Helper: does the current user have a repair order linked to this entity?
CREATE OR REPLACE FUNCTION public.tech_owns_repair_order(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.repair_orders o
    WHERE o.id = _order_id AND o.assigned_technician_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.tech_owns_repair_customer(_customer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.repair_orders o
    WHERE o.customer_id = _customer_id AND o.assigned_technician_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.tech_owns_repair_device(_device_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.repair_orders o
    WHERE o.device_id = _device_id AND o.assigned_technician_id = auth.uid()
  )
$$;

-- Tighten technician SELECT policies
DROP POLICY IF EXISTS "Technicians can view repair_orders" ON public.repair_orders;
CREATE POLICY "Technicians can view assigned repair_orders" ON public.repair_orders
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND assigned_technician_id = auth.uid());

DROP POLICY IF EXISTS "Technicians can update repair_orders" ON public.repair_orders;
CREATE POLICY "Technicians can update assigned repair_orders" ON public.repair_orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND assigned_technician_id = auth.uid())
  WITH CHECK (has_role(auth.uid(),'technician'::app_role) AND assigned_technician_id = auth.uid());

DROP POLICY IF EXISTS "Technicians can view repair_customers" ON public.repair_customers;
CREATE POLICY "Technicians can view linked repair_customers" ON public.repair_customers
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_customer(id));

DROP POLICY IF EXISTS "Technicians can update repair_customers" ON public.repair_customers;
CREATE POLICY "Technicians can update linked repair_customers" ON public.repair_customers
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_customer(id))
  WITH CHECK (has_role(auth.uid(),'technician'::app_role));

DROP POLICY IF EXISTS "Technicians can view repair_devices" ON public.repair_devices;
CREATE POLICY "Technicians can view linked repair_devices" ON public.repair_devices
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_device(id));

DROP POLICY IF EXISTS "Technicians can update repair_devices" ON public.repair_devices;
CREATE POLICY "Technicians can update linked repair_devices" ON public.repair_devices
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_device(id))
  WITH CHECK (has_role(auth.uid(),'technician'::app_role));

DROP POLICY IF EXISTS "Technicians can view repair_order_history" ON public.repair_order_history;
CREATE POLICY "Technicians can view linked repair_order_history" ON public.repair_order_history
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_order(order_id));

DROP POLICY IF EXISTS "Technicians can view repair_order_photos" ON public.repair_order_photos;
CREATE POLICY "Technicians can view linked repair_order_photos" ON public.repair_order_photos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_order(order_id));

DROP POLICY IF EXISTS "Technicians can update repair_order_photos" ON public.repair_order_photos;
CREATE POLICY "Technicians can update linked repair_order_photos" ON public.repair_order_photos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'technician'::app_role) AND public.tech_owns_repair_order(order_id))
  WITH CHECK (has_role(auth.uid(),'technician'::app_role));

-- Lock down service_requests inserts
DROP POLICY IF EXISTS "Anyone can insert service requests" ON public.service_requests;
CREATE POLICY "Anon can insert anonymous service requests" ON public.service_requests
  FOR INSERT TO anon
  WITH CHECK (customer_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert requests" ON public.service_requests;
CREATE POLICY "Authenticated users can insert own requests" ON public.service_requests
  FOR INSERT TO authenticated
  WITH CHECK (customer_id IS NULL OR customer_id = auth.uid());

-- Storage: make repair-photos effectively private by removing public listing policy
DROP POLICY IF EXISTS "Public read repair-photos" ON storage.objects;
