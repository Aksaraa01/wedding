-- Register the in-house "Majestic" template: a beaded ivory invitation ported
-- from the Majestic reference. The cover and the gate are the reference's own
-- opening films (beaded chandelier, envelope-with-seal), art is vendored under
-- public/templates/majestic/, and every section is rebuilt in the reference's
-- own language (ivory paper, sage ink, classic-script headings, beaded plates).
--
-- Content spec lives in TEMPLATE_CONFIGS: two semantic photo slots (venue plate
-- + closing portrait — the cover is the design's film), portraits on, story
-- photos on, quote off (the couple's words ship as Kalimat Pembuka), and
-- gallery/video/gift/dresscode/rundown/inviting on.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('majestic', 'Majestic',
   'Undangan ivory bersulam manik: film lampu gantung dan pohon palem di sampul, amplop bersegel sebagai pembuka, tipografi skrip klasik, hitung mundur besar, kartu lokasi berbingkai ukir, ornamen lampu tali, dan penutup berupa lengkung bordir.',
   '/templates/majestic/thumbnail.webp',
   '/templates/majestic/preview', 43, 'Floral', 'inhouse',
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
