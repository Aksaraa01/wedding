-- Register the first Ceriavite template: Songket Marun.
--
-- Kids family (event_type = 'kids'): one design serves khitanan, aqiqah and
-- ulang tahun. Content spec lives in TEMPLATE_CONFIGS; the sections the wedding
-- playbook requires that simply do not exist here (second person, love story,
-- dress code, rundown, livestream, turut mengundang) are disabled there and
-- recorded in docs/CERIAVITE.md.
--
-- The preview image is a palette poster in public/templates/songket-marun/ until
-- ops uploads a real screenshot through /ops/templates.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo, event_type)
VALUES
  ('songket-marun', 'Songket Marun',
   'Undangan marun dan emas bergaya songket Melayu: bingkai lengkung masjid, ornamen tenun, dan tipografi serif klasik untuk khitanan, aqiqah, atau ulang tahun ananda.',
   '/templates/songket-marun/thumbnail.svg',
   '/templates/songket-marun/preview', 10, 'Ceriavite', 'inhouse',
   '["essential"]',
   'Baru', true, false, 'kids')
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
  event_type = EXCLUDED.event_type;
