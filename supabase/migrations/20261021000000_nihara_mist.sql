-- Dress code + live streaming editable content (jsonb objects).
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS dresscode jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS livestream jsonb DEFAULT '{}'::jsonb;

-- Register the in-house Nihara Mist template (dark elegance).
INSERT INTO web_templates
  (code, name, description, preview_image_url, demo_url, sort_order, category, source_type, package_eligibility, tier, is_active)
VALUES
  ('nihara-mist', 'Nihara Mist',
   'Undangan gaya elegansi gelap dengan antarmuka interaktif — scene deck sinematik, countdown, galeri mist tiles, dress code, dan vinil musik.',
   'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/1790765548170-DSC06466.jpg',
   '/templates/nihara-mist/preview', 11, 'Elegansi Dark', 'inhouse',
   '["essential","signature","prestige","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]',
   'Baru', true)
ON CONFLICT (code) DO NOTHING;
