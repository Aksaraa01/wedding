ALTER TABLE package_matrix_rows ADD COLUMN IF NOT EXISTS bonus_full_custom_value TEXT;
ALTER TABLE package_matrix_rows ADD COLUMN IF NOT EXISTS bonus_full_custom_emphasis TEXT;

INSERT INTO packages (code, name, description, base_price, price_old) VALUES
  ('bonus_full_custom', 'BONUS FULL CUSTOM', 'Paket bonus full custom untuk kandidat terpilih (diberikan via OPS)', 350000, NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO package_features (package_code, feature_code, is_included) VALUES
  ('bonus_full_custom', 'premium_web', true),
  ('bonus_full_custom', 'wish_wall', true),
  ('bonus_full_custom', 'reservation_automation', true),
  ('bonus_full_custom', 'unique_link_generator', true),
  ('bonus_full_custom', 'kolom_direct_transfer', true)
ON CONFLICT (package_code, feature_code) DO NOTHING;

UPDATE package_matrix_rows SET bonus_full_custom_value = prestige_value, bonus_full_custom_emphasis = prestige_emphasis;

UPDATE package_matrix_rows SET bonus_full_custom_value = '—', bonus_full_custom_emphasis = 'muted' WHERE label = 'Reminder otomatis ke 100 Customers VIP';
