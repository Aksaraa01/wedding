#!/bin/bash
# Phase 2 guardrail: fail PRs that reintroduce raw full-byte Storage serving.
# - Raw /object/public/ URLs serve full originals (no resize) -> cached egress.
#   Use toTransformedUrl() / <StorageImage> instead (see src/lib/storageUrl.ts).
# - preload="auto" on audio fetches full MP3s on page load, including bounces.
#   Use <StorageAudio> (preload="none") instead.
# - Hardcoded <project-ref>.supabase.co URLs bill the wrong project when
#   staging/dev traffic hits them. Use NEXT_PUBLIC_SUPABASE_URL instead.
# Allowlist: infra files that must construct raw URLs are exempt.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

echo "--- check: no /render/image/ transformations (billed per origin) ---"
RENDER_HITS=$(grep -rn "render/image" "$ROOT/src" --include='*.ts' --include='*.tsx' \
  | grep -v "src/app/api/ops/usage/route.ts" \
  || true)
if [ -n "$RENDER_HITS" ]; then
  echo "$RENDER_HITS"
  echo "FAIL: image transformations are billed per distinct origin. Use a pre-generated thumb via toTransformedUrl()."
  FAIL=1
else
  echo "OK"
fi

echo "--- check: no new raw /object/public/ usages ---"
RAW_HITS=$(grep -rn "object/public" "$ROOT/src" --include='*.ts' --include='*.tsx' \
  | grep -v "src/lib/storageUrl.ts" \
  | grep -v "src/lib/storage.ts" \
  | grep -v "src/lib/assets.ts" \
  | grep -v "src/lib/bankList.ts" \
  | grep -v "render/image" \
  | grep -v "marker\|MARKER\|extractStoragePath\|storagePathFromUrl" \
  || true)
# NOTE: bankList.ts builds env-relative logo URLs (tiny KB files, exempt).
# API routes that only PARSE stored URLs (marker = ...) are exempt above.
if [ -n "$RAW_HITS" ]; then
  echo "$RAW_HITS"
  echo "FAIL: raw Supabase object URLs serve full originals. Use toTransformedUrl() / <StorageImage>."
  FAIL=1
else
  echo "OK"
fi

echo "--- check: no preload=auto audio ---"
AUDIO_HITS=$(grep -rn 'preload="auto"\|preload={.auto.}' "$ROOT/src" --include='*.tsx' || true)
if [ -n "$AUDIO_HITS" ]; then
  echo "$AUDIO_HITS"
  echo "FAIL: preload=auto downloads full MP3s on page load. Use <StorageAudio> (preload=none)."
  FAIL=1
else
  echo "OK"
fi

echo "--- check: no hardcoded prod supabase URL ---"
HARDCODED_HITS=$(grep -rn "ylmfgorryxzpdckkebnr\.supabase\.co" "$ROOT/src" --include='*.ts' --include='*.tsx' \
  | grep -v "src/lib/assets.ts" \
  || true)
if [ -n "$HARDCODED_HITS" ]; then
  echo "$HARDCODED_HITS"
  echo "FAIL: hardcoded prod URL bills prod from every env. Use NEXT_PUBLIC_SUPABASE_URL."
  FAIL=1
else
  echo "OK (assets.ts fallback literal exempt)"
fi

exit $FAIL
