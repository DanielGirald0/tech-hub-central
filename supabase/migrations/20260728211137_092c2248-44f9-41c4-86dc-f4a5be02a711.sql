
-- 1) order_items: allow snapshot columns, drop hard FK dependency on products
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS alegra_item_id text,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_reference text,
  ADD COLUMN IF NOT EXISTS product_image_url text;

ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

-- Drop FK from order_items.product_id to products (name may vary; try common defaults)
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.order_items DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;

-- 2) Update dashboard stats to drop products/categories references
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
    'orders',     (SELECT count(*) FROM public.orders),
    'users',      (SELECT count(*) FROM public.profiles),
    'reviews',    (SELECT count(*) FROM public.reviews WHERE approved = false),
    'repairs',    (SELECT count(*) FROM public.repair_orders WHERE status NOT IN ('entregado','cancelado'))
  );
END;
$function$;

-- 3) Drop obsolete tables (Alegra is the source of truth now)
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
