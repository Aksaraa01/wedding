-- Flag guest_photos by source so the concierge selfie ("Foto Check-in",
-- captured during successful QR/manual check-in) is distinguishable from
-- guest-uploaded gallery photos in the Galeri Kenangan dashboard.
ALTER TABLE public.guest_photos ADD COLUMN IF NOT EXISTS source text DEFAULT 'gallery';