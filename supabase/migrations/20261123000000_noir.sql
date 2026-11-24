-- Register the in-house "Noir" template: the black poster invitation ported
-- from the Katsudoto "exclusive-noir" theme. A fixed cover pane on the left
-- (61%, desktop) and a black, typographic scroll column on the right (39%):
-- Cormorant Unicase display, Newsreader text, cream #E6D8D5 on #000000,
-- poster-size countdown, magazine gallery, full-bleed love story, and a quiet
-- closing. Both faces are vendored Google fonts (SIL OFL) under public/fonts.
--
-- Content spec lives in TEMPLATE_CONFIGS: two cover slots (the poster and the
-- closing portrait), portraits on, story photos on, initials off (the design
-- prints no monogram), livestream off (the reference has no live section and
-- the contract does not require one), contacts off. The design opens with a
-- still cover, so there is no opening-film section; the couple's film lives in
-- the Video section. The reference's Instagram-filter block is dropped: it is
-- outside the minimum-section contract and no profile column feeds it. See
-- docs/REA_NOIR.md for the section contract, deviations and the state matrix.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('noir', 'Noir',
   'Undangan hitam sinematik: panel foto sampul di kiri, tipografi Cormorant Unicase, hitung mundur berukuran poster, galeri bergaya majalah, cerita cinta layar penuh, dan penutup yang tenang.',
   '/templates/noir/thumbnail.webp',
   '/templates/noir/preview', 1, 'Elegant', 'inhouse',
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
