ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_document_number_unique
  ON public.profiles (regexp_replace(coalesce(document_number,''),'\D','','g'))
  WHERE document_number IS NOT NULL AND document_number <> '';

CREATE OR REPLACE FUNCTION public.admin_update_user(
  _user_id uuid,
  _name text,
  _email text,
  _phone text,
  _document_number text,
  _address text,
  _notes text,
  _account_status text,
  _role app_role
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc text;
  v_conflict uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_doc := regexp_replace(coalesce(_document_number,''),'\D','','g');
  IF v_doc = '' THEN v_doc := NULL; END IF;

  IF v_doc IS NOT NULL THEN
    SELECT user_id INTO v_conflict
      FROM public.profiles
     WHERE regexp_replace(coalesce(document_number,''),'\D','','g') = v_doc
       AND user_id <> _user_id
     LIMIT 1;
    IF v_conflict IS NOT NULL THEN
      RAISE EXCEPTION 'Documento ya registrado en otro usuario';
    END IF;
  END IF;

  UPDATE public.profiles
     SET name = coalesce(_name, name),
         email = coalesce(_email, email),
         phone = coalesce(_phone, phone),
         document_number = v_doc,
         address = coalesce(_address, address),
         notes = coalesce(_notes, notes),
         account_status = coalesce(_account_status, account_status),
         updated_at = now()
   WHERE user_id = _user_id;

  UPDATE public.user_roles
     SET role = _role
   WHERE user_id = _user_id AND role <> _role;

  IF v_doc IS NOT NULL THEN
    PERFORM public.link_repair_customer_to_user_by_doc(_user_id, v_doc);
    UPDATE public.repair_customers
       SET name = coalesce(_name, name),
           phone = coalesce(_phone, phone),
           email = coalesce(_email, email),
           address = coalesce(_address, address),
           updated_at = now()
     WHERE user_id = _user_id
        OR regexp_replace(coalesce(document_number,''),'\D','','g') = v_doc;
  ELSE
    UPDATE public.repair_customers
       SET name = coalesce(_name, name),
           phone = coalesce(_phone, phone),
           email = coalesce(_email, email),
           address = coalesce(_address, address),
           updated_at = now()
     WHERE user_id = _user_id;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.get_all_users();

CREATE FUNCTION public.get_all_users()
RETURNS TABLE(
  user_id uuid, name text, email text, phone text,
  document_number text, address text, notes text, account_status text,
  role app_role, created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.name, p.email, p.phone,
         p.document_number, p.address, p.notes, p.account_status,
         ur.role, p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.has_role(auth.uid(), 'admin')
$$;