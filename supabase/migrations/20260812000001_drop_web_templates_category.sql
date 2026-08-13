-- category column is unused (no data, no feature depends on it) — remove it.
ALTER TABLE public.web_templates DROP COLUMN IF EXISTS category;
