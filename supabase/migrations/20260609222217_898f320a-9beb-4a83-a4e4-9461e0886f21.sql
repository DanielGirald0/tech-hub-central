DROP INDEX IF EXISTS public.products_alegra_id_key;
CREATE UNIQUE INDEX products_alegra_id_key ON public.products USING btree (alegra_id);