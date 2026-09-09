-- 1. Priority enum + column
DO $$ BEGIN
  CREATE TYPE public.repair_priority AS ENUM ('normal','prioritaria');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.repair_orders
  ADD COLUMN IF NOT EXISTS priority public.repair_priority NOT NULL DEFAULT 'normal';

-- 2. Indexes for the priority center queries
CREATE INDEX IF NOT EXISTS idx_repair_orders_priority_status ON public.repair_orders (priority, status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_estimated_status ON public.repair_orders (estimated_date, status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_tech_status ON public.repair_orders (assigned_technician_id, status);
CREATE INDEX IF NOT EXISTS idx_repair_orders_estimated_priority ON public.repair_orders (estimated_date, priority);

-- 3. Reports include priority
DROP FUNCTION IF EXISTS public.get_repair_report(timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION public.get_repair_report(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS TABLE(id uuid, order_number text, received_at timestamp with time zone, delivered_at timestamp with time zone, estimated_date date, status repair_status, cost numeric, customer_name text, customer_document text, customer_phone text, technician_name text, technician_id uuid, device_type text, brand text, model text, priority text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.id, o.order_number, o.received_at, o.delivered_at, o.estimated_date,
         o.status, o.cost,
         c.name, c.document_number, c.phone,
         COALESCE(NULLIF(o.assigned_technician,''), p.name, '—') AS technician_name,
         o.assigned_technician_id,
         d.device_type, d.brand, d.model,
         o.priority::text
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  LEFT JOIN public.profiles p ON p.user_id = o.assigned_technician_id
  WHERE public.is_staff(auth.uid())
    AND o.received_at >= _from
    AND o.received_at < _to
  ORDER BY o.received_at DESC
$function$;

-- 4. Today's priorities center
CREATE OR REPLACE FUNCTION public.get_today_priorities()
 RETURNS TABLE(
   id uuid, order_number text, status repair_status, priority text,
   received_at timestamp with time zone, estimated_date date,
   customer_name text, customer_phone text,
   device_type text, brand text, model text,
   technician_name text, technician_id uuid,
   bucket int
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (SELECT auth.uid() AS uid, public.has_role(auth.uid(),'admin') AS is_admin)
  SELECT o.id, o.order_number, o.status, o.priority::text,
         o.received_at, o.estimated_date,
         c.name, c.phone,
         d.device_type, d.brand, d.model,
         COALESCE(NULLIF(o.assigned_technician,''), p.name) AS technician_name,
         o.assigned_technician_id,
         CASE
           WHEN o.priority = 'prioritaria' AND o.estimated_date IS NOT NULL AND o.estimated_date <= (now() AT TIME ZONE 'America/Bogota')::date THEN 1
           WHEN o.priority = 'prioritaria' THEN 2
           WHEN o.estimated_date IS NOT NULL AND o.estimated_date <= (now() AT TIME ZONE 'America/Bogota')::date THEN 3
           ELSE 4
         END AS bucket
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  LEFT JOIN public.profiles p ON p.user_id = o.assigned_technician_id
  CROSS JOIN me
  WHERE public.is_staff(me.uid)
    AND o.status NOT IN ('entregado','cancelado')
    AND (me.is_admin OR o.assigned_technician_id = me.uid)
    AND (
      o.priority = 'prioritaria'
      OR (o.estimated_date IS NOT NULL AND o.estimated_date <= ((now() AT TIME ZONE 'America/Bogota')::date + 3))
    )
  ORDER BY bucket, o.estimated_date NULLS LAST, o.received_at
$function$;

GRANT EXECUTE ON FUNCTION public.get_today_priorities() TO authenticated;

-- 5. Dashboard stats with priority counters
CREATE OR REPLACE FUNCTION public.get_repair_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_month_start timestamptz := date_trunc('month', now());
  v_today date := (now() AT TIME ZONE 'America/Bogota')::date;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN jsonb_build_object(
    'counts_by_status', COALESCE(
      (SELECT jsonb_object_agg(status, c)
         FROM (SELECT status::text, count(*)::int AS c
                 FROM public.repair_orders GROUP BY status) t),
      '{}'::jsonb
    ),
    'revenue_month', COALESCE(
      (SELECT sum(cost) FROM public.repair_orders
        WHERE status = 'entregado' AND delivered_at >= v_month_start),
      0
    ),
    'priority_open', (
      SELECT count(*)::int FROM public.repair_orders
       WHERE priority = 'prioritaria' AND status NOT IN ('entregado','cancelado')
    ),
    'due_today', (
      SELECT count(*)::int FROM public.repair_orders
       WHERE estimated_date = v_today AND status NOT IN ('entregado','cancelado')
    ),
    'open_total', (
      SELECT count(*)::int FROM public.repair_orders
       WHERE status NOT IN ('entregado','cancelado')
    ),
    'recent', COALESCE(
      (SELECT jsonb_agg(row_to_json(r))
         FROM (
           SELECT o.id, o.order_number, o.status, o.received_at, o.cost, o.priority::text AS priority,
                  jsonb_build_object('name', c.name, 'phone', c.phone) AS repair_customers,
                  jsonb_build_object('device_type', d.device_type, 'brand', d.brand, 'model', d.model) AS repair_devices
             FROM public.repair_orders o
             JOIN public.repair_customers c ON c.id = o.customer_id
             JOIN public.repair_devices d ON d.id = o.device_id
            ORDER BY o.created_at DESC
            LIMIT 10
         ) r),
      '[]'::jsonb
    )
  );
END;
$function$;