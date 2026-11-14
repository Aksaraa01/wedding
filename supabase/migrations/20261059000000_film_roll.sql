-- Register the in-house Film Roll template (a fixed-viewport reel that scrolls
-- scene by scene, driven by wheel/touch/drag). Every photograph is the couple's
-- own; the look is Smythe / Marcellus / Urbanist (vendored under public/fonts/)
-- and CSS — no reference media, no reference couple data, no third-party marks.
--
-- Content spec lives in TEMPLATE_CONFIGS: one cover slot (the poster), portraits
-- as single photos, love-story photos on, all sixteen minimum sections enabled
-- except livestream and contacts (RSVP is the shared InvitationOverlay dock).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('film-roll', 'Film Roll',
   'Undangan bergaya rol film: satu layar penuh yang bergulir adegan demi adegan seperti gulungan sinema, judul film besar dengan huruf yang berputar masuk, tiket acara, program kertas, dan galeri yang bergerak sendiri.',
   '/templates/film-roll/thumbnail.webp',
   '/templates/film-roll/preview', 39, 'Modern', 'inhouse',
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
