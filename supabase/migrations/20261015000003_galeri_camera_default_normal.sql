-- Galeri Tamu film cameras are opt-in like frames: new rows default to
-- no filter. Existing stored selections are untouched.

ALTER TABLE public.wedding_profiles
  ALTER COLUMN gallery_camera SET DEFAULT 'normal';
