#!/usr/bin/env bash
# Guarded production deploy for aksara-wedding.
#
# Why this exists: a deploy from a stale tree silently overwrote a newer bundle
# (the adat-jawa-2 404 incident). This script refuses to ship a stale/wrong build
# and rolls back automatically if the post-deploy smoke test fails.
#
# Usage (from the repo root, prod env already sourced):
#   set -a; source .env.local.prod; set +a; npm run build
#   ./scripts/deploy.sh
#
# Flags:
#   --skip-build-check   bypass the guard (emergency only)
#   --no-rollback        do not restore the snapshot on smoke failure
#
# Notes:
#  - The guard refuses a tree that is behind/ahead of origin/main OR that has
#    uncommitted changes (another agent's WIP would be compiled in and shipped).
#    Build from a clean worktree: git worktree add --detach /tmp/build origin/main
#  - Sync is additive: nothing on the server is deleted during a deploy, so the
#    running process keeps its chunks and the deploy window no longer 500s for
#    users. Old chunk files are pruned after 7 days.
#  - The build output goes over one tar stream (no per-file rsync negotiation —
#    unusable at ~1.2 s RTT) and node_modules is skipped when unchanged.
#    public/ still uses rsync --checksum so only changed media crosses the wire.
#  - origin/main is re-verified after the sync: a push that lands mid-deploy
#    rolls back instead of leaving the server on stale code.
set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/aksaraa_deploy}"
# Keepalive matters: this link drops idle/lossy connections mid-transfer.
SSH_OPTS=(-i "$SSH_KEY" -o ServerAliveInterval=15 -o ServerAliveCountMax=6 -o TCPKeepAlive=yes -o ConnectTimeout=30)
SERVER="${SERVER:-askaraa@103.93.135.176}"

TARGET="prod"
SKIP_GUARD=0; NO_ROLLBACK=0
GUARD_REF=""
GUARD_SITE_URL=""
SMOKE_BASE=""

args=("$@")
i=0
while [ $i -lt ${#args[@]} ]; do
  a="${args[$i]}"
  case "$a" in
    --skip-build-check) SKIP_GUARD=1 ;;
    --no-rollback) NO_ROLLBACK=1 ;;
    --target)
      i=$((i + 1)); TARGET="${args[$i]:-prod}" ;;
    --ref)
      i=$((i + 1)); GUARD_REF="${args[$i]:-}" ;;
    --site-url)
      i=$((i + 1)); GUARD_SITE_URL="${args[$i]:-}" ;;
    --base)
      i=$((i + 1)); SMOKE_BASE="${args[$i]:-}" ;;
  esac
  i=$((i + 1))
done

if [ "$TARGET" = "staging" ]; then
  REMOTE="${REMOTE:-/var/www/aksara-wedding-staging}"
  PM2_APP="aksara-wedding-staging"
  : "${GUARD_REF:=jclolnjkjhyjilvymagr}"
  : "${GUARD_SITE_URL:=https://wedding-stg.aksaraa.com}"
  : "${SMOKE_BASE:=https://wedding-stg.aksaraa.com}"
else
  REMOTE="${REMOTE:-/var/www/aksara-wedding}"
  PM2_APP="aksara-wedding"
  : "${GUARD_REF:=ylmfgorryxzpdckkebnr}"
  : "${SMOKE_BASE:=https://wedding.aksaraa.com}"
fi

SNAP="$REMOTE/.next/.deploy-snapshot"

step() { printf "\n\033[1m▸ %s\033[0m\n" "$1"; }

# Serialize deploys across agents. Stale locks expire after 20 minutes.
LOCK="$REMOTE/.deploy.lock"
step "Acquire deploy lock"
if ! ssh "${SSH_OPTS[@]}" "$SERVER" "mkdir '$LOCK' 2>/dev/null"; then
  if ssh "${SSH_OPTS[@]}" "$SERVER" "find '$LOCK' -maxdepth 0 -mmin +20 2>/dev/null | grep -q ."; then
    ssh "${SSH_OPTS[@]}" "$SERVER" "rmdir '$LOCK' && mkdir '$LOCK'"
  else
    echo "✗ Another deploy is in progress (lock: $LOCK). Wait for it to finish."
    exit 1
  fi
fi
cleanup_lock() { ssh "${SSH_OPTS[@]}" "$SERVER" "rmdir '$LOCK' 2>/dev/null" || true; }
trap cleanup_lock EXIT

