# Caddy on the VPS — custom binary, TLS renewal, and how it broke once

Everything here is VPS-side (`askaraa@103.93.135.176`). Nothing in this file is
served by Next.js.

## Facts you must not forget

- **`/usr/bin/caddy` is a custom build, not the apt package.** `dpkg -l caddy`
  says 2.11.4, but the file was replaced (2026-07-31) with an `xcaddy` build that
  includes `dns.providers.hostinger`. The official deb ships **zero**
  `dns.providers` modules, so `apt install --reinstall caddy` or a normal
  `apt upgrade` leaves a binary that fails to load `/etc/caddy/Caddyfile`
  (`unknown module: dns.providers.hostinger`). `caddy` is therefore
  **`apt-mark hold`**-ed. If Caddy needs a security update: rebuild with
  `scripts/ops/build-caddy-linux.sh`, deploy it, then re-apply the hold.
- **The build carries a local patch** (`scripts/ops/libdns-hostinger-ttl.patch`)
  because `libdns-hostinger` forwards ACME's `TTL 0` to the Hostinger API, which
  rejects it (`HTTP 422 [DNS:4005] Resource record TTL must be at least 60
  seconds`). Without the patch every DNS-01 challenge fails and no certificate
  can be issued or renewed.
- Rollback binary: `/usr/bin/caddy.bak-20261029-pretlsfix` (the 2026-07-31,
  pre-patch build).

## Deploy a rebuilt binary

```bash
scripts/ops/build-caddy-linux.sh                    # -> caddy-v2.11.4-linux-amd64
scp caddy-v2.11.4-linux-amd64 askaraa@103.93.135.176:/tmp/caddy-new

ssh askaraa@103.93.135.176 '
  set -e
  /tmp/caddy-new version
  /tmp/caddy-new list-modules | grep dns.providers.hostinger
  /tmp/caddy-new validate --config /etc/caddy/Caddyfile
  sudo cp -a /usr/bin/caddy /usr/bin/caddy.bak-$(date +%Y%m%d-%H%M)
  sudo install -o root -g root -m 0755 /tmp/caddy-new /usr/bin/caddy
  sudo apt-mark hold caddy
  rm -f /tmp/caddy-new
  sudo systemctl restart caddy
'
```

Then confirm renewal actually works (this is the part that matters):

```bash
ssh askaraa@103.93.135.176 "sudo journalctl -u caddy --since '5 minutes ago' | grep -iE 'renew|obtain|challenge'"
# expect: "certificate renewed successfully" (or "certificate obtained successfully")
```

And from outside:

```bash
curl -s -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' https://wedding.aksaraa.com/
# ssl_verify_result must be 0
```

## What went wrong on 2026-10-29 (do not repeat)

| When | What |
|---|---|
| 2026-07-31 02:20 | `*.aksaraa.com` / `*.wedding.aksaraa.com` issued fine (90 days, expiring 2026-10-29). |
| ~Aug–Sep | Hostinger began rejecting `ttl=0` on zone writes. The provider sends ACME's `TTL 0` as-is. |
| 2026-09-28 16:23 | First renewal attempt (30 days before expiry) → HTTP 422. Caddy kept retrying with backoff, logging only to the journal. |
| 2026-10-29 02:19 | Certs expired. Every host behind a wildcard (`wedding.aksaraa.com`, `wp.aksaraa.com`, `www.`, all couples) failed the TLS handshake. `aksaraa.com` stayed up because that block uses HTTP-01. |
| 2026-10-29 10:11 | Patched provider deployed; both wildcards renewed within 10 seconds. |

Two guards now exist:

1. **`cert-expiry-check.timer`** (daily, 06:00 WIB) runs
   `/usr/local/bin/cert-expiry-check.sh` — source of truth:
   `scripts/ops/cert-expiry-check.sh`. It fails the run (and WhatsApps the ops
   group via `127.0.0.1:3001/send`) when any host stops verifying, expires
   within 14 days, or when Caddy logged a renewal failure in the last 6 hours.
   Check it with `systemctl list-timers cert-expiry-check.timer` and
   `/usr/local/bin/cert-expiry-check.sh --dry-run`.
2. **`npm run deploy`'s smoke test** treats TLS/DNS failures as fatal
   (`ERR:60` etc.), so a broken certificate now blocks a deploy instead of
   reporting "all healthy".

## Troubleshooting

```bash
sudo journalctl -u caddy -n 100 | grep -iE 'renew|challenge|error'
sudo ls /var/lib/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/
# expiry of every managed cert:
sudo find /var/lib/caddy/.local/share/caddy/certificates -name '*.crt' -exec sh -c \
  'printf "%-40s " "$(basename "$(dirname "$1")")"; openssl x509 -in "$1" -noout -enddate' _ {} \;
```

Never `caddy reload` a Caddyfile that fails `caddy validate`; the running config
keeps serving, but the reload error is easy to miss in a long deploy log.
