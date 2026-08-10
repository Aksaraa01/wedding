-- Add stable feature codes to package_matrix_rows so feature gating can map
-- rows to editor/template features independent of per-environment UUIDs.

ALTER TABLE public.package_matrix_rows
  ADD COLUMN code text;

-- Backfill the three feature rows that gate editor + template content.
UPDATE public.package_matrix_rows SET code = 'gift_address' WHERE id = 'f80f0a0d-df51-4b12-a4eb-0d27c93a902f';
UPDATE public.package_matrix_rows SET code = 'inviting_families' WHERE id = 'd3008cba-29f4-4348-9d2c-142a86629cc9';
UPDATE public.package_matrix_rows SET code = 'story' WHERE id = '65d7bbc3-6fc0-4013-9585-d35d1c674d47';

CREATE UNIQUE INDEX IF NOT EXISTS idx_package_matrix_rows_code ON public.package_matrix_rows(code) WHERE code IS NOT NULL;