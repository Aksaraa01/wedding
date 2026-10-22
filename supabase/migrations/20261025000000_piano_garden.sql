-- Register the in-house Piano Garden template (pastel garden, scroll sections).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('piano-garden', 'Piano Garden',
   'Undangan bergaya taman pastel — sampul bunga, video pembuka, ayat, mempelai, hitung mundur, acara, dress code, galeri berjalan, kisah cinta, hadiah, dan ucapan dalam satu alur gulir.',
   '/templates/piano-garden/thumbnail.webp',
   '/templates/piano-garden/preview', 18, 'Floral', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige","gt"]',
   'Baru', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  preview_image_url = EXCLUDED.preview_image_url,
  demo_url = EXCLUDED.demo_url,
  sort_order = EXCLUDED.sort_order,
  category = EXCLUDED.category,
  source_type = EXCLUDED.source_type,
  package_eligibility = EXCLUDED.package_eligibility,
  tier = EXCLUDED.tier,
  is_active = EXCLUDED.is_active;
