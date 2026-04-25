CREATE UNIQUE INDEX IF NOT EXISTS idx_products_alegra_id_unique
ON public.products (alegra_id)
WHERE alegra_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_unique
ON public.product_categories (product_id, category_id);