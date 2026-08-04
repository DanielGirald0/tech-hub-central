CREATE TABLE public.featured_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alegra_id text NOT NULL UNIQUE,
  name text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.featured_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_products TO authenticated;
GRANT ALL ON public.featured_products TO service_role;

ALTER TABLE public.featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured products are viewable by everyone"
ON public.featured_products FOR SELECT
USING (true);

CREATE POLICY "Admins manage featured products"
ON public.featured_products FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));