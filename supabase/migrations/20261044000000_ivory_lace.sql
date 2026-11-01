-- Register the in-house Ivory Lace template (editorial paper / lace envelope).
--
-- The design is photo-led: ivory paper, torn-edge photo plates, hairline + heart
-- rules, a drawn wax seal and a wreath monogram. No reference art is shipped
-- (the reference is a Canva template whose lace, seal and icons are licensed
-- stock), so `no_photo` stays false — every photograph is the couple's own.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Sampul /
-- Kisah Cinta / Penutup), portraits on, love-story photos on, and all fifteen
-- minimum sections enabled plus the approved love-story block.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('ivory-lace', 'Ivory Lace',
   'Undangan editorial kertas ivory — amplop renda bersegel lilin, monogram wreath, mempelai, kisah cinta, kalender dan hitung mundur, acara, susunan acara, galeri, film, hadiah, dress code, dan ucapan.',
   '/templates/ivory-lace/thumbnail.webp',
   '/templates/ivory-lace/preview', 26, 'Editorial', 'inhouse',
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
