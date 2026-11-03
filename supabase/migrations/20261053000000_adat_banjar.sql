-- Register the in-house Adat Banjar template.
--
-- Same long-scroll component family as Adat Melayu/Bugis/Dayak (cover gate →
-- opening video → verse → mempelai → Turut Mengundang → events/countdown →
-- livestream → rundown → dress code → gallery → love story → gift → wishes →
-- contacts → closing), re-skinned to the reference's deep maroon (#361111 /
-- #5A2020) on warm paper (#fffcf3) with the Banjar opening film + soundtrack.
--
-- No schema change: rundown/contacts/dresscode/livestream already exist from
-- the Adat Melayu migration. Only the web_templates row is new.

INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('adat-banjar', 'Adat Banjar',
   'Undangan adat Banjar bernuansa deep maroon dan warm paper — ilustrasi rumah bubungan tinggi banjar, video pembuka, ayat, mempelai, hitung mundur, acara, rundown, dress code, galeri, kisah cinta, hadiah, ucapan, dan kontak keluarga.',
   '/templates/adat-banjar/thumbnail.webp',
   '/templates/adat-banjar/preview', 36, 'Adat/Tradisional', 'inhouse',
   '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige","gt"]',
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
