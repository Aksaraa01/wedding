-- Register the in-house Embroidered Garden template (Provençal embroidery).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('embroidered-garden', 'Embroidered Garden',
   'Undangan bordir bergaya taman Provençal — gerbang pintu bertekstur, sulaman wistaria dan mawar, hitung mundur mutiara, turut mengundang, susunan acara, dress code, kisah cinta, hadiah, dan ucapan.',
   '/templates/embroidered-garden/thumbnail.webp',
   '/templates/embroidered-garden/preview', 2, 'Floral', 'inhouse',
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
