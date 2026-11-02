# Rencana Performa & CDN — Aksaraa Wedding

Status: **rencana (belum dieksekusi)**
Tanggal: 2026-11-02
Pemilik: Aksaraa (infra + template undangan)

---

## 0. Ringkasan

Undangan terasa lambat bukan karena jaringan tamu. Hasil pengukuran dari jaringan
yang sama dengan HP pengguna:

| Target | Throughput |
|---|---|
| `wedding.aksaraa.com` 1 koneksi | 2,0–3,0 Mbps |
| `wedding.aksaraa.com` 4 paralel | 4,3 Mbps |
| `wedding.aksaraa.com` 8 paralel | **4,15 Mbps (plafon)** |
| Cloudflare test (10 MB) | 6,8 Mbps |
| OVH test (10 MB) | 13,6 Mbps |

Paralel 4 vs 8 tidak menambah throughput → **total egress VPS ±4 Mbps, dibagi
semua pengunjung**. Latensi sehat (TTFB HTML 170–310 ms, gzip 7–18 KB), jadi
masalahnya bandwidth, bukan RTT.

Berat halaman terukur:

| Halaman | Request | Byte | `load` event |
|---|---|---|---|
| `embroidered-garden/preview` | 52 | **5,2 MB** | — |
| `adat-jawa/preview` | 39 | **1,7 MB** | 17,5 s* |
| `wp.aksaraa.com/template-1` | **121** | **3,6 MB** | 24,8 s* |

\* diukur di koneksi 180 Mbps → penyebabnya stall third-party (satu request
Supabase 10,7 s; 4 request ke `ayomarried.com`), bukan bandwidth.

Aset: `public/` = 171 MB (`public/templates` = 158 MB), seluruhnya disajikan
VPS satu per satu tanpa varian responsif.

**Tujuan rencana:** agar halaman pertama sebuah undangan ≤1,5 MB, TTFB HTML
dari edge, dan lonjakan tamu saat acara tidak lagi menghabiskan uplink VPS.

---

## 1. Prinsip

1. **Tidak menurunkan kualitas** yang terlihat. **Keputusan klien 2026-11-02:
   video template tidak di-re-encode dan tidak dipotong durasinya.** Encode ulang
   dan trim (`-c copy`) dibatalkan; byte video tetap apa adanya. Percepatan
   video hanya boleh datang dari CDN (Fase 2), bukan dari mengubah file.
2. **Satu perubahan = satu deploy**, supaya rollback presisi.
3. **Additive & reversible**: tidak menghapus aset lama sampai 30 hari setelah
   cutover; tidak menyentuh data yang tidak perlu.
4. **Ukur sebelum & sesudah** dengan tes curl yang sama (lihat §2).
5. **Tidak memigrasi aset Supabase.** Sudah di belakang Cloudflare
   (`cf-cache-status: HIT`, `server: cloudflare`), upload sudah
   `cacheControl: 31536000` (`src/lib/storage.ts:119,228`), dan URL-nya tersebar
   di banyak kolom DB. Manfaat nol, risiko tinggi.

### Non-goals (jangan dikerjakan)

- Migrasi Supabase Storage → Cloudflare/R2.
- Akun Cloudflare baru, Pages/Workers, Cloudflare Images berbayar, Stream.
- Mengubah desain template.
- Mengganti VPS/hosting.

---

## 2. Fase 0 — Baseline & guardrail (±1 hari)

### 2.1 Rekam baseline

Simpan angka sebelum perubahan (dipakai sebagai pembanding go/no-go):

```bash
# TTFB/ukuran HTML
for u in \
  https://wedding.aksaraa.com/templates/embroidered-garden/preview \
  https://wedding.aksaraa.com/templates/adat-jawa/preview \
  https://wp.aksaraa.com/template-1/?aksaraa_preview=1 ; do
  curl -s -o /dev/null -H 'Accept-Encoding: br,gzip' \
    -w "%{http_code} ttfb=%{time_starttransfer} total=%{time_total} size=%{size_download}  $u\n" "$u"
done

# Throughput VPS (harus turun ke 0 setelah CDN aktif)
for n in 1 4 8; do
  start=$(python3 -c 'import time;print(time.time())')
  for i in $(seq 1 $n); do
    curl -s -o /dev/null "https://wedding.aksaraa.com/templates/embroidered-garden/dresscode-garland.webp?n=$n$RANDOM$i" &
  done; wait
  end=$(python3 -c 'import time;print(time.time())')
  python3 -c "s=$start;e=$end;n=$n;print('%d paralel: %.2fs, %.2f Mbps'%(n,e-s,(n*422700*8/1e6)/(e-s)))"
done
```

