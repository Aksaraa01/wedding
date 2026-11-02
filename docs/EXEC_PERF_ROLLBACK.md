# Eksekusi: Performa Undangan (CDN aset, sertifikat, lazy-load)

Status: **siap dieksekusi, bertahap**
Tanggal: 2026-11-02
Prasyarat: `docs/PLAN_PERF_CDN.md` (strategi), `docs/PERF_BASELINE.md` (angka awal)

---

## 0. Konteks & keputusan yang sudah dikunci

| Keputusan | Nilai |
|---|---|
| Migrasi aset Supabase | **tidak** (sudah di belakang Cloudflare) |
| Re-encode / potong durasi video | **tidak** (kualitas dijaga) |
| Subdomain undangan | tetap `{slug}.{event}.aksaraa.com` → **dua level** |
| ACM ($10/bln) | **tidak** dipakai → undangan tamu **DNS-only** |
| CDN untuk undangan | lewat **host aset terpisah** (`cdn.aksaraa.com`) |

Trafik tamu in-house: HTML tetap di origin (4 Mbps), aset (±90% byte) dari edge.

---

## 1. Langkah 1 — `cdn.aksaraa.com` + redirect aset (biaya $0)

### 1.1 Desain

Daripada mengubah 172 referensi di 55 file, **tidak ada perubahan kode sama
sekali**: Caddy pada host undangan mengembalikan **302** untuk path aset ke host
CDN. Browser lalu mengambil aset dari edge.

```
{slug}.wedding.aksaraa.com/templates/x.webp
   → 302 https://cdn.aksaraa.com/templates/x.webp   (dari Caddy, ±200 byte)
   → 200 dari Cloudflare edge (cache 30 hari)
```

Kenapa redirect, bukan codemod:

- berlaku otomatis untuk **semua template sekarang dan yang akan datang**,
- rollback = hapus 3 baris Caddy (tidak perlu deploy/revert kode),
- tidak menyentuh CSS/TS, jadi nol risiko regresi tata letak.

Biaya: satu RTT tambahan per batch aset pada kunjungan pertama (paralel,
±1 RTT), setelah itu browser memakai URL final dari dokumen yang sama; edge
meng-cache aset 30 hari.

### 1.2 Yang dibangun

| # | Perubahan | Lokasi |
|---|---|---|
| 1 | Record `cdn.aksaraa.com` A → `103.93.135.176`, **proxied** | Cloudflare API |
| 2 | Blok Caddy `cdn.aksaraa.com` → `file_server` statis dari `public/` (tanpa Node), `encode zstd gzip br`, cache 7 hari | VPS `/etc/caddy/Caddyfile` |
| 3 | `redir /templates/* https://cdn.aksaraa.com{uri} 302` di blok `*.aksaraa.com` dan `*.wedding.aksaraa.com` | idem |
| 4 | `redir /fonts/*` + `/images/*` (opsional, 250 KB + 8 file) | idem |
| 5 | Cache rule Cloudflare: host `cdn.aksaraa.com` → edge 30 hari | Cloudflare API |

### 1.3 Rollback (RTO < 2 menit)

1. **Cepat:** `sudo cp /etc/caddy/Caddyfile.bak-<ts> /etc/caddy/Caddyfile && sudo systemctl reload caddy` — redirect hilang, aset kembali dari origin.
2. **DNS:** kalau host CDN bermasalah, set record `cdn` ke **DNS-only** (aset dilayani origin langsung, tetap 200).
3. **Total:** hapus blok `cdn.aksaraa.com` + record `cdn` (kembali ke kondisi sebelum langkah 1).
4. Tidak ada rollback aplikasi karena **tidak ada kode yang berubah**.

### 1.4 Test case

