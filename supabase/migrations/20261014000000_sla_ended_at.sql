-- Freeze the ops SLA clock when a project reaches a terminal stage.
-- SlaTimer diffs sla_ended_at - sla_started_at once set; NULL means running.

ALTER TABLE public.ops_queue
  ADD COLUMN IF NOT EXISTS sla_ended_at timestamptz NULL;

-- Backfill rows already terminal: prefer the actual transition timestamp from
-- the status log; rows with no log entry fall back to created_at
-- (== sla_started_at in practice, i.e. an "unknown" zero duration) so no
-- finished project keeps a running timer. Only fills NULLs: re-runnable.
UPDATE public.ops_queue q
SET sla_ended_at = COALESCE(sub.ts, q.created_at)
FROM (
  SELECT ops_queue_id, MAX(created_at) AS ts
  FROM public.ops_queue_status_log
  WHERE new_status IN ('feedback_selesai', 'project_selesai')
  GROUP BY ops_queue_id
) sub
WHERE q.id = sub.ops_queue_id
  AND q.sla_ended_at IS NULL
  AND q.status IN ('feedback_selesai', 'project_selesai');

UPDATE public.ops_queue q
SET sla_ended_at = q.created_at
WHERE q.sla_ended_at IS NULL
  AND q.status IN ('feedback_selesai', 'project_selesai')
  AND NOT EXISTS (
    SELECT 1 FROM public.ops_queue_status_log l
    WHERE l.ops_queue_id = q.id
      AND l.new_status IN ('feedback_selesai', 'project_selesai')
  );
