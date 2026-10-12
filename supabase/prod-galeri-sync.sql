-- =====================================================
-- PROD SYNC: galeri_tiers slider matrix (staging-exact values)
-- Pre-state (2026-10-12, verified): all five galeri migrations
-- (20261012000000–20261013000000) are already applied on prod
-- (supabase migration list: local == remote). The ONLY gap is
-- galeri_tiers content: prod still has stale A/B/C/D bands, while
-- staging runs the 6-row Roll matrix. No profiles reference A/B/C/D.
-- Idempotent — safe to re-run.
-- =====================================================
BEGIN;

DELETE FROM public.galeri_tiers WHERE tier IN ('A', 'B', 'C', 'D');

INSERT INTO public.galeri_tiers (tier, photo_min, photo_max, guest_min, guest_max, price) VALUES
  ('Mini Roll - Basic', 1, 5, 1, 100, 100000),
  ('Standard Roll - Basic', 1, 5, 101, 150, 150000),
  ('Mini Roll - Plus', 6, 10, 1, 100, 200000),
  ('Standard Roll - Plus', 6, 10, 101, 150, 230000),
  ('Maxi Roll - Basic', 1, 5, 151, 200, 280000),
  ('Maxi Roll - Plus', 6, 10, 151, 200, 320000)
ON CONFLICT (tier) DO UPDATE SET
  photo_min = EXCLUDED.photo_min,
  photo_max = EXCLUDED.photo_max,
  guest_min = EXCLUDED.guest_min,
  guest_max = EXCLUDED.guest_max,
  price = EXCLUDED.price;

COMMIT;
