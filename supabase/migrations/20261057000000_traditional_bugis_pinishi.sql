-- Register the in-house Traditional Bugis Pinishi template.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('traditional-bugis-pinishi', 'Traditional Bugis Pinishi',
   'Undangan adat Bugis vintage bernuansa hangat dengan motif tradisional, foto mempelai, kisah cinta, acara, galeri, hadiah, dan ucapan.',
   '/templates/traditional-bugis-pinishi/thumbnail.webp',
   '/templates/traditional-bugis-pinishi/preview', 1, 'Adat/Tradisional', 'inhouse',
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
