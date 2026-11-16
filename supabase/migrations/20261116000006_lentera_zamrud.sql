-- Register the second Ceriavite template: Lentera Zamrud.
-- Kids family, sold in the ceriavite package. Preview lives on the kids host.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category,
   source_type, package_eligibility, tier, is_active, no_photo, event_type)
VALUES
  ('lentera-zamrud', 'Lentera Zamrud',
   'Undangan zamrud dan emas: lengkung masjid, lentera gantung, ornamen ranting zaitun, dan tipografi Cinzel untuk khitanan, aqiqah, atau ulang tahun ananda.',
   '/templates/lentera-zamrud/thumbnail.webp',
   'https://ceriavite.aksaraa.com/templates/lentera-zamrud/preview',
   11, 'Ceriavite', 'inhouse', '["ceriavite"]'::jsonb, 'Baru', true, false, 'kids')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  preview_image_url = EXCLUDED.preview_image_url, demo_url = EXCLUDED.demo_url,
  sort_order = EXCLUDED.sort_order, category = EXCLUDED.category,
  source_type = EXCLUDED.source_type, package_eligibility = EXCLUDED.package_eligibility,
  tier = EXCLUDED.tier, is_active = EXCLUDED.is_active, no_photo = EXCLUDED.no_photo,
  event_type = EXCLUDED.event_type;
