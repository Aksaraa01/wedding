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
GUARD_BRANCH="${GUARD_BRANCH:-}"
GUARD_COMMIT=""
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
    --branch)
      i=$((i + 1)); GUARD_BRANCH="${args[$i]:-}" ;;
    --commit)
      i=$((i + 1)); GUARD_COMMIT="${args[$i]:-}" ;;
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
  # Staging normally deploys the main tip; a prod-branch rehearsal passes --branch prod.
  : "${GUARD_BRANCH:=main}"
else
  REMOTE="${REMOTE:-/var/www/aksara-wedding}"
  PM2_APP="aksara-wedding"
  : "${GUARD_REF:=ylmfgorryxzpdckkebnr}"
  : "${SMOKE_BASE:=https://wedding.aksaraa.com}"
  # Prod is the release-train branch, never main.
  : "${GUARD_BRANCH:=prod}"
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
  guard_args=(--target "$TARGET" --branch "$GUARD_BRANCH" --ref "$GUARD_REF")
  [ -n "$GUARD_COMMIT" ] && guard_args+=(--commit "$GUARD_COMMIT")
  [ -n "$GUARD_SITE_URL" ] && guard_args+=(--site-url "$GUARD_SITE_URL")
  node scripts/predeploy-guard.mjs "${guard_args[@]}"
fi

step "Snapshot current server build (for rollback)"
# Keep three generations: an incident is often noticed only after the next deploy
# has already replaced the single snapshot the old script kept.
ssh "${SSH_OPTS[@]}" "$SERVER" "
  set -e
  cd '$REMOTE/.next'
  rm -rf .deploy-snapshot.3
  [ -d .deploy-snapshot.2 ] && mv .deploy-snapshot.2 .deploy-snapshot.3 || true
  [ -d .deploy-snapshot.1 ] && mv .deploy-snapshot.1 .deploy-snapshot.2 || true
  [ -d .deploy-snapshot ] && mv .deploy-snapshot .deploy-snapshot.1 || true
  mkdir -p .deploy-snapshot
  if [ -d '$REMOTE/.next/standalone' ]; then cp -a '$REMOTE/.next/standalone' .deploy-snapshot/standalone; fi
  if [ -d '$REMOTE/.next/static' ]; then cp -a '$REMOTE/.next/static' .deploy-snapshot/static; fi
  echo \"snapshot: \$(cat .deploy-snapshot/standalone/.next/BUILD_ID 2>/dev/null || echo none)\"
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
  record_deploy rollback || true
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

# Deploy history lives next to the app and is append-only. It is the only record
# of *who* deployed *what* and of rollbacks; RELEASE.json only describes the
# bundle that happens to be on disk now.
HIST="$REMOTE/.deploy-history.jsonl"
record_deploy() { # $1=result
  local tmp; tmp="$(mktemp)"
  node -e '
    const m = require("./.next/build-env.json")
    console.log(JSON.stringify({
      at: new Date().toISOString(),
      env: process.argv[1],
      result: process.argv[2],
      commit: m.commit,
      short: m.short,
      branch: m.branch,
      buildId: m.buildId,
      anonKey: (m.anonKeySha256 || "").slice(0, 12),
      operator: process.env.USER || process.env.LOGNAME || "unknown",
    }))
  ' "$TARGET" "$1" > "$tmp"
  ssh "${SSH_OPTS[@]}" "$SERVER" "cat >> '$HIST'" < "$tmp" || echo "  ! could not append deploy history"
  rm -f "$tmp"
}

LOCAL_COMMIT="$(node -e 'console.log(require("./.next/build-env.json").commit)')"
LOCAL_BUILD_ENV="$(node -e 'console.log(require("./.next/build-env.json").env)')"

step "Verify the synced bundle carries this commit"
REMOTE_COMMIT="$(ssh "${SSH_OPTS[@]}" "$SERVER" "cat '$REMOTE/.next/standalone/RELEASE.json' 2>/dev/null" \
  | tr -d ' \n' | sed -n 's/.*"commit":"\([0-9a-f]\{7,\}\)".*/\1/p')"