Catat juga di `docs/PERF_BASELINE.md`: jumlah request & byte per template
(dari DevTools → Network → "Transferred"), dan LCP di Lighthouse mobile.

**Acceptance:** tabel baseline tersimpan di repo.

### 2.2 Guardrail media (CI)

File baru: `scripts/check-media-budget.mjs`, dijalankan manual dan dicolek ke
`scripts/predeploy-guard.mjs` sebagai check ke-4.

Aturan awal (threshold, bukan target):

| Aturan | Batas | Aksi |
|---|---|---|
| Satu file gambar di `public/templates/**` | > 300 KB | warning |
| Satu file gambar | > 800 KB | gagal |
| Video cover (`cover-door.mp4`, `opening*.mp4`, `hero-bg.mp4`) | > 1,2 MB | gagal |
| Total `public/templates/<code>` | > 12 MB | warning |
| Setiap `*.mp4` | `moov` setelah `mdat` | gagal (pakai `scripts/mp4-faststart.mjs`) |

**Acceptance:** `node scripts/check-media-budget.mjs` melaporkan status semua
template dan gagal pada pelanggaran.

---

## 3. Fase 1 — Perbaikan tanpa CDN (3–5 hari)

Dampak langsung ke pengalaman, tanpa menyentuh DNS/Cloudflare. Cocok dikerjakan
lebih dulu dan bisa dinikmati sendiri.

### 3.1 Preview: definisi "loaded" dan label lambat

Masalah: `src/components/TemplatePreviewModal.tsx` menganggap preview "loaded"
saat iframe `onload`, yang menunggu **semua** subresource (termasuk Supabase dan
third-party). Label "Jaringan lambat" muncul setelah 7 s karena itu, walau
jaringan tamu sehat.

Perubahan:

1. Reveal iframe lebih awal: `REVEAL_FALLBACK_MS` 9000 → **2500**.
2. Status loaded: tetap `onload`, tapi tambahkan pengecekan dokumen sudah
   tergambar (untuk in-house, iframe same-origin: `contentDocument.readyState`).
3. Label: baru tampil pada **max(8 s, onload belum)** dan teksnya netral
   ("Pratinjau masih memuat aset…"), bukan menuduh jaringan. Tombol "Buka di tab
   baru" selalu tersedia setelah 3 s.
4. `SLOW_NETWORK_MS` dijadikan konstanta terdokumentasi; jangan pakai
   `navigator.connection.effectiveType` (terbukti salah: `slow-2g` di link
   180 Mbps).

**Acceptance:** membuka preview di koneksi 4 Mbps menampilkan iframe <3 s dan
label tidak muncul kecuali aset memang masih jalan >8 s.

### 3.2 Pre-render halaman preview

`src/app/templates/[code]/preview/page.tsx` masih
`export const dynamic = "force-dynamic"`. Isinya data demo statis → jadikan
statis:

- tambah `generateStaticParams()` dari `getTemplateCodes()` /
  `TEMPLATE_MAP` (lihat `src/components/templates/index.ts`);
- `export const revalidate = 3600`;
- pastikan tidak ada pembacaan DB/headers di halaman itu.

Efek: TTFB turun, HTML bisa di-cache edge pada Fase 2.

**Acceptance:** build menghasilkan 32 halaman `●` (SSG) untuk
`/templates/[code]/preview`; TTFB <150 ms dari Jakarta.

### 3.3 Kompresi Caddy

Tambah/verifikasi di `/etc/caddy/Caddyfile`:

```
encode zstd gzip br
```

(urutan preferensi; `br` untuk browser modern). HTML saat ini hanya gzip 12 KB →
brotli ±9 KB. Kecil, tapi gratis dan menyentuh semua respons.

### 3.4 Video cover — DIBATALKAN

