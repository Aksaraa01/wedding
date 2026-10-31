-- DGB add-on quota is additive on top of the package base (see
-- getGalleryQuota() in src/lib/gallery.ts: base photos + add-on photos).
-- The RPC only read galeri_photos_per_guest, so a dgb_sistem couple who bought
-- 10 add-on photos was capped at 10 uploads per device while the UI (and the
-- QUOTA_DEVICE message) said 12 — guests were blocked with a "12 foto" error
-- after 10 shots. Mirror the base here so both sides agree.
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

  -- Slider config wins; DGB packages add their bundled base photos on top;
  -- legacy gt rows fall back to band defaults.
  IF v_cfg_quota IS NOT NULL AND v_cfg_quota > 0 AND v_cfg_cap IS NOT NULL AND v_cfg_cap > 0 THEN
    v_quota := v_cfg_quota + CASE v_pkg
      WHEN 'dgb_sistem' THEN 2
      WHEN 'dgb_pro' THEN 2
      WHEN 'dgb_premium' THEN 3
      WHEN 'dgb_prestige' THEN 4
      ELSE 0
    END;
    v_cap := LEAST(v_quota * v_cfg_cap, 2000);
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