| ID | Uji | Cara | Harapan |
|---|---|---|---|
| 1-T1 | Redirect aset template | `curl -sI https://<slug>.wedding.aksaraa.com/templates/lace/opening.mp4` | `302` + `Location: https://cdn.aksaraa.com/...` |
| 1-T2 | Aset dari edge | 2× `curl -sI https://cdn.aksaraa.com/templates/lace/opening.mp4` | 200, `cf-cache-status: HIT` pada request ke-2 |
| 1-T3 | Video range | `curl -r 0-1023 https://cdn.aksaraa.com/templates/embroidered-garden/cover-door.mp4` | `206`, `content-range` benar |
| 1-T4 | Font | `curl -sI https://cdn.aksaraa.com/fonts/inter-400.woff2` | 200 + `font/woff2` |
| 1-T5 | Halaman tamu tetap 200 | `curl -s https://<slug>.wedding.aksaraa.com/?to=Test` | 200, HTML identik (tidak ada referensi absolut yang berubah) |
| 1-T6 | Tidak ada 404 aset | buka undangan di browser, cek `performance` + console | 0 request gagal |
| 1-T7 | Gambar benar-benar termuat | `document.images` → `naturalWidth > 0` untuk semua `img` | semua > 0 |
| 1-T8 | Video terputar | tap gate / `video.play()` | `currentTime` maju |
| 1-T9 | Font terpakai | `getComputedStyle` pada heading | family sesuai template |
| 1-T10 | Mixed content | semua URL aset | `https://` semua |
| 1-T11 | Editor preview | buka editor `/dashboard/<id>/web-invitation/editor` | iframe tetap tampil benar |
| 1-T12 | Template WP | `?template=template-2` di galeri | redirect ke wp.aksaraa.com, tidak terpengaruh |
| 1-T13 | Rollback | komentar 3 baris redirect, reload Caddy | aset kembali 200 dari origin |

**Wajib diuji pada undangan yang sudah tayang** (dari DB prod, `is_published = true`):

| Template | Slug uji |
|---|---|
| `sandhya` | `Vanda-Grace` |
| `manjari` | `KevinGabrielHotAsiSimangunsong-YolandaAdeNataliaSimamora` |
| `nihara-mist` | `Hernita-Fadlan`, `Todo-Yunita` |
| `pastel-coastal-cut` | `DianAditya-AyuAnita` |
| `pastel-dream-cathedral` | `AndredanendraAlanOberlinLumbanrajaST-NovrianiAlbertaSihalohoST` |
| `impasto-mosque-dark-gold` | `Cristovel-Erlin` |

Ditambah 4 template in-house yang belum tayang → uji lewat
`/templates/<code>/preview` (`adat-batak`, `cinnabar-seal`, `dark-split-rail`,
`still-ever`).

### 1.5 Pelajaran: jangan cache HTML preview di edge

Percobaan pertama memasang cache rule untuk `/templates/*/preview` membuat 4
halaman mengembalikan **307** ke `?_rsc`. Penyebabnya: Next menjawab request RSC
(dikirim oleh klien router dan oleh smoke test) dengan redirect 307, dan
Cloudflare menyimpan respons itu di bawah URL tanpa query — lalu menyajikannya ke
navigasi biasa. Cache rule tidak bisa memfilter berdasarkan status respons, jadi
solusinya:

- rule khusus preview **dihapus** (HTML preview sekarang `cf-cache-status:
  DYNAMIC`, origin hanya butuh ~15 ms), dan
- rule `/templates/*` diberi pengecualian
  `and not http.request.uri.path contains "/preview"`.

Akibat percobaan itu, dua deploy gagal di smoke test dan **rollback otomatis
bekerja** (kembali ke `rVxj73iYIKYOySLFsYCaC`), lalu deploy sukses setelah cache
dipurgasi. Catat: purge `purge_everything` aman dilakukan karena cache hanya berisi
aset statis yang akan terisi ulang.

### 1.6 Analitik tamu (Cloudflare Web Analytics)

Beacon dipasang di root layout tapi **hanya untuk `wedding.aksaraa.com`**.
Cloudflare RUM menolak beacon dari hostname yang tidak terdaftar (CORS error) dan
tidak menerima wildcard (`*.wedding.aksaraa.com` → `host.invalid`). Karena
undangan tamu ada di subdomain DNS-only, halaman tamu **belum terukur** oleh CF.
Perlu jalur sendiri (endpoint RUM sendiri atau pendaftaran site per pasangan)
kalau angka tamu sungguhan dibutuhkan.

---

## 2. Langkah 2 — Rebuild Caddy `dns cloudflare` (sebelum awal Desember)

### 2.1 Kenapa

