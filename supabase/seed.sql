-- Packages (marketing prices; price_old = strikethrough shown on /customize)
INSERT INTO packages (code, name, description, base_price, price_old) VALUES
    ('essential', 'Essential', 'Sederhana, anggun, dan esensial untuk momen hangat keluarga dekat', 199000, 299000),
    ('signature', 'Signature', 'Keseimbangan sempurna antara estetika, kenyamanan tamu, dan fitur lengkap', 299000, 450000),
    ('prestige', 'Prestige', 'Pengalaman narasi digital paling mewah dengan fitur VIP eksklusif', 499000, 750000),
    ('cetak_undangan_bonus', 'BONUS (Cetak Undangan)', 'Paket bonus cetak undangan untuk kandidat terpilih (diberikan via OPS)', 100000, NULL),
    ('dgb_sistem', 'Sistem', 'Buku Tamu Digital - Sistem', 699000, 999000),
    ('dgb_pro', 'Pro', 'Buku Tamu Digital - Pro', 1699000, 2275000),
    ('dgb_premium', 'Premium', 'Buku Tamu Digital - Premium', 2199000, 2950000),
    ('dgb_prestige', 'Prestige', 'Buku Tamu Digital - Prestige', 2699000, 3600000)
ON CONFLICT (code) DO NOTHING;

-- Package Features
INSERT INTO package_features (package_code, feature_code, is_included) VALUES
    ('essential', 'premium_web', true),
    ('essential', 'reservation_automation', true),
    ('essential', 'unique_link_generator', true),
    ('essential', 'kolom_direct_transfer', true),
    ('signature', 'premium_web', true),
    ('signature', 'wish_wall', true),
    ('signature', 'reservation_automation', true),
    ('signature', 'unique_link_generator', true),
    ('signature', 'kolom_direct_transfer', true),
    -- Prestige excludes QR book + guest gallery (moved to Buku Tamu Digital).
    ('prestige', 'premium_web', true),
    ('prestige', 'wish_wall', true),
    ('prestige', 'reservation_automation', true),
    ('prestige', 'kolom_direct_transfer', true),
    ('prestige', 'galeri_foto_tamu', false),
    ('prestige', 'qr_code_book', false),
    ('prestige', 'unique_link_generator', true),
    ('prestige', 'wa_blast', true),
    -- BONUS (cetak undangan) = Signature-minus: no galeri/qr/wa blast.
    ('cetak_undangan_bonus', 'premium_web', true),
    ('cetak_undangan_bonus', 'wish_wall', true),
    ('cetak_undangan_bonus', 'reservation_automation', true),
    ('cetak_undangan_bonus', 'unique_link_generator', true),
    ('cetak_undangan_bonus', 'kolom_direct_transfer', true),
    -- Buku Tamu Digital tiers: full set (incl. QR book, galeri, WA blast).
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

-- WA Blast Pricing Tiers
TRUNCATE product_price_tiers;
INSERT INTO product_price_tiers (product_code, min_qty, max_qty, price) VALUES
    ('wa_blast', 100, 100, 150000),
    ('wa_blast', 200, 200, 250000),
    ('wa_blast', 300, 300, 300000);

-- Package Matrix Sections
INSERT INTO package_matrix_sections (code, label, sort_order) VALUES
    ('core', 'Inti Pengalaman (Included in All)', 1),
    ('exclusive', 'Fitur Eksklusif', 2),
    ('limit', 'Limitasi Produksi', 3),
    ('dgbook', 'Fitur Buku Tamu Digital', 4)
ON CONFLICT (code) DO NOTHING;

