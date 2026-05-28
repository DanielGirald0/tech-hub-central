
-- 1. Add document_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_document_number_unique
  ON public.profiles(document_number) WHERE document_number IS NOT NULL;

-- 2. Add document_number and user_id to repair_customers
ALTER TABLE public.repair_customers ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.repair_customers ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS repair_customers_document_number_unique
  ON public.repair_customers(document_number) WHERE document_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS repair_customers_user_id_idx
  ON public.repair_customers(user_id) WHERE user_id IS NOT NULL;

-- 3. Function: link repair_customers to a user by document
CREATE OR REPLACE FUNCTION public.link_repair_customer_to_user_by_doc(_user_id uuid, _doc text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_doc text;
BEGIN
  v_doc := regexp_replace(coalesce(_doc,''),'\D','','g');
  IF v_doc = '' OR _user_id IS NULL THEN
    RETURN 0;
  END IF;
  UPDATE public.repair_customers
     SET user_id = _user_id
   WHERE regexp_replace(coalesce(document_number,''),'\D','','g') = v_doc
     AND (user_id IS NULL OR user_id = _user_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 4. Trigger on profiles: when document_number set/changes, link existing customers
CREATE OR REPLACE FUNCTION public.profiles_link_repair_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.document_number IS NOT NULL AND NEW.document_number <> '' THEN
    PERFORM public.link_repair_customer_to_user_by_doc(NEW.user_id, NEW.document_number);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_link_repair_customers_trg ON public.profiles;
CREATE TRIGGER profiles_link_repair_customers_trg
AFTER INSERT OR UPDATE OF document_number ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_link_repair_customers();

-- 5. Admin lookup: find repair customer + registered user info by document
CREATE OR REPLACE FUNCTION public.find_repair_customer_by_document(_doc text)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  email text,
  address text,
  notes text,
  document_number text,
  user_id uuid,
  registered_name text,
  registered_email text,
  registered_phone text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_doc := regexp_replace(coalesce(_doc,''),'\D','','g');
  IF v_doc = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.email, c.address, c.notes, c.document_number,
         COALESCE(c.user_id, p.user_id) AS user_id,
         p.name AS registered_name, p.email AS registered_email, p.phone AS registered_phone
  FROM public.repair_customers c
  FULL OUTER JOIN public.profiles p
    ON regexp_replace(coalesce(p.document_number,''),'\D','','g') = v_doc
  WHERE regexp_replace(coalesce(c.document_number,''),'\D','','g') = v_doc
     OR regexp_replace(coalesce(p.document_number,''),'\D','','g') = v_doc
  LIMIT 1;
END;
$$;

-- 6. User-facing: get my repair orders (by user_id or by my document)
CREATE OR REPLACE FUNCTION public.get_my_repair_orders()
RETURNS TABLE(
  id uuid,
  order_number text,
  status repair_status,
  received_at timestamptz,
  estimated_date date,
  delivered_at timestamptz,
  cost numeric,
  warranty_days integer,
  reported_issue text,
  diagnosis text,
  device_type text,
  brand text,
  model text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_doc text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;
  SELECT regexp_replace(coalesce(document_number,''),'\D','','g')
    INTO v_doc
    FROM public.profiles WHERE user_id = v_uid;

  RETURN QUERY
  SELECT o.id, o.order_number, o.status, o.received_at, o.estimated_date, o.delivered_at,
         o.cost, o.warranty_days, o.reported_issue, o.diagnosis,
         d.device_type, d.brand, d.model
  FROM public.repair_orders o
  JOIN public.repair_customers c ON c.id = o.customer_id
  JOIN public.repair_devices d ON d.id = o.device_id
  WHERE c.user_id = v_uid
     OR (v_doc IS NOT NULL AND v_doc <> '' AND regexp_replace(coalesce(c.document_number,''),'\D','','g') = v_doc)
  ORDER BY o.received_at DESC;
END;
$$;

-- 7. Update handle_new_user to also link by document if provided in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc text;
BEGIN
  v_doc := regexp_replace(coalesce(NEW.raw_user_meta_data ->> 'document_number',''),'\D','','g');
  IF v_doc = '' THEN v_doc := NULL; END IF;

  INSERT INTO public.profiles (user_id, name, email, phone, document_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    v_doc
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;
