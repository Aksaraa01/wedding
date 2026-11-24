-- Three-way invitation language: 'default' follows the template's own copy.
--
-- `default` is a preference, not a third dictionary: the render paths resolve it
-- to the template's native language (TEMPLATE_NATIVE_LANG) and templates keep
-- receiving only 'id' | 'en'. Existing rows keep 'id', so behaviour is unchanged
-- until a couple opts into another option.
ALTER TABLE public.wedding_profiles
  DROP CONSTRAINT IF EXISTS wedding_profiles_language_check;

ALTER TABLE public.wedding_profiles
  ADD CONSTRAINT wedding_profiles_language_check
  CHECK (language IN ('default', 'id', 'en'));

COMMENT ON COLUMN public.wedding_profiles.language IS
  'Invitation language preference: default (follow template), id, or en.';
