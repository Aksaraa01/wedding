-- Add fields that WP templates can map but were missing from the editor:
-- bride's instagram handle and a video URL (e.g. "OUR FOOTAGE" section).
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS bride_instagram text,
  ADD COLUMN IF NOT EXISTS video_url text;
