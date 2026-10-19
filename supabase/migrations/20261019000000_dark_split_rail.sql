-- Dark Split Rail — in-house split-screen invitation template.
-- React component registered in TEMPLATE_MAP ('dark-split-rail'); rendered from
-- wedding_profiles with no WP dependency. Preview/demo uses the Vincent & Felicia
-- couple (public storage URLs); see src/components/templates/demoProps.ts.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('dark-split-rail', 'Dark Split Rail',
   'Undangan split-screen gelap sinematik — panel foto/video di kiri dan rel konten elegan di kanan, dengan animasi reveal blur.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/1790765548170-DSC06466.jpg',
   '/templates/dark-split-rail/preview', 10, 'Elegansi Dark', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;
