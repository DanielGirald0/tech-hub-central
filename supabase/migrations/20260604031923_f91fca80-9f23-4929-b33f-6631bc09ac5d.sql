-- Drop duplicate indexes on products.alegra_id (3 unique indexes existed)
DROP INDEX IF EXISTS public.idx_products_alegra_id_unique;
DROP INDEX IF EXISTS public.idx_products_alegra_id_conflict;

-- Drop duplicate indexes on categories.slug (3 indexes existed)
DROP INDEX IF EXISTS public.idx_categories_slug;
DROP INDEX IF EXISTS public.idx_categories_slug_conflict;

-- Composite indexes for repair_orders frequent access patterns
CREATE INDEX IF NOT EXISTS idx_repair_orders_status_received
  ON public.repair_orders(status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_repair_orders_customer_received
  ON public.repair_orders(customer_id, received_at DESC);

-- Composite index for repair_order_history timeline
CREATE INDEX IF NOT EXISTS idx_repair_history_order_created
  ON public.repair_order_history(order_id, created_at DESC);