-- Products: Alegra fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS alegra_id TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS products_alegra_id_key ON public.products(alegra_id) WHERE alegra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products(sku);

-- Orders: Alegra invoice + customer snapshot
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS alegra_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS alegra_invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Sync log
CREATE TABLE IF NOT EXISTS public.alegra_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alegra_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync log"
  ON public.alegra_sync_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sync log"
  ON public.alegra_sync_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));