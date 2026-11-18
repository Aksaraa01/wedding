-- Register the in-house "Fresco" template: an illustrated Mediterranean villa
-- invitation (painted linen envelope with a real opening film, blue-and-white
-- countdown frame, olive cenefas, welcome arch, gift wreath, closing arch).
-- All artwork is vendored under public/templates/fresco/ and referenced through
-- FRESCO_ASSETS; the reference's licensed script face is substituted (see
-- docs/REA_FRESCO.md §5).
--
-- Content spec lives in TEMPLATE_CONFIGS: no cover slot (the cover is the
-- design's own painting + envelope film), portraits on, story photos off
-- ("Our Story" is prose on painted clouds), quote off (the couple's words ship
-- as Kalimat Pembuka), gallery/video/gift/dresscode/rundown/inviting on.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('fresco', 'Fresco',
   'Undangan cat-air Mediterania: amplop linen dengan pita yang terbuka lewat film, tebing dan laut di balik nama, hitung mundur berbingkai biru, lengkung zaitun, dan tipografi Antic Didone dengan aksen skrip.',
   '/templates/fresco/thumbnail.webp',
   '/templates/fresco/preview', 42, 'Floral', 'inhouse',
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
