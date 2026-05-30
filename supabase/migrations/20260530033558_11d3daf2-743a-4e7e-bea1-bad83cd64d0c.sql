
-- 1) Add new repair statuses
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'pendiente_aprobacion';
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'garantia';

-- 2) Simplify order numbering: just zero-padded consecutive number
CREATE OR REPLACE FUNCTION public.set_repair_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := lpad(nextval('public.repair_order_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
