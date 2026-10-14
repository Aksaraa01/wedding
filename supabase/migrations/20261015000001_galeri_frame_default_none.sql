-- Galeri Tamu frames are opt-in: new rows default to no frame.
-- Existing stored selections (incl. backfilled 'frame-1') are untouched.

ALTER TABLE public.wedding_profiles
  ALTER COLUMN gallery_frame SET DEFAULT 'none';
