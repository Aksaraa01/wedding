-- Register the in-house N Film template (streaming-poster / film invitation).
--
-- The design is type-led: black ground, Anton display, Archivo functional, one
-- red accent. It ships no reference art, so `no_photo` stays false — the cover
-- profile picker and the mempelai portraits are the couple's own photographs.
--
-- Content spec lives in TEMPLATE_CONFIGS: 3 semantic cover slots (Sampul /
-- Kutipan / Closing), portraits on, love-story photos on, and all sixteen
-- minimum sections enabled.
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES
  ('n-film', 'N Film',
   'Undangan bergaya film dan layanan streaming — sampul pemilih tamu, poster nama, daftar episode kisah cinta, hitung mundur, galeri, film, dan ucapan.',
   '/templates/n-film/thumbnail.webp',
   '/templates/n-film/preview', 33, 'Modern', 'inhouse',
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
