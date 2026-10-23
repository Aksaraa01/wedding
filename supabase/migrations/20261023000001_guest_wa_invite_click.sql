ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS wa_invite_clicked_at timestamp with time zone;
