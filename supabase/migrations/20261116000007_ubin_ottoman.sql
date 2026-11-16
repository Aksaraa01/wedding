-- Register the second Ceriavite template: Ubin Ottoman.
--
-- Faithful port of the reference preset `ubin-biru-ottoman` (sub_id
-- 6ae2f7f7e9edc7234a45431c): cream #F6EEDC + navy #1E3A7B, Ottoman tile and
-- copper-lantern ornaments, Marcellus / Lora / Cinzel Decorative.
--
-- Kids family (event_type = 'kids'): one design serves khitanan, aqiqah and
-- ulang tahun. The content spec lives in TEMPLATE_CONFIGS; the wedding sections
-- that do not exist for a kids invitation (second person, love story, dress
-- code, rundown, livestream, contacts) stay disabled there and are recorded in
-- docs/REA_UBIN_OTTOMAN.md.
--
-- The preview image is the template's own cover plate in
-- public/templates/ubin-ottoman/ until ops uploads a real screenshot through
-- /ops/templates.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo, event_type)
VALUES
  ('ubin-ottoman', 'Ubin Ottoman',
   'Undangan biru Ottoman dan krem: ubin biru, lentera tembaga, ornamen bunga di empat sudut, dan tipografi serif klasik untuk khitanan, aqiqah, atau ulang tahun ananda.',
   '/templates/ubin-ottoman/thumbnail.webp',
   'https://ceriavite.aksaraa.com/templates/ubin-ottoman/preview', 12, 'Ceriavite', 'inhouse',
   '["ceriavite"]',
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
