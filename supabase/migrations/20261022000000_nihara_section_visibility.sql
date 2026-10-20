-- Per-section visibility for Nihara Mist's new sections.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS dresscode_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS livestream_visible boolean DEFAULT true;
