-- Packages
INSERT INTO packages (code, name, description, base_price) VALUES
    ('essential', 'Essential', 'Sederhana, anggun, dan esensial untuk momen hangat keluarga dekat', 249000),
    ('signature', 'Signature', 'Keseimbangan sempurna antara estetika, kenyamanan tamu, dan fitur lengkap', 399000),
    ('prestige', 'Prestige', 'Pengalaman narasi digital paling mewah dengan fitur VIP eksklusif', 499000)
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
    ('prestige', 'premium_web', true),
    ('prestige', 'wish_wall', true),
    ('prestige', 'reservation_automation', true),
    ('prestige', 'kolom_direct_transfer', true),
    ('prestige', 'galeri_foto_tamu', true),
    ('prestige', 'qr_code_book', true),
    ('prestige', 'unique_link_generator', true),
    ('prestige', 'wa_blast', true)
ON CONFLICT DO NOTHING;

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
    ('limit', 'Limitasi Produksi', 3)
ON CONFLICT (code) DO NOTHING;

-- Package Matrix Rows
INSERT INTO package_matrix_rows (code, section_code, label, essential_value, essential_emphasis, signature_value, signature_emphasis, prestige_value, prestige_emphasis, sort_order) VALUES
    -- Core features
    (NULL, 'core', 'Countdown & Add to Calendar', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 1),
    (NULL, 'core', 'Digital RSVP & Wedding Wish', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 2),
    (NULL, 'core', 'Pilihan Lagu & Autoplay', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 3),
    (NULL, 'core', '1 PIC', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 4),
    (NULL, 'core', 'Maps', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 5),
    (NULL, 'core', 'Smart Dashboard', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 6),
    (NULL, 'core', 'Subdomain Nama Pasangan', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 7),
    (NULL, 'core', 'Unlimited Send (Manual)', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 8),
    (NULL, 'core', 'Amplop Digital (Rekening Based)', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 9),
    -- Exclusive features
    ('gift_address', 'exclusive', 'Alamat Pengiriman Kado', '—', 'muted', '✓', 'secondary', '✓', 'gold', 1),
    ('inviting_families', 'exclusive', 'Fitur Turut Mengundang', '—', 'muted', '✓', 'secondary', '✓', 'gold', 2),
    ('story', 'exclusive', 'Love Story', '—', 'muted', '—', 'muted', '✓', 'gold', 3),
    ('cinematic_video', 'exclusive', 'Cinematic Video', '—', 'muted', '—', 'muted', '✓', 'gold', 4),
    (NULL, 'exclusive', 'Reminder Otomatis ke 100 Tamu VIP', '—', 'muted', '—', 'muted', '✓', 'gold', 5),
    -- Production limits
    (NULL, 'limit', 'Kuota Foto', '15 Foto', 'default', '20 Foto', 'secondary', 'Unlimited', 'default', 1),
    (NULL, 'limit', 'Masa Aktif', '2 Bulan', 'default', '6 Bulan', 'secondary', '12 Bulan', 'default', 2),
    (NULL, 'limit', 'Batas Revisi', '2 Round', 'default', '3 Round', 'secondary', '5 Round', 'default', 3)
ON CONFLICT DO NOTHING;

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
