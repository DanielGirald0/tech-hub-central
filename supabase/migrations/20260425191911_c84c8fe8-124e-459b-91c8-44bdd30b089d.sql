CREATE UNIQUE INDEX IF NOT EXISTS idx_products_alegra_id_conflict
ON public.products (alegra_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_conflict
ON public.categories (slug);