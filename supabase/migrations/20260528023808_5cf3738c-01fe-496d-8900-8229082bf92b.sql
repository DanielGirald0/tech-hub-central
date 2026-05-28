
-- ============ ENUM ============
CREATE TYPE public.repair_status AS ENUM (
  'recibido','en_diagnostico','esperando_repuesto','en_reparacion',
  'reparado','listo_entrega','entregado','cancelado'
);

-- ============ CUSTOMERS ============
CREATE TABLE public.repair_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_customers TO authenticated;
GRANT ALL ON public.repair_customers TO service_role;
ALTER TABLE public.repair_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage repair_customers" ON public.repair_customers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_repair_customers_phone ON public.repair_customers(phone);
CREATE TRIGGER trg_repair_customers_updated
  BEFORE UPDATE ON public.repair_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DEVICES ============
CREATE TABLE public.repair_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.repair_customers(id) ON DELETE CASCADE,
  device_type text NOT NULL,
  brand text DEFAULT '',
  model text DEFAULT '',
  serial_imei text DEFAULT '',
  device_password text DEFAULT '',
  accessories text DEFAULT '',
  physical_condition text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_devices TO authenticated;
GRANT ALL ON public.repair_devices TO service_role;
ALTER TABLE public.repair_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage repair_devices" ON public.repair_devices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_repair_devices_customer ON public.repair_devices(customer_id);
CREATE TRIGGER trg_repair_devices_updated
  BEFORE UPDATE ON public.repair_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDERS ============
CREATE SEQUENCE public.repair_order_seq START 1;

CREATE TABLE public.repair_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.repair_customers(id) ON DELETE RESTRICT,
  device_id uuid NOT NULL REFERENCES public.repair_devices(id) ON DELETE RESTRICT,
  received_at timestamptz NOT NULL DEFAULT now(),
  reported_issue text NOT NULL DEFAULT '',
  diagnosis text DEFAULT '',
  solution text DEFAULT '',
  assigned_technician text DEFAULT '',
  status public.repair_status NOT NULL DEFAULT 'recibido',
  cost numeric NOT NULL DEFAULT 0,
  estimated_date date,
  warranty_days integer NOT NULL DEFAULT 0,
  delivered_at timestamptz,
  internal_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_orders TO authenticated;
GRANT ALL ON public.repair_orders TO service_role;
ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage repair_orders" ON public.repair_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_repair_orders_customer ON public.repair_orders(customer_id);
CREATE INDEX idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX idx_repair_orders_number ON public.repair_orders(order_number);

-- Auto order_number: OS-YYYY-0001
CREATE OR REPLACE FUNCTION public.set_repair_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'OS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.repair_order_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_repair_orders_number
  BEFORE INSERT ON public.repair_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_repair_order_number();
CREATE TRIGGER trg_repair_orders_updated
  BEFORE UPDATE ON public.repair_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PHOTOS ============
CREATE TABLE public.repair_order_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  url text NOT NULL,
  label text NOT NULL DEFAULT 'otro',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_order_photos TO authenticated;
GRANT ALL ON public.repair_order_photos TO service_role;
ALTER TABLE public.repair_order_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage repair_order_photos" ON public.repair_order_photos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_repair_photos_order ON public.repair_order_photos(order_id);

-- ============ HISTORY ============
CREATE TABLE public.repair_order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.repair_orders(id) ON DELETE CASCADE,
  from_status public.repair_status,
  to_status public.repair_status NOT NULL,
  note text DEFAULT '',
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_order_history TO authenticated;
GRANT ALL ON public.repair_order_history TO service_role;
ALTER TABLE public.repair_order_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage repair_order_history" ON public.repair_order_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_repair_history_order ON public.repair_order_history(order_id);

CREATE OR REPLACE FUNCTION public.log_repair_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.repair_order_history(order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.repair_order_history(order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_repair_status_history
  AFTER INSERT OR UPDATE OF status ON public.repair_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_repair_status_change();

-- ============ PUBLIC LOOKUP ============
CREATE OR REPLACE FUNCTION public.lookup_repair_order(_order_number text, _phone text)
RETURNS TABLE (
  order_number text,
  status public.repair_status,
  received_at timestamptz,
  estimated_date date,
  delivered_at timestamptz,
  cost numeric,
  warranty_days integer,
  reported_issue text,
  diagnosis text,
  device_type text,
  brand text,
  model text,
  customer_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT o.order_number, o.status, o.received_at, o.estimated_date, o.delivered_at,
         o.cost, o.warranty_days, o.reported_issue, o.diagnosis,
         d.device_type, d.brand, d.model, c.name
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(c.phone,'\D','','g') = regexp_replace(_phone,'\D','','g')
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_repair_order(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_repair_order_history(_order_number text, _phone text)
RETURNS TABLE (
  from_status public.repair_status,
  to_status public.repair_status,
  note text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT h.from_status, h.to_status, h.note, h.created_at
  FROM public.repair_order_history h
  JOIN public.repair_orders o ON o.id = h.order_id
  JOIN public.repair_customers c ON c.id = o.customer_id
  WHERE upper(o.order_number) = upper(_order_number)
    AND regexp_replace(c.phone,'\D','','g') = regexp_replace(_phone,'\D','','g')
  ORDER BY h.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_repair_order_history(text,text) TO anon, authenticated;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('repair-photos','repair-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read repair-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'repair-photos');
CREATE POLICY "Admins upload repair-photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'repair-photos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update repair-photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'repair-photos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete repair-photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'repair-photos' AND public.has_role(auth.uid(),'admin'));
