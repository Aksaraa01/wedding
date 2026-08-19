-- Dashboard toggle to hide/show the whole gift (Hadiah/Amplop) section on WP.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS gift_section_visible boolean NOT NULL DEFAULT true;