**Keputusan klien 2026-11-02: quality-first.** Tidak ada re-encode dan tidak ada
pemotongan durasi. Byte video tidak diubah sama sekali.

Alasan teknis yang mendukung keputusan ini (hasil uji kandidat, lihat
`docs/PERF_BASELINE.md`):

- Sumber sudah efisien: re-encode CRF 26 pada `adat-*` (540×960, 20 s)
  menghasilkan 3,2–3,6 MB **lebih besar** dari aslinya (2,7–3,1 MB).
- Hanya 3 file yang lolos SSIM ≥ 0,98 dengan hasil lebih kecil, dan semuanya
  tetap lossy: `adat-jawa/assets/opening.mp4` (−74%, SSIM 0,9835),
  `lunar-blossom/opening.mp4` (−74%, SSIM 0,9831), `lace/opening.mp4`
  (−18%, SSIM 0,9810). Ketiganya **tidak dipakai**.

Konsekuensi: penghematan byte video = 0. Percepatan video bergantung pada
cache edge Cloudflare (Fase 2), yang tidak mengubah file sama sekali.

Budget media karena itu **informasional** untuk video: file di atas 1,2 MB
dilaporkan sebagai warning, bukan pelanggaran.

### 3.5 Gambar above-the-fold

Fokus dulu yang benar-benar terlihat sebelum scroll:

| File | Sekarang | Target |
|---|---|---|
| `embroidered-garden/welcome-swans.webp` | 322 KB | ≤150 KB (960w, q≈72) |
| `embroidered-garden/dresscode-garland.webp` | 413 KB | ≤180 KB |
| `embroidered-garden/ceremony-bg.webp` | 266 KB | ≤150 KB |
| `*/cover*.webp`, poster | 121 KB | ≤80 KB |

Cara: encode ulang WebP kualitas 70–75 pada lebar maksimum yang dipakai (960 px
untuk layar 480 CSS px @2x). Simpan original di `public/templates/<code>/orig/`
selama 30 hari (tidak di-commit) untuk rollback.

### 3.6 `content-visibility` untuk section bawah

Tambahkan ke section yang jauh dari layar (galeri, gift, dresscode, wishes,
rundown):

```css
.cn-section, .eg-film, .lc-gallery { /* per template, kelas section-nya */
  content-visibility: auto;
  contain-intrinsic-size: auto 800px;
}
```

Efek: browser tidak mengunduh/melayout bagian bawah sampai mendekat. Tidak
mengubah tampilan saat terlihat.

**Acceptance:** byte awal turun ≥30% dan tidak ada section yang "hilang" saat
scroll cepat.

### 3.7 Font

- Pastikan semua `@font-face` pakai `font-display: swap`.
- `<link rel="preload">` hanya untuk 1–2 font yang dipakai di cover.
- Buang weight/italic yang tidak dipakai template (saat ini 5–8 file WOFF2 ×
  36–47 KB).

---

## 4. Fase 2 — Cloudflare proxy ($0)

Prasyarat: Fase 1 selesai dan stabil minimal 3 hari.

### 4.1 Pra-migrasi (1 hari sebelum)

1. **Turunkan TTL** semua record A/CNAME di Hostinger ke **300 s**, tunggu
   minimal 1 jam (idealnya 24 jam).
2. **Export DNS** — kondisi saat ini sudah diperiksa:
   - `aksaraa.com` → A `103.93.135.176`
   - `wedding.aksaraa.com` → A `103.93.135.176`
   - `wp.aksaraa.com` → A `103.93.135.176`
   - `*.wedding.aksaraa.com` → A `103.93.135.176`
   - **Tidak ada MX / TXT / CAA** (diverifikasi via 1.1.1.1) → tidak ada email
     yang bisa rusak.
   Simpan hasil `dig +short` ke `docs/DNS_EXPORT_<tanggal>.txt`.
3. **Backup Caddy**: `ssh askaraa@103.93.135.176 'sudo cp /etc/caddy/Caddyfile
   /etc/caddy/Caddyfile.bak-$(date +%F)'` dan `sudo cp /usr/bin/caddy
   /usr/bin/caddy.bak`.
