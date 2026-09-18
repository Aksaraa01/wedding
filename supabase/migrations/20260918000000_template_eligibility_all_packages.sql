-- All templates are available to all packages.
-- Backfill package_eligibility to the full package code list so every
-- template is eligible for every package (including elite and
-- bonus_full_custom, which were missing from all rows).
UPDATE web_templates
SET package_eligibility = '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]'::jsonb
WHERE package_eligibility IS DISTINCT FROM '["essential","signature","prestige","elite","cetak_undangan_bonus","bonus_full_custom","dgb_sistem","dgb_pro","dgb_premium","dgb_prestige"]'::jsonb;
