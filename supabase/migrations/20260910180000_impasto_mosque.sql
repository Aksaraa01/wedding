-- Fourth interactive in-house template: Impasto Mosque Dark Gold
-- (scroll-snap pages over one fixed mosque painting).

INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('impasto-mosque-dark-gold', 'Impasto Mosque Dark Gold',
   'Undangan gulir bernuansa lukisan minyak masjid — halaman per halaman dengan transisi mulus di atas satu latar.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/impasto-mosque/cover-bg.jpg',
   '/templates/impasto-mosque-dark-gold/preview', 2, 'Nasional', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;