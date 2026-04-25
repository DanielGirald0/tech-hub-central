ALTER TABLE public.alegra_sync_log
ADD COLUMN IF NOT EXISTS items_processed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_ms integer,
ADD COLUMN IF NOT EXISTS error_detail text,
ADD COLUMN IF NOT EXISTS technical_details jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_alegra_sync_log_started_at ON public.alegra_sync_log (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_alegra_sync_log_status ON public.alegra_sync_log (status);