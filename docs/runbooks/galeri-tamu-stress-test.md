# Runbook Stress Test Galeri Tamu

## Tujuan
Mengukur performa upload foto Galeri Tamu saat 5-10 tamu upload bersamaan, untuk paket representatif yang punya `galeri_foto_tamu`, dan mengecek bottleneck infra/arsitektur. Termasuk verifikasi pasca-test: download ZIP dan Buku Kenangan.

## Scope
- Endpoint utama: `POST /api/guest-photos/upload` (jalur Galeri QR/event: `gallery_token + device_id + capture_id`)
- Kontrol/read: `GET /api/gallery/[token]`, `GET /api/gallery/[token]/photos`
- Download: `GET /api/guest-photos/download-all?wedding_profile_id=...` (manifest JSON; ZIP dibuat client-side via fflate)
- Dashboard: Galeri Kenangan + Buku Kenangan
- Paket representatif:
  - `gt` standalone (tier kecil & besar)
  - `dgb_sistem`
  - `dgb_prestige`
  - Undangan + `galeri_addon`
  - Opsional: legacy `/welcome` (`wedding_profile_id + guest_id`, tanpa idempotency/capture_id)

## Safety
- **JANGAN jalankan di production.** Script menolak BASE_URL prod kecuali `ALLOW_PROD=1` (tetap tidak direkomendasikan).
- Default target: staging `https://wedding-stg.aksaraa.com`.
- Staging share VPS dengan prod (`103.93.135.176`) — jalankan jam sepi, mulai kecil, monitor prod+staging.
- Gunakan couple/profile test terisolasi. Bersihkan data setelah selesai.
- Pastikan side effect eksternal mati di staging (`NOTIFY_GROUP_ENABLED=false`).

## Normalisasi galeri tamu (current)
- `src/lib/storage.ts`: `GUEST_PHOTO_MAX_DIMENSION = 2100`, `GUEST_PHOTO_MAX_BYTES = 1.75MB`
- `src/lib/imageCompress.ts`: default 2100 / 1.75MB
- `src/components/gallery/PhotoboothCamera.tsx`, `src/components/scanner/SelfieModal.tsx`: 2100 / 1.75MB
- `src/app/api/guest-photos/upload/route.ts`: raw `MAX_SIZE = 10MB`; server menormalisasi guest photo ke cap di atas.

Gunakan fixture 1.75MB / width besar (mis. 2400px) untuk menguji batas normalisasi: `node scripts/loadtest/make-photo-fixture.mjs --out scripts/loadtest/fixtures/photo-1750kb.jpg --width 2400 --height 3200 --target-bytes 1835008`.

## Pra-syarat
- `k6 version`
- Akses staging app + monitoring VPS + Supabase staging
- Couple test per paket dengan:
  - `gallery_token` aktif
  - window aktif (`start-1h .. end+1h`)
  - `payment_status` bukan `UNPAID`
  - `photos_cleared_at` null
  - quota/cap cukup
- Fixture foto: `node scripts/loadtest/make-photo-fixture.mjs --out scripts/loadtest/fixtures/photo-1750kb.jpg --width 2400 --height 3200 --target-bytes 1835008`

## Setup "miniroll" (quota minimal, cepat diisi)
Untuk verifikasi cepat download ZIP & Buku Kenangan, pakai config kecil:
- `galeri_photos_per_guest = 2`
- `galeri_guest_count = 5`
- event cap efektif kecil (2x5=10), mudah penuh dan mudah diverifikasi.

Pastikan status galeri aktif. Untuk DGB, ingat base quota ditambah add-on; gunakan nilai kecil yang tetap valid.

## Metrik
### Aplikasi
- success rate, p50/p95/p99 latency upload
- 409 QUOTA_DEVICE/QUOTA_EVENT, 410 UPCOMING/ENDED/CLEARED, 429 rate limit
- dedup `capture_id` benar
- tidak ada over-quota/cap

### Infra
- VPS: CPU/core, load avg, RAM, Node RSS, PM2 restart, conn
- Supabase: storage upload latency/error, RPC/DB latency, object growth, egress

