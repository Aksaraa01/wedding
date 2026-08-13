-- Deduplicate the package comparison matrix rows (code IS NULL) to the canonical
-- set. Previous seed runs created duplicate rows because these rows have no unique
-- key, which caused duplicate React keys (and duplicate features) in /customize.
DELETE FROM public.package_matrix_rows WHERE code IS NULL;

INSERT INTO public.package_matrix_rows (code, section_code, label, essential_value, essential_emphasis, signature_value, signature_emphasis, prestige_value, prestige_emphasis, sort_order) VALUES
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
    -- Exclusive features (no gate code)
    (NULL, 'exclusive', 'Reminder Otomatis ke 100 Tamu VIP', '—', 'muted', '—', 'muted', '✓', 'gold', 5),
    -- Production limits
    (NULL, 'limit', 'Kuota Foto', '15 Foto', 'default', '20 Foto', 'secondary', 'Unlimited', 'default', 1),
    (NULL, 'limit', 'Masa Aktif', '2 Bulan', 'default', '6 Bulan', 'secondary', '12 Bulan', 'default', 2),
    (NULL, 'limit', 'Batas Revisi', '2 Round', 'default', '3 Round', 'secondary', '5 Round', 'default', 3);
