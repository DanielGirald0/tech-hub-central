
-- Public RPC to let any visitor (anon or authenticated) submit a unified service request
-- that is immediately materialized as a repair order (Servicio Técnico).
CREATE OR REPLACE FUNCTION public.create_customer_repair_order(
  p_name text,
  p_phone text,
  p_email text DEFAULT '',
  p_document text DEFAULT '',
  p_address text DEFAULT '',
  p_device_type text DEFAULT '',
  p_brand text DEFAULT '',
  p_model text DEFAULT '',
  p_serial text DEFAULT '',
  p_accessories text DEFAULT '',
  p_category text DEFAULT '',
  p_reported_issue text DEFAULT '',
  p_notes text DEFAULT ''
) RETURNS TABLE(order_id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_doc text;
  v_customer_id uuid;
  v_device_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_full_issue text;
BEGIN
  IF coalesce(trim(p_name),'') = '' OR coalesce(trim(p_phone),'') = '' THEN
    RAISE EXCEPTION 'Nombre y teléfono son obligatorios';
  END IF;

  v_doc := regexp_replace(coalesce(p_document,''),'\D','','g');
  IF v_doc = '' THEN v_doc := NULL; END IF;

  -- Reuse existing customer by document or phone, else create
  IF v_doc IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM public.repair_customers
     WHERE regexp_replace(coalesce(document_number,''),'\D','','g') = v_doc
     LIMIT 1;
  END IF;
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id FROM public.repair_customers
     WHERE regexp_replace(phone,'\D','','g') = regexp_replace(p_phone,'\D','','g')
     LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.repair_customers(name, phone, email, address, document_number, user_id)
    VALUES (trim(p_name), trim(p_phone), coalesce(p_email,''), coalesce(p_address,''), v_doc, v_uid)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.repair_customers
       SET name = COALESCE(NULLIF(trim(p_name),''), name),
           email = COALESCE(NULLIF(p_email,''), email),
           address = COALESCE(NULLIF(p_address,''), address),
           document_number = COALESCE(v_doc, document_number),
           user_id = COALESCE(user_id, v_uid),
           updated_at = now()
     WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.repair_devices(customer_id, device_type, brand, model, serial_imei, accessories)
  VALUES (v_customer_id,
          NULLIF(coalesce(p_device_type,''),''),
          coalesce(p_brand,''), coalesce(p_model,''),
          coalesce(p_serial,''), coalesce(p_accessories,''))
  RETURNING id INTO v_device_id;

  v_full_issue := coalesce(p_reported_issue,'');
  IF coalesce(p_category,'') <> '' THEN
    v_full_issue := '[' || p_category || '] ' || v_full_issue;
  END IF;
  IF coalesce(p_notes,'') <> '' THEN
    v_full_issue := v_full_issue || E'\nObservaciones: ' || p_notes;
  END IF;

  INSERT INTO public.repair_orders(customer_id, device_id, reported_issue, status)
  VALUES (v_customer_id, v_device_id, v_full_issue, 'recibido')
  RETURNING id, order_number INTO v_order_id, v_order_number;

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_repair_order(text,text,text,text,text,text,text,text,text,text,text,text,text) TO anon, authenticated;
