#!/usr/bin/env bash
# Guest asset host health check (cdn.aksaraa.com + the Atlas/Academy art host).
#
# Runs every 15 minutes from the cdn-health-check.timer systemd unit on the VPS.
# It exists because of 2026-11-03→11-06: `cdn.aksaraa.com` was attached as an R2
# custom domain (bucket `aksaraa-art`), which silently took the hostname away
# from Caddy. Every in-house template lost its fonts, but it looked fine for
# three days — browsers keep woff2 for 7 days and Cloudflare for 1 year — so the
# breakage only surfaced when those copies expired, and by then the R2 404s had
# been cached with the same 1-year edge TTL.
#
# The probe always uses a unique query string: the cache rules match on the path
# only, so a warm edge copy would otherwise hide a broken origin for a year.
#
# Exit 0 = healthy; exit 1 = a probe failed, and a WhatsApp message goes to the
# ops group (same gateway the app uses: 127.0.0.1:3001/send).
#
#   cdn-health-check.sh            # normal run
#   cdn-health-check.sh --dry-run  # print what it would send, send nothing
#
set -uo pipefail

WA_SEND_URL="${WA_SEND_URL:-http://127.0.0.1:3001/send}"
ECOSYSTEM="${ECOSYSTEM:-/var/www/aksara-wedding/ecosystem.config.js}"
CDN="${CDN:-https://cdn.aksaraa.com}"
ART="${ART:-https://art.aksaraa.com}"
COUPLE_HOST="${COUPLE_HOST:-rafi-novi.wedding.aksaraa.com}"
# Caddy serves these from .next/standalone/public. A woff2 is the most demanding
# probe: it needs 200, the font content type AND Access-Control-Allow-Origin, or
# the browser refuses it.
FONT_PATH="${FONT_PATH:-/fonts/poppins-400.woff2}"

DRY_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

probe="$(date +%s)-$$"
problems=()
summary=()

# header_probe <url> -> prints "<status> <content-type> <acao> <location>"
header_probe() {
  local url="$1" hdrs
  hdrs="$(curl -sS -o /dev/null -D - --max-time 25 -H 'Origin: https://wedding.aksaraa.com' "$url" 2>/dev/null)" || {
    echo "ERR - - -"
    return
  }
  local status type acao loc
  status="$(printf '%s\n' "$hdrs" | awk '/^HTTP\//{s=$2} END{print s}')"
  type="$(printf '%s\n' "${hdrs}" | grep -i '^content-type:' | tail -1 | cut -d' ' -f2- | tr -d '\r')"
  acao="$(printf '%s\n' "${hdrs}" | grep -i '^access-control-allow-origin:' | tail -1 | sed -E 's/^[^:]+:[[:space:]]*//' | tr -d '\r')"
  loc="$(printf '%s\n' "${hdrs}" | grep -i '^location:' | tail -1 | sed -E 's/^[^:]+:[[:space:]]*//' | tr -d '\r')"
  echo "${status:-ERR} ${type:- -} ${acao:- -} ${loc:- -}"
}

# 1. The wedding CDN must be Caddy, not an R2 bucket. A bucket answers with an
#    HTML "Not Found" page and no CORS header.
read -r st type acao _ <<<"$(header_probe "${CDN}${FONT_PATH}?probe=${probe}")"
if [ "${st}" = "200" ] && [[ "${type}" == font/* ]] && [ "${acao}" = "*" ]; then
  summary+=("font ok")
else
  problems+=("${CDN}${FONT_PATH} -> ${st}, type=${type}, ACAO=${acao} (want 200 + font/* + '*'). cdn.aksaraa.com must be a proxied A record to 103.93.135.176 (Caddy file_server), NOT an R2 custom domain.")
  summary+=("font BROKEN")
fi

# 2. Couple subdomains are DNS-only and must 302 /fonts to the CDN. If this
#    redirect disappears, fonts are fetched from the app origin instead.
read -r st _ _ loc <<<"$(header_probe "https://${COUPLE_HOST}${FONT_PATH}")"
if [ "${st}" = "302" ] && [ "${loc}" = "${CDN}${FONT_PATH}" ]; then
  summary+=("couple-redirect ok")
else
  problems+=("https://${COUPLE_HOST}${FONT_PATH} -> ${st} Location=${loc} (want 302 -> ${CDN}${FONT_PATH})")
  summary+=("couple-redirect BROKEN")
fi

# 3. Atlas/Academy art is stored as absolute cdn.aksaraa.com/atlas|academy|og
#    URLs in that project's DB, so the CDN host must keep 302'ing them to the
#    R2 bucket host. Probe a path that need not exist: only the redirect counts.
read -r st _ _ loc <<<"$(header_probe "${CDN}/atlas/health-probe-${probe}.png")"
if [ "${st}" = "302" ] && [[ "${loc}" == "${ART}/atlas/"* ]]; then
  summary+=("art-redirect ok")
else
  problems+=("${CDN}/atlas/... -> ${st} Location=${loc} (want 302 -> ${ART}/atlas/...)")
  summary+=("art-redirect BROKEN")
fi

# 4. The art host itself must terminate at Cloudflare/R2 (any HTTP answer that is
#    not an R2 404 is fine for a probe key that does not exist).
read -r st type _ _ <<<"$(header_probe "${ART}/health-probe-${probe}.png")"
if [ "${st}" = "ERR" ]; then
  problems+=("${ART} unreachable (DNS/TLS). The aksaraa-art R2 custom domain may have been detached.")
  summary+=("art-host BROKEN")
else
  summary+=("art-host ${st}")
fi

echo "[cdn-health] $(date -u +%Y-%m-%dT%H:%M:%SZ) ${summary[*]}"

if [ ${#problems[@]} -eq 0 ]; then
  exit 0
fi

jid=""
if [ -r "${ECOSYSTEM}" ]; then
  jid="$(grep -oE 'WA_TARGET_GROUP_JID[[:space:]]*:[[:space:]]*"[^"]+"' "${ECOSYSTEM}" 2>/dev/null \
    | head -1 | sed -E 's/.*"([^"]+)"$/\1/')"
fi

message=$'🚨 Asset CDN problem (cdn.aksaraa.com)\n\n'
message+="$(printf '%s\n' "${problems[@]}")"
message+=$'\n\nFont undangan yang gagal = semua template in-house kehilangan font (CORS/404). Cek DNS: cdn.aksaraa.com harus A 103.93.135.176 (Caddy), bukan R2 custom domain. Setelah diperbaiki, purge cache Cloudflare.'

echo "[cdn-health] ALERT: ${#problems[@]} problem(s)"
printf '%s\n' "${problems[@]}"

if [ "${DRY_RUN}" -eq 1 ]; then
  echo "[cdn-health] --dry-run: would send to WA group:"
  printf '%s\n' "${message}"
  exit 1
fi

if [ -z "${jid}" ]; then
  echo "[cdn-health] WA_TARGET_GROUP_JID not found in ${ECOSYSTEM} — alert only logged" >&2
  exit 1
fi

curl -sS -o /dev/null --max-time 30 -X POST "${WA_SEND_URL}" \
  -H 'Content-Type: application/json' \
  --data "$(python3 -c '
import json, sys
print(json.dumps({"phone": sys.argv[1], "message": sys.argv[2]}))
' "${jid}" "${message}")" \
  || echo "[cdn-health] WhatsApp send failed" >&2

exit 1
