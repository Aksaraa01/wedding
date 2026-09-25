-- Feedback-bot dedupe: one notification per (couple, kind, ref).
-- Registration keeps its single-row behavior (kind='registration', ref_id null).
ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'registration';

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS ref_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_log_kind_ref
  ON public.notification_log (wedding_profile_id, kind, ref_id);
