CREATE TABLE public.repair_lookup_attempts (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_repair_lookup_attempts_key_time ON public.repair_lookup_attempts (key, created_at DESC);
GRANT ALL ON public.repair_lookup_attempts TO service_role;
ALTER TABLE public.repair_lookup_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.lookup_repair_order(_order_number text, _phone text)
RETURNS TABLE(
  id uuid, order_number text, status repair_status, received_at timestamp with time zone,
  estimated_date date, delivered_at timestamp with time zone, cost numeric, warranty_days integer,
  reported_issue text, diagnosis text, device_type text, brand text, model text, customer_name text
)
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ip text;
  _ord_key text := 'ord:' || upper(coalesce(_order_number,''));
  _ip_key text;
BEGIN
  BEGIN
    _ip := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for',''), ',', 1);
  EXCEPTION WHEN others THEN _ip := '';
  END;
  _ip_key := CASE WHEN coalesce(trim(_ip),'') <> '' THEN 'ip:' || trim(_ip) END;

  DELETE FROM public.repair_lookup_attempts WHERE created_at < now() - interval '1 hour';

  IF (SELECT count(*) FROM public.repair_lookup_attempts a
      WHERE a.key = _ord_key AND a.created_at > now() - interval '10 minutes') >= 10
     OR (_ip_key IS NOT NULL AND (SELECT count(*) FROM public.repair_lookup_attempts a
      WHERE a.key = _ip_key AND a.created_at > now() - interval '10 minutes') >= 10) THEN
    RAISE EXCEPTION 'Demasiados intentos de consulta. Intenta de nuevo en 10 minutos.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.repair_lookup_attempts(key) VALUES (_ord_key);
  IF _ip_key IS NOT NULL THEN
    INSERT INTO public.repair_lookup_attempts(key) VALUES (_ip_key);
  END IF;

  RETURN QUERY
  SELECT o.id, o.order_number, o.status, o.received_at, o.estimated_date, o.delivered_at,
         o.cost, o.warranty_days, o.reported_issue, o.diagnosis,
         d.device_type, d.brand, d.model, c.name
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(c.phone,'\D','','g') = regexp_replace(_phone,'\D','','g')
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_repair_order(text,text) TO anon, authenticated;