-- Register the in-house Navy Love template (navy & ivory paper scrapbook).
--
-- The design is paper-led: a navy lace envelope cover, deckled ivory cards,
-- torn-paper labels, watercolour florals and an engraved venue etching. The
-- stationery art is vendored from the reference export into
-- public/templates/navy-love/ (see docs/REA_NAVY_IVORY.md §5), so `no_photo`
-- stays false — every photograph is the couple's own.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Kartu Ucapan /
-- Kisah Cinta / Penutup), portraits on, story photos on, and all sixteen
-- minimum sections (opening film included) enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('navy-love', 'Navy Love',
   'Undangan kertas scrapbook navy–ivory — amplop renda bermonogram, kartu deckled, label kertas sobek, kaligrafi floral, hitung mundur, susunan acara, galeri, film, hadiah, dress code, dan ucapan.',
   '/templates/navy-love/thumbnail.webp',
   '/templates/navy-love/preview', 27, 'Minimalis', 'inhouse',
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
