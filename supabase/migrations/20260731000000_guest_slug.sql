-- Add a per-profile unique slug to guests so invitation URLs can use the guest name
-- instead of the QR token. The token stays the authoritative identity for the QR system.

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS slug character varying;

CREATE UNIQUE INDEX IF NOT EXISTS guests_profile_slug_idx
  ON public.guests(wedding_profile_id, slug)
  WHERE slug IS NOT NULL;
