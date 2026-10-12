-- Galeri Kenangan Tamu (standalone product: gt_4 / gt_6).
-- Owner configures couple photo + name + event window on the dashboard;
-- guests scan one event QR (active start-1h .. end+1h) and upload with a
-- device-scoped slot quota (4 or 6 photos per device, 400/600 per event).

-- =====================================================
-- 1. wedding_profiles: event setup columns
-- =====================================================
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS gallery_token text,
  ADD COLUMN IF NOT EXISTS gallery_couple_name text,
  ADD COLUMN IF NOT EXISTS gallery_photo_url text,
  ADD COLUMN IF NOT EXISTS gallery_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS gallery_end_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wedding_profiles_gallery_token_key'
  ) THEN
    ALTER TABLE public.wedding_profiles ADD CONSTRAINT wedding_profiles_gallery_token_key UNIQUE (gallery_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_gallery_token ON public.wedding_profiles(gallery_token);

-- =====================================================
-- 2. guest_photos: anonymous device uploads + caption + idempotency
-- =====================================================
ALTER TABLE public.guest_photos
  ALTER COLUMN guest_id DROP NOT NULL;

ALTER TABLE public.guest_photos
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS uploader_name text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guest_photos_idempotency_key_key'
  ) THEN
    ALTER TABLE public.guest_photos ADD CONSTRAINT guest_photos_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_gallery_identity'
  ) THEN
    ALTER TABLE public.guest_photos ADD CONSTRAINT chk_gallery_identity
      CHECK (guest_id IS NOT NULL OR device_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_photos_profile_device ON public.guest_photos(wedding_profile_id, device_id);
CREATE INDEX IF NOT EXISTS idx_photos_profile_created ON public.guest_photos(wedding_profile_id, created_at DESC, id DESC);

-- =====================================================
-- 3. Packages gt_4 / gt_6 + features
-- =====================================================
INSERT INTO public.packages (code, name, description, base_price, price_old) VALUES
  ('gt_4', 'Intimate Memories', 'Galeri Kenangan Tamu - 4 jepretan per tamu (kapasitas hingga 400 foto per acara)', 150000, NULL),
  ('gt_6', 'Grand Celebration', 'Galeri Kenangan Tamu - 6 jepretan per tamu (kapasitas hingga 600 foto per acara)', 250000, NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.package_features (package_code, feature_code, is_included) VALUES
  ('gt_4', 'galeri_foto_tamu', true),
  ('gt_6', 'galeri_foto_tamu', true)
ON CONFLICT (package_code, feature_code) DO NOTHING;

-- =====================================================
-- 4. Matrix columns for the new packages
-- =====================================================
ALTER TABLE public.package_matrix_rows
  ADD COLUMN IF NOT EXISTS gt_4_value TEXT,
  ADD COLUMN IF NOT EXISTS gt_4_emphasis TEXT,
  ADD COLUMN IF NOT EXISTS gt_6_value TEXT,
  ADD COLUMN IF NOT EXISTS gt_6_emphasis TEXT;

-- Per-device photo quota behind the gallery window.
UPDATE public.package_matrix_rows
SET gt_4_value = '4', gt_4_emphasis = 'secondary',
    gt_6_value = '6', gt_6_emphasis = 'gold'
WHERE label = 'Photo by Guest';

-- =====================================================
-- 5. Atomic gallery insert (idempotent + race-safe quotas)
-- Serializes per-event via advisory lock, then checks in one txn:
-- idempotency key, event window (±1h), per-device quota, per-event cap.
-- Returns { ok, dedup?, code?, photo? } as jsonb.
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

  SELECT gallery_start_at, gallery_end_at INTO v_start, v_end
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

  SELECT count(*) INTO v_dev FROM public.guest_photos
  WHERE wedding_profile_id = p_profile_id
    AND device_id = p_device_id
    AND source IS DISTINCT FROM 'selfie';
  IF v_dev >= p_quota THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_DEVICE');
  END IF;

  SELECT count(*) INTO v_tot FROM public.guest_photos
  WHERE wedding_profile_id = p_profile_id
    AND source IS DISTINCT FROM 'selfie';
  IF v_tot >= p_cap THEN
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
