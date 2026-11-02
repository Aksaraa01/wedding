#!/usr/bin/env bash
# Cloudflare preflight: prove every public hostname is actually served with a
# valid edge certificate BEFORE (and after) changing proxy status.
#
# Why this exists: on 2026-11-02 `*.wedding.aksaraa.com` was proxied without
# noticing that Universal SSL only covers ONE level (`*.aksaraa.com`). Couple
# invitations then failed the TLS handshake at the edge until the record was set
# back to DNS-only. DNS proxying and certificate coverage are separate systems —
# this script checks both.
#
# Usage:
#   scripts/ops/cloudflare-preflight.sh
#   scripts/ops/cloudflare-preflight.sh --host rafi-novi.wedding.aksaraa.com
#
# Exit 0 = every host resolves, presents a certificate valid for its own name,
# and (when proxied) reaches Cloudflare. Exit 1 = at least one host is broken.
set -uo pipefail

DO=842                                     # probe every host through Cloudflare DoH
HOSTS=(
  aksaraa.com
  www.aksaraa.com
  wedding.aksaraa.com
  cdn.aksaraa.com
  wp.aksaraa.com
  education.aksaraa.com
  staging.aksaraa.com
  stg.education.aksaraa.com
  rafi-novi.wedding.aksaraa.com            # one couple, two levels deep
)

if [ "${1:-}" = "--host" ] && [ -n "${2:-}" ]; then
  HOSTS=("$2")
fi

fail=0

doh_resolve() {
  curl -s --max-time 15 -H 'accept: application/dns-json' \
    "https://cloudflare-dns.com/dns-query?name=$1&type=A" 2>/dev/null |
    grep -o '"data":"[0-9.]*"' | head -1 | cut -d'"' -f4
}

is_cloudflare_ip() {
  case "$1" in
    104.*|172.6[4-9].*|172.7[0-1].*|173.245.*|103.21.24[4-7].*|108.162.*|141.101.*|162.15[89].*|188.114.*|190.93.*|197.234.*|198.41.*) return 0 ;;
    *) return 1 ;;
  esac
}

for host in "${HOSTS[@]}"; do
  printf '%-44s ' "$host"
  ip="$(doh_resolve "$host")"
  if [ -z "$ip" ]; then
    echo "FAIL  tidak resolve (DoH)"
    fail=1
    continue
  fi

  # curl (not openssl) so the platform trust store and hostname verification
  # are exactly what a browser does. Exit 60 = certificate does not match/chain.
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
    --resolve "$host:443:$ip" "https://$host/" 2>/dev/null)
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "FAIL  TLS/cert untuk $host (curl exit $rc, ip=$ip)"
    fail=1
    continue
  fi

  if is_cloudflare_ip "$ip"; then
    ray=$(curl -sI --max-time 15 --resolve "$host:443:$ip" "https://$host/" | grep -ci '^cf-ray:')
    if [ "$ray" -eq 0 ]; then
      echo "FAIL  proxied tapi tidak ada cf-ray"
      fail=1
      continue
    fi
    echo "ok    proxied   http=$code ($ip)"
  else
    echo "ok    DNS-only  http=$code ($ip)"
  fi
done

echo
if [ "$fail" -ne 0 ]; then
  echo "✗ preflight gagal — jangan ubah proxy status / record sampai ini hijau"
  exit 1
fi

echo "✓ semua host resolve + cert valid (proxied atau DNS-only sesuai desain)"
