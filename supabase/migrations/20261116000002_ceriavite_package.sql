-- Ceriavite gets its own package instead of reusing `essential`.
--
-- Same Rp 199.000 price, but a strictly smaller feature set: invitation, RSVP,
-- wish wall, unique guest links and the digital envelope. No love story, no
-- cinematic video, no QR guestbook, no guest gallery — so the editor, dashboard,
-- ops and the completeness checks can all derive from the package rather than
-- from scattered `event_type === kids` conditionals.
INSERT INTO packages (code, name, description, base_price, price_old)
VALUES ('ceriavite', 'Ceriavite',
  'Undangan digital khitanan, aqiqah, dan ulang tahun: RSVP, doa dan ucapan, tautan tamu, tanda kasih.',
  199000, 299000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO package_features (package_code, feature_code, is_included) VALUES
  ('ceriavite', 'premium_web', true),
  ('ceriavite', 'wish_wall', true),
  ('ceriavite', 'reservation_automation', true),
  ('ceriavite', 'unique_link_generator', true),
  ('ceriavite', 'kolom_direct_transfer', true)
ON CONFLICT (package_code, feature_code) DO NOTHING;

-- The kids template is sold in this package only.
UPDATE web_templates
SET package_eligibility = '["ceriavite"]'::jsonb
WHERE code = 'songket-marun';
