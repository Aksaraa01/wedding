-- Register the in-house "Swan Garden" template: a watercolour garden invitation
-- ported from the Katsudoto "exclusive-aulia" design. The painted arch and
-- bridge, the swans, birds and butterflies, the carved oval couple frames and
-- the paper texture are vendored under public/templates/swan-garden/ and
-- referenced through ornaments.ts / SG; every section is rebuilt in the
-- reference's own visual language. No new wedding_profiles columns are needed —
-- the template reads sessions, stories, rundown, dresscode, livestream,
-- gift_accounts, inviting_families and template_content.
--
-- Content spec lives in TEMPLATE_CONFIGS: two cover slots (the oval on the
-- cover and the portrait inside the entry arch), portraits on, story
-- photos on, and gallery, video, gift, dress code, rundown, inviting and
-- livestream on. The reference's RSVP block and transfer-confirmation form are
-- not shipped (see docs/REA_SWAN_GARDEN.md §9).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('swan-garden', 'Swan Garden',
   'Undangan cat-air taman: lengkung batu berlumut di tepi danau, angsa dan kupu-kupu, bunga liar di setiap sudut, bingkai oval berukir untuk kedua mempelai, serta tipografi Imperial Script di atas kertas krem-hijau.',
   '/templates/swan-garden/thumbnail.webp',
   '/templates/swan-garden/preview', 45, 'Floral', 'inhouse',
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
