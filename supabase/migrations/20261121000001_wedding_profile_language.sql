-- Couple-selected invitation language for in-house templates.
-- 'id' (Bahasa Indonesia) is the default and preserves existing behavior.
-- English ('en') is opt-in per profile. WP templates stay ID-only.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'id';

ALTER TABLE public.wedding_profiles
  DROP CONSTRAINT IF EXISTS wedding_profiles_language_check;

ALTER TABLE public.wedding_profiles
  ADD CONSTRAINT wedding_profiles_language_check
  CHECK (language IN ('id', 'en'));
