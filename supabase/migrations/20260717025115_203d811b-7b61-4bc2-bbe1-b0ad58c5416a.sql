
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(user_id uuid, name text, email text, phone text, document_number text, address text, notes text, account_status text, role app_role, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.name, p.email, p.phone,
         p.document_number, p.address, p.notes, p.account_status,
         ur.role, p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.get_staff_list()
RETURNS TABLE(user_id uuid, name text, email text, role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.name, p.email, ur.role
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE public.is_staff(auth.uid())
    AND ur.role IN ('admin'::app_role, 'technician'::app_role)
$$;

REVOKE ALL ON FUNCTION public.get_staff_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_list() TO authenticated;