4. Buat token Cloudflare **baru** dengan scope minimal (JANGAN pakai token yang
   pernah bocor):
   `Zone:Read`, `Zone Settings:Edit`, `Zone Rulesets:Edit`, `Cache Purge:Purge`,
   `DNS:Edit`, `Zone:Cache Rules:Edit`. Simpan sebagai `CLOUDFLARE_API_TOKEN` di
   `.env.local` (chmod 600) — jangan pernah ditempel di chat.

### 4.2 Aktifkan zone

1. Tambah zone `aksaraa.com` (Add a site) → import record hasil export.
2. Ganti nameserver di Hostinger ke NS Cloudflare.
3. Tunggu status **Active** (biasanya <1 jam).
4. Mode SSL: **Full (strict)**.

### 4.3 Sertifikat origin

Dua opsi; pilih **A** kalau tidak ingin menyentuh Caddy, pilih **B** kalau ingin
tetap bisa bypass Cloudflare.

**A. Cloudflare Origin CA (rekomendasi, paling sedikit risiko operasional)**
- Buat Origin Certificate (15 tahun) untuk `aksaraa.com`, `*.aksaraa.com`,
  `*.wedding.aksaraa.com`.
- Pasang di Caddy (file cert/key), reload.
- Kelebihan: tidak ada renewal ACME → kelas insiden 2026-10-29 hilang.
- Kekurangan: cert origin tidak publik; akses langsung ke IP tanpa proxy akan
  memperingatkan.

**B. Tetap Let's Encrypt via DNS-01 Cloudflare**
- Rebuild Caddy: tambahkan `--with github.com/caddy-dns/cloudflare@<versi>` ke
  `scripts/ops/build-caddy-linux.sh` (model: provider hostinger yang sudah ada).
- Scaffold baru `scripts/ops/libdns-cloudflare-ttl.patch` **tidak perlu** (bug TTL
  hanya milik libdns-hostinger), tapi tetap verifikasi `journalctl -u caddy`.
- Set `tls { dns cloudflare {env.CLOUDFLARE_API_TOKEN} }` di Caddyfile.
- Deploy mengikuti `scripts/ops/deploy-caddy.md` (backup → install → apt-mark
  hold → restart → verifikasi renewal).

### 4.4 Cache rules (urutan penting, rule pertama menang)

| Prioritas | Path / host | Cache | Edge TTL | Catatan |
|---|---|---|---|---|
| 1 | `*/api/*`, `*/scanner/*`, `*/qr/*`, `*/led/*` | Bypass | — | Jangan pernah di-cache |
| 2 | `*/w/*` (host `*.wedding.aksaraa.com`) | Bypass | — | Ada `?to=` per tamu |
| 3 | `*/templates/*/preview*` | Standard | 1 jam | setelah §3.2 pre-render |
| 4 | `*/templates/*` | Cache Everything | 1 bulan | aset art + video |
| 5 | `*/_next/static/*` | Cache Everything | 1 tahun | immutable |
| 6 | `*/fonts/*`, `*/images/*` | Cache Everything | 1 tahun | |
| 7 | `wp.aksaraa.com/wp-content/uploads/*` | Cache Everything | 1 bulan | zone `wp` |
| 8 | `wp.aksaraa.com/wp-json/*`, `*/wp-admin/*` | Bypass | — | API mu-plugin |

Aturan tambahan: **jangan** aktifkan "Cache Everything" untuk host
`wedding.aksaraa.com` secara global — HTML harus tetap ke origin.

### 4.5 Header asli klien

- Caddy: percayai hanya IP Cloudflare untuk `X-Forwarded-For`
  (`trusted_proxies`), dan pakai `CF-Connecting-IP` untuk rate-limit/log.
- `src/proxy.ts` tetap menerima `Host` asli (Cloudflare mempertahankannya), jadi
  rewrite `{slug}.wedding.aksaraa.com` tidak berubah.
- Set `x-forwarded-proto` agar redirect HTTPS Next tidak loop.

### 4.6 Verifikasi

```bash
# cache harus HIT setelah 2 request
curl -sI https://wedding.aksaraa.com/templates/lace/opening.mp4 | grep -i cf-cache-status
# throughput: target >= 20 Mbps untuk 4 paralel
for i in 1 2 3 4; do curl -s -o /dev/null \
  "https://wedding.aksaraa.com/templates/embroidered-garden/dresscode-garland.webp?x=$i" & done; wait
```

