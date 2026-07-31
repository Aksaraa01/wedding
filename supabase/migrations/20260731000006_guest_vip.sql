-- VIP flag for guests targeted by the Reminder Tamu VIP (WA blast) feature
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;
