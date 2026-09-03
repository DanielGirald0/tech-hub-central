CREATE OR REPLACE FUNCTION public.get_repair_order_public(_order_id uuid)
RETURNS TABLE(
  id uuid, order_number text, status repair_status,
  received_at timestamptz, estimated_date date, delivered_at timestamptz,
  cost numeric, warranty_days integer, reported_issue text, diagnosis text,
  device_type text, brand text, model text, customer_name text, is_owner boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_doc text;
BEGIN
  SELECT regexp_replace(coalesce(document_number,''),'\D','','g')
    INTO v_doc FROM public.profiles WHERE user_id = v_uid;

  RETURN QUERY
  SELECT o.id, o.order_number, o.status, o.received_at, o.estimated_date, o.delivered_at,
         o.cost, o.warranty_days, o.reported_issue, o.diagnosis,
         d.device_type, d.brand, d.model,
         split_part(c.name, ' ', 1) AS customer_name,
         (v_uid IS NOT NULL AND (c.user_id = v_uid OR (v_doc IS NOT NULL AND v_doc <> ''
            AND regexp_replace(coalesce(c.document_number,''),'\D','','g') = v_doc))) AS is_owner
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  WHERE o.id = _order_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_repair_order_public(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.customer_set_repair_status(_order_id uuid, _status repair_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_doc text;
  v_owner boolean;
  v_current repair_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;
  IF _status NOT IN ('aprobado'::repair_status, 'cancelado'::repair_status) THEN
    RAISE EXCEPTION 'Estado no permitido para el cliente';
  END IF;

  SELECT regexp_replace(coalesce(document_number,''),'\D','','g')
    INTO v_doc FROM public.profiles WHERE user_id = v_uid;

  SELECT EXISTS (
    SELECT 1 FROM public.repair_orders o
    JOIN public.repair_customers c ON c.id = o.customer_id
    WHERE o.id = _order_id
      AND (c.user_id = v_uid
           OR (v_doc IS NOT NULL AND v_doc <> ''
               AND regexp_replace(coalesce(c.document_number,''),'\D','','g') = v_doc))
  ) INTO v_owner;

  IF NOT v_owner THEN
    RAISE EXCEPTION 'No tienes permiso sobre esta orden';
  END IF;

  SELECT status INTO v_current FROM public.repair_orders WHERE id = _order_id;
  IF v_current NOT IN ('pendiente_aprobacion'::repair_status, 'recibido'::repair_status) THEN
    RAISE EXCEPTION 'La orden ya no permite cambios por parte del cliente';
  END IF;

  UPDATE public.repair_orders
     SET status = _status, updated_at = now()
   WHERE id = _order_id;

  UPDATE public.repair_order_history
     SET changed_by = v_uid,
         note = CASE WHEN _status = 'aprobado'::repair_status
                     THEN 'Aprobado por el cliente' ELSE 'Cancelado por el cliente' END
   WHERE order_id = _order_id
     AND to_status = _status
     AND created_at = (SELECT max(created_at) FROM public.repair_order_history WHERE order_id = _order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.customer_set_repair_status(uuid, repair_status) TO authenticated;