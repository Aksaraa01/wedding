-- New couples default to Fleksibel link mode. Existing rows are untouched
-- (couples already on Terbatas stay Terbatas unless flipped explicitly).
ALTER TABLE public.wedding_profiles
  ALTER COLUMN guest_link_strict SET DEFAULT false;
