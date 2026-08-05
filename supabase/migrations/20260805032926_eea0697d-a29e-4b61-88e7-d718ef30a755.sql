CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doc text;
BEGIN
  v_doc := regexp_replace(coalesce(NEW.raw_user_meta_data ->> 'document_number',''),'\D','','g');
  IF v_doc = '' THEN v_doc := NULL; END IF;

  INSERT INTO public.profiles (user_id, name, email, phone, document_number)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(split_part(COALESCE(NEW.email,''), '@', 1), ''),
      ''
    ),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    v_doc
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;