-- Portfolio consent + curation flags on wedding_profiles.
-- portfolio_visible: ops-confirmed consent to feature this couple publicly.
-- portfolio_featured: curated picks shown on the /portofolio index (max 5).
ALTER TABLE wedding_profiles
  ADD COLUMN IF NOT EXISTS portfolio_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_featured boolean NOT NULL DEFAULT false;
