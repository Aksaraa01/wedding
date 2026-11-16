#!/usr/bin/env bash
# Certificate expiry / TLS health check for the Caddy-fronted hosts.
#
# Runs daily from the cert-expiry-check.timer systemd unit on the VPS. It is the
# guard for the failure that took every host down on 2026-10-29: Caddy's ACME
# renewal failed silently for 31 days (Hostinger DNS provider sent TTL 0, the API
# wants >= 60s), so the wildcard certs expired while everything still looked
# healthy in pm2.
#
# Exit 0 = healthy or warned; exit 1 = a host is broken, and a WhatsApp message
# goes to the ops group (same gateway the app uses: 127.0.0.1:3001/send).
#
#   cert-expiry-check.sh            # normal run
#   cert-expiry-check.sh --dry-run  # print what it would send, send nothing
#   cert-expiry-check.sh --host x.example.com --host y.example.com
#
set -uo pipefail

WARN_DAYS=14
FAIL_DAYS=3
WA_SEND_URL="${WA_SEND_URL:-http://127.0.0.1:3001/send}"
ECOSYSTEM="${ECOSYSTEM:-/var/www/aksara-wedding/ecosystem.config.js}"

DRY_RUN=0
HOSTS=()
RENEW_LOG_SINCE="${RENEW_LOG_SINCE:-25 hours ago}"
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --host) shift; [ $# -gt 0 ] && HOSTS+=("$1") ;;
    --warn-days) shift; WARN_DAYS="${1:-14}" ;;
    --renew-log-since) shift; RENEW_LOG_SINCE="${1:-25 hours ago}" ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

if [ ${#HOSTS[@]} -eq 0 ]; then
  # The couple entries prove the wildcard certificates, not just the apex ones:
  # rafi-novi.wedding.aksaraa.com for *.wedding.aksaraa.com and
  # rafi-novi.aksaraa.com for the canonical *.aksaraa.com invitation host.
  HOSTS=(aksaraa.com www.aksaraa.com wedding.aksaraa.com wp.aksaraa.com ceriavite.aksaraa.com rafi-novi.wedding.aksaraa.com rafi-novi.aksaraa.com)
fi

now="$(date +%s)"
problems=()
summary=()

for host in "${HOSTS[@]}"; do
  # curl exits non-zero on any TLS/DNS/HTTP failure; -k is deliberately absent
  # so an expired or untrusted chain is caught, not masked.
  curl_out="$(curl -sS -o /dev/null --max-time 25 "https://${host}/" 2>&1)"
  curl_rc=$?
  not_after="$(echo | timeout 20 openssl s_client -connect "${host}:443" -servername "${host}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')"

  days=""
  if [ -n "${not_after}" ]; then
    end_epoch="$(date -d "${not_after}" +%s 2>/dev/null || true)"
    [ -n "${end_epoch}" ] && days=$(( (end_epoch - now) / 86400 ))
  fi

  if [ "${curl_rc}" -ne 0 ]; then
    problems+=("${host}: TLS/HTTP FAILED (curl exit ${curl_rc}) — ${curl_out%%$'\n'*}")
    summary+=("${host} BROKEN")
  elif [ -z "${days}" ]; then
    problems+=("${host}: could not read certificate expiry")
    summary+=("${host} UNKNOWN")
  elif [ "${days}" -le "${FAIL_DAYS}" ]; then
    problems+=("${host}: certificate expires in ${days} day(s) (${not_after})")
    summary+=("${host} ${days}d")
  elif [ "${days}" -le "${WARN_DAYS}" ]; then
    problems+=("${host}: certificate expires in ${days} day(s) (${not_after})")
    summary+=("${host} ${days}d")
  else
    summary+=("${host} ${days}d ok")
  fi
done

# Renewal failures are the leading indicator. Caddy starts renewing ~30 days
# before expiry, so watching only the expiry date means up to a month of
# silence — exactly the gap between 2026-09-28 (first failure) and 2026-10-29
# (expiry). Only *ongoing* failures count (newest one inside RECENT_HOURS), so a
# fixed incident stops alerting immediately instead of nagging for a day.
RECENT_HOURS="${RECENT_HOURS:-6}"
if command -v journalctl >/dev/null 2>&1; then
  renew_log="$(journalctl -u caddy --since "${RENEW_LOG_SINCE}" --no-pager -o short-iso 2>/dev/null \
    | grep -E 'could not get certificate from issuer|will retry.*Renew:' || true)"
  if [ -n "${renew_log}" ]; then
    renew_failures="$(printf '%s\n' "${renew_log}" | wc -l | tr -d ' ')"
    last_ts="$(printf '%s\n' "${renew_log}" | tail -1 | awk '{print $1}')"
    last_epoch="$(date -d "${last_ts}" +%s 2>/dev/null || echo 0)"
    if [ "${last_epoch}" -gt 0 ]; then
      age_m=$(( (now - last_epoch) / 60 ))
      if [ "${age_m}" -le $(( RECENT_HOURS * 60 )) ]; then
        problems+=("Caddy is failing to renew certificates RIGHT NOW (${renew_failures}x in ${RENEW_LOG_SINCE}, last failure ${age_m} min ago)")
        summary+=("renew-failing")
      fi
    fi
  fi
fi

echo "[cert-expiry] $(date -Is) ${summary[*]}"

if [ ${#problems[@]} -eq 0 ]; then
  exit 0
fi

# Same group the app's own notifications use; read from the deployed ecosystem
# file so the JID is never duplicated into this script or into git.
jid=""
if [ -r "${ECOSYSTEM}" ]; then
  jid="$(grep -oE 'WA_TARGET_GROUP_JID[[:space:]]*:[[:space:]]*"[^"]+"' "${ECOSYSTEM}" 2>/dev/null \
    | head -1 | sed -E 's/.*"([^"]+)"$/\1/')"
fi

message=$'🚨 TLS/certificate problem on wedding.aksaraa.com\n\n'
message+="$(printf '%s\n' "${problems[@]}")"
message+=$'\n\nKalau sertifikat sudah expired, semua link undangan tamu gagal dibuka (browser menolak koneksi). Cek: journalctl -u caddy -n 100'

echo "[cert-expiry] ALERT: ${#problems[@]} problem(s)"
printf '%s\n' "${problems[@]}"

if [ "${DRY_RUN}" -eq 1 ]; then
  echo "[cert-expiry] --dry-run: would send to WA group:"
  printf '%s\n' "${message}"
  exit 1
fi

if [ -z "${jid}" ]; then
  echo "[cert-expiry] WA_TARGET_GROUP_JID not found in ${ECOSYSTEM} — alert only logged" >&2
  exit 1
fi

curl -sS -o /dev/null --max-time 30 -X POST "${WA_SEND_URL}" \
  -H 'Content-Type: application/json' \
  --data "$(python3 -c '
import json, sys
print(json.dumps({"phone": sys.argv[1], "message": sys.argv[2]}))
' "${jid}" "${message}")" \
  || echo "[cert-expiry] WhatsApp send failed" >&2

exit 1
