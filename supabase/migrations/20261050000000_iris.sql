-- Register the in-house Iris template (classic cream-and-gold garden
-- invitation). The watercolour frames, drapes and envelope art are vendored
-- under public/templates/iris; the couple's own photographs fill the cover,
-- oval portraits, verse frame, gallery and closing.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Sampul /
-- Ayat / Closing), portraits on, love-story photos on, all sixteen minimum
-- sections enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('iris', 'Iris',
   'Undangan taman klasik dengan bingkai emas, lukisan cat air, foto oval, hitung mundur hijau, dan tipografi skrip Garlicha.',
   '/templates/iris/thumbnail.webp',
   '/templates/iris/preview', 28, 'Elegant', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige","gt"]',
   'Baru', true, false)
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
  is_active = EXCLUDED.is_active,
  no_photo = EXCLUDED.no_photo;
