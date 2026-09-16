ALTER TABLE package_matrix_rows ADD COLUMN IF NOT EXISTS elite_value TEXT;
ALTER TABLE package_matrix_rows ADD COLUMN IF NOT EXISTS elite_emphasis TEXT;

INSERT INTO packages (code, name, description, base_price, price_old) VALUES
  ('elite', 'Elite', 'Masterpiece — prioritas pengerjaan, masa aktif 1 tahun, full custom design (termasuk fitur Prestige)', 599000, 850000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO package_features (package_code, feature_code, is_included) VALUES
  ('elite', 'premium_web', true),
  ('elite', 'wish_wall', true),
  ('elite', 'reservation_automation', true),
  ('elite', 'unique_link_generator', true),
  ('elite', 'kolom_direct_transfer', true),
  ('elite', 'wa_blast', true)
ON CONFLICT (package_code, feature_code) DO NOTHING;

UPDATE package_matrix_rows SET elite_value = prestige_value, elite_emphasis = prestige_emphasis;
