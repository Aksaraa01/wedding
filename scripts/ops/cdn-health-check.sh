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
# A failed probe is retried once before it counts. Over 952 runs the single
# alert was a 25 s VPS -> Cloudflare timeout that had healed 14 min later, and
# the only trace was the alert itself (the requests never reached Caddy), so one
# confirmation attempt is enough to tell a blip from a real origin break.
#
# Failures are reported per family: the font/couple probes own the `font_*`
# advice, the Atlas/Academy art probes own `art_*`. An art-only failure must
# never claim the invitations lost their fonts — that is what happened on
# 2026-11-15, when a proxied-host blip was read as a site-wide font outage.
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
# Which family of probe failed — drives the advice block at the end so a
# copy-safety alert never tells ops to go look at DNS, and vice versa. Art
# failures stay separate from font failures for the same reason.
font_problem=0
art_problem=0
wp_problem=0

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

# header_probe_retry <url>: repeat a probe once when the answer looks transient
# (transport failure, or a 5xx handed back by the edge). Deterministic
# breakage — a bucket's HTML 404 page, a missing CORS header, a wrong redirect
# target — fails again just as fast, so it is not retried.
header_probe_retry() {
  local out st
  out="$(header_probe "$1")"
  st="${out%% *}"
  if [ "${st}" = "ERR" ] || [[ "${st}" == 5* ]]; then
    sleep 3
    out="$(header_probe "$1")"
  fi
  printf '%s\n' "${out}"
}

# 1. The wedding CDN must be Caddy, not an R2 bucket. A bucket answers with an
#    HTML "Not Found" page and no CORS header.
read -r st type acao _ <<<"$(header_probe_retry "${CDN}${FONT_PATH}?probe=${probe}")"
if [ "${st}" = "200" ] && [[ "${type}" == font/* ]] && [ "${acao}" = "*" ]; then
  summary+=("font ok")
else
  problems+=("${CDN}${FONT_PATH} -> ${st}, type=${type}, ACAO=${acao} (want 200 + font/* + '*'). cdn.aksaraa.com must be a proxied A record to 103.93.135.176 (Caddy file_server), NOT an R2 custom domain.")
  summary+=("font BROKEN")
  font_problem=1
fi

# 2. Couple subdomains are DNS-only and must 302 /fonts to the CDN. If this
#    redirect disappears, fonts are fetched from the app origin instead.
read -r st _ _ loc <<<"$(header_probe_retry "https://${COUPLE_HOST}${FONT_PATH}")"
if [ "${st}" = "302" ] && [ "${loc}" = "${CDN}${FONT_PATH}" ]; then
  summary+=("couple-redirect ok")
else
  problems+=("https://${COUPLE_HOST}${FONT_PATH} -> ${st} Location=${loc} (want 302 -> ${CDN}${FONT_PATH})")
  summary+=("couple-redirect BROKEN")
  font_problem=1
fi

# 3. Atlas/Academy art is stored as absolute cdn.aksaraa.com/atlas|academy|og
#    URLs in that project's DB, so the CDN host must keep 302'ing them to the
#    R2 bucket host. Probe a path that need not exist: only the redirect counts.
read -r st _ _ loc <<<"$(header_probe_retry "${CDN}/atlas/health-probe-${probe}.png")"
if [ "${st}" = "302" ] && [[ "${loc}" == "${ART}/atlas/"* ]]; then
  summary+=("art-redirect ok")
else
  problems+=("${CDN}/atlas/... -> ${st} Location=${loc} (want 302 -> ${ART}/atlas/...)")
  summary+=("art-redirect BROKEN")
  art_problem=1
fi

# 4. The art host itself must terminate at Cloudflare/R2 (any HTTP answer that is
#    not an R2 404 is fine for a probe key that does not exist).
read -r st type _ _ <<<"$(header_probe_retry "${ART}/health-probe-${probe}.png")"
if [ "${st}" = "ERR" ]; then
  problems+=("${ART} unreachable (DNS/TLS). The aksaraa-art R2 custom domain may have been detached.")
  summary+=("art-host BROKEN")
  art_problem=1
else
  summary+=("art-host ${st}")
fi

# 5. Invitation copy safety. iOS/iPadOS Safari rewrites phone-shaped text into
#    <a href="tel:…">, and WeddingPress's copy widget serialised innerHTML — so a
#    bank account number reached guests as markup. The mu-plugin turns detection
#    off and replaces the widget handler with a text-only one. A WordPress or
#    WeddingPress update, or a mu-plugin revert, silently reopens it.
WP_PROBE="${WP_PROBE:-https://wp.aksaraa.com/template-10/}"
wp_html="$(curl -sS --max-time 25 "${WP_PROBE}" 2>/dev/null || true)"
# here-strings, not `printf | grep -q`: under `set -o pipefail` grep -q exits on
# the first match, printf gets SIGPIPE and the pipeline reports 141 (false alarm).
if grep -qiE 'name="format-detection"[^>]*telephone=no' <<<"${wp_html}" \
  && grep -q 'window.copyText=' <<<"${wp_html}"; then
  summary+=("wp-copy ok")
else
  problems+=("${WP_PROBE} is missing the copy-safety markers (meta format-detection telephone=no + text-only window.copyText). Either the Aksaraa mu-plugin was reverted or a WP/WeddingPress update dropped the hooks — iPhone guests then paste '<a href=\"tel:…\">' markup instead of the gift account number.")
  summary+=("wp-copy BROKEN")
  wp_problem=1
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

if [ "${font_problem}" -eq 1 ]; then
  message=$'🚨 Asset CDN problem (cdn.aksaraa.com)\n\n'
else
  message=$'🚨 Asset CDN problem (art.aksaraa.com / R2)\n\n'
fi
message+="$(printf '%s\n' "${problems[@]}")"
message+=$'\n\n'
# Advice per failing probe: a fonts-only failure has nothing to do with the WP
# copy hooks or the R2 art bucket, and an art-only failure has nothing to do
# with invitation fonts (they come from cdn.aksaraa.com, not art.aksaraa.com).
if [ "${font_problem}" -eq 1 ]; then
  message+=$'Font undangan yang gagal = semua template in-house kehilangan font (CORS/404). Cek DNS: cdn.aksaraa.com harus A 103.93.135.176 (Caddy), bukan R2 custom domain. Setelah diperbaiki, purge cache Cloudflare.\n'
fi
if [ "${art_problem}" -eq 1 ] && [ "${font_problem}" -eq 0 ]; then
  message+=$'Hanya aset Atlas/Academy yang terdampak — font undangan TIDAK lewat jalur ini. Cek: cdn.aksaraa.com masih 302 /atlas|/academy|/og ke art.aksaraa.com, dan art.aksaraa.com masih CNAME public.r2.dev (proxied) dengan custom domain bucket aksaraa-art terpasang. Bila gagal satu kali lalu pulih sendiri, itu gangguan edge Cloudflare, bukan perubahan config.\n'
fi
if [ "${wp_problem}" -eq 1 ]; then
  message+=$'Copy-safety WP: cek /var/www/wp/wp-content/mu-plugins/aksaraa-plugin.php — harus ada hook wp_head (meta format-detection) dan wp_footer (window.copyText). Bila hilang, pulihkan dari aksaraa-plugin.php.bak-copyfix-* di folder yang sama, lalu verifikasi https://wp.aksaraa.com/template-10/ memuat kedua marker.\n'
fi

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
