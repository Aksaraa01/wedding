-- In-house template support.
-- source_type marks how a template renders: 'wp' (Elementor master + manifest,
-- duplicated per couple) vs 'inhouse' (React component registered in
-- TEMPLATE_MAP, rendered from wedding_profiles with no WP dependency).

ALTER TABLE web_templates
  ADD COLUMN source_type text NOT NULL DEFAULT 'wp';
ALTER TABLE web_templates
  ADD CONSTRAINT web_templates_source_type_check CHECK (source_type IN ('wp', 'inhouse'));

-- Backfill: the four existing React-registered codes are in-house templates.
UPDATE web_templates SET source_type = 'inhouse'
  WHERE code IN ('parallax-sinematik', 'editorial-modern', 'animasi-watercolor', 'heritage-dinamis');

-- First fully in-house template: Skyline Penthouse (immersive "room" experience).
-- demo_url points at the internal in-house demo render route (no WP dependency).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('skyline-penthouse', 'Skyline Penthouse',
   'Undangan interaktif bergaya penthouse metropolitan gelap dengan hotspot menyala — buka galeri, kisah cinta, acara, profil mempelai, dan kado lewat ruang 3D ilustrasi.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/skyline-penthouse/room-bg.jpg',
   '/templates/skyline-penthouse/preview', 6, 'Elegansi Dark', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;
