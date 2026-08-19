-- Kalimat Pembuka (opening greeting) + countdown end date handled via estimated_wedding_date.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS opening_title text,
  ADD COLUMN IF NOT EXISTS opening_description text;
