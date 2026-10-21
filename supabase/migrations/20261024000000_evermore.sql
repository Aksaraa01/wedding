-- Register the in-house Evermore template (vintage scrapbook, scroll sections).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('evermore', 'Evermore',
   'Undangan bergaya scrapbook tahun 70-an — sampul ilustrasi anak, foto mempelai berbingkai pita, kisah cinta, galeri polaroid, hadiah, dan ucapan dalam satu alur gulir.',
   '/templates/evermore/thumbnail.webp',
   '/templates/evermore/preview', 13, 'Modern Minimalis', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
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
