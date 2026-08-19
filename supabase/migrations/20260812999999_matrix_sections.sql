-- Package matrix sections must exist before any matrix-row INSERT that
-- references section_code (FK). They were only inserted via seed.sql, so a fresh
-- `supabase db reset` (migrations run before seed) failed on the FK when
-- 20260813000000_dedupe_matrix_rows.sql ran. Seed still inserts them idempotently.
INSERT INTO public.package_matrix_sections (code, label, sort_order) VALUES
    ('core', 'Inti Pengalaman (Included in All)', 1),
    ('exclusive', 'Fitur Eksklusif', 2),
    ('limit', 'Limitasi Produksi', 3)
ON CONFLICT (code) DO NOTHING;