if [ -z "$REMOTE_COMMIT" ]; then
  echo "✗ $REMOTE/.next/standalone/RELEASE.json is missing or has no commit."
  echo "  The sync did not land the bundle identity — refusing to reload."
  rollback
  exit 1
fi
if [ "$REMOTE_COMMIT" != "$LOCAL_COMMIT" ]; then
  echo "✗ Server bundle is commit ${REMOTE_COMMIT:0:7}, local build is ${LOCAL_COMMIT:0:7}."
  rollback
  exit 1
fi
echo "  server bundle = ${LOCAL_COMMIT:0:7} (${LOCAL_BUILD_ENV})"

step "Verify release migrations are applied"
MIG_CHECK="$(ssh "${SSH_OPTS[@]}" "$SERVER" "bash -s -- '$REMOTE'" <<'EOS'
set -u
REMOTE_APP="$1"
REL="$REMOTE_APP/.next/standalone/RELEASE.json"
[ -f "$REL" ] || { echo "WARN no RELEASE.json"; exit 0; }
node --input-type=commonjs - "$REL" "$REMOTE_APP" <<'NODE'
const fs = require('fs');
const rel = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const migrations = Array.isArray(rel.migrations) ? rel.migrations : [];
if (!migrations.length) { console.log('WARN no migrations in RELEASE.json'); process.exit(0); }
const app = process.argv[3];
function envFile(p){ try{ return fs.readFileSync(p,'utf8'); }catch{ return ''; } }
const text = envFile(app + '/.env.production') + '\n' + envFile(app + '/.env.runtime.' + (rel.env||'prod'));
function get(k){ const m = text.match(new RegExp('^'+k+'=(.*)$','m')); return m ? m[1].trim().replace(/^"|"$/g,'') : (process.env[k]||''); }
const dbUrl = get('SUPABASE_DB_URL') || get('DATABASE_URL');
const host = get('SUPABASE_DB_HOST') || ('aws-0-ap-northeast-1.pooler.supabase.com');
const pass = get('SUPABASE_DB_PASSWORD');
const ref = rel.supabaseRef || (rel.env === 'staging' ? 'jclolnjkjhyjilvymagr' : 'ylmfgorryxzpdckkebnr');
const user = get('SUPABASE_DB_USER') || ('postgres.' + ref);
const db = get('SUPABASE_DB_NAME') || 'postgres';
const port = Number(get('SUPABASE_DB_PORT') || 6543);
if (!dbUrl && !pass) { console.log('WARN cannot check migrations (no DB credentials on host)'); process.exit(0); }
(async () => {
  let Client;
  try { Client = require(app + '/.next/standalone/node_modules/pg').Client; }
  catch { try { Client = require('pg').Client; } catch { console.log('WARN pg not available on host'); process.exit(0); } }
  const client = dbUrl ? new Client({ connectionString: dbUrl }) : new Client({ host, port, user, password: pass, database: db, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query('select version from supabase_migrations.schema_migrations');
  const applied = new Set(res.rows.map(r => String(r.version)));
  const missing = migrations.filter(v => !applied.has(String(v)));
  await client.end();
  if (missing.length) { console.error('FAIL missing migrations in DB: ' + missing.join(', ')); process.exit(2); }
  console.log('OK ' + migrations.length + ' migrations present');
})().catch(e => { console.log('WARN migration check failed: ' + (e.message||e)); process.exit(0); });
NODE
EOS
)" || true
echo "$MIG_CHECK" | tail -5
if echo "$MIG_CHECK" | grep -q '^FAIL'; then
  echo "✗ release migrations are not applied on target DB"
  rollback
  exit 1
fi
if echo "$MIG_CHECK" | grep -q '^WARN'; then
  echo "  ! migration assertion could not be fully verified (see warning)"
fi

# The pre-deploy guard ran before the copy. A push that lands during the sync
# makes this build stale. Re-check under the lock before switching the server over.
step "Re-verify origin/${GUARD_BRANCH} did not move during the sync"
if ! node scripts/predeploy-guard.mjs --sync-only --branch "$GUARD_BRANCH" ${GUARD_COMMIT:+--commit "$GUARD_COMMIT"}; then
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

# A reload kills the process mid-job. Any wp_sync_jobs row left in `processing`
# then belongs to a process that no longer exists, and claimNext() only reclaims
# it after 5 minutes — during which that couple's template change is refused with
# a 409. Pause the worker and let in-flight jobs finish first; the new process
# also reclaims stragglers on boot (WP_RECLAIM_ON_BOOT).
step "Drain WP sync worker (pause, wait for in-flight jobs)"
# Runs on the host: the secret is resolved there (env file, else PM2's process
# env) and never crosses to this machine or into the log.
LOCAL_PORT="$([ "$TARGET" = "staging" ] && echo 3003 || echo 3002)"
drain_wp_worker() {
  ssh "${SSH_OPTS[@]}" "$SERVER" "bash -s -- '$REMOTE' '$LOCAL_PORT' '$PM2_APP'" <<'EOS' || true
set -u
REMOTE_APP="$1"; PORT="$2"; APP="$3"
BASE="http://127.0.0.1:${PORT}"
secret="${WP_INTERNAL_SECRET:-}"
if [ -z "$secret" ] && [ -f "$REMOTE_APP/.env.production" ]; then
  secret="$(grep -m1 '^WP_INTERNAL_SECRET=' "$REMOTE_APP/.env.production" 2>/dev/null | cut -d= -f2- || true)"
fi
if [ -z "$secret" ]; then
  id="$(pm2 id "$APP" 2>/dev/null | grep -o '[0-9]\+' | head -1 || true)"
  if [ -n "$id" ]; then
    secret="$(pm2 env "$id" 2>/dev/null | grep -m1 '^WP_INTERNAL_SECRET' \
      | sed -E 's/^WP_INTERNAL_SECRET[[:space:]]*[:=][[:space:]]*//; s/^"//; s/",?[[:space:]]*$//; s/[[:space:]]*$//' || true)"
  fi
fi
if [ -z "$secret" ]; then
  echo "  ! no WP_INTERNAL_SECRET on the host — skipping pause (boot reclaim still applies)"
  exit 0
fi
if ! curl -fsS --max-time 15 -X POST "$BASE/api/wp/worker" \
    -H "X-Aksaraa-Secret: $secret" -H "Content-Type: application/json" \
    -d '{"action":"pause"}' >/dev/null 2>&1; then
  echo "  ! pause endpoint unavailable (running build predates it) — boot reclaim will handle stragglers"
  exit 0
fi
n=0
while [ "$n" -lt 30 ]; do
  proc="$(curl -fsS --max-time 10 "$BASE/api/wp/worker" -H "X-Aksaraa-Secret: $secret" 2>/dev/null \
    | sed -n 's/.*"processing":\([0-9][0-9]*\).*/\1/p' || true)"
  if [ -z "$proc" ]; then echo "  ! could not read worker state — continuing"; exit 0; fi
  if [ "$proc" -eq 0 ]; then echo "  worker idle — safe to reload"; exit 0; fi
  echo "  waiting: ${proc} job(s) still processing"
  n=$((n + 1)); sleep 2
done
echo "  ! worker still busy after 60s — reloading anyway; boot reclaim will requeue"
EOS
}
drain_wp_worker

# delete + start, not startOrRestart: PM2 keeps the env snapshot from the first
# start, and Node's --env-file never overrides an existing variable. A stale
# snapshot (the old ecosystem injected secrets inline) makes the process run
# values that differ from .env.production — the 2026-11-23 WP 401 incident.
step "Reload PM2 (delete + start so .env.production is authoritative)"
ssh "${SSH_OPTS[@]}" "$SERVER" "cd '$REMOTE' && pm2 delete '$PM2_APP' >/dev/null 2>&1 || true; pm2 start ecosystem.config.js --only '$PM2_APP' --update-env >/dev/null && sleep 4 && pm2 list | grep '$PM2_APP'"

step "Assert PM2 stores no secret env (would shadow .env.production)"
PM2_SECRET_COUNT="$(ssh "${SSH_OPTS[@]}" "$SERVER" "id=\$(pm2 id '$PM2_APP' 2>/dev/null | grep -o '[0-9]\+' | head -1); pm2 env \$id 2>/dev/null | grep -cE '^(SUPABASE_SERVICE_ROLE_KEY|WP_INTERNAL_SECRET|SCANNER_JWT_SECRET|AUTH_SESSION_SECRET|CRON_SECRET|HEALTH_TOKEN|WA_TARGET_GROUP_JID|OPENROUTER_API_KEY)[[:space:]]*[:=]' || true")"
if [ "${PM2_SECRET_COUNT:-0}" != "0" ]; then
  echo "✗ PM2 stores ${PM2_SECRET_COUNT} secret variable(s) for ${PM2_APP}; they shadow .env.production."
  echo "  Run once: pm2 delete ${PM2_APP} && pm2 start ecosystem.config.js --only ${PM2_APP} --update-env"
  rollback
  exit 1
fi
echo "  PM2 env is clean (0 stored secrets)"

# Prove the running process is the bundle we just reloaded. The bundle can be on
# disk while the process is still on the old env/commit (bad reload, wrong env
# file, missing runtime secret). /api/health/env is token-gated and returns no
# secrets; if the running build predates it, warn but don't block this rollout.
step "Assert running process matches RELEASE.json"
assert_health_env() {
  ssh "${SSH_OPTS[@]}" "$SERVER" "bash -s -- '$REMOTE' '$LOCAL_PORT' '$PM2_APP'" <<'EOS'
set -u
REMOTE_APP="$1"; PORT="$2"; APP="$3"
BASE="http://127.0.0.1:${PORT}"
token="${HEALTH_TOKEN:-${CRON_SECRET:-${WP_INTERNAL_SECRET:-}}}"
if [ -z "$token" ] && [ -f "$REMOTE_APP/.env.production" ]; then
  for k in HEALTH_TOKEN CRON_SECRET WP_INTERNAL_SECRET; do
    v="$(grep -m1 "^${k}=" "$REMOTE_APP/.env.production" 2>/dev/null | cut -d= -f2- || true)"
    [ -n "$v" ] && token="$v" && break
  done
fi
if [ -z "$token" ]; then
  id="$(pm2 id "$APP" 2>/dev/null | grep -o '[0-9]\+' | head -1 || true)"
  if [ -n "$id" ]; then
    for k in HEALTH_TOKEN CRON_SECRET WP_INTERNAL_SECRET; do
      v="$(pm2 env "$id" 2>/dev/null | grep -m1 "^${k}" \
        | sed -E "s/^${k}[[:space:]]*[:=][[:space:]]*//; s/^\"//; s/\",?[[:space:]]*$//; s/[[:space:]]*$//" || true)"
      [ -n "$v" ] && token="$v" && break
    done
  fi
fi
if [ -z "$token" ]; then echo "WARN no health token on host"; exit 0; fi
code="$(curl -sS -o /tmp/health-env.json -w '%{http_code}' --max-time 15 "$BASE/api/health/env" -H "X-Health-Token: $token" || true)"
if [ "$code" = "404" ]; then echo "WARN /api/health/env not present in running build (pre-phase3)"; exit 0; fi
if [ "$code" != "200" ]; then echo "FAIL health env HTTP $code"; cat /tmp/health-env.json; exit 1; fi
cat /tmp/health-env.json
EOS
}
HEALTH_OUT="$(assert_health_env)" || { echo "$HEALTH_OUT"; echo "✗ running process failed env/commit assertion"; rollback; exit 1; }
echo "$HEALTH_OUT" | sed -n '1,6p'
if echo "$HEALTH_OUT" | grep -q '^WARN'; then
  echo "  ! health/env assertion skipped (see warning above)"
else
  REMOTE_ENV_COMMIT="$(echo "$HEALTH_OUT" | tr -d '\n ' | sed -n 's/.*"commit":"\([0-9a-f]\{7,\}\)".*/\1/p')"
  REMOTE_ENV_NAME="$(echo "$HEALTH_OUT" | tr -d '\n ' | sed -n 's/.*"env":"\([^"]*\)".*/\1/p')"
  REMOTE_ENV_ANON="$(echo "$HEALTH_OUT" | tr -d '\n ' | sed -n 's/.*"anonKeySha256":"\([0-9a-f]\{12\}\)".*/\1/p')"
  LOCAL_ANON="$(node -e 'console.log((require("./.next/build-env.json").anonKeySha256||"").slice(0,12))')"
  if [ -n "$REMOTE_ENV_COMMIT" ] && [ "$REMOTE_ENV_COMMIT" != "$LOCAL_COMMIT" ]; then
    echo "✗ running process reports commit ${REMOTE_ENV_COMMIT:0:7}, expected ${LOCAL_COMMIT:0:7}"
    rollback; exit 1
  fi
  if [ -n "$REMOTE_ENV_NAME" ] && [ "$REMOTE_ENV_NAME" != "$TARGET" ]; then
    echo "✗ running process reports env $REMOTE_ENV_NAME, expected $TARGET"
    rollback; exit 1
  fi
  if [ -n "$REMOTE_ENV_ANON" ] && [ "$REMOTE_ENV_ANON" != "$LOCAL_ANON" ]; then
    echo "✗ running process anon fingerprint $REMOTE_ENV_ANON != expected $LOCAL_ANON"
    rollback; exit 1
  fi
  ok_line="  health/env ok: ${REMOTE_ENV_NAME:-?} @ ${REMOTE_ENV_COMMIT:0:7}"
  echo "$ok_line"
fi

step "Post-deploy smoke test"
if node scripts/postdeploy-smoke.mjs --base "$SMOKE_BASE"; then
  LOCAL_BUILD="$(cat .next/standalone/.next/BUILD_ID)"
  sleep 2
  REMOTE_BUILD="$(ssh "${SSH_OPTS[@]}" "$SERVER" "cat '$REMOTE/.next/standalone/.next/BUILD_ID' 2>/dev/null || true")"
  if [ "$REMOTE_BUILD" != "$LOCAL_BUILD" ]; then
    echo "✗ Another deploy replaced this build (local=$LOCAL_BUILD remote=$REMOTE_BUILD)."
    exit 1
  fi
  step "Deployed successfully — ${LOCAL_COMMIT:0:7} (BUILD_ID $LOCAL_BUILD)"
  record_deploy success || true
  # Append to the local release ledger (best effort; never fail a good deploy).
  node -e '
    const fs=require("fs"); const p="releases/ledger.jsonl";
    const m=require("./.next/build-env.json");
    const env=process.argv[1];
    const state = env === "staging" ? "staged" : "deployed";
    const purpose = (env === "staging" && m.branch && m.branch !== "main") ? "rehearsal" : "deploy";
    const e={at:new Date().toISOString(),sha:m.commit,short:(m.commit||"").slice(0,7),env,state,purpose,by:process.env.USER||process.env.LOGNAME||"unknown",buildId:m.buildId,branch:m.branch};
    fs.mkdirSync("releases",{recursive:true}); fs.appendFileSync(p,JSON.stringify(e)+"\n");
  ' "$TARGET" >/dev/null 2>&1 || echo "  ! could not append releases/ledger.jsonl"
  # The snapshot is kept: it becomes .deploy-snapshot.1 on the next deploy, so a
  # rollback target survives more than one release.
else
  echo
  echo "✗ Smoke test failed."
  rollback
  exit 1
fi