if [ "$SKIP_GUARD" = "0" ]; then
  step "Pre-deploy guard"
  guard_args=(--ref "$GUARD_REF")
  [ -n "$GUARD_SITE_URL" ] && guard_args+=(--site-url "$GUARD_SITE_URL")
  node scripts/predeploy-guard.mjs "${guard_args[@]}"
fi

step "Snapshot current server build (for rollback)"
ssh "${SSH_OPTS[@]}" "$SERVER" "
  set -e
  rm -rf '$SNAP'
  mkdir -p '$SNAP'
  if [ -d '$REMOTE/.next/standalone' ]; then cp -a '$REMOTE/.next/standalone' '$SNAP/standalone'; fi
  if [ -d '$REMOTE/.next/static' ]; then cp -a '$REMOTE/.next/static' '$SNAP/static'; fi
  echo \"snapshot: \$(cat '$SNAP/standalone/.next/BUILD_ID' 2>/dev/null || echo none)\"
"

rollback() {
  if [ "$NO_ROLLBACK" != "0" ]; then return 0; fi
  step "Rolling back to previous build"
  ssh "${SSH_OPTS[@]}" "$SERVER" "
    set -e
    cd '$REMOTE'
    if [ ! -d '$SNAP/standalone' ]; then echo 'no snapshot to roll back to'; exit 1; fi
    rm -rf .next/standalone .next/static
    cp -a '$SNAP/standalone' .next/standalone
    if [ -d '$SNAP/static' ]; then
      cp -a '$SNAP/static' .next/static
      rm -rf .next/standalone/.next/static
      cp -a '$SNAP/static' .next/standalone/.next/static
    elif [ -d .next/standalone/.next/static ]; then
      mkdir -p .next
      cp -a .next/standalone/.next/static .next/static
    fi
    pm2 startOrRestart ecosystem.config.js --only '$PM2_APP' --update-env >/dev/null
    echo \"rolled back to \$(cat .next/standalone/.next/BUILD_ID 2>/dev/null || echo unknown)\"
  "
}

# ---------- sync phase ----------
# Two changes here, both aimed at the failure we hit on 2026-10-27:
#
#  1. Additive, never destructive. rsync --delete removed the RUNNING process's
#     chunks before PM2 switched over, so every page load 500'd for the whole
#     transfer (a chunk route matched the old manifest but the file was gone →
#     500 instead of 404). Nothing is deleted now; the old build keeps serving
#     until PM2 restarts, so the deploy window is invisible to users no matter
#     how slow the link is.
#
#  2. One tar stream per tree instead of rsync. rsync negotiates every one of
#     ~3400 files individually, which is unusable at ~1.2 s RTT. tar is a single
#     stream with no round trips. public/ still uses rsync --checksum because
#     only genuinely changed media should cross the wire (145 MB of templates).
stream_to() { # $1=local dir  $2=remote dir  $3=extra tar args (may be empty)
  # COPYFILE_DISABLE stops macOS tar emitting AppleDouble ._ entries (which
  # doubled the file count: 238 entries for 117 files).
  # --no-xattrs stops the per-file LIBARCHIVE.xattr pax headers; without it the
  # GNU tar on the VPS warns on every single file (~2600 log lines per deploy).
  # -z because the link is the wall (~80 KB/s): JS/JSON gzips ~4x.
  # shellcheck disable=SC2086
  COPYFILE_DISABLE=1 tar -C "$1" $3 --no-xattrs -czf - . \
    | ssh "${SSH_OPTS[@]}" "$SERVER" "mkdir -p '$2' && tar -C '$2' -xzf -"
}

# This link drops connections (75% loss observed), so every network step retries.
retry() { # $1=attempts  $2=label  $3..=command
  local n="$1" label="$2"; shift 2
  local i=1
  while true; do
    if "$@"; then return 0; fi
    if [ "$i" -ge "$n" ]; then echo "  ✗ ${label} failed after ${n} attempt(s)"; return 1; fi
    i=$((i + 1))
    echo "  ↻ ${label}: retry ${i}/${n}"
    sleep 5
  done
}

sync_nm() {
  COPYFILE_DISABLE=1 tar -C .next/standalone --no-xattrs -czf - node_modules \
    | ssh "${SSH_OPTS[@]}" "$SERVER" "mkdir -p '$REMOTE/.next/standalone' && tar -C '$REMOTE/.next/standalone' -xzf - && printf '%s' '$NM_STAMP' > '$REMOTE/.next/standalone/node_modules/.deploy-stamp'"
}
sync_standalone() { stream_to .next/standalone "$REMOTE/.next/standalone" "--exclude ./node_modules"; }
sync_static_top() { stream_to .next/static "$REMOTE/.next/static" ""; }
sync_static_sa() { stream_to .next/static "$REMOTE/.next/standalone/.next/static" ""; }
sync_public() {
  rsync -az --checksum --partial --timeout=180 \
    -e "ssh ${SSH_OPTS[*]}" public/ "$SERVER:$REMOTE/.next/standalone/public/"
}

