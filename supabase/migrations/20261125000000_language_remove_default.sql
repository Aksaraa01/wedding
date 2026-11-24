-- Drop the three-way language option: invitations are Bahasa Indonesia or English.
-- Any row that opted into 'default' (follow the template) falls back to 'id',
-- which is what it rendered for every design shipped so far.
UPDATE public.wedding_profiles SET language = 'id' WHERE language = 'default';

ALTER TABLE public.wedding_profiles
  DROP CONSTRAINT IF EXISTS wedding_profiles_language_check;

ALTER TABLE public.wedding_profiles
  ADD CONSTRAINT wedding_profiles_language_check
  CHECK (language IN ('id', 'en'));

COMMENT ON COLUMN public.wedding_profiles.language IS
  'Invitation language: id or en. Couple-entered content is never translated.';
