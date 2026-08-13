-- Couple initials (e.g. "WD", "AC") shown on the cover, plus multiple cover photos.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS couple_initials text,
  ADD COLUMN IF NOT EXISTS cover_photos jsonb DEFAULT '[]'::jsonb;