Checklist:
- [ ] `cf-cache-status: HIT` untuk `/templates/*`, `/_next/static/*`, font, uploads.
- [ ] `cf-cache-status: BYPASS/DYNAMIC` untuk `/api/*`, `/w/*`, `/scanner/*`.
- [ ] Undangan tamu (`{slug}.wedding.aksaraa.com/?to=Nama`) terbuka benar, nama
      tamu benar, tidak ada cache silang antar tamu.
- [ ] Scanner + QR check-in jalan (JWT, foto tamu).
- [ ] WP: mu-plugin REST (`/wp-json/aksaraa/v1/...`) tidak ter-cache.
- [ ] `npm run deploy:smoke` 32/32 hijau.
- [ ] `cert-expiry-check.sh --dry-run` sehat.

### 4.7 Observasi 14 hari

Pantau: cache hit ratio (target >85% untuk `/templates`), egress VPS (turun
drastis), error 5xx, dan laporan tamu. Jangan hapus record Hostinger sampai
periode ini selesai.

---

## 5. Fase 3 — R2 (opsional, hanya bila perlu)

Baru dikerjakan kalau salah satu benar: (a) ingin 158 MB art lepas dari disk VPS,
(b) ingin domain media terpisah, (c) video volume besar.

- Bucket `aksaraa-media`, custom domain `media.aksaraa.com` (zone harus sudah di
  Cloudflare).
- Upload `public/templates` + `public/images` (171 MB → biaya ±$0,003/bulan).
- Tambah helper `assetBase()`/`assetUrl()`; codemod 55 file (142 `url(/templates…)`
  di CSS + 30 referensi TS/TSX). Path lama tetap dilayani origin 90 hari.

---

## 6. Rollback plan

Setiap fase punya jalur balik sendiri. **RTO** = waktu sampai layanan normal.

### 6.1 Deploy aplikasi (semua fase)

`npm run deploy` sudah: snapshot build → sync additive → smoke → rollback
otomatis bila smoke gagal.

Manual bila perlu:

```bash
ssh askaraa@103.93.135.176
cd /var/www/aksara-wedding
cp -a .next/.deploy-snapshot/standalone .next/standalone
cp -a .next/.deploy-snapshot/static .next/static
pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env
```

Kode: `git revert <sha> && git push origin main`, lalu build+deploy ulang
(~3 menit). RTO: **5 menit**.

### 6.2 Fase 1 (preview UX, CSS, gambar, video)

- Kode: `git revert <sha>` per perubahan (satu commit per item) → deploy. RTO 5 menit.
- Aset gambar: original disimpan 30 hari. Ganti balik file + bump `?v=` pada
  referensi. RTO 10 menit.
- Video: file original tetap di repo (`git show <sha>:public/templates/...`) →
  `git checkout <sha> -- <path>` → deploy. RTO 10 menit.
- `content-visibility`: hapus blok CSS → deploy. RTO 5 menit.

### 6.3 Fase 2 (Cloudflare)

Urut dari yang paling ringan:

1. **Cache salah** (mis. HTML ter-cache): purge + ubah rule ke Bypass.
   `curl -X POST "https://api.cloudflare.com/client/v4/zones/<zone>/purge_cache" ...`
   RTO 2 menit.
2. **Sertifikat origin bermasalah** (502/526): pasang kembali cert lama di Caddy
   (`caddy.bak` + `Caddyfile.bak-<tanggal>`), `systemctl restart caddy`. RTO 10 menit.
3. **Proxy mengganggu aplikasi** (scanner/QR/WP REST): ubah record jadi
   **DNS only** (grey cloud) untuk host yang bermasalah — traffic kembali
   langsung ke VPS dalam <1 menit (TTL record proxied diabaikan, tapi resolusi
   lokal sudah di edge).
4. **Rollback penuh (DNS)**: kembalikan nameserver di Hostinger ke
   `lunar/solar.dns-parking.com`. Zone Hostinger **tidak boleh dihapus/diubah**
   selama 14 hari. TTL sudah 300 s → RTO **≤30 menit** (propagasi).
