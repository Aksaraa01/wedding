-- Allow multiple photos per guest (Buku Tamu Digital "Photo by Guest" quota:
-- Sistem 2 / Pro 2 / Premium 3 / Prestige 4). The old UNIQUE on guest_id
-- capped every guest at one photo, which breaks the per-guest multi-photo
-- upload flow. The FK to guests(id) is kept.
ALTER TABLE public.guest_photos
  DROP CONSTRAINT IF EXISTS guest_photos_guest_id_key;
