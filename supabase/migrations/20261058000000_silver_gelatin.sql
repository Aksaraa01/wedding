-- Register the in-house Silver Gelatin template (monochrome editorial
-- film-photography invitation). Every photograph is the couple's own except
-- the wishes-band still life (public/templates/silver-gelatin/rsvp-band.webp,
-- the reference's RSVP photo, shipped at the couple's request); the rest of the
-- design is Bodoni Moda / Monsieur La Doulaise / Jost (vendored under
-- public/fonts/) and CSS.
--
-- Content spec lives in TEMPLATE_CONFIGS: 4 semantic cover slots (Venue /
-- Sampul / Gift / Dresscode), portraits on (welcome band), love-story photos
-- on, all sixteen minimum sections enabled except livestream and contacts.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('silver-gelatin', 'Silver Gelatin',
   'Undangan editorial monokrom ala fotografi film: kanvas putih di atas kertas ivory, tipografi Bodoni Moda dengan aksen skrip Monsieur La Doulaise, foto hitam-putih berbutir halus, dan tata letak asimetris yang lapang.',
   '/templates/silver-gelatin/thumbnail.webp',
   '/templates/silver-gelatin/preview', 38, 'Elegant', 'inhouse',
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
