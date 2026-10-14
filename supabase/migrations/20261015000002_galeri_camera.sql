-- Galeri Tamu film camera selection (baked into captures at upload).
-- Existing rows default to Portra 400.

ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS gallery_camera text NOT NULL DEFAULT 'portra-400';

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.wedding_profiles
    WHERE gallery_camera NOT IN ('fuji-quicksnap', 'kodak-funsaver', 'ilford-hp5', 'cinestill-800t', 'agfa-vista', 'lomo-metropolis', 'polaroid-600', 'portra-400')
  ) THEN
    UPDATE public.wedding_profiles
    SET gallery_camera = 'portra-400'
    WHERE gallery_camera NOT IN ('fuji-quicksnap', 'kodak-funsaver', 'ilford-hp5', 'cinestill-800t', 'agfa-vista', 'lomo-metropolis', 'polaroid-600', 'portra-400');
  END IF;
END $$;
