-- Galeri Tamu photo frame selection (frame-1..frame-5, baked into captures).
-- Existing rows default to frame-1 (auto-select).

ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS gallery_frame text NOT NULL DEFAULT 'frame-1';

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.wedding_profiles
    WHERE gallery_frame NOT IN ('frame-1', 'frame-2', 'frame-3', 'frame-4', 'frame-5')
  ) THEN
    UPDATE public.wedding_profiles
    SET gallery_frame = 'frame-1'
    WHERE gallery_frame NOT IN ('frame-1', 'frame-2', 'frame-3', 'frame-4', 'frame-5');
  END IF;
END $$;
