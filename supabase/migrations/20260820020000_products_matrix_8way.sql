-- 8-way package matrix: BONUS (cetak_undangan_bonus) + 4 Buku Tamu Digital tiers.
-- Adds 5 (value, emphasis) column pairs keyed by package code so `{code}_value`
-- resolution in featureGates/photo-quota/limit routes works automatically.
--
-- Preserves the existing coded rows (gift_address, inviting_families, story,
-- cinematic_video) — their essential/signature/prestige columns are untouched;
-- only the new bonus + dgb columns are written.
ALTER TABLE public.package_matrix_rows
  ADD COLUMN IF NOT EXISTS cetak_undangan_bonus_value character varying NOT NULL DEFAULT '—',
  ADD COLUMN IF NOT EXISTS cetak_undangan_bonus_emphasis character varying NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS dgb_sistem_value character varying NOT NULL DEFAULT '—',
  ADD COLUMN IF NOT EXISTS dgb_sistem_emphasis character varying NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS dgb_pro_value character varying NOT NULL DEFAULT '—',
  ADD COLUMN IF NOT EXISTS dgb_pro_emphasis character varying NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS dgb_premium_value character varying NOT NULL DEFAULT '—',
  ADD COLUMN IF NOT EXISTS dgb_premium_emphasis character varying NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS dgb_prestige_value character varying NOT NULL DEFAULT '—',
  ADD COLUMN IF NOT EXISTS dgb_prestige_emphasis character varying NOT NULL DEFAULT 'default';

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS price_old numeric;

-- Section for Buku Tamu Digital only rows (after the other three sections).
INSERT INTO public.package_matrix_sections (code, label, sort_order) VALUES
  ('dgbook', 'Fitur Buku Tamu Digital', 4)
ON CONFLICT (code) DO NOTHING;

-- Marketing prices (source: package pricing CSV). Strikethrough = price_old.
UPDATE public.packages SET base_price = 199000, price_old = 299000 WHERE code = 'essential';
UPDATE public.packages SET base_price = 299000, price_old = 450000 WHERE code = 'signature';
UPDATE public.packages SET base_price = 499000, price_old = 750000 WHERE code = 'prestige';

INSERT INTO public.packages (code, name, description, base_price, price_old) VALUES
  ('cetak_undangan_bonus', 'BONUS (Cetak Undangan)', 'Paket bonus cetak undangan untuk kandidat terpilih (diberikan via OPS)', 100000, NULL),
  ('dgb_sistem', 'Sistem', 'Buku Tamu Digital - Sistem', 699000, 999000),
  ('dgb_pro', 'Pro', 'Buku Tamu Digital - Pro', 1699000, 2275000),
  ('dgb_premium', 'Premium', 'Buku Tamu Digital - Premium', 2199000, 2950000),
  ('dgb_prestige', 'Prestige', 'Buku Tamu Digital - Prestige', 2699000, 3600000)
ON CONFLICT (code) DO NOTHING;

-- Rebuild the non-coded rows to the canonical 27-row PDF order (splitting the
-- previously combined rows: Countdown/Add-to-Calendar, RSVP/Wish, Lagu/Autoplay)
-- plus the new rows (Greetings, Pilihan Bahasa, Custom Logo) and the 4
-- Buku Tamu Digital rows. Coded rows are preserved separately below.
DELETE FROM public.package_matrix_rows WHERE code IS NULL;

