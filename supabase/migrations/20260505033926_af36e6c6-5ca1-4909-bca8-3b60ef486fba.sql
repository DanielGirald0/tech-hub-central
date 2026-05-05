ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'tienda',
  ADD COLUMN IF NOT EXISTS delivery_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pendiente';