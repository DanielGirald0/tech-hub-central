DROP FUNCTION IF EXISTS public.lookup_repair_order(text, text);

CREATE OR REPLACE FUNCTION public.lookup_repair_order(_order_number text, _phone text)
RETURNS TABLE(
  id uuid,
  order_number text,
  status repair_status,
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
  customer_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.status, o.received_at, o.estimated_date, o.delivered_at,
         o.cost, o.warranty_days, o.reported_issue, o.diagnosis,
         d.device_type, d.brand, d.model, c.name
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(c.phone,'\D','','g') = regexp_replace(_phone,'\D','','g')
  LIMIT 1;
$$;