`wedding.aksaraa.com` + `*.wedding` memakai DNS-01 via Hostinger. Setelah NS
pindah ke Cloudflare, renewal akan gagal (insiden 2026-10-29 terulang).

| Sertifikat | Metode sekarang | Kedaluwarsa | Tenggat aman |
|---|---|---|---|
| `wedding.aksaraa.com`, `*.wedding`, `wp` | `dns hostinger` | 27 Jan 2027 | ±28 Des 2026 |
| `aksaraa.com` | HTTP-01 (tanpa `tls`) | 13 Des 2026 | otomatis, sudah diverifikasi lewat Cloudflare |

### 2.2 Langkah

1. Build lokal: `scripts/ops/build-caddy-linux.sh` + `--with github.com/caddy-dns/cloudflare` (Go tersedia di mesin ini).
2. Backup di VPS: `/usr/bin/caddy` → `caddy.bak-<ts>`, `Caddyfile` → `Caddyfile.bak-<ts>`.
3. Ganti 3 blok `tls { dns hostinger ... }` → `tls { dns cloudflare {env.CLOUDFLARE_API_TOKEN} }`.
4. Tulis token ke `/etc/systemd/system/caddy.service.d/override.conf` (chmod 600) — **hapus** `HOSTINGER_API_TOKEN` karena sudah bocor dan tidak dipakai lagi.
5. `caddy validate --config /etc/caddy/Caddyfile`, `systemctl daemon-reload`, `restart caddy`.
6. Paksa uji renewal: `journalctl -u caddy | grep -i acme` + `caddy reload`; verifikasi cert tetap valid dan tanggal tidak berubah sampai renewal terjadwal.

### 2.2b Hasil eksekusi (2026-11-02)

- Binary baru: `v2.11.4` + `dns.providers.cloudflare` **v0.2.4** + `dns.providers.hostinger` + `gzip/zstd`.
  **v0.2.2 tidak bisa dipakai**: validator token-nya hanya menerima format lama, sedangkan token Cloudflare sekarang berformat `cfat_` (ditolak dengan pesan "appears invalid").
- `CLOUDFLARE_API_TOKEN` dipindah dari file env ke `/etc/systemd/system/caddy.service.d/override.conf` (chmod 600); `HOSTINGER_API_TOKEN` **dihapus**.
- Backup saat deploy: `/usr/bin/caddy.bak-20261102-231127`, `/etc/caddy/Caddyfile.bak-20261102-231127`, `override.conf.bak-20261102-231127`.
- Uji `caddy validate` + restart: bersih, tidak ada error ACME di journal, sertifikat origin tetap (wedding/wp 27 Jan 2027, aksaraa.com 13 Des 2026).
- **Uji DNS-01 staging belum bisa membuktikan issuance**: resolver POP yang melayani VPS masih menyajikan NS lama (Hostinger) karena TTL delegasi 86400 baru berubah hari ini. Cloudflare **menerima pembuatan TXT** (auth + izin token terbukti), tetapi pengecekan propagasi Certmagic menunggu NS yang salah lalu timeout. Bahkan DoH dari VPS mengembalikan NS lama, jadi ini cache POP, bukan masalah token. **Ulangi uji DNS-01 setelah TTL habis (≥ 24 jam) dan sebelum 28 Des 2026.**
- Percobaan mengalihkan systemd-resolved ke DNS-over-TLS sudah dibatalkan (tidak menolong, karena cache ada di POP resolver).
- `cert-expiry-check.sh --dry-run`: `aksaraa.com 40d ok, www/wedding/wp 85d ok` ✅

### 2.2c Uji DNS-01 (lanjutan, 2026-11-02 malam)

Cache NS pada resolver yang melayani VPS sudah kedaluwarsa, dan uji ulang
berhasil:

```
trying to solve challenge  identifier=acme-test.aksaraa.com challenge_type=dns-01
certificate obtained successfully  identifier=acme-test.aksaraa.com
```

Sertifikat staging LE terbit dalam ~12 detik, record TXT dibersihkan otomatis,
dan tidak ada sisa record di zone. **Jalur renewal produksi (LE + DNS-01
Cloudflare) sekarang terbukti bekerja.**

### 2.4 Preflight wajib sebelum mengubah proxy

