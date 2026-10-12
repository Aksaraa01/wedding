-- Galeri Tamu copywriting (Opsi A): emotional package names.
UPDATE public.packages
SET name = 'Intimate Memories',
    description = 'Galeri Kenangan Tamu - 4 jepretan per tamu (kapasitas hingga 400 foto per acara)'
WHERE code = 'gt_4';

UPDATE public.packages
SET name = 'Grand Celebration',
    description = 'Galeri Kenangan Tamu - 6 jepretan per tamu (kapasitas hingga 600 foto per acara)'
WHERE code = 'gt_6';
