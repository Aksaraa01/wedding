-- =====================================================
-- Drop old tables
-- =====================================================
DROP TABLE IF EXISTS package_matrix_rows CASCADE;
DROP TABLE IF EXISTS package_matrix_sections CASCADE;
DROP TABLE IF EXISTS package_features CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS product_selections CASCADE;
DROP TABLE IF EXISTS product_price_tiers CASCADE;
DROP TABLE IF EXISTS product_catalog CASCADE;

-- =====================================================
-- 1. Packages
-- =====================================================
CREATE TABLE packages (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO packages (code, name, description, base_price) VALUES
    ('essential', 'Essential', 'Sederhana, anggun, dan esensial untuk momen hangat keluarga dekat', 249000),
    ('signature', 'Signature', 'Keseimbangan sempurna antara estetika, kenyamanan tamu, dan fitur lengkap', 399000),
    ('prestige', 'Prestige', 'Pengalaman narasi digital paling mewah dengan fitur VIP eksklusif', 499000)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. Package Features
-- =====================================================
CREATE TABLE package_features (
    package_code VARCHAR(20) REFERENCES packages(code) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL,
    is_included BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (package_code, feature_code)
);

INSERT INTO package_features (package_code, feature_code, is_included) VALUES
    ('essential', 'premium_web', true),
    ('essential', 'reservation_automation', true),
    ('essential', 'kolom_direct_transfer', true),
    ('signature', 'premium_web', true),
    ('signature', 'wish_wall', true),
    ('signature', 'reservation_automation', true),
    ('signature', 'kolom_direct_transfer', true),
    ('prestige', 'premium_web', true),
    ('prestige', 'wish_wall', true),
    ('prestige', 'reservation_automation', true),
    ('prestige', 'kolom_direct_transfer', true),
    ('prestige', 'gift_marketplace', true),
    ('prestige', 'qr_code_book', true),
    ('prestige', 'unique_link_generator', true),
    ('prestige', 'wa_blast', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. WA Blast Tiers
-- =====================================================
CREATE TABLE product_price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) NOT NULL,
    min_qty INTEGER NOT NULL,
    max_qty INTEGER,
    price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE product_price_tiers;

INSERT INTO product_price_tiers (product_code, min_qty, max_qty, price) VALUES
    ('wa_blast', 100, 100, 150000),
    ('wa_blast', 200, 200, 250000),
    ('wa_blast', 300, 300, 300000);

-- =====================================================
-- 4. Wedding Profiles — add package columns
-- =====================================================
ALTER TABLE wedding_profiles
    ADD COLUMN IF NOT EXISTS package_type VARCHAR(20) DEFAULT 'signature',
    ADD COLUMN IF NOT EXISTS express_service BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS wa_blast_tier INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS undangan_fisik BOOLEAN DEFAULT FALSE;

ALTER TABLE wedding_profiles
    DROP CONSTRAINT IF EXISTS fk_wedding_profiles_package_type;

ALTER TABLE wedding_profiles
    ADD CONSTRAINT fk_wedding_profiles_package_type
        FOREIGN KEY (package_type) REFERENCES packages(code);

-- =====================================================
-- 5. Package Matrix (feature comparison data)
-- =====================================================
CREATE TABLE package_matrix_sections (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(200) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO package_matrix_sections (code, label, sort_order) VALUES
    ('core', 'Inti Pengalaman (Included in All)', 1),
    ('exclusive', 'Fitur Eksklusif', 2),
    ('limit', 'Limitasi Produksi', 3)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE package_matrix_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code VARCHAR(50) REFERENCES package_matrix_sections(code) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    essential_value VARCHAR(200) NOT NULL DEFAULT '—',
    essential_emphasis VARCHAR(20) NOT NULL DEFAULT 'default',
    signature_value VARCHAR(200) NOT NULL DEFAULT '—',
    signature_emphasis VARCHAR(20) NOT NULL DEFAULT 'default',
    prestige_value VARCHAR(200) NOT NULL DEFAULT '—',
    prestige_emphasis VARCHAR(20) NOT NULL DEFAULT 'default',
    sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- 6. Indexes for guest queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_guests_wedding_profile_id ON guests(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_guests_dup_check ON guests(wedding_profile_id, phone_number);

-- =====================================================
-- 7. Indexes for slug / registration queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_wedding_profiles_slug ON wedding_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

INSERT INTO package_matrix_rows (section_code, label, essential_value, essential_emphasis, signature_value, signature_emphasis, prestige_value, prestige_emphasis, sort_order) VALUES
    -- Core features
    ('core', 'Countdown & Add to Calendar', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 1),
    ('core', 'Digital RSVP & Wedding Wish', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 2),
    ('core', 'Pilihan Lagu & Autoplay', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 3),
    ('core', '1 PIC', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 4),
    ('core', 'Maps', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 5),
    ('core', 'Smart Dashboard', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 6),
    ('core', 'Subdomain Nama Pasangan', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 7),
    ('core', 'Unlimited Send (Manual)', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 8),
    ('core', 'Amplop Digital (Rekening Based)', '✓', 'primary', '✓', 'secondary', '✓', 'gold', 9),
    -- Exclusive features
    ('exclusive', 'Alamat Pengiriman Kado', '—', 'muted', '✓', 'secondary', '✓', 'gold', 1),
    ('exclusive', 'Fitur Turut Mengundang', '—', 'muted', '✓', 'secondary', '✓', 'gold', 2),
    ('exclusive', 'Love Story & Cinematic Video', '—', 'muted', '—', 'muted', '✓', 'gold', 3),
    ('exclusive', 'Reminder Otomatis ke 100 Tamu VIP', '—', 'muted', '—', 'muted', '✓', 'gold', 4),
    -- Production limits
    ('limit', 'Kuota Foto', '15 Foto', 'default', '20 Foto', 'secondary', 'Unlimited', 'default', 1),
    ('limit', 'Masa Aktif', '2 Bulan', 'default', '6 Bulan', 'secondary', '12 Bulan', 'default', 2),
    ('limit', 'Batas Revisi', '2 Round', 'default', '3 Round', 'secondary', '5 Round', 'default', 3);

-- =====================================================
-- 8. Web Invitation Templates
-- =====================================================
CREATE TABLE IF NOT EXISTS web_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    preview_image_url TEXT,
    demo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO web_templates (code, name, description, preview_image_url, demo_url, sort_order) VALUES
    ('parallax-sinematik', 'Parallax Sinematik', 'Tata letak gulir vertikal kontinu dengan transisi gambar paralaks dramatis dan fade-in teks yang elegan.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZI0UVuf0E3q4oKByJNY9fsVdzmfQhLxE9PMmGhOvu2z0sjo9G7m9nFqz1nBm1lo4UKaC6VMP8CmZZD1P7n_0XZ1yPqO1mE02wzOhhpIg3VA-k_KEzGV9TW5ns9AjreSP0kal7WDLWMz7liPU1HrmNfVgzlmU7hUzRaMjptnN-dCzt5m_oi_DMfBt3JVNqMel8ZWjTNH5Ta15OHWJORPquuMFetQsYkxAKSNZ8hZvalK6ZS7Beh8s8', 'https://ayomarried.com/valdo-debora', 1),
    ('editorial-modern', 'Editorial Modern', 'Desain editorial tipografi high-fashion dengan aksen monokrom bersih, tajuk serif besar, dan whitespace terstruktur.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS4mFpWKZ0Z4PMV0O91judgZpPD_DCyfnmB7UoNBlkwkoY8OkTBIvyx0OonNVhdaGxfiaWxB5EI3zbMQl__ANqhTf_6HBbf2uhou3abYZi0odXyyZsYCzm_4Sn7EcHrmwlycROSPSHucLVopSVU8c8y-oSLhUqr9SAauFSEAzTxV3Q4vzAT4DyFPeju3jXUfAD9vaVyEXTomSs5eeeceqEJapXlAGAy0UWE-0GrZ1l2iO5mnyUGFLt', 'https://ayomarried.com/raja-tya', 2),
    ('animasi-watercolor', 'Animasi Watercolor', 'Desain romantis dengan ilustrasi bunga pastel lembut yang mengapung dan berputar anggun saat pengguna menggulir.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm6a6jW4mlyVUHnAfHdfXfivWDAQ1CQqriIHT_UTmfsT41uM8m9bKaF25WqGjNHGfwBTIy76IGGbWbw0uuW-F68NOWUmtD1qJWgzdOpouYNgWiXZv7HqZhqRC50YzEKEJThw_9VA9wWKTkei9O27xezyEMXpbCQdrWpOM6VQNtNzlIZhp2LhjLPPMoBRFqNaho-PRSYxJpzvXnHGHfnxFZcnK8xCg9i0fW9i5tuP1jTAfaK6Iu_y4p', 'https://ayomarried.com/reinhard-maici', 3),
    ('heritage-dinamis', 'Heritage Dinamis', 'Representasi digital motif budaya, seperti garis Gorga atau Songket hasil render vektor yang mengembang secara interaktif.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZhlkLMb7KgIeX0IJBgXEk9b9Uajk9GlBb3lpaG6Rn3f-zAv09FGBBpnX2iv5uNZHNEeWtOFLEQhUNNy8DhP6q1oauba17E9zmb3lARxWGLhtfhZ7zZI1ZtLtqcR2aT59fD1gebhhUz1EVi2uRCLH2X6etulVRG5RWcvOiFRe2xhWpgBpdEfM1KOtmxRp85jRsgrroVyddyYtGoHsuZ7C-3csGO_h9Qt4AIYWcPZrdAYo2WExYyVgq', 'https://ayomarried.com/james-enna', 4),
    ('heritage-jawa', 'Heritage Jawa', 'Desain pernikahan adat Jawa yang elegan dengan ornamen tradisional, motif Gunungan, dan palet warna emas & krem.', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiB2aWV3Ym94PSIwIDAgNDAwIDYwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmZGY5ZjAiLz48cGF0aCBkPSJNMjAwIDIwQzIwMCAyMCAxNTAgODAgMTAwIDEwMFMyMCAxMzAgMjAgMjAwUzYwIDMyMCAxMDAgMzUwUzE1MCA0MDAgMjAwIDQyMFMyNTAgNDAwIDMwMCAzNTBTMzgwIDI3MCAzODAgMjAwUzMwMCAxMzAgMjUwIDEwMFMyMDAgMjAgMjAwIDIwWiIgZmlsbD0iI2Q0YWYzNyIgb3BhY2l0eT0iMC4xIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTgwIiByPSI2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDRhZjM3IiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMyIvPjx0ZXh0IHg9IjIwMCIgeT0iMjkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM4ZDRkMzkiPkhlcml0YWdlIEphd2E8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIzMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjkiIGZpbGw9IiM5OTkiIGxldHRlci1zcGFjaW5nPSIzIj5UUkFESVRJT05BTCBXRURESU5HPC90ZXh0PjxsaW5lIHgxPSIxNjAiIHkxPSIzNDAiIHgyPSIyNDAiIHkyPSIzNDAiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48dGV4dCB4PSIyMDAiIHk9IjM3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNTU1IiBmb250LXN0eWxlPSJpdGFsaWMiPkFkYXQgSmF3YTwvdGV4dD48cGF0aCBkPSJNMjAwIDQyMEMyMDAgNDIwIDE3MCA0NjAgMTUwIDQ4MFMxMjAgNTIwIDEyMCA1NTBIMjgwQzI4MCA1MjAgMjUwIDQ4MCAyMzAgNDYwUzIwMCA0MjAgMjAwIDQyMFoiIGZpbGw9IiM4ZDRkMzkiIG9wYWNpdHk9IjAuMDgiLz48L3N2Zz4=', '', 5)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 9. Music Tracks
-- =====================================================
CREATE TABLE IF NOT EXISTS web_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200),
    mood_category VARCHAR(50) NOT NULL,
    audio_url TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO web_tracks (title, artist, mood_category, audio_url, sort_order) VALUES
    ('White Moment', 'Instrumental Modern', 'klasik-abad', 'https://drive.usercontent.google.com/download?id=1gyl4IppTKVm7jAldtHwvXWbQ8GO7jY20&export=download', 1),
    ('Perfect', 'Instrumental Acoustic', 'klasik-abad', 'https://drive.usercontent.google.com/download?id=1B0PawYUvYMyRpx-lk9J593hzge5tcxCp&export=download', 2),
    ('Women in White', 'Orchestra Minimalist', 'klasik-abad', 'https://drive.usercontent.google.com/download?id=1aluJd9AVsl7UL55gsXnRJpnZ6L6HEMH8&export=download', 3),
    ('Can''t Help Falling in Love', 'Acoustic Cover', 'modern-romantis', '', 4),
    ('Rewrite the Stars', 'Pop Instrumental', 'modern-romantis', '', 5),
    ('Yang Terdalam', 'Peterpan', 'nusantara-heritage', '', 6),
    ('Hasian', 'Original Song', 'nusantara-heritage', '', 7)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. Wedding Profile — add template & track selection
-- =====================================================
ALTER TABLE wedding_profiles
    ADD COLUMN IF NOT EXISTS selected_template_id UUID REFERENCES web_templates(id),
    ADD COLUMN IF NOT EXISTS selected_track_id UUID REFERENCES web_tracks(id);
