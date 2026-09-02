-- Re-add category filter for the customer template picker (Nasional/Budaya).
-- A `category` column previously existed and was dropped as unused; the /ops
-- mapping + wtStyles now use it to group templates in the customer-facing list.
ALTER TABLE public.web_templates ADD COLUMN IF NOT EXISTS category text;

UPDATE public.web_templates SET category = 'Nasional'
  WHERE code IN ('template-1', 'template-3', 'template-5');

UPDATE public.web_templates SET category = 'Budaya'
  WHERE code NOT IN ('template-1', 'template-3', 'template-5')
    AND code LIKE 'template-%';