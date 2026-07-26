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
