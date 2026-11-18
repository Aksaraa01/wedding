-- Register the in-house "Olan" template: the classical split-screen invitation
-- (left panel is an oil painting, right panel scrolls through cream paper,
-- watercolour botanicals, an arched cover portrait, a baroque countdown scene
-- with pillars/bridge/stairs, and a peacock in the event card). All artwork is
-- vendored under public/templates/olan/ and referenced through OLAN; the
-- reference's Cormorant Infant / Cormorant faces are vendored Google fonts.
--
-- Content spec lives in TEMPLATE_CONFIGS: one cover slot (the arch portrait),
-- portraits on, story photos on (the Our Story slider is a photo), initials off
-- (the design prints no monogram), livestream on (it ships as its own section),
-- contacts off. See docs/REA_OLAN.md for the section contract and deviations.
--
-- `is_active` is FALSE on purpose: the design is ported and deployed, but the
-- owner has not opened it for sale yet. Flip the column (not this file) when it
-- ships to the gallery; keeping the file false means a replay or a fresh
-- `db reset` cannot silently publish it.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('olan', 'Olan',
   'Undangan lukis klasik: panel lukisan alam di kiri, kertas krem bertekstur, tipografi Cormorant Infant, bingkai lengkung, pilar dan jembatan pada hitung mundur, serta burung merak di kartu acara.',
   '/templates/olan/thumbnail.webp',
   '/templates/olan/preview', 44, 'Floral', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige","gt"]',
   'Baru', false, false)
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
