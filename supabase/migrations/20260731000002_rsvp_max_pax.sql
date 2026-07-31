-- Per-invitation RSVP maximum pax. Caps the JUMLAH TAMU dropdown on the
-- web invitation and is enforced server-side by the RSVP API.

ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS rsvp_max_pax integer NOT NULL DEFAULT 10;
