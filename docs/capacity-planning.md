# Capacity & Scale Planning — Aksaraa Wedding

**Revisi:** 07 Aug 2026
**Penulis:** Tech Lead

---

## 1. Ringkasan Eksekutif

- **Bottleneck utama = Supabase Storage (foto) + Egress (undangan dilihat + download galeri).**
  Bukan Postgres (kecil), bukan CPU/Memory VPS (memadai).
- Skenario **20 pasangan/bulan**, retention data **3 bulan**, foto **tidak dikompresi (max 5MB)**.
- **Keputusan storage: Supabase Pro ($25/bln).** Pada volume target, bebas menyumbang storage (100GB) & egress (250GB), sekaligus mengaktifkan **Smart CDN** (tidak ganggu performa, tanpa code change). Tidak rekomendasi R2/B2 untuk skala ini (integration cost > saving).
- **Hot-spot yang harus diprioritaskan:**
1. Galeri foto tamu (storage) — dominan.
2. **Download galeri** (egress) — ~625MB per unduhan.
3. Undangan dibuka tamu (egress) — 500 tamu × aset.
- Pending item `template in-house (±100)` & `WordPress → in-house` = **biaya sekali** (build/disk), bukan monthly.

---

## 2. Infrastruktur Saat Ini (Baseline)

| Komponen | Nilai |
|---|---|
| VPS `103.93.135.176` | 2 vCPU, 1.9GiB RAM, disk 58GB (44GB free), **swap 2GB (aktif 07 Aug 2026, persist `/etc/fstab`)** |
| PM2 processes | 5 processes ±640MB total (`aksara-wedding` 139MB, `whatsapp` 65MB, `whatsapp-cron` 73MB, `aksaraa` 166MB, `pencatatan` 195MB) — available RAM ±1.1GB |
| OOM history | **0 kejadian** (belum pernah ter-kill, dmesg kosong) |
| Standalone `.next` | 51MB (5 template saat ini) |
| Supabase bucket `media` | public, fileSizeLimit 20MB, MIME: jpeg/png/webp/svg/mp3/wav/ogg |
| Supabase bucket `template-media` | public, tanpa limit |
| Build `next build` | **harus lokal** (VPS 2GB RAM) → rsync → pm2 restart |
| RLS | **0 policy** (akses dikontrol app: anon/service-role) |
| Env | Prod `ylmfgorryxzpdckkebnr`, Staging `jclolnjkjhyjilvymagr`, Local 127.0.0.1:54321 |
| **RLS / Storage policy** | **0 policy** — akses dikontrol app (service-role/anon). **Gap keamanan terpantau** (lihat §8) |

---

## 3. Supabase Plan — Batas (2026)

| Item | **Free** | **Pro ($25/bln)** |
|---|---|---|
| Database size | 500MB | 8GB, lewatnya $0.125/GB |
| **Storage (file)** | 1GB | **100GB**, lewatnya $0.021/GB |
| **Egress/bandwidth** | **5GB/bln** | **250GB/bln**, lewatnya $0.09/GB |
| Penonaktifan | pause setelah 1 minggu idle | tidak pernah |
| Autobackup | tidak ada | 7 hari |
| CDN | Basic | **Smart CDN** |

> **Konsekuensi:** Pro menghapus masalah auto-pause (free rentan mati saat idle), backup otomatis, dan membuat CDN aktif — semua tanpa perf impact.

---

## 4. Model Per-Pasangan (500 undangan)

**Asumsi (sesuai permintaan):**
- 500 undangan; **50% upload 1 foto galeri** → 250 foto.
- **50% kirim wish** → 250 wish.
- RSVP respond ±70% → 350 update in-place.
- Retention 3 bulan → hapus data/foto setelah 3 bulan.

### 4.a. Database (per pasangan)

| Entity | Baris | Ukuran |
|---|---|---|
| `guests` | 500 | ~250KB |
| `guest_photos` (ref) | 250 | ~75KB |
| `wishes` | 250 | ~0.1–0.2MB |
| check-in/RSVP/souvenir/opened | in-place | ~0.2KB/guest |
| `wa_blast_schedules` | 1 (per wedding) | kecil |
| `wedding_profiles` + JSONB (sessions/stories/gallery) | 1 | kecil |

**Per pasangan DB: < 1MB.** → Bukan masalah.

### 4.b. Storage objek (per pasangan) — **dominan**

Foto **tidak dikompresi**, max **5MB**, avg smartphone JPEG ≈ **2.5–3MB**.

| Item | Jumlah | Estimasi |
|---|---|---|
| Foto galeri tamu (50%) | 250 | **±0.6–1.25GB** (avg 2.5MB → ~0.75GB) |
| Foto pasangan/editor (groom, bride, illustration, galeri, stories) | ~12 | ~30–60MB |
| Audio | 0 (seeded/bukan upload) | 0 |

**Per pasangan ≈ 0.75GB khas, hingga 1.25GB.**

### 4.c. QR / welcome / wish-wall (client-side, 0 storage)

