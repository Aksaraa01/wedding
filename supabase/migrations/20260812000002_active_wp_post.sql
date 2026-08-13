-- Add active WP post tracking for duplicated wedding templates
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS active_wp_post_id bigint,
  ADD COLUMN IF NOT EXISTS active_wp_post_url text;
