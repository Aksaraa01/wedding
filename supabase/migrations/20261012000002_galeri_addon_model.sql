-- Galeri Tamu dual model: standalone GT tab (slider-priced gt_4/gt_6 bands)
-- + GT add-on on Undangan Digital base packages.
-- Slider config lives on the profile; quota/cap derive from it.

-- =====================================================
-- 1. Per-profile GT config columns
-- =====================================================
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS galeri_addon boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS galeri_photos_per_guest integer,
  ADD COLUMN IF NOT EXISTS galeri_guest_count integer,
  ADD COLUMN IF NOT EXISTS galeri_tier text,
  ADD COLUMN IF NOT EXISTS galeri_price integer DEFAULT 0;

-- =====================================================
-- 2. Tier price source of truth (seeded A–D matrix)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.galeri_tiers (
  tier text PRIMARY KEY,
  photo_min integer NOT NULL,
  photo_max integer NOT NULL,
  guest_min integer NOT NULL,
  guest_max integer NOT NULL,
  price integer NOT NULL
);

INSERT INTO public.galeri_tiers (tier, photo_min, photo_max, guest_min, guest_max, price) VALUES
  ('A', 1, 5, 1, 100, 150000),
  ('B', 1, 5, 101, 200, 250000),
  ('C', 6, 10, 1, 100, 250000),
  ('D', 6, 10, 101, 200, 350000)
ON CONFLICT (tier) DO UPDATE SET
  photo_min = EXCLUDED.photo_min,
  photo_max = EXCLUDED.photo_max,
  guest_min = EXCLUDED.guest_min,
  guest_max = EXCLUDED.guest_max,
  price = EXCLUDED.price;

-- =====================================================
-- 3. Matrix Photo-by-Guest becomes band ranges (quotas now
-- per-profile; these cells are display truth for the table)
-- =====================================================
UPDATE public.package_matrix_rows
SET gt_4_value = '1–5', gt_4_emphasis = 'secondary',
    gt_6_value = '6–10', gt_6_emphasis = 'gold'
WHERE label = 'Photo by Guest';

UPDATE public.packages
SET name = 'Intimate Memories',
    description = 'Galeri Kenangan Tamu standalone — 1–5 jepretan per tamu (harga mengikuti jumlah tamu)'
WHERE code = 'gt_4';

UPDATE public.packages
SET name = 'Grand Celebration',
    description = 'Galeri Kenangan Tamu standalone — 6–10 jepretan per tamu (harga mengikuti jumlah tamu)'
WHERE code = 'gt_6';

-- =====================================================
-- 4. Atomic gallery insert v2: quota/cap from the profile's
-- slider config (fallback to legacy gt_4/gt_6 defaults for rows
-- configured before the slider model). Absolute 2000 cap.
-- =====================================================
CREATE OR REPLACE FUNCTION public.insert_gallery_photo(
  p_profile_id uuid,
  p_device_id text,
  p_name text,
  p_category text,
  p_caption text,
  p_image_url text,
  p_idem text,
  p_quota int,
  p_cap int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
  v_now timestamptz := now();
  v_pkg text;
  v_cfg_quota int;
  v_cfg_cap int;
  v_quota int;
  v_cap int;
  v_dev int;
  v_tot int;
  v_row public.guest_photos%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_profile_id::text));

  IF p_idem IS NOT NULL THEN
    SELECT * INTO v_row FROM public.guest_photos WHERE idempotency_key = p_idem;
    IF FOUND THEN
      RETURN jsonb_build_object('ok', true, 'dedup', true, 'photo', row_to_json(v_row));
    END IF;
  END IF;

  SELECT gallery_start_at, gallery_end_at, package_type,
         galeri_photos_per_guest, galeri_guest_count
  INTO v_start, v_end, v_pkg, v_cfg_quota, v_cfg_cap
  FROM public.wedding_profiles WHERE id = p_profile_id;

  IF v_start IS NULL OR v_end IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_CONFIGURED');
  END IF;
  IF v_now < (v_start - interval '1 hour') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UPCOMING');
  END IF;
  IF v_now > (v_end + interval '1 hour') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ENDED');
  END IF;

  -- Slider config wins; legacy gt rows fall back to band defaults.
  IF v_cfg_quota IS NOT NULL AND v_cfg_quota > 0 AND v_cfg_cap IS NOT NULL AND v_cfg_cap > 0 THEN
    v_quota := v_cfg_quota;
    v_cap := LEAST(v_cfg_quota * v_cfg_cap, 2000);
  ELSIF v_pkg = 'gt_4' THEN
    v_quota := 4; v_cap := 400;
  ELSIF v_pkg = 'gt_6' THEN
    v_quota := 6; v_cap := 600;
  ELSE
    v_quota := p_quota; v_cap := p_cap;
  END IF;

  SELECT count(*) INTO v_dev FROM public.guest_photos
  WHERE wedding_profile_id = p_profile_id
    AND device_id = p_device_id
    AND source IS DISTINCT FROM 'selfie';
  IF v_dev >= v_quota THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_DEVICE');
  END IF;

  SELECT count(*) INTO v_tot FROM public.guest_photos
  WHERE wedding_profile_id = p_profile_id
    AND source IS DISTINCT FROM 'selfie';
  IF v_tot >= v_cap THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_EVENT');
  END IF;

  INSERT INTO public.guest_photos
    (wedding_profile_id, guest_id, device_id, uploader_name, category, caption, image_url, source, idempotency_key)
  VALUES
    (p_profile_id, NULL, p_device_id, p_name, p_category, NULLIF(p_caption, ''), p_image_url, 'gallery', p_idem)
  RETURNING * INTO v_row;

  RETURN jsonb_build_object('ok', true, 'dedup', false, 'photo', row_to_json(v_row));
END;
$$;
