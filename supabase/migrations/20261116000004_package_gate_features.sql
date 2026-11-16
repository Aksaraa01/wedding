-- Move the four section gates from the wide matrix into package_features.
--
-- `package_matrix_rows` carries one column pair per package (essential_value,
-- signature_value, …), which means every new package needs new columns and
-- `getRowGates` has to know a fallback chain. A gate is really just "is this
-- feature in the package", so it belongs in package_features with the rest:
--
--   story | cinematic_video | inviting_families | gift_address
--
-- After this migration every package has an explicit is_included row for all
-- four, computed from its matrix column, so the code no longer guesses.
INSERT INTO package_features (package_code, feature_code, is_included)
SELECT
  p.code,
  g.code,
  CASE
    WHEN p.code = 'ceriavite' THEN g.code IN ('gift_address', 'inviting_families')
    ELSE COALESCE(to_jsonb(g) ->> (p.code || '_value'), '—') <> '—'
         AND COALESCE(to_jsonb(g) ->> (p.code || '_emphasis'), '') <> 'muted'
  END
FROM packages p
CROSS JOIN (
  SELECT * FROM package_matrix_rows
  WHERE code IN ('story', 'cinematic_video', 'inviting_families', 'gift_address')
) g
ON CONFLICT (package_code, feature_code) DO UPDATE
  SET is_included = EXCLUDED.is_included;
