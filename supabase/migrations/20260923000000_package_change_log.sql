-- Ops queue audit log: also record package changes in the same timeline.
-- kind='status' rows use previous_status/new_status; kind='package' rows use
-- previous_package/new_package (status columns stay NULL for package rows).

ALTER TABLE public.ops_queue_status_log
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'status',
  ADD COLUMN IF NOT EXISTS previous_package text,
  ADD COLUMN IF NOT EXISTS new_package text;

-- Package-change rows carry packages instead of statuses, so new_status must
-- accept NULL. Status-change inserts always provide it, unaffected.
ALTER TABLE public.ops_queue_status_log
  ALTER COLUMN new_status DROP NOT NULL;
