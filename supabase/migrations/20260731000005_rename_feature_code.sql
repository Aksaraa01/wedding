-- Unify the guest photo gallery feature code to galeri_foto_tamu
-- (was gift_marketplace in package_features, galeri_kenangan in feature_actions)

UPDATE public.package_features
SET feature_code = 'galeri_foto_tamu'
WHERE feature_code = 'gift_marketplace';

UPDATE public.feature_actions
SET feature_key = 'galeri_foto_tamu'
WHERE feature_key = 'galeri_kenangan';
