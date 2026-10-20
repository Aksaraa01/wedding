-- Sandhya: reference-only copy fields consumed by the in-house template.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS template_content jsonb DEFAULT '{}'::jsonb;

-- Register the in-house Sandhya template (dark elegance, scene deck).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('sandhya', 'Sandhya',
   'Undangan sinematik bernuansa senja — sampul berlapis bunga, ayat, mempelai, acara, dress code, galeri, hadiah, dan ucapan dalam satu alur gulir.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/1790765548170-DSC06466.jpg',
   '/templates/sandhya/preview', 12, 'Elegansi Dark', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
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
  is_active = EXCLUDED.is_active;
