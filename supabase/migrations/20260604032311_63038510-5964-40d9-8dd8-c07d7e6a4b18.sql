CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN jsonb_build_object(
    'products',   (SELECT count(*) FROM public.products),
    'orders',     (SELECT count(*) FROM public.orders),
    'users',      (SELECT count(*) FROM public.profiles),
    'categories', (SELECT count(*) FROM public.categories),
    'reviews',    (SELECT count(*) FROM public.reviews WHERE approved = false),
    'repairs',    (SELECT count(*) FROM public.repair_orders WHERE status NOT IN ('entregado','cancelado'))
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;


CREATE OR REPLACE FUNCTION public.get_repair_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start timestamptz := date_trunc('month', now());
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
    'recent', COALESCE(
      (SELECT jsonb_agg(row_to_json(r))
         FROM (
           SELECT o.id, o.order_number, o.status, o.received_at, o.cost,
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
$$;

REVOKE EXECUTE ON FUNCTION public.get_repair_dashboard_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_repair_dashboard_stats() TO authenticated;