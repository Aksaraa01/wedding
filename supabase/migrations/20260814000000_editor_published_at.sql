-- Track when a couple confirms (publishes) their web invitation so the editor
-- can show the local confirmation date & time.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;
