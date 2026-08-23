-- Index for WP sideload cache lookup (postmeta _aksaraa_source_url)
-- This index lives on WordPress DB, not Supabase. Supabase has no wp_postmeta.
-- Kept as no-op migration to document the required WP index:
-- Run on WP VPS: wp db query "CREATE INDEX IF NOT EXISTS idx_aksaraa_source_url ON wp_postmeta (meta_key, meta_value(191)) WHERE meta_key = '_aksaraa_source_url'"
select 1;
