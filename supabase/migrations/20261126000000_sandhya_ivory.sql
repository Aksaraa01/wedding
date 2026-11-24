-- Register Sandhya Ivory, the bright ivory-and-sage sibling of Sandhya.
-- It is a separate in-house template so existing dark Sandhya invitations keep
-- their current design. Feature parity is intentional: no rundown section and
-- YouTube-only video, matching Sandhya at the time of this port.
INSERT INTO public.web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo, event_type, wp_master_slug, wp_manifest)
VALUES
  ('sandhya-ivory', 'Sandhya Ivory',
   'Versi terang Sandhya dengan palet ivory dan sage, foto sinematik, tipografi anggun, galeri, hadiah, dan ucapan dalam satu alur gulir.',
   '/templates/sandhya-ivory/thumbnail.webp',
   '/templates/sandhya-ivory/preview',
   (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.web_templates),
   'Elegant', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true, false, 'wedding', NULL, NULL)
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
  no_photo = EXCLUDED.no_photo,
  event_type = EXCLUDED.event_type,
  wp_master_slug = NULL,
  wp_manifest = NULL;
