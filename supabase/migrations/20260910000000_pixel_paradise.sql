-- Second interactive in-house template: Pixel Paradise (retro arcade room).
-- Interactive in-house templates share the "Undangan Interaksi" category.

INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('pixel-paradise', 'Pixel Paradise',
   'Penthouse arcade retro — ruang piksel interaktif dengan neon cyan/pink; buka galeri, kisah cinta, acara, dan kado lewat objek di dinding ruangan.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/pixel-paradise/room-bg.jpg',
   '/templates/pixel-paradise/preview', 7, 'Undangan Interaksi', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;

-- Align the interactive templates under one category.
UPDATE web_templates SET category = 'Undangan Interaksi'
  WHERE code IN ('skyline-penthouse', 'pixel-paradise');