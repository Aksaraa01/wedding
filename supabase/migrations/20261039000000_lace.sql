-- Register the in-house Lace template (ivory & burgundy lace).
-- The design has no cover photo and no portraits (the cover is a sealed plate),
-- but it DOES take a gallery and a wedding film, so `no_photo` stays false —
-- that flag means "this template renders no couple photos at all". The editor
-- hides the cover/portrait fields from the template's own content spec
-- (cover_slots: 0, person_photos: false).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('lace', 'Lace',
   'Undangan bergaya renda ivory dan burgundy — sampul bertulle bersegel lilin, sambutan, mempelai, hitung mundur berpita renda, acara, susunan acara, dress code, turut mengundang, galeri, video, hadiah, dan ucapan.',
   '/templates/lace/thumbnail.webp',
   '/templates/lace/preview', 3, 'Floral', 'inhouse',
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
