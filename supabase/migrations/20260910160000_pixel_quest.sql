-- Third interactive in-house template: Pixel Quest Level Up Together
-- (6-step arcade quest reusing the Pixel Paradise content mapping).

INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('pixel_quest', 'Pixel Quest Level Up Together',
   'Petualangan 6 langkah bergaya arcade retro — latar dan karakter berubah tiap tahap, dari Press Start hingga Quest Complete.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/pixel-quest/frame1.jpg',
   '/templates/pixel-quest/preview', 8, 'Undangan Interaktif', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;