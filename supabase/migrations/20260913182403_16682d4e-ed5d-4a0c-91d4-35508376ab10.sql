DROP FUNCTION IF EXISTS public.get_repair_order_public(uuid);

CREATE OR REPLACE FUNCTION public.get_repair_order_public(_order_id uuid)
RETURNS TABLE(
  id uuid,
  order_number text,
  status repair_status,
  priority text,
  received_at timestamp with time zone,
  estimated_date date,
  delivered_at timestamp with time zone,
  cost numeric,
  warranty_days integer,
  reported_issue text,
  diagnosis text,
  device_type text,
  brand text,
  model text,
  customer_name text,
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT o.id,
         o.order_number,
         o.status,
         o.priority::text,
         o.received_at,
         o.estimated_date,
         o.delivered_at,
         o.cost,
         o.warranty_days,
         o.reported_issue,
         o.diagnosis,
         d.device_type,
         d.brand,
         d.model,
         c.name AS customer_name,
         (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) AS is_owner
  FROM public.repair_orders o
  JOIN public.repair_devices d ON d.id = o.device_id
  JOIN public.repair_customers c ON c.id = o.customer_id
  WHERE o.id = _order_id;
$function$;