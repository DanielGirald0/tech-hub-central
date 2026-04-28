ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS reference text,
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS tax_percentage numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price numeric;

UPDATE public.products
SET
  reference = COALESCE(NULLIF(reference, ''), NULLIF(sku, '')),
  base_price = COALESCE(base_price, price),
  final_price = COALESCE(final_price, price)
WHERE reference IS NULL OR base_price IS NULL OR final_price IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_reference ON public.products (reference);
CREATE INDEX IF NOT EXISTS idx_products_available_final_price ON public.products (final_price) WHERE stock > 0;