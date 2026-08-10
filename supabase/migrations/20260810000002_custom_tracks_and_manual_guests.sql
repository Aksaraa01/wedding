-- =====================================================
-- User/Admin custom music tracks + manual guest flag
-- =====================================================

ALTER TABLE public.web_tracks
  ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.wedding_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS uploaded_by_name text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_web_tracks_custom_owner
  ON public.web_tracks (uploaded_by)
  WHERE is_custom = true;

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS added_manually boolean DEFAULT false;