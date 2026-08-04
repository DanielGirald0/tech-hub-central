CREATE OR REPLACE FUNCTION public.create_customer_repair_order(p_name text, p_phone text, p_email text DEFAULT ''::text, p_document text DEFAULT ''::text, p_address text DEFAULT ''::text, p_device_type text DEFAULT ''::text, p_brand text DEFAULT ''::text, p_model text DEFAULT ''::text, p_serial text DEFAULT ''::text, p_accessories text DEFAULT ''::text, p_category text DEFAULT ''::text, p_reported_issue text DEFAULT ''::text, p_notes text DEFAULT ''::text)
 RETURNS TABLE(order_id uuid, order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT rc.id INTO v_customer_id
  FROM public.repair_customers rc
  WHERE (v_doc IS NOT NULL AND rc.document_number = v_doc)
     OR (v_uid IS NOT NULL AND rc.user_id = v_uid)
     OR regexp_replace(coalesce(rc.phone,''),'\D','','g') = regexp_replace(p_phone,'\D','','g')
  ORDER BY (rc.document_number = v_doc) DESC NULLS LAST
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.repair_customers(name, phone, email, address, document_number, user_id, notes)
    VALUES (trim(p_name), trim(p_phone), NULLIF(trim(coalesce(p_email,'')),''), NULLIF(trim(coalesce(p_address,'')),''), v_doc, v_uid, NULLIF(trim(coalesce(p_notes,'')),''))
    RETURNING repair_customers.id INTO v_customer_id;
  ELSE
    UPDATE public.repair_customers
       SET name = COALESCE(NULLIF(trim(p_name),''), name),
           phone = COALESCE(NULLIF(trim(p_phone),''), phone),
           email = COALESCE(NULLIF(trim(coalesce(p_email,'')),''), email),
           address = COALESCE(NULLIF(trim(coalesce(p_address,'')),''), address),
           document_number = COALESCE(v_doc, document_number),
           user_id = COALESCE(user_id, v_uid),
           updated_at = now()
     WHERE id = v_customer_id;
  END IF;

  INSERT INTO public.repair_devices(customer_id, device_type, brand, model, serial_imei, accessories)
  VALUES (v_customer_id, NULLIF(trim(coalesce(p_device_type,'')),''), NULLIF(trim(coalesce(p_brand,'')),''), NULLIF(trim(coalesce(p_model,'')),''), NULLIF(trim(coalesce(p_serial,'')),''), NULLIF(trim(coalesce(p_accessories,'')),''))
  RETURNING repair_devices.id INTO v_device_id;

  v_full_issue := coalesce(p_reported_issue,'');
  IF coalesce(p_category,'') <> '' THEN
    v_full_issue := '[' || p_category || '] ' || v_full_issue;
  END IF;
  IF coalesce(trim(p_notes),'') <> '' THEN
    v_full_issue := v_full_issue || E'\nObservaciones: ' || trim(p_notes);
  END IF;

  INSERT INTO public.repair_orders(customer_id, device_id, reported_issue, status)
  VALUES (v_customer_id, v_device_id, v_full_issue, 'recibido')
  RETURNING repair_orders.id, repair_orders.order_number INTO v_order_id, v_order_number;

  RETURN QUERY SELECT v_order_id, v_order_number;
END;
$function$;