`scripts/ops/cloudflare-preflight.sh` memeriksa setiap pola host (apex, satu
level, dua level, DNS-only) lewat DoH + verifikasi TLS + `cf-ray`. Jalankan
sebelum dan sesudah mengubah status proxy; exit 1 = jangan lanjut.

Snapshot konfigurasi server ada di `scripts/ops/Caddyfile.prod` supaya blok
`cdn`, redirect aset, dan `tls { dns cloudflare }` tidak hanya hidup di VPS.

### 2.3 Rollback (RTO < 10 menit)

- Binary: `sudo cp /usr/bin/caddy.bak-<ts> /usr/bin/caddy && sudo cp /etc/caddy/Caddyfile.bak-<ts> /etc/caddy/Caddyfile && sudo systemctl restart caddy`.
- Karena NS sudah di Cloudflare, rollback ini hanya bertahan sampai sertifikat berikutnya perlu renew → perbaiki penyebabnya, jangan tinggalkan lama.
- Guard `cert-expiry-check.timer` tetap aktif dan akan WhatsApp bila ada host gagal.

### 2.4 Test case

| ID | Uji | Harapan |
|---|---|---|
| 2-T1 | `caddy validate` | sukses |
| 2-T2 | Semua host HTTPS | 200/301/308, bukan error TLS |
| 2-T3 | `openssl s_client` per host | issuer Let's Encrypt, `notAfter` ≥ 60 hari |
| 2-T4 | Log ACME setelah restart | tidak ada `error`/`failed` baru |
| 2-T5 | `cert-expiry-check.sh --dry-run` | exit 0 |
| 2-T6 | Undangan tayang (6 slug di §1.4) | 200 + aset termuat |
| 2-T7 | Rollback binary | layanan kembali normal |

---

## 3. Langkah 3 — Lazy-load background below-fold

### 3.1 Masalah

Art template mayoritas CSS `background-image` yang dimuat walau section belum
terlihat. First screen ±2,4–5,2 MB.

### 3.2 Pendekatan (kualitas 100% sama, hanya ditunda)

Untuk section yang jauh dari layar: render placeholder dulu, tukar ke aset saat
mendekati viewport (`IntersectionObserver`, rootMargin ±400px), atau ganti
`background-image` menjadi `<img loading="lazy">` bila elemen memungkinkan.

Pilot di dua template terberat: `adat-jawa` dan `lunar-blossom`.

### 3.3 Rollback (RTO < 5 menit)

- Satu commit per template → `git revert <sha>` → deploy.
- Tidak ada aset yang diubah; hanya cara memuat.

### 3.4 Test case

| ID | Uji | Harapan |
|---|---|---|
| 3-T1 | First screen bytes | turun ≥30% (DevTools, "Transferred") |
| 3-T2 | Scroll cepat atas→bawah | tidak ada section kosong/berkedip |
| 3-T3 | Screenshot per section setelah scroll | identik dengan versi sebelum (A/B piksel) |
| 3-T4 | Undangan tayang template terkait | semua section tampil |
| 3-T5 | `prefers-reduced-motion` | tidak ada animasi tambahan |

---

## 4. Urutan eksekusi & gate

| Fase | Isi | Gate sebelum lanjut |
|---|---|---|
| 1 | `cdn.aksaraa.com` + redirect | 13 test case §1.4 hijau, termasuk 6 undangan tayang |
| 2 | Caddy `dns cloudflare` | 7 test case §2.4 hijau + renewal terbukti |
| 3 | Lazy-load 2 template pilot | 5 test case §3.4 hijau + A/B visual |

Setiap fase: deploy dari worktree bersih `origin/main`, `npm run deploy`,
smoke 32 template, lalu laporan angka sebelum/sesudah.

---

## 5. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Redirect merusak pemuatan video (range) | uji 1-T3 dengan `-r` sebelum deploy; kalau gagal, batasi redirect ke `/templates/**` non-video dulu |
| Aset ter-cache dengan URL lama | purge `cdn.aksaraa.com` setelah perubahan |
| Rollback Caddy lupa reload | selalu `caddy validate` + `systemctl reload` + cek status |
| Token Hostinger bocor | rotasi sekarang; hapus dari systemd saat langkah 2 |
| Template baru lupa ikut | redirect berbasis path, jadi semua template otomatis ikut |
