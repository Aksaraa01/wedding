-- WP template management: package eligibility + WP master link + element manifest
ALTER TABLE public.web_templates
  ADD COLUMN IF NOT EXISTS package_eligibility jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS wp_master_slug text,
  ADD COLUMN IF NOT EXISTS wp_manifest jsonb;

-- Each template's demo URL must be unique so the WP master post preview is 1:1.
CREATE UNIQUE INDEX IF NOT EXISTS web_templates_demo_url_key ON public.web_templates (demo_url)
  WHERE demo_url IS NOT NULL AND demo_url <> '';
