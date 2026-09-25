-- notification_log holds one row per (couple, kind, ref): the original
-- single-column PK on wedding_profile_id blocks that, so replace it with
-- partial unique indexes. Registration stays single-row per couple;
-- feedback rows are unique per (couple, kind, ref_id) via
-- uq_notification_log_kind_ref (created in 20260925000001).
ALTER TABLE public.notification_log
  DROP CONSTRAINT IF EXISTS notification_log_pkey;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_log_registration
  ON public.notification_log (wedding_profile_id)
  WHERE kind = 'registration';
