-- Collapse standalone GT bands (gt_4/gt_6) into a single gt package.
-- Slider tiers (galeri_tiers) price it; no profile rows reference the bands
-- (verified: zero gt profiles on staging and prod before writing this).

DELETE FROM public.package_features WHERE package_code IN ('gt_4', 'gt_6');
DELETE FROM public.packages WHERE code IN ('gt_4', 'gt_6');

INSERT INTO public.packages (code, name, description, base_price, price_old)
VALUES ('gt', 'Galeri Tamu', 'Galeri Kenangan Tamu standalone — harga mengikuti matriks tier foto & tamu', 0, NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.package_features (package_code, feature_code, is_included)
VALUES ('gt', 'galeri_foto_tamu', true)
ON CONFLICT (package_code, feature_code) DO NOTHING;

-- Band comparison columns leave the matrix with the bands.
ALTER TABLE public.package_matrix_rows
  DROP COLUMN IF EXISTS gt_4_value,
  DROP COLUMN IF EXISTS gt_4_emphasis,
  DROP COLUMN IF EXISTS gt_6_value,
  DROP COLUMN IF EXISTS gt_6_emphasis;
