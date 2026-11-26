-- Register the in-house "Jazz Vintage" template: the burgundy-and-olive
-- jazz-age invitation (velvet curtain cover with a chandelier and a rose-laden
-- table, textured cream paper, a gramophone music card, gold oval frames,
-- burgundy lace, velvet bows, a 1930s calendar card and a curtain closing).
--
-- Every ornament is vendored locally under public/templates/jazz-vintage/ and
-- referenced through ./assets (see docs/REA_JAZZ_VINTAGE.md §3). No reference
-- couple photograph and no reference audio is shipped; portraits and gallery
-- photos always come from the couple's profile.
--
-- Content spec lives in TEMPLATE_CONFIGS: no cover-photo slot (the cover and
-- the closing are the design's own painted stage), portraits on, story photos
-- on, initials off, quote/livestream/contacts off, all sixteen minimum
-- sections implemented except the conditional opening film (the reference
-- opens with static art, so video_url renders in the Video section).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('jazz-vintage', 'Jazz Vintage',
   'Undangan jazz-era burgundy dan zaitun: tirai beludru dengan lampu gantung, kertas krem bertekstur, kartu musik gramofon, bingkai oval emas, renda, dan pita beludru.',
   '/templates/jazz-vintage/thumbnail.webp',
   '/templates/jazz-vintage/preview', 1, 'Elegant', 'inhouse',
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
