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
| VPS `103.93.135.176` | 2 vCPU, 1.9GiB RAM, disk 58GB (44GB free), swap **0B** |
| PM2 processes | 5 processes ±620MB total (`aksara-wedding` 126MB, `whatsapp` 64MB, `whatsapp-cron` 73MB, `aksaraa` 165MB, `pencatatan` 192MB) |
| Standalone `.next` | 51MB (5 template saat ini) |
| Supabase bucket `media` | public, fileSizeLimit 20MB, MIME: jpeg/png/webp/svg/mp3/wav/ogg |
| Supabase bucket `template-media` | public, tanpa limit |
| Build `next build` | **harus lokal** (VPS 2GB RAM) → rsync → pm2 restart |
| RLS | **0 policy** (akses dikontrol app: anon/service-role) |
| Env | Prod `ylmfgorryxzpdckkebnr`, Staging `jclolnjkjhyjilvymagr`, Local 127.0.0.1:54321 |

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
| **Postgres** | 20 × ~0.75MB ≈ **15MB/bln**, 3bln ≈ 45MB |
| **Egress — undangan dilihat** | 20 pasangan × 500 tamu × aset terlihat ≈ 2–15GB/bln |
| **Egress — download galeri** | 20 × ~0.75GB ≈ **15GB/bln** bila semua unduh |
| **Egress total** | **±17–30GB/bln** |

> **Verdict Free:** Storage 45GB >> 1GB, Egress 30GB > 5GB → **Free tidak cukup sejak bulan #1. Pro wajib.**

---

## 6. VPS compute & memory

- Cukup untuk 20 pasangan umumnya (concurrency low). Risiko OOM saat `next build` → **dilarang di VPS**; tambah swap 1–2GB disarankan.
- 100 template in-house: disk +100–300MB (aman). **Pilot 10 template dulu → ukur `.next/standalone` & RAM `next build`.**

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

## 9. Download Galeri (pending — hot-spot egress)

Route `GET /api/guest-photos/download-all` server-side mengumpulkan seluruh foto ke ZIP:
- Per unduhan ≈ **0.75GB** (250 × 3MB).
- 20 pasangan × 2 unduhan/bulan → ≈ **30GB/bln** tanpa CDN.

**Rekomendasi:**
- Setelah naik **Pro (Smart CDN)**, seluruh penyajian foto (termasuk aset dari download) ditangani **CDN**, sehingga egress foto keluar dari Supabase → **tidak dibebankan sebagai egress terpusat** (Smart CDN egress terpisah/blok).
- Opsi tambahan: batasi download admin (throttle/per-request), atau jadikan ZIP **cacheable** (cache-control).

---

## 10. Pending Items — Impact & Action

| Item | Tipe Biaya | Impact | Aksi |
|---|---|---|---|
| **Template in-house (±100)** | build/disk sekali | static +100–500MB, RAM build | **pilot 10 → ukur → batch** |
| **WordPress → in-house** | build sekali / preview route | SSR `/demo/[code]` per tpl | implement `/demo` route (sudah ada fallback `demoUrl || /demo/{code}`) |
| **Download galeri** | egress repetitif | ~15–25GB/bln | offload ke Smart CDN (Pro) / rate-limit |
| **Reminder berbasis quota** | CPU mungil | tier (`wa_blast_tier`) sudah support | monitoring `wa_blast_schedules` |

---

## 11. Quick Reference Sheet

| Metrik | 1 pasangan (500 ug) | 20 pasangan (retensi 3 bln) |
|---|---|---|
| Storage foto (tak dikompresi) | ±0.5–1.25GB | ±45GB (maks 75GB) |
| Postgres | ~0.75MB | ~45MB |
| Baris DB | ~1.000–2.000 | ~40–120K |
| Egress (undangan + download) | ±1–2GB | ±17–40GB |
| VPS RAM proc | 126MB | ~620MB total (OK) |
| VPS disk | 51MB static | +100–500MB (template) |

---

## 12. Kesimpulan

1. **Naikkan Supabase Free → Pro ($25/bln)** sebagai langkah pertama — menyelesaikan storage, egress, backup, dan **Smart CDN** (performa naik, tanpa rework).
2. **Jangan kompresi** foto (keputusan bisnis) — cukup andalkan **Pro CDN** untuk kecepatan (upload tetap max 5MB).
3. **Retention 3 bulan** — volume foto ~45GB tersimpan; sudah dalam Pro allowance; monitor jika mendekati 50GB.
4. **Template in-house** → pilot 10 template dulu sebelum scale ke 100.
5. **VPS** — cukup; tambahkan swap 1–2GB & jangan build di server.