# node_modules is identical between builds. Fingerprint the traced tree (file
# list + sizes) and skip the whole 1100-file / 47 MB transfer when it matches.
nm_stamp() {
  ( cd .next/standalone/node_modules && find . -type f | LC_ALL=C sort | xargs stat -f '%N:%z' 2>/dev/null | shasum | cut -d' ' -f1 )
}
NM_STAMP="$(nm_stamp)"
NM_REMOTE="$(ssh "${SSH_OPTS[@]}" "$SERVER" "cat '$REMOTE/.next/standalone/node_modules/.deploy-stamp' 2>/dev/null" 2>/dev/null || true)"
if [ -n "$NM_STAMP" ] && [ "$NM_STAMP" = "$NM_REMOTE" ]; then
  step "node_modules unchanged — skipped"
else
  step "Sync node_modules (changed)"
  retry 3 "node_modules" sync_nm
fi

step "Sync build output (tar stream, additive)"
retry 3 "build output" sync_standalone

step "Sync static (.next/static)"
retry 3 "static" sync_static_top

step "Sync static (standalone)"
retry 3 "static (standalone)" sync_static_sa

step "Sync public (delta, additive, must be last)"
retry 3 "public" sync_public

# Additive syncs mean old chunk files linger. They are inert (content-hashed
# names, long immutable cache) but they add up at ~16 MB per build.
step "Prune chunk files older than 7 days"
ssh "${SSH_OPTS[@]}" "$SERVER" "
  for d in '$REMOTE/.next/standalone/.next/static' '$REMOTE/.next/static' '$REMOTE/.next/standalone/.next/server'; do
    [ -d \"\$d\" ] && find \"\$d\" -type f -mtime +7 -delete 2>/dev/null || true
  done
  echo \"  .next is now \$(du -sh '$REMOTE/.next' 2>/dev/null | cut -f1)\"
"

# The pre-deploy guard ran before the copy. A push that lands during the sync
# makes this build stale (it would leave the server running older code than
# origin/main). Re-check under the lock before switching the server over.
step "Re-verify origin/main did not move during the sync"
if ! node scripts/predeploy-guard.mjs --sync-only; then
  echo "✗ Another agent pushed to origin/main while this build was syncing."
  echo "  This build is stale — restoring the previous bundle instead of switching to it."
  rollback
  exit 1
fi

# The persistent route cache outlives a deploy: an entry rendered before this
# build keeps serving its old page (this is how a newly registered template
# stayed invisible on /templates long after its row existed). Drop it so the
# first request after the reload re-renders from the deployed build.
step "Invalidate the persistent route cache"
ssh "${SSH_OPTS[@]}" "$SERVER" "rm -rf '$REMOTE/.next/standalone/.next/server/route-cache'" || true

step "Reload PM2 (ecosystem, --update-env)"
ssh "${SSH_OPTS[@]}" "$SERVER" "cd '$REMOTE' && pm2 startOrRestart ecosystem.config.js --only '$PM2_APP' --update-env >/dev/null && sleep 4 && pm2 list | grep '$PM2_APP'"

step "Post-deploy smoke test"
if node scripts/postdeploy-smoke.mjs --base "$SMOKE_BASE"; then
  LOCAL_BUILD="$(cat .next/standalone/.next/BUILD_ID)"
  sleep 2
  REMOTE_BUILD="$(ssh "${SSH_OPTS[@]}" "$SERVER" "cat '$REMOTE/.next/standalone/.next/BUILD_ID' 2>/dev/null || true")"
  if [ "$REMOTE_BUILD" != "$LOCAL_BUILD" ]; then
    echo "✗ Another deploy replaced this build (local=$LOCAL_BUILD remote=$REMOTE_BUILD)."
    exit 1
  fi
  step "Deployed successfully — BUILD_ID $LOCAL_BUILD"
  ssh "${SSH_OPTS[@]}" "$SERVER" "rm -rf '$SNAP'" >/dev/null 2>&1 || true
else
  echo
  echo "✗ Smoke test failed."
  rollback
  exit 1
fi
