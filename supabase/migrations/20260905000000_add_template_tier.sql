ALTER TABLE public.web_templates ADD COLUMN IF NOT EXISTS tier text DEFAULT 'Baru';
UPDATE public.web_templates SET tier = 'Baru' WHERE tier IS NULL;
