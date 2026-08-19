-- Per-feature visibility toggles (editor) for hiding whole sections on WP.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS video_section_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inviting_families_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS story_visible boolean NOT NULL DEFAULT true;
