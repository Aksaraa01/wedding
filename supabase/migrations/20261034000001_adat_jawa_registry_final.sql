-- Register the second in-house Adat Jawa template (maroon/cream reference build).
-- The original 'adat-jawa' row is left untouched.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('adat-jawa-2', 'Adat Jawa 2',
   'Undangan adat Jawa bernuansa merah dan krem — gebyok, pendopo, gunung, video pembuka, ayat, mempelai, hitung mundur, acara, galeri, hadiah, dan ucapan dalam satu alur gulir.',
   '/templates/adat-jawa-2/thumbnail.webp',
   '/templates/adat-jawa-2/preview?v=1', 2, 'Adat/Tradisional', 'inhouse',
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
