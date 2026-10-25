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

step "Rsync standalone"
rsync -az -e "ssh -i $SSH_KEY" --delete .next/standalone/ "$SERVER:$REMOTE/.next/standalone/"
step "Rsync static (.next/static)"
rsync -az -e "ssh -i $SSH_KEY" --delete .next/static/ "$SERVER:$REMOTE/.next/static/"
step "Rsync static (standalone)"
rsync -az -e "ssh -i $SSH_KEY" --delete .next/static/ "$SERVER:$REMOTE/.next/standalone/.next/static/"
step "Rsync public (must be last)"
rsync -az -e "ssh -i $SSH_KEY" --delete public/ "$SERVER:$REMOTE/.next/standalone/public/"

step "Reload PM2 (ecosystem, --update-env)"
ssh -i "$SSH_KEY" "$SERVER" "cd '$REMOTE' && pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env >/dev/null && sleep 4 && pm2 list | grep aksara-wedding"

step "Post-deploy smoke test"
if node scripts/postdeploy-smoke.mjs; then
  step "Deployed successfully — BUILD_ID $(cat .next/standalone/.next/BUILD_ID)"
  ssh -i "$SSH_KEY" "$SERVER" "rm -rf '$SNAP'" >/dev/null 2>&1 || true
else
  echo
  echo "✗ Smoke test failed."
  if [ "$NO_ROLLBACK" = "0" ]; then
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
  fi
  exit 1
fi
