-- Ops queue audit log: human-readable details for non-status rows
-- (e.g. kind='invitation' rows summarize which invitation fields ops edited).

ALTER TABLE public.ops_queue_status_log
  ADD COLUMN IF NOT EXISTS details text;
