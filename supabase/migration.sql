-- 1. Tabel Master Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(30) DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'WORKER', 'CONSULTANT', 'CLIENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Wedding Profiles
CREATE TABLE IF NOT EXISTS wedding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bride_name VARCHAR(100) NOT NULL,
    groom_name VARCHAR(100) NOT NULL,
    estimated_wedding_date DATE NOT NULL,
    estimated_guest_count INTEGER NOT NULL CHECK (estimated_guest_count > 0),
    slug VARCHAR(100) UNIQUE NOT NULL,
    rekening_bank VARCHAR(100),
    gift_shipping_address TEXT,
    total_project_cost DECIMAL(15, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL_DP', 'FULLY_PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian slug cepat
CREATE INDEX IF NOT EXISTS idx_wedding_profiles_slug ON wedding_profiles(slug);

-- 3. Tabel Product Catalog
CREATE TABLE IF NOT EXISTS product_catalog (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_tiered BOOLEAN DEFAULT FALSE,
    is_sub_product BOOLEAN DEFAULT FALSE,
    parent_code VARCHAR(50) REFERENCES product_catalog(code),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed main products
INSERT INTO product_catalog (code, name, description, base_price, is_tiered) VALUES
    ('premium_web', 'Premium Web Invitation', 'Desain undangan digital sinematik premium.', 1000000, FALSE),
    ('qr_code_book', 'QR Code Book & Real-Time Attendance', 'Sistem check-in tamu otomatis di lokasi.', 500000, FALSE),
    ('undangan_fisik', 'Undangan Fisik', 'Layanan cetak eksklusif dengan bahan premium.', 0, FALSE),
    ('wa_blast', 'WhatsApp Blast Resmi', 'Kirim undangan massal resmi via WhatsApp.', 0, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed sub-products
INSERT INTO product_catalog (code, name, description, base_price, is_sub_product, parent_code) VALUES
    ('wish_wall', 'Virtual Wish Wall', 'Dinding doa digital untuk tamu.', 0, TRUE, 'premium_web'),
    ('reservation_automation', 'Reservation Automation', 'Otomatisasi RSVP tamu.', 0, TRUE, 'premium_web'),
    ('kolom_direct_transfer', 'Kolom Direct Transfer', 'Transfer hadiah langsung.', 0, TRUE, 'premium_web'),
    ('gift_marketplace', 'Aksara Gift Marketplace', 'Marketplace kado pernikahan.', 0, TRUE, 'premium_web'),
    ('unique_link_generator', 'Unique Link Generator', 'Link undangan unik per tamu.', 0, TRUE, 'qr_code_book')
ON CONFLICT (code) DO NOTHING;

-- 4. Tabel Price Tiers (WA Blast)
CREATE TABLE IF NOT EXISTS product_price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) REFERENCES product_catalog(code),
    min_guest INTEGER NOT NULL,
    max_guest INTEGER,
    price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO product_price_tiers (product_code, min_guest, max_guest, price) VALUES
    ('wa_blast', 0, 100, 200000),
    ('wa_blast', 101, 500, 500000),
    ('wa_blast', 501, NULL, 1000000)
ON CONFLICT DO NOTHING;

-- 5. Tabel Product Selections (per wedding)
CREATE TABLE IF NOT EXISTS product_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_profile_id UUID REFERENCES wedding_profiles(id) ON DELETE CASCADE UNIQUE,
    premium_web BOOLEAN DEFAULT TRUE,
    wish_wall BOOLEAN DEFAULT TRUE,
    reservation_automation BOOLEAN DEFAULT TRUE,
    kolom_direct_transfer BOOLEAN DEFAULT TRUE,
    gift_marketplace BOOLEAN DEFAULT TRUE,
    qr_code_book BOOLEAN DEFAULT TRUE,
    unique_link_generator BOOLEAN DEFAULT TRUE,
    undangan_fisik BOOLEAN DEFAULT FALSE,
    wa_blast BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add whatsapp_number to wedding_profiles
ALTER TABLE wedding_profiles ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- 6. Tabel Tamu (Guests)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_profile_id UUID REFERENCES wedding_profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    category VARCHAR(100),
    table_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guests_wedding_profile ON guests(wedding_profile_id);
