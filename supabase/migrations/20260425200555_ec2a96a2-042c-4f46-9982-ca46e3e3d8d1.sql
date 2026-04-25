CREATE INDEX IF NOT EXISTS idx_products_stock_available
ON public.products (stock)
WHERE stock > 0;