DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.featured_products CASCADE;
DROP TABLE IF EXISTS public.alegra_sync_log CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN jsonb_build_object(
    'users',   (SELECT count(*) FROM public.profiles),
    'reviews', (SELECT count(*) FROM public.reviews WHERE approved = false),
    'repairs', (SELECT count(*) FROM public.repair_orders WHERE status NOT IN ('entregado','cancelado'))
  );
END;
$function$;