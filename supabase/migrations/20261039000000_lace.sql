-- Register the in-house Lace template (ivory & burgundy lace, photo-less).
-- `no_photo` is true: the design has no photo slots at all, so the editor hides
-- the photo fields and invitation completeness waives galeri/video.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('lace', 'Lace',
   'Undangan bergaya renda ivory dan burgundy — sampul bersegel lilin, hitung mundur berpita renda, ilustrasi vila, susunan acara, dress code, turut mengundang, hadiah, dan ucapan.',
   '/templates/lace/thumbnail.webp',
   '/templates/lace/preview', 3, 'Floral', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige","gt"]',
   'Baru', true, true)
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
