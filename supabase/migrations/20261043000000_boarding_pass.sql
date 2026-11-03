-- Register the in-house Boarding Pass template (travel-document invitation).
--
-- Paper and ink, no raster ornament: the ticket, perforations, barcode,
-- stamp, passport cards and departure board are all CSS. `no_photo` is false
-- because the cover, hero, passports, album and closing all carry the couple's
-- own photographs.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Sampul /
-- Kutipan / Closing), portraits on, love-story photos on, all sixteen minimum
-- sections enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('boarding-pass', 'Boarding Pass',
   'Undangan berbentuk tiket pesawat dan paspor perjalanan — papan keberangkatan, manifest penumpang, itinerary, dan buku tamu.',
   '/templates/boarding-pass/thumbnail.webp',
   '/templates/boarding-pass/preview', 3, 'Modern', 'inhouse',
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