5. **Caddy binary rusak**: `sudo cp /usr/bin/caddy.bak /usr/bin/caddy &&
   sudo systemctl restart caddy`. RTO 5 menit.

### 6.4 Fase 3 (R2)

- Flip env `NEXT_PUBLIC_MEDIA_BASE` kembali ke kosong (path `/templates/...`
  dilayani origin). Deploy. RTO 5 menit.
- Bucket tidak dihapus 30 hari.

### 6.5 Titik tidak bisa-balik

- **Tidak ada** selama 14 hari pertama Fase 2 (DNS Hostinger dipertahankan).
- Setelah record Supabase/DB tidak disentuh sama sekali → tidak ada rollback DB
  yang diperlukan.

---

## 7. Biaya

| Item | Biaya | Catatan |
|---|---|---|
| Cloudflare Free | **$0** | CDN unlimited, wildcard proxy, cache rules |
| R2 (opsional, 0,2–0,5 GB) | **±$0,003–0,008/bln** | egress $0 |
| Cloudflare Pro | $20–25/bln | Hanya bila ingin Polish otomatis; tidak perlu jika §3.5/§3.4 dikerjakan |
| Total wajib | **$0/bln** | |

---

## 8. Jadwal & dependency

| Fase | Durasi | Dependency |
|---|---|---|
| 0 Baseline + guard | 1 hari | — |
| 1 Preview UX + pre-render | 1 hari | 0 |
| 1 Video + gambar | 2–3 hari | 0 |
| 1 `content-visibility` + font | 0,5 hari | 1 |
| 2 Pra-migrasi + zone | 1 hari | 1 stabil 3 hari |
| 2 Cache rules + verifikasi | 1 hari | 2 zone aktif |
| 2 Observasi | 14 hari | — |
| 3 R2 (opsional) | 2 hari | 2 |

---

## 9. Kriteria selesai (go/no-go)

| Metrik | Sekarang | Target |
|---|---|---|
| Byte halaman preview in-house (first screen) | 2,4–5,2 MB | **≤1,5 MB** |
| Byte total preview in-house | 5,2 MB | **≤3 MB** |
| Byte preview WP | 3,6 MB | **≤2,5 MB** |
| Throughput 4 paralel | 4,3 Mbps | **≥20 Mbps** |
| TTFB HTML `*/preview` | 250 ms (origin) | **≤150 ms** (edge) |
| `load` preview di 4 Mbps | 17–25 s | **≤6 s** |
| Cache hit `/templates/*` | 0% | **≥85%** |
| Smoke test | 32/32 | 32/32 |
| Regresi visual template | — | 0 |

Kalau salah satu target utama tidak tercapai setelah Fase 2, jangan lanjut ke
Fase 3 sebelum akar masalahnya diukur ulang (bisa jadi origin CPU, bukan
bandwidth).

---

## 10. Risiko

| Risiko | Mitigasi |
|---|---|
| Wildcard `*.wedding.aksaraa.com` salah rewrite di belakang proxy | Uji 3 slug + scanner di staging sebelum NS switch; siap grey-cloud per host |
| `?to=` ter-cache / bocor antar tamu | Rule Bypass untuk `/w/*` + `/api/*` (prioritas tertinggi) |
| Sertifikat origin/renewal | Origin CA (opsi A) atau `cert-expiry-check.timer` tetap aktif + uji renewal manual |
| Perubahan video/gambar ditolak selera | A/B + SSIM dulu, original disimpan 30 hari |
| Deploy dari tree kotor | Selalu build dari worktree `origin/main` (sudah jadi kebiasaan) |
| Token Cloudflare bocor lagi | Token scoped per project, TTL 90 hari, simpan di `.env.local` chmod 600 |

---

## 11. Langkah pertama (hari ini)

1. `scripts/check-media-budget.mjs` + baseline `docs/PERF_BASELINE.md`.
2. Perbaiki `TemplatePreviewModal` (§3.1) — dampak pengalaman paling cepat.
3. Pre-render halaman preview (§3.2).
4. Baru lanjut ke video/gambar.

Semua item Fase 1 tidak membutuhkan Cloudflare maupun kredensial apa pun.