## Skenario
- **S1 Burst**: 5, 10, 15 VU, 1 foto/VU, start bersamaan, ulang 3x.
- **S2 Venue realistic**: 10 VU, 5 menit, 2-4 foto/VU, think time 10-30s, 80% same-IP.
- **S3 Sustained mix**: 10 VU, 10 menit, 70% upload + 30% resolve.
- **S4 Idempotency**: capture_id sama dikirim 3x, expect dedup true.
- **S5 Matrix paket**: S1+S2 untuk gt kecil/besar, dgb_sistem, dgb_prestige, undangan+addon.

## Eksekusi
```bash
export BASE_URL="https://wedding-stg.aksaraa.com"
export GALLERY_TOKEN="<token>"
export SCENARIO="burst"   # burst|venue|sustained|idempotency
export VUS="10"
export DURATION="5m"
export PHOTO_FILE="./scripts/loadtest/fixtures/photo-1750kb.jpg"
export TARGET_BYTES="1835008"
export TARGET_WIDTH="2400"
export SAME_IP_MODE="1"
export ALLOW_PROD="0"

k6 run scripts/loadtest/galeri-tamu-upload.k6.js
```

Burst matrix:
```bash
for n in 5 10 15; do
  VUS=$n SCENARIO=burst k6 run --summary-export=./tmp/k6-galeri-burst-$n.json scripts/loadtest/galeri-tamu-upload.k6.js
done
```

## Verifikasi Download ZIP & Buku Kenangan
Setelah ada foto test:

1. **Download ZIP (dashboard)**
   - Login ke dashboard couple test.
   - Buka Galeri Kenangan.
   - Klik Download/Unduh semua. Endpoint manifest: `GET /api/guest-photos/download-all?wedding_profile_id=<id>&offset=0&limit=200`.
   - Verifikasi: browser mengunduh ZIP, isi foto sesuai, nama file/folder masuk akal, captions.txt ada, tidak ada error 401/429/500.

2. **Buku Kenangan**
   - Buka `Dashboard > Galeri Kenangan > Buku` / halaman buku kenangan.
   - Verifikasi: foto muncul, urutan benar, caption/uploader tampil, layout tidak pecah, download/print (jika ada) bekerja.

3. **API manifest cek cepat**
   ```bash
   curl -sS -H "Cookie: <session>" \
     "https://wedding-stg.aksaraa.com/api/guest-photos/download-all?wedding_profile_id=<id>&offset=0&limit=200" | jq '{total, count:(.photos|length), sample:.photos[0]}'
   ```

## Monitoring
VPS:
```bash
ssh -i ~/.ssh/aksaraa_deploy -o BatchMode=yes askaraa@103.93.135.176 "date; uptime; pm2 ls"
ssh -i ~/.ssh/aksaraa_deploy -o BatchMode=yes askaraa@103.93.135.176 "pm2 logs aksara-wedding-staging --lines 100"
```

Supabase staging: cek `guest_photos`, storage `guest-photos/`, `thumbs/`, error log.

## Cleanup
- Hapus row test: `guest_photos` dengan `wedding_profile_id=<test>` dan `device_id like 'loadtest-%'`.
- Hapus storage object terkait original + thumbs.
- Pastikan count kembali bersih.

SQL cek:
```sql
select count(*) from guest_photos where wedding_profile_id = '<PROFILE_ID>' and device_id like 'loadtest-%';
select idempotency_key, count(*) from guest_photos where wedding_profile_id = '<PROFILE_ID>' and idempotency_key is not null group by 1 having count(*) > 1;
```

## Kriteria lulus awal
- 10 upload simultan: >=99% sukses, p95 < 5s, 0 5xx, 0 PM2 restart.
- Tidak ada over-quota/cap; idempotency benar.
- Rate-limit upload di-scope per **device_id** (12/jam, cukup untuk kuota maks 10 foto + retry) dengan **ceiling per IP 1000/jam**. Venue yang berbagi satu Wi-Fi tidak lagi memblokir tamu ke-21; uji dengan >20 upload dari satu IP untuk membuktikan.
- Download ZIP dan Buku Kenangan berhasil dari data test.
