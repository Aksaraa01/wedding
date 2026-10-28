-- Register the in-house Still & Ever template (stationery editorial).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('still-ever', 'Still & Ever',
   'Undangan stationery bernuansa charcoal dan krem — kartu amplop bersegel lilin, sampul editorial, ayat, mempelai, kisah cinta, hitung mundur, acara, dress code, galeri, live streaming, video, hadiah, dan ucapan.',
   '/templates/still-ever/thumbnail.webp',
   '/templates/still-ever/preview', 1, 'Elegant', 'inhouse',
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
