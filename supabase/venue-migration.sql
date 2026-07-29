-- Venue columns for wedding_profiles
ALTER TABLE wedding_profiles
    ADD COLUMN IF NOT EXISTS venue_name TEXT,
    ADD COLUMN IF NOT EXISTS venue_address TEXT,
    ADD COLUMN IF NOT EXISTS event_time TEXT DEFAULT '18.00 WIB - Selesai';

-- Ensure qr_token is unique to prevent duplication
UPDATE guests SET qr_token = NULL WHERE qr_token IN (
    SELECT qr_token FROM guests WHERE qr_token IS NOT NULL GROUP BY qr_token HAVING COUNT(*) > 1
);
ALTER TABLE guests ADD CONSTRAINT uniq_guests_qr_token UNIQUE (qr_token);
CREATE INDEX IF NOT EXISTS idx_guests_qr_token ON guests(qr_token);
