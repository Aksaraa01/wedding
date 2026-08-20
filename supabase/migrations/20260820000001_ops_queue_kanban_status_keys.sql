-- Ops Queue Kanban: use the column keys as the stored status vocabulary.
-- The initial kanban migration allowed pipeline names (pending/paid/.../completed);
-- the app now stores the board column keys directly (belum_bayar/.../project_selesai).

ALTER TABLE public.ops_queue
  DROP CONSTRAINT IF EXISTS ops_queue_status_check;

ALTER TABLE public.ops_queue
  ALTER COLUMN status SET DEFAULT 'belum_bayar';

UPDATE public.ops_queue
  SET status = 'belum_bayar'
  WHERE status NOT IN ('belum_bayar','sudah_bayar','feedback_baru','feedback_progress','feedback_selesai','project_selesai');

ALTER TABLE public.ops_queue
  ADD CONSTRAINT ops_queue_status_check
  CHECK (status IN ('belum_bayar','sudah_bayar','feedback_baru','feedback_progress','feedback_selesai','project_selesai'));