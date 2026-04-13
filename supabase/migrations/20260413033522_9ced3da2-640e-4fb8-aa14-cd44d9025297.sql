
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Delete from user_roles
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  -- Delete from profiles
  DELETE FROM public.profiles WHERE user_id = _user_id;
  -- Delete from auth.users (cascades)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
