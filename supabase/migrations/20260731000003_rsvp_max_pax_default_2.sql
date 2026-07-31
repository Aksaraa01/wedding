-- Default RSVP max pax is 2 (editable per invitation up to 10).
-- Existing rows hold the previous default (10) or test artifacts; reset to 2.

ALTER TABLE public.wedding_profiles
  ALTER COLUMN rsvp_max_pax SET DEFAULT 2;

UPDATE public.wedding_profiles
  SET rsvp_max_pax = 2;
