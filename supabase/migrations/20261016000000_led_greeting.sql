-- Layar Sapaan (LED greeting) settings on the couple profile, plus indexes
-- for the wall's recent-check-in poll and latest-selfie lookup.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS led_greeting_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS led_greeting_duration_sec integer NOT NULL DEFAULT 30
    CHECK (led_greeting_duration_sec IN (15, 20, 30));

CREATE INDEX IF NOT EXISTS idx_guests_profile_checkin
  ON public.guests (wedding_profile_id, checkin_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_guest_photos_guest_created
  ON public.guest_photos (guest_id, created_at DESC);
