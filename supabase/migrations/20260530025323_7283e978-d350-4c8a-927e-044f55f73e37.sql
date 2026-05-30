
-- 1. Add assigned_technician_id column
ALTER TABLE public.repair_orders
  ADD COLUMN IF NOT EXISTS assigned_technician_id uuid;

CREATE INDEX IF NOT EXISTS idx_repair_orders_assigned_tech ON public.repair_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_received_at ON public.repair_orders(received_at);

-- 2. Staff helper
CREATE OR REPLACE FUNCTION public.is_staff(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_uid, 'admin'::app_role) OR public.has_role(_uid, 'technician'::app_role)
$$;

REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- 3. RLS policies for technicians on repair module (admins already have ALL via existing policy)
CREATE POLICY "Technicians can view repair_customers"
  ON public.repair_customers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can insert repair_customers"
  ON public.repair_customers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can update repair_customers"
  ON public.repair_customers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Technicians can view repair_devices"
  ON public.repair_devices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can insert repair_devices"
  ON public.repair_devices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can update repair_devices"
  ON public.repair_devices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Technicians can view repair_orders"
  ON public.repair_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can insert repair_orders"
  ON public.repair_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can update repair_orders"
  ON public.repair_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Technicians can view repair_order_history"
  ON public.repair_order_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can insert repair_order_history"
  ON public.repair_order_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Technicians can view repair_order_photos"
  ON public.repair_order_photos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can insert repair_order_photos"
  ON public.repair_order_photos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can update repair_order_photos"
  ON public.repair_order_photos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'technician'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'technician'::app_role));

-- 4. Storage: technicians can read/write repair-photos (admins already can)
CREATE POLICY "Technicians can read repair-photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'repair-photos' AND public.has_role(auth.uid(), 'technician'::app_role));
CREATE POLICY "Technicians can upload repair-photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'repair-photos' AND public.has_role(auth.uid(), 'technician'::app_role));

