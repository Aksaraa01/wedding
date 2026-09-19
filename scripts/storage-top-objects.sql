-- Phase 2 observability: top Storage objects by bytes stored.
-- Run monthly in Supabase SQL editor (prod). Join with request logs on the
-- dashboard (Storage > Bandwidth) to rank by actual egress, not just size.
-- Heaviest hitters should all be served via /render/image/ transforms or
-- moved to VPS public/ — never raw /object/public/ at full size.
SELECT
  name AS path,
  bucket_id,
  (metadata ->> 'size')::bigint AS bytes,
  (metadata ->> 'mimetype') AS mimetype,
  created_at
FROM storage.objects
WHERE bucket_id = 'media'
ORDER BY (metadata ->> 'size')::bigint DESC NULLS LAST
LIMIT 30;
