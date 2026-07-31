-- Track when a guest first opens their web invitation
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS invitation_opened_at timestamp with time zone;
