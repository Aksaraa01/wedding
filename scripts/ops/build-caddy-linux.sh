#!/usr/bin/env bash
# Build the Caddy binary that runs on the VPS (103.93.135.176, /usr/bin/caddy).
#
# Why a custom build: the official Caddy package ships ZERO dns.providers
# modules, but /etc/caddy/Caddyfile needs `tls { dns hostinger ... }` for the
# wildcard certs (*.aksaraa.com, *.wedding.aksaraa.com). `apt install caddy`
# therefore produces a binary that cannot even parse the Caddyfile.
#
# Why the patch: libdns-hostinger forwards ACME's "TTL 0" verbatim and Hostinger
# rejects anything below 60s, so DNS-01 worked until the API tightened in
# Sep 2026 and then failed silently until the certs expired on 2026-10-29.
# See libdns-hostinger-ttl.patch.
#
# Usage (from the repo root, with Go + xcaddy installed):
#   scripts/ops/build-caddy-linux.sh              # builds ./caddy-v2.11.4-linux-amd64
#   CADDY_VERSION=v2.11.7 scripts/ops/build-caddy-linux.sh
#
# Then deploy with scripts/ops/deploy-caddy.md (backup -> install -> apt-mark hold
# -> restart -> verify renewal in journalctl).
set -euo pipefail

cd "$(dirname "$0")"

CADDY_VERSION="${CADDY_VERSION:-v2.11.4}"
HOSTINGER_PLUGIN_VERSION="${HOSTINGER_PLUGIN_VERSION:-v0.1.3}"
LIBDNS_VERSION="${LIBDNS_VERSION:-v0.1.2}"
# DNS is now hosted on Cloudflare, so ACME DNS-01 must go through it. The
# hostinger provider stays in the binary only so the Caddyfile can be reverted
# during the migration window; drop it once the switch is settled.
CLOUDFLARE_PLUGIN_VERSION="${CLOUDFLARE_PLUGIN_VERSION:-v0.2.4}"
OUT="caddy-${CADDY_VERSION}-linux-amd64"

command -v xcaddy >/dev/null || { echo "xcaddy not found: go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git clone --quiet --depth 1 --branch "${LIBDNS_VERSION}" \
  https://github.com/sbrunk/libdns-hostinger "${WORK}/libdns-hostinger"
git -C "${WORK}/libdns-hostinger" apply "${PWD}/libdns-hostinger-ttl.patch"

GOOS=linux GOARCH=amd64 CGO_ENABLED=0 GOTOOLCHAIN=auto xcaddy build "${CADDY_VERSION}" \
  --with "github.com/sbrunk/caddy-dns-hostinger@${HOSTINGER_PLUGIN_VERSION}" \
  --with "github.com/caddy-dns/cloudflare@${CLOUDFLARE_PLUGIN_VERSION}" \
  --replace "github.com/sbrunk/libdns-hostinger=${WORK}/libdns-hostinger" \
  --output "${PWD}/${OUT}"

echo
echo "Built ${OUT}"
shasum -a 256 "${OUT}"
echo
echo "Verify before deploying:"
echo "  file ${OUT}                       # must say: ELF 64-bit LSB executable, x86-64"
echo "  ssh askaraa@103.93.135.176 '~/caddy-check ${OUT}'   # version + list-modules"
