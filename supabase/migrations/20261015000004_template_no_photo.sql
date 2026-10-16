-- Tanpa-photo templates: no cover / person / gallery / story images.
-- Dedicated flag (not category/tier) so it never renders as a badge.
-- Editor + ops hide the photo fields and exclude them from completeness;
-- stored photos are kept (hidden, ungated, unsynced) so switching back to a
-- with-photo template restores them.

ALTER TABLE public.web_templates
  ADD COLUMN IF NOT EXISTS no_photo boolean NOT NULL DEFAULT false;
