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
#  - rsync runs with --checksum so only real content deltas cross the wire; a
#    fresh worktree's checkout timestamps no longer re-push the ~160 MB of
#    template media (that took ~13 min and kept the site serving a stale build).
#  - origin/main is re-verified after the sync so a push that lands mid-deploy
#    rolls back instead of stripping the newer work.
set -euo pipefail

SSH_KEY="${SSH_KEY:-$HOME/.ssh/aksaraa_deploy}"
SERVER="${SERVER:-askaraa@103.93.135.176}"
REMOTE="/var/www/aksara-wedding"
SNAP="$REMOTE/.next/.deploy-snapshot"
SKIP_GUARD=0; NO_ROLLBACK=0
for a in "$@"; do
  [ "$a" = "--skip-build-check" ] && SKIP_GUARD=1
  [ "$a" = "--no-rollback" ] && NO_ROLLBACK=1
done

step() { printf "\n\033[1m▸ %s\033[0m\n" "$1"; }

# Serialize deploys across agents. Stale locks expire after 20 minutes.
LOCK="$REMOTE/.deploy.lock"
step "Acquire deploy lock"
if ! ssh -i "$SSH_KEY" "$SERVER" "mkdir '$LOCK' 2>/dev/null"; then
  if ssh -i "$SSH_KEY" "$SERVER" "find '$LOCK' -maxdepth 0 -mmin +20 2>/dev/null | grep -q ."; then
    ssh -i "$SSH_KEY" "$SERVER" "rmdir '$LOCK' && mkdir '$LOCK'"
  else
    echo "✗ Another deploy is in progress (lock: $LOCK). Wait for it to finish."
    exit 1
  fi
fi
cleanup_lock() { ssh -i "$SSH_KEY" "$SERVER" "rmdir '$LOCK' 2>/dev/null" || true; }
trap cleanup_lock EXIT

if [ "$SKIP_GUARD" = "0" ]; then
  step "Pre-deploy guard"
  node scripts/predeploy-guard.mjs
fi

step "Snapshot current server build (for rollback)"
ssh -i "$SSH_KEY" "$SERVER" "
  set -e
  rm -rf '$SNAP'
  mkdir -p '$SNAP'
  cp -a '$REMOTE/.next/standalone' '$SNAP/standalone'
  cp -a '$REMOTE/.next/static' '$SNAP/static'
  echo \"snapshot: \$(cat '$SNAP/standalone/.next/BUILD_ID' 2>/dev/null || echo unknown)\"
"

rollback() {
  if [ "$NO_ROLLBACK" != "0" ]; then return 0; fi
  step "Rolling back to previous build"
  ssh -i "$SSH_KEY" "$SERVER" "
    set -e
    cd '$REMOTE'
    rm -rf .next/standalone .next/static
    cp -a '$SNAP/standalone' .next/standalone
    cp -a '$SNAP/static' .next/static
    cp -a '$SNAP/static' .next/standalone/.next/static
    pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env >/dev/null
    echo \"rolled back to \$(cat .next/standalone/.next/BUILD_ID)\"
  "
}

# --checksum: hash both ends and ship only real content deltas. A fresh git
# worktree stamps every file with the checkout time, which defeats rsync's
# default size+mtime check and re-pushes the full ~160 MB of template media
# (~13 min). Hashing is cheap; the transfer is not.
RSYNC_OPTS="-az --checksum -e \"ssh -i $SSH_KEY\""

step "Rsync standalone"
eval rsync $RSYNC_OPTS --delete .next/standalone/ "\"$SERVER:$REMOTE/.next/standalone/\""
step "Rsync static (.next/static)"
eval rsync $RSYNC_OPTS --delete .next/static/ "\"$SERVER:$REMOTE/.next/static/\""
step "Rsync static (standalone)"
eval rsync $RSYNC_OPTS --delete .next/static/ "\"$SERVER:$REMOTE/.next/standalone/.next/static/\""
step "Rsync public (must be last)"
eval rsync $RSYNC_OPTS --delete public/ "\"$SERVER:$REMOTE/.next/standalone/public/\""

# The pre-deploy guard ran before the copy; a push that landed during it would
# make this build stale (its --delete would then strip the newer work). Re-check
# under the lock before switching the server over.
step "Re-verify origin/main did not move during the sync"
if ! node scripts/predeploy-guard.mjs --sync-only; then
  echo "✗ Another agent pushed to origin/main while this build was syncing."
  echo "  This build is stale — restoring the previous bundle instead of switching to it."
  rollback
  exit 1
fi

step "Reload PM2 (ecosystem, --update-env)"
ssh -i "$SSH_KEY" "$SERVER" "cd '$REMOTE' && pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env >/dev/null && sleep 4 && pm2 list | grep aksara-wedding"

step "Post-deploy smoke test"
if node scripts/postdeploy-smoke.mjs; then
  LOCAL_BUILD="$(cat .next/standalone/.next/BUILD_ID)"
  sleep 2
  REMOTE_BUILD="$(ssh -i "$SSH_KEY" "$SERVER" "cat '$REMOTE/.next/standalone/.next/BUILD_ID' 2>/dev/null || true")"
  if [ "$REMOTE_BUILD" != "$LOCAL_BUILD" ]; then
    echo "✗ Another deploy replaced this build (local=$LOCAL_BUILD remote=$REMOTE_BUILD)."
    exit 1
  fi
  step "Deployed successfully — BUILD_ID $LOCAL_BUILD"
  ssh -i "$SSH_KEY" "$SERVER" "rm -rf '$SNAP'" >/dev/null 2>&1 || true
else
  echo
  echo "✗ Smoke test failed."
  rollback
  exit 1
fi
