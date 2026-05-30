-- Add new status 'aprobado' to enum
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'aprobado' AFTER 'pendiente_aprobacion';

-- RPC for customer to approve their own order
CREATE OR REPLACE FUNCTION public.approve_repair_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_doc text;
  v_owner boolean;
  v_status repair_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para aprobar la reparación';
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
    RAISE EXCEPTION 'No tienes permiso para aprobar esta orden';
  END IF;

  SELECT status INTO v_status FROM public.repair_orders WHERE id = _order_id;
  IF v_status <> 'pendiente_aprobacion' THEN
    RAISE EXCEPTION 'La orden no está pendiente de aprobación';
  END IF;

  UPDATE public.repair_orders
     SET status = 'aprobado', updated_at = now()
   WHERE id = _order_id;

  -- log_repair_status_change trigger registers the change, but force changed_by + note
  UPDATE public.repair_order_history
     SET changed_by = v_uid, note = 'Aprobado por el cliente'
   WHERE order_id = _order_id
     AND to_status = 'aprobado'
     AND created_at = (SELECT max(created_at) FROM public.repair_order_history WHERE order_id = _order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_repair_order(uuid) TO authenticated;