- **QR** dibuat client-side (`qrcode` lib), **tidak disimpan**. Storage hanya menyimpan string token/slug.
- **Welcome/check-in** = write in-place pada `guests`.
- **Wish** = 1 baris `wishes`.
- **Wish wall LED** = mini push.

---

## 5. Volume & Biaya — 20 Pasangan / Bulan (retention 3 bulan)

Upload rate foto ≈ 20 × 0.75GB ≈ **15GB/bln** (20×1.25GB ≈ 25GB maks).

Dengan retention 3 bulan → pasangan aktif bersamaan ≈ 60 (20×3).

| Komponen | Nilai |
|---|---|
| **Storage (foto) tersimpan** | ~20 × 0.75GB × 3 bln ≈ **45GB** (maks ~75GB) |
| Storage (couple media) | ~60 × 45MB ≈ 2.7GB |
| Storage (template in-house, ±100, sekali) | **~20MB** (lihat §7) — negligible, tidak diper-time-counter |
| **Postgres** | 20 × ~0.75MB ≈ **15MB/bln**, 3bln ≈ 45MB |
| **Egress — undangan dilihat** | 20 pasangan × 500 tamu × aset terlihat ≈ 2–15GB/bln |
| **Egress — download galeri** | 20 × ~0.75GB ≈ **15GB/bln** bila semua unduh |
| **Egress total** | **±17–30GB/bln** |

> **Verdict Free:** Storage 45GB >> 1GB, Egress 30GB > 5GB → **Free tidak cukup sejak bulan #1. Pro wajib.**

> **Catatan template:** 100+ template in-house = **sekali bayar ~20MB Supabase**, tidak tumbuh per pasangan (aset demo/texture shared antar semua template lewat `ASSETS`). Jadi tidak menambah angka monthly di atas.

---

## 6. VPS compute & memory

- Cukup untuk 20 pasangan umumnya (concurrency low). Risiko OOM saat `next build` → **dilarang di VPS**; **swap 2GB sekarang aktif** (jaring pengaman OOM, 07 Aug 2026).
- 100 template in-house: disk +100–300MB (aman), **tetapi** tiap template baru menambah **manifest route + kode module di RAM `next-server` runtime** (cukup dampak pada `next start`, bukan hanya disk). **Pilot 10 template dulu → ukur `.next/standalone` & RAM `next start`** sebelum scale ke 100.
- **Peak / spike (event-driven) — risk nyata:** pernikahan serentak Jumat–Minggu malam (18.00–21.00). Bila 3–5 pasangan bersamaan × 500 tamu → **1.500–2.500 tamu aktif** (load aset+audio, upload 5MB, RSVP/wish write). Uji beban **k6/Locust skenario 1.000 concurrent** sebelum sistematika jam sibuk; waspadai bottleneck **event-loop Node.js (2 vCPU)** & **connection pool Postgres**. Mitigasi: SM pooling (pgbouncer), asset dari CDN (bukan VPS), throttling upload.

---

## 7. Rekomendasi storage — reliable & murah

**Opsi A — Supabase Pro ($25/bln)** :white_check_mark: **dipilih**
- Menyumbang **50GB storage** & **250GB egress** dari bulanan (45GB & 17–40GB). Overage cheap ($0.021/GB storage, $0.09/GB egress).
- **Smart CDN aktif** → penyajian foto cepat **tanpa mengganggu performa**, minim code/work.
- **Migrasi: NOL** (tetap Supabase bucket yang sama), cukup upgrade plan → tidak perlu ubah `.env`/code.

**Opsi B — R2/B2 offload (lebih murah tetapi penuh kerja)**
- Supabase DB/Auth + foto di **Cloudflare R2 (0 egress) / Backblaze B2 (~$6/TB)**.
- Egress jadi ~0 untuk foto (CDN). Butuh rebuild `src/lib/storage.ts` + presigned/URL mapping + download-all kita fetch ulang dari R2.
- **Mengingat skala 40GB & integrasi cost, belum layak** — simpan sebagai jalur bila volume >> 100GB/bln.

---

## 8. Keamanan Storage & DB (RLS 0 policy — GAP)

Bucket `media`/`template-media` **public** + `fileSizeLimit 20MB`, **RLS 0 policy** (kontrol penuh di app: anon/service-role).

**Risiko:** bila anon/service-role key bocor, attacker bisa **upload/overwrite/delete file** langsung di `media` → boros quota storage/egress.

**Mitigasi minimal yang direncanakan (action item):**
- **RLS pada tabel sensitif** (`wedding_profiles`, `guests`, `guest_photos`, `wishes`) → non-pub hanya lewat service-role; anon terbatas.
- **Storage policy bucket `media`**: batasi `INSERT`/`DELETE` (hanya app/service di path tertentu), file tetap public-read (tujuannya render & download via CDN).
- **Jangan pakai anon untuk operasi admin**; simpan service-role key server-only (sudah di policy).
- Re-verifikasi setelah policy aktif (smoke test upload tamu + render quad masih jalan).

---

## 9. Download Galeri — REDESIGN WAJIB (hot-spot egress + OOM)

Route `GET /api/guest-photos/download-all` **server-side ZIP** — **BURUK**, 3 masalah:

1. **OOM pada VPS.** ZIP ±0.75GB (250×3MB) dibangun di memori/disk VPS yang available hanya ±1.1GB → risiko **Linux OOM-killer mematikan PM2** (hanya bertahan swap 2GB, bukan solusi).
2. **Egress ganda.** Foto: Supabase→VPS (egress S) lalu VPS→user (bandwidth VPS) — dua kali transit.
3. **Mono CDN.** Smart CDN tidak men-cache endpoint API dinamis (`/api/...`) secara otomatis. ZIP dinamis ≠ aset CDN.

**Redesign (pilih satu):**
- **A — Client-side ZIP (recommended, 0 server memory):** endpoint hanya bikin daftar [presigned/public URLs]; browser pakai **JSZip** download foto langsung dari CDN & zip di device user. Egress hanya sekali (Supabase/CDN→user, masuk Smart CDN bila URL dikirim dari Supabase). RAM/CUM VPS = ~0.
- **B — Presigned streaming tanpa ZIP:** bila ZIP benar dibutuhkan server-side, pakai **presigned URL ke objek** (bukan server-assemble), atau **background worker** terpisah (bukan event-loop Next.js) → tanpa smart CDN benefit.

**Estimasi egress tetap** (dari CDN, tak sentuh VPS):
- Per unduhan ≈ 0.75GB (250×3MB) → 20 unduhan/bln ≈ 15GB/bln (dari budget 250GB Pro → aman).

> **Aksi:** pindah ke skema client-side zip; tambah throttle/batas unduhan per couple & `Cache-Control` bila ZIP di-cache CDN.

**Retensi 3 bulan — TIDAK dihapus otomatis (keputusan: skip hard-delete cron).**
- **Tanpa cron auto-hapus**, volume foto akan **tumbuh linear** ±15–25GB/bulan → menembus 100GB Pro dalam **±5–6 bulan** (4–5× skenario di §5).
- Karena user menolak hard delete otomatis, mitigasi diganti **monitoring & pembersihan manual berkala** (dashboard/satelit egress+storage), ditambah **opsi downgrade/arsip cold storage** bila mendekati limit — **bukan cron destroy otomatis**.

---

## 10. Pending Items — Impact & Action

| Item | Tipe Biaya | Impact | Aksi |
|---|---|---|---|
| **Template in-house (±100)** | build/disk sekali + ~20MB Supabase | static +100–500MB (VPS disk), RAM build | **pilot 10 → ukur → batch** |
| **WordPress → in-house** | build sekali / preview route | SSR `/demo/[code]` per tpl | isi `/demo/[code]`. Sudah **ada** fallback `demoUrl || /demo/{code}` di modal |

> **Detail WordPress → in-house:** `src/app/demo/[code]/page.tsx` sudah tersedia & merender tiap template dgn data contoh; `TemplatePreviewModal` fallback otomatis ke `/demo/{code}` saat `demo_url` kosong. Karena itu cukup kosongkan `demo_url` (di seed/schema) → semua demo langsung in-house via `/demo`. Tidak ada kode penyimpan gambar baru; demo asset `ASSETS.demo` ±7 jpg + 1 audio ≈ shared ~0.4MB.

---

## 11. Quick Reference Sheet

| Metrik | 1 pasangan (500 ug) | 20 pasangan (retensi 3 bln) |
|---|---|---|
| Storage foto (tak dikompresi) | ±0.5–1.25GB | ±45GB (maks 75GB) |
| Postgres | ~0.75MB | ~45MB |
| Baris DB | ~1.000–2.000 | ~40–120K |
| Egress (undangan + download) | ±1–2GB | ±17–40GB |
| VPS RAM proc | 126MB | ~640MB total (OK) |
| VPS disk | 51MB static | +100–500MB (template) |
| **Download galeri** | server-side ZIP (batal) | **client-side zip → 0 RAM VPS** |

---

## 12. Kesimpulan

1. **Naikkan Supabase Free → Pro ($25/bln)** sebagai langkah pertama — menyelesaikan storage, egress, backup, dan **Smart CDN** (performa naik, tanpa rework).
2. **Jangan kompresi** foto (keputusan bisnis) — cukup andalkan **Pro CDN** untuk kecepatan (upload tetap max 5MB).
3. **Retensi 3 bulan — SKIP hard-delete otomatis (keputusan user).** Upload foto ±15–25GB/bln → wajib **monitor manual** storage/egress (dashboard); rencana **cold storage/arsip** bila mendekati 100GB (terjadi ±5–6 bln tanpa clean-up).
4. **Download galeri** → **client-side zip** (JSZip, URL CDN), **tanpa VPS-assemble** — menyelesaikan OOM & egress ganda.
5. **RLS/storage policy** → aktifkan minimal (RLS tabel sensitif + policy insert/delete bucket) untuk menutup eksposur bucket publik.
6. **Template in-house** → pilot 10 template dulu, ukur RAM `next start` & standalone, sebelum scale ke 100.
7. **VPS** — swap **2GB aktif** (jaring pengaman OOM); jangan build di server; **load test k6/Locust** utk skenario spike 1.000 concurrent sebelum jam sibuk.