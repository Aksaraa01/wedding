-- Change slug unique constraint from global to composite (wedding_profile_id, slug)
-- This allows the same slug (e.g., "Rafi") to exist for different wedding profiles

-- First, drop the existing global unique constraint on slug
ALTER TABLE public.guests DROP CONSTRAINT IF EXISTS guests_slug_key;

-- Add composite unique constraint (wedding_profile_id, slug)
-- This allows "Rafi" to exist for multiple wedding profiles
ALTER TABLE public.guests ADD CONSTRAINT guests_wedding_profile_slug_unique 
    UNIQUE (wedding_profile_id, slug);