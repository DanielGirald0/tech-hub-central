CREATE OR REPLACE FUNCTION public.get_all_users()
 RETURNS TABLE(user_id uuid, name text, email text, phone text, document_number text, address text, notes text, account_status text, role app_role, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.name, p.email, p.phone,
         p.document_number, p.address, p.notes, p.account_status,
         ur.role, p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_all_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;