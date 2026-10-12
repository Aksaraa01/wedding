-- Single price source of truth: every price the app charges or displays
-- comes from packages / product_price_tiers / galeri_tiers. No hardcoded
-- money in code.

-- Express 24h flat fee lives with the other product tiers.
INSERT INTO public.product_price_tiers (product_code, min_qty, max_qty, price)
SELECT 'express_service', 1, 1, 250000
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_price_tiers WHERE product_code = 'express_service'
);

-- Standalone GT bands price entirely from the slider tier matrix
-- (galeri_price), so the package base is 0 by definition.
UPDATE public.packages SET base_price = 0 WHERE code IN ('gt_4', 'gt_6');
