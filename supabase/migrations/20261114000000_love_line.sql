-- Register the in-house Love Line template: a no-photo invitation drawn
-- entirely in black-and-white line art. Cream paper, crimson accents, Mr Dafoe
-- script, Caveat annotations and Montserrat body copy. All illustrations were
-- vendored under public/templates/love-line/; the couple never uploads a photo.
--
-- Content spec lives in TEMPLATE_CONFIGS: no cover slots, person_photos=false,
-- story_photo=false, gallery section off (the "our moments" band is fixed
-- illustration art), all other minimum sections enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('love-line', 'Love Line',
   'Undangan tanpa foto bergaya ilustrasi tinta: kertas krem, gambar garis hitam-putih, aksen merah, tipografi Mr Dafoe dan catatan tangan Caveat. Semua bagian digambar, bukan difoto.',
   '/templates/love-line/thumbnail.webp',
   '/templates/love-line/preview', 40, 'Modern', 'inhouse',
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