-- Package Matrix Rows (8-way: BONUS, Essential, Signature, Prestige,
-- DGB Sistem, DGB Pro, DGB Premium, DGB Prestige — in PDF/CSV order)
TRUNCATE package_matrix_rows;
INSERT INTO package_matrix_rows (
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
    -- Core (included in all 8)
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
    -- Exclusive
    ('gift_address', 'exclusive', 'Alamat Pengiriman Kado', 1, '✓','gold', '—','muted', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    ('inviting_families', 'exclusive', 'Fitur Turut Mengundang', 2, '—','muted', '—','muted', '✓','secondary', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    ('story', 'exclusive', 'Love Story', 3, '✓','gold', '—','muted', '—','muted', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    ('cinematic_video', 'exclusive', 'Cinematic Video', 4, '✓','gold', '—','muted', '—','muted', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    (NULL, 'exclusive', 'Custom Logo', 5, '—','muted', '—','muted', '—','muted', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    -- Production limits
    (NULL, 'limit', 'Batas Revisi', 1, '2 Round','default', '2 Round','default', '3 Round','secondary', '5 Round','gold', '5 Round','default', '5 Round','secondary', '5 Round','secondary', '5 Round','gold'),
    (NULL, 'limit', 'Kuota Foto', 2, '10 Foto','default', '15 Foto','default', '20 Foto','secondary', 'Unlimited','default', 'Unlimited','default', 'Unlimited','secondary', 'Unlimited','secondary', 'Unlimited','gold'),
    (NULL, 'limit', 'Masa Aktif', 3, '2 Bulan','default', '3 Bulan','default', '6 Bulan','secondary', '12 Bulan','gold', '12 Bulan','default', '12 Bulan','secondary', '12 Bulan','secondary', '12 Bulan','gold'),
    (NULL, 'limit', 'Reminder otomatis ke 100 Customers VIP', 4, '—','muted', '—','muted', '—','muted', '✓','gold', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    -- Buku Tamu Digital
    (NULL, 'dgbook', 'QR Digital System', 1, '—','muted', '—','muted', '—','muted', '—','muted', '✓','secondary', '✓','secondary', '✓','secondary', '✓','gold'),
    (NULL, 'dgbook', 'Photo by Guest', 2, '—','muted', '—','muted', '—','muted', '—','muted', '2','default', '2','secondary', '3','secondary', '4','gold'),
    (NULL, 'dgbook', 'Devices (Tablet/HP)', 3, '—','muted', '—','muted', '—','muted', '—','muted', '—','muted', '2','secondary', '3','secondary', '4','gold'),
    (NULL, 'dgbook', 'Ushers', 4, '—','muted', '—','muted', '—','muted', '—','muted', '—','muted', '2','secondary', '3','secondary', '4','gold');

-- Web Templates
INSERT INTO web_templates (code, name, description, preview_image_url, demo_url, sort_order) VALUES
    ('parallax-sinematik', 'Parallax Sinematik', 'Tata letak gulir vertikal kontinu dengan transisi gambar paralaks dramatis dan fade-in teks yang elegan.', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/templates/parallax-sinematik.jpg', 'https://ayomarried.com/valdo-debora', 1),
    ('editorial-modern', 'Editorial Modern', 'Desain editorial tipografi high-fashion dengan aksen monokrom bersih, tajuk serif besar, dan whitespace terstruktur.', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/templates/editorial-modern.jpg', 'https://ayomarried.com/raja-tya', 2),
    ('animasi-watercolor', 'Animasi Watercolor', 'Desain romantis dengan ilustrasi bunga pastel lembut yang mengapung dan berputar anggun saat pengguna menggulir.', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/templates/animasi-watercolor.jpg', 'https://ayomarried.com/reinhard-maici', 3),
    ('heritage-dinamis', 'Heritage Dinamis', 'Representasi digital motif budaya, seperti garis Gorga atau Songket hasil render vektor yang mengembang secara interaktif.', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/templates/heritage-dinamis.jpg', 'https://ayomarried.com/james-enna', 4),
    ('heritage-jawa', 'Heritage Jawa', 'Desain pernikahan adat Jawa yang elegan dengan ornamen tradisional, motif Gunungan, dan palet warna emas & krem.', '', '', 5)
ON CONFLICT (code) DO NOTHING;

-- Music Tracks
INSERT INTO web_tracks (title, artist, mood_category, audio_url, sort_order) VALUES
    ('White Moment', 'Instrumental Modern', 'klasik-abad', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/tracks/white-moment.mp3', 1),
    ('Perfect', 'Instrumental Acoustic', 'klasik-abad', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/tracks/perfect.mp3', 2),
    ('Women in White', 'Orchestra Minimalist', 'klasik-abad', 'https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/seeded/tracks/women-in-white.mp3', 3),
    ('Can''t Help Falling in Love', 'Acoustic Cover', 'modern-romantis', '', 4),
    ('Rewrite the Stars', 'Pop Instrumental', 'modern-romantis', '', 5),
    ('Yang Terdalam', 'Peterpan', 'nusantara-heritage', '', 6),
    ('Hasian', 'Original Song', 'nusantara-heritage', '', 7)
ON CONFLICT DO NOTHING;

-- Storage bucket for template media
INSERT INTO storage.buckets (id, name, public) VALUES ('template-media', 'template-media', true)
ON CONFLICT (id) DO NOTHING;

-- Default admin employee
INSERT INTO employees (name, phone_number, pin, role)
SELECT 'Admin', '+628123456789', '123456', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone_number = '+628123456789');
