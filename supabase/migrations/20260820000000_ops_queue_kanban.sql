-- Ops Queue Kanban: expand ops_queue.status pipeline + add audit log.

ALTER TABLE public.ops_queue
  DROP CONSTRAINT IF EXISTS ops_queue_status_check;

-- Normalize any legacy values to the base stage.
UPDATE public.ops_queue
  SET status = 'pending'
  WHERE status NOT IN ('pending','paid','feedback_baru','feedback_progress','feedback_selesai','completed');

ALTER TABLE public.ops_queue
  ADD CONSTRAINT ops_queue_status_check
  CHECK (status IN ('pending','paid','feedback_baru','feedback_progress','feedback_selesai','completed'));

CREATE TABLE IF NOT EXISTS public.ops_queue_status_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ops_queue_id uuid NOT NULL,
  previous_status character varying,
  new_status character varying NOT NULL,
  changed_by_employee_id uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ops_queue_status_log_pkey PRIMARY KEY (id),
  CONSTRAINT ops_queue_status_log_queue_fkey FOREIGN KEY (ops_queue_id) REFERENCES public.ops_queue(id) ON DELETE CASCADE,
  CONSTRAINT ops_queue_status_log_employee_fkey FOREIGN KEY (changed_by_employee_id) REFERENCES public.employees(id)
);

CREATE INDEX IF NOT EXISTS idx_ops_queue_status_log_queue ON public.ops_queue_status_log (ops_queue_id);