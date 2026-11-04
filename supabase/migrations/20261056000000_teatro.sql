-- Register the in-house Teatro template (burgundy velvet-curtain theatre
-- programme). All artwork is vendored locally under public/templates/teatro/
-- (closed/open drapery posters, the real curtain-pull film, gold foil, line
-- art, programme frame, flower divider) and referenced through
-- TEATRO_ASSETS; the couple's own photographs fill the stage arch, portraits,
-- deckled mats, gallery, film poster and closing frame.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Sampul /
-- Cerita / Penutup), portraits on, love-story photos on, all sixteen minimum
-- sections enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('teatro', 'Teatro',
   'Undangan teater klasik dengan tirai beludru burgundy, tata panggung berbingkai emas, tanggal garuk-perak, dan tipografi Cormorant dengan aksen skrip.',
   '/templates/teatro/thumbnail.webp',
   '/templates/teatro/preview', 37, 'Elegant', 'inhouse',
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
