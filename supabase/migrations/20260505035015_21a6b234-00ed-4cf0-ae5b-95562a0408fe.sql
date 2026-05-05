CREATE POLICY "Users can cancel own pending orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = customer_id AND status = 'pendiente de pago')
WITH CHECK (auth.uid() = customer_id AND status IN ('pendiente de pago', 'cancelado'));