INSERT INTO public.package_matrix_rows (
  code, section_code, label, sort_order,
  cetak_undangan_bonus_value, cetak_undangan_bonus_emphasis,
  essential_value, essential_emphasis,
  signature_value, signature_emphasis,
  prestige_value, prestige_emphasis,
  dgb_sistem_value, dgb_sistem_emphasis,
  dgb_pro_value, dgb_pro_emphasis,
  dgb_premium_value, dgb_premium_emphasis,
  dgb_prestige_value, dgb_prestige_emphasis
) VALUES
  -- ===== Core (included in all 8) =====
  (NULL, 'core', '1 PIC', 1, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Greetings / Sapa Tamu', 2, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Maps', 3, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Countdown', 4, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Add to Calendar', 5, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Smart Dashboard', 6, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Pilihan Lagu & AutoPlay', 7, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Autoplay Lagu', 8, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Subdomain', 9, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Pilihan Bahasa', 10, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Unlimited Send (Manual)', 11, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'RSVP', 12, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Wedding Wish', 13, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'core', 'Amplop Digital (Rekening Based)', 14, '✓','gold', '✓','primary', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  -- ===== Exclusive (bonus: only Alamat Kado/Love Story/Cinematic; Custom Logo is prestige+) =====
  (NULL, 'exclusive', 'Custom Logo', 1, '—','muted', '—','muted', '—','muted', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  -- ===== Limitasi Produksi =====
  (NULL, 'limit', 'Batas Revisi', 1, '2 Round','default', '2 Round','default', '3 Round','secondary', '5 Round','gold', '5 Round','default', '5 Round','secondary', '5 Round','secondary', '5 Round','gold'),
  (NULL, 'limit', 'Kuota Foto', 2, '10 Foto','default', '15 Foto','default', '20 Foto','secondary', 'Unlimited','default', 'Unlimited','default', 'Unlimited','secondary', 'Unlimited','secondary', 'Unlimited','gold'),
  (NULL, 'limit', 'Masa Aktif', 3, '2 Bulan','default', '3 Bulan','default', '6 Bulan','secondary', '12 Bulan','gold', '12 Bulan','default', '12 Bulan','secondary', '12 Bulan','secondary', '12 Bulan','gold'),
  (NULL, 'limit', 'Reminder otomatis ke 100 Customers VIP', 4, '—','muted', '—','muted', '—','muted', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  -- ===== Buku Tamu Digital =====
  (NULL, 'dgbook', 'QR Digital System', 1, '—','muted', '—','muted', '—','muted', '—','muted', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
  (NULL, 'dgbook', 'Photo by Guest', 2, '—','muted', '—','muted', '—','muted', '—','muted', '2','default', '2','secondary', '3','secondary', '4','gold'),
  (NULL, 'dgbook', 'Devices (Tablet/HP)', 3, '—','muted', '—','muted', '—','muted', '—','muted', '—','muted', '2','secondary', '3','secondary', '4','gold'),
  (NULL, 'dgbook', 'Ushers', 4, '—','muted', '—','muted', '—','muted', '—','muted', '—','muted', '2','secondary', '3','secondary', '4','gold');

-- Coded rows: only the new bonus + dgb columns are set; the existing
-- essential/signature/prestige values (which featureGates depends on) are kept.
UPDATE public.package_matrix_rows SET
  cetak_undangan_bonus_value = '✓', cetak_undangan_bonus_emphasis = 'gold',
  dgb_sistem_value = '✓', dgb_sistem_emphasis = 'secondary',
  dgb_pro_value = '✓', dgb_pro_emphasis = 'secondary',
  dgb_premium_value = '✓', dgb_premium_emphasis = 'secondary',
  dgb_prestige_value = '✓', dgb_prestige_emphasis = 'gold'
WHERE code = 'gift_address';

UPDATE public.package_matrix_rows SET
  cetak_undangan_bonus_value = '—', cetak_undangan_bonus_emphasis = 'muted',
  dgb_sistem_value = '✓', dgb_sistem_emphasis = 'secondary',
  dgb_pro_value = '✓', dgb_pro_emphasis = 'secondary',
  dgb_premium_value = '✓', dgb_premium_emphasis = 'secondary',
  dgb_prestige_value = '✓', dgb_prestige_emphasis = 'gold'
WHERE code = 'inviting_families';

UPDATE public.package_matrix_rows SET
  cetak_undangan_bonus_value = '✓', cetak_undangan_bonus_emphasis = 'gold',
  dgb_sistem_value = '✓', dgb_sistem_emphasis = 'secondary',
  dgb_pro_value = '✓', dgb_pro_emphasis = 'secondary',
  dgb_premium_value = '✓', dgb_premium_emphasis = 'secondary',
  dgb_prestige_value = '✓', dgb_prestige_emphasis = 'gold'
WHERE code IN ('story', 'cinematic_video');

-- Feature mappings for the new packages. BONUS = Signature-minus (no galeri/qr/wa-bl via matrix);
-- all Buku Tamu Digital tiers include the full set (prestige incl. QR book, galeri, WA blast).
INSERT INTO package_features (package_code, feature_code, is_included) VALUES
  ('cetak_undangan_bonus', 'premium_web', true),
  ('cetak_undangan_bonus', 'wish_wall', true),
  ('cetak_undangan_bonus', 'reservation_automation', true),
  ('cetak_undangan_bonus', 'unique_link_generator', true),
  ('cetak_undangan_bonus', 'kolom_direct_transfer', true),
  ('dgb_sistem', 'premium_web', true),
  ('dgb_sistem', 'wish_wall', true),
  ('dgb_sistem', 'reservation_automation', true),
  ('dgb_sistem', 'unique_link_generator', true),
  ('dgb_sistem', 'kolom_direct_transfer', true),
  ('dgb_sistem', 'galeri_foto_tamu', true),
  ('dgb_sistem', 'qr_code_book', true),
  ('dgb_sistem', 'wa_blast', true),
  ('dgb_pro', 'premium_web', true),
  ('dgb_pro', 'wish_wall', true),
  ('dgb_pro', 'reservation_automation', true),
  ('dgb_pro', 'unique_link_generator', true),
  ('dgb_pro', 'kolom_direct_transfer', true),
  ('dgb_pro', 'galeri_foto_tamu', true),
  ('dgb_pro', 'qr_code_book', true),
  ('dgb_pro', 'wa_blast', true),
  ('dgb_premium', 'premium_web', true),
  ('dgb_premium', 'wish_wall', true),
  ('dgb_premium', 'reservation_automation', true),
  ('dgb_premium', 'unique_link_generator', true),
  ('dgb_premium', 'kolom_direct_transfer', true),
  ('dgb_premium', 'galeri_foto_tamu', true),
  ('dgb_premium', 'qr_code_book', true),
  ('dgb_premium', 'wa_blast', true),
  ('dgb_prestige', 'premium_web', true),
  ('dgb_prestige', 'wish_wall', true),
  ('dgb_prestige', 'reservation_automation', true),
  ('dgb_prestige', 'unique_link_generator', true),
  ('dgb_prestige', 'kolom_direct_transfer', true),
  ('dgb_prestige', 'galeri_foto_tamu', true),
  ('dgb_prestige', 'qr_code_book', true),
  ('dgb_prestige', 'wa_blast', true)
ON CONFLICT (package_code, feature_code) DO NOTHING;

-- Prestige loses QR book + guest gallery (moved to Buku Tamu Digital line).
UPDATE public.package_features SET is_included = false
WHERE package_code = 'prestige' AND feature_code IN ('qr_code_book', 'galeri_foto_tamu');