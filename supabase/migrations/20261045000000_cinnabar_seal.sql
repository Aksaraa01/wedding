-- Register the in-house Cinnabar Seal template (Chinese-heritage maroon and
-- gold invitation). Ornament masks and envelope art are vendored under
-- public/templates/cinnabar-seal; the couple's own photographs drive the cover,
-- hero, portraits, story, gallery and closing.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Sampul /
-- Sambutan / Closing), portraits on, love-story photos on, all sixteen minimum
-- sections enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('cinnabar-seal', 'Cinnabar Seal',
   'Undangan bernuansa marun dan emas dengan cap cinnabar, ornamen lampion, dan tata letak surat klasik Tionghoa.',
   '/templates/cinnabar-seal/thumbnail.webp',
   '/templates/cinnabar-seal/preview', 27, 'Budaya', 'inhouse',
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
