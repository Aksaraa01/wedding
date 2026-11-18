-- Register the in-house "Emerald Heirloom" template: a Victorian emerald-and-
-- lace invitation ported from the Viding reference (theme 175 / 13735). The
-- painted garden, the carved frames with transparent windows, the lace bands,
-- the pond plate behind the countdown, the fan, the swans and the flower sprays
-- are vendored under public/templates/emerald-heirloom/ and referenced through
-- EH_ASSETS; every section is rebuilt in the reference's own language.
--
-- Content spec lives in TEMPLATE_CONFIGS: no cover-photo slot (the cover is the
-- design's own painting), portraits on, story photos on, and gallery, video,
-- gift, dress code, rundown, inviting and livestream on. The livestream block
-- is the reference's own "Join Live" section, backed by
-- wedding_profiles.livestream (see docs/REA_EMERALD_HEIRLOOM.md §6).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('emerald-heirloom', 'Emerald Heirloom',
   'Undangan hijau zamrud bergaya kartu pos viktoria: taman cat-air di balik lengkung ukir, renda krem, kipas sutra, angsa dan bunga lili, bingkai berjendela untuk kedua mempelai, serta tipografi Cinzel Decorative.',
   '/templates/emerald-heirloom/thumbnail.webp',
   '/templates/emerald-heirloom/preview', 44, 'Floral', 'inhouse',
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
