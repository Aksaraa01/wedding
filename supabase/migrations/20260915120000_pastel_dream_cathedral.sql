-- In-house template: Pastel Dream Cathedral (duplicate of Impasto Mosque with church background)

INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('pastel-dream-cathedral', 'Pastel Dream Cathedral',
   'Undangan gulir bernuansa lukisan minyak katedral — halaman per halaman dengan transisi mulus di atas satu latar.',
   '/images/church.jpeg',
   '/templates/pastel-dream-cathedral/preview', 1, 'Nasional', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;