-- 5. Update admin_update_user to handle technician role and prevent technicians from escalating
CREATE OR REPLACE FUNCTION public.admin_update_user(
  _user_id uuid, _name text, _email text, _phone text, _document_number text,
  _address text, _notes text, _account_status text, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc text;
  v_conflict uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_doc := regexp_replace(coalesce(_document_number,''),'\D','','g');
  IF v_doc = '' THEN v_doc := NULL; END IF;

  IF v_doc IS NOT NULL THEN
    SELECT user_id INTO v_conflict
      FROM public.profiles
     WHERE regexp_replace(coalesce(document_number,''),'\D','','g') = v_doc
       AND user_id <> _user_id
     LIMIT 1;
    IF v_conflict IS NOT NULL THEN
      RAISE EXCEPTION 'Documento ya registrado en otro usuario';
    END IF;
  END IF;

  UPDATE public.profiles
     SET name = coalesce(_name, name),
         email = coalesce(_email, email),
         phone = coalesce(_phone, phone),
         document_number = v_doc,
         address = coalesce(_address, address),
         notes = coalesce(_notes, notes),
         account_status = coalesce(_account_status, account_status),
         updated_at = now()
   WHERE user_id = _user_id;

  UPDATE public.user_roles
     SET role = _role
   WHERE user_id = _user_id AND role <> _role;

  IF v_doc IS NOT NULL THEN
    PERFORM public.link_repair_customer_to_user_by_doc(_user_id, v_doc);
    UPDATE public.repair_customers
       SET name = coalesce(_name, name),
           phone = coalesce(_phone, phone),
           email = coalesce(_email, email),
           address = coalesce(_address, address),
           updated_at = now()
     WHERE user_id = _user_id
        OR regexp_replace(coalesce(document_number,''),'\D','','g') = v_doc;
  ELSE
    UPDATE public.repair_customers
       SET name = coalesce(_name, name),
           phone = coalesce(_phone, phone),
           email = coalesce(_email, email),
           address = coalesce(_address, address),
           updated_at = now()
     WHERE user_id = _user_id;
  END IF;
END;
$$;

-- 6. get_all_users: allow staff (admin + technician) to list users for technician assignment.
-- Technicians get a limited view (still sees role) but cannot modify via admin_update_user.
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(user_id uuid, name text, email text, phone text, document_number text, address text, notes text, account_status text, role app_role, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.email, p.phone,
         p.document_number, p.address, p.notes, p.account_status,
         ur.role, p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.is_staff(auth.uid())
$$;

-- 7. Reports

CREATE OR REPLACE FUNCTION public.get_repair_report(_from timestamptz, _to timestamptz)
RETURNS TABLE(
  id uuid,
  order_number text,
  received_at timestamptz,
  delivered_at timestamptz,
  estimated_date date,
  status repair_status,
  cost numeric,
  customer_name text,
  customer_document text,
  customer_phone text,
  technician_name text,
  technician_id uuid,
  device_type text,
  brand text,
  model text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.received_at, o.delivered_at, o.estimated_date,
         o.status, o.cost,
         c.name, c.document_number, c.phone,
         COALESCE(NULLIF(o.assigned_technician,''), p.name, '—') AS technician_name,
         o.assigned_technician_id,
         d.device_type, d.brand, d.model
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  LEFT JOIN public.profiles p ON p.user_id = o.assigned_technician_id
  WHERE public.is_staff(auth.uid())
    AND o.received_at >= _from
    AND o.received_at < _to
  ORDER BY o.received_at DESC
$$;

REVOKE EXECUTE ON FUNCTION public.get_repair_report(timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_repair_report(timestamptz, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_repair_report_summary(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH base AS (
    SELECT o.*, COALESCE(NULLIF(o.assigned_technician,''), p.name, '—') AS tech_name
    FROM public.repair_orders o
    LEFT JOIN public.profiles p ON p.user_id = o.assigned_technician_id
    WHERE o.received_at >= _from AND o.received_at < _to
  ),
  totals AS (
    SELECT
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE status='entregado')::int AS delivered,
      COUNT(*) FILTER (WHERE status NOT IN ('entregado','cancelado'))::int AS pending,
      COUNT(*) FILTER (WHERE status='cancelado')::int AS cancelled,
      COALESCE(SUM(cost) FILTER (WHERE status='entregado'),0) AS revenue,
      COALESCE(AVG(cost) FILTER (WHERE status='entregado' AND cost > 0),0) AS avg_ticket
    FROM base
  ),
  by_day AS (
    SELECT to_char(date_trunc('day', received_at),'YYYY-MM-DD') AS day,
           COUNT(*)::int AS orders,
           COALESCE(SUM(cost) FILTER (WHERE status='entregado'),0) AS revenue
    FROM base GROUP BY 1 ORDER BY 1
  ),
  by_status AS (
    SELECT status::text, COUNT(*)::int AS count FROM base GROUP BY 1
  ),
  by_tech AS (
    SELECT tech_name AS technician,
           COUNT(*)::int AS orders,
           COALESCE(SUM(cost) FILTER (WHERE status='entregado'),0) AS revenue
    FROM base
    GROUP BY 1
    ORDER BY orders DESC
  )
  SELECT jsonb_build_object(
    'totals', (SELECT to_jsonb(t) FROM totals t),
    'by_day', COALESCE((SELECT jsonb_agg(to_jsonb(d)) FROM by_day d), '[]'::jsonb),
    'by_status', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM by_status s), '[]'::jsonb),
    'by_technician', COALESCE((SELECT jsonb_agg(to_jsonb(b)) FROM by_tech b), '[]'::jsonb),
    'top_by_orders', (SELECT to_jsonb(b) FROM by_tech b ORDER BY orders DESC LIMIT 1),
    'top_by_revenue', (SELECT to_jsonb(b) FROM by_tech b ORDER BY revenue DESC LIMIT 1)
  ) INTO v;

  RETURN v;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_repair_report_summary(timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_repair_report_summary(timestamptz, timestamptz) TO authenticated, service_role;
