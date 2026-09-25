-- Dedicated sub-300KB JPEG social thumbnail per couple.
-- og_image_url is set lazily (see ensureOgImage, called from the
-- web-invitation PUT hook whenever cover fields change). NULL means
-- "fall back to the normal cover chain" — safe before backfill.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS og_image_url text;
