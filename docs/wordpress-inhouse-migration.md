# Plan: Migrasi WordPress Undangan → In-House Template

**Revisi:** 07 Aug 2026
**Penulis:** Tech Lead

---

## 1. Masalah (Bukti)

- Undangan asli pasangan **tidak dirender in-house**; `/w/[slug]` me-`redirect` (307) ke situs WordPress `ayomarried.com/*`.

  ```
  GET https://dela-dela.wedding.aksaraa.com/           → 307 https://ayomarried.com/james-enna
  GET https://dela-dela.wedding.aksaraa.com/?to=...   → 307 https://ayomarried.com/james-enna
  ```

- Di prod ada **10 template**, 8 di antaranya `demo_url` = `ayomarried.com/*`; hanya 5 punya komponen React in-house.

| code | demo_url (prod) | Komponen in-house |
|---|---|---|
| `heritage-jawa` | (kosong) | ✅ |
| `parallax-sinematik` | valdo-debora | ✅ |
| `editorial-modern` | raja-tya | ✅ |
| `animasi-watercolor` | reinhard-maici | ✅ |
| `heritage-dinamis` | james-enna | ✅ |
| `sinematik-editorial` | dinda-semi | ❌ |
| `Minang` | aisyah-bagas | ❌ |
| `batak` | jimmi-johanna | ❌ |
| `sinematik` | weni-bagas | ❌ |
| `heritage` | jones-edwika | ❌ |

**Akibat:** pasangan memilih template, tapi tamunya dibawa ke situs pihak ketiga (WP), tidak sinkron dgn data `wedding_profiles`, tidak bisa diedit/dipersonalisasi, dan kunci profil ke ekosistem luar.

---

## 2. Tujuan

Semua undangan WordPress di-render **in-house**, didorong penuh oleh data `wedding_profiles` yang bisa **di-edit pasangan** — tanpa redirect ke luar, tanpa dependensi WP.

---

## 3. Data yang Bisa Diganti Couple (Sumber `wedding_profiles` + anak tabel)

Kolom/asal data saat ini yang **sudah** didukung editor & menjadi input template:

| Area (konten couple) | Penyimpanan DB | Type |
|---|---|---|
| Hero | `couple_illustration_url`, `display_name` | text URL / text |
| Nama mempelai | `bride_name`, `groom_name`, `groom_full_name`, `bride_full_name` | text |
| Foto mempelai | `groom_photo_url`, `bride_photo_url` | text URL |
| Orang tua | `groom_parents`, `bride_parents` | text |
| IG | `groom_instagram` | text |
| Tanggal acara | `estimated_wedding_date` | date |
| **Sesi acara** | `sessions` (**JSONB**) `[{name,date,time,timezone,venue,address,maps_url}]` | jsonb |
| **Kisah cinta** | `stories` (**JSONB**) `[{year,title,description,image_url}]` | jsonb |
| **Galeri** | `gallery_photos` (**JSONB**) `[url…]` (cap ~10) | jsonb |
| Kutipan | `quote_text`, `quote_source` | text |
| Keluarga undang | `inviting_families` | text (JSON di-read) |
| Amplop/rek | `gift_accounts` (child) `[bank/ewallet…]` | table |
| Alamat kirim | `gift_addresses.full_address` | child |
| Musik | `selected_track_id` → `web_tracks.audio_url` | FK |

**Per konteks: semua konten undangan sudah living di DB in-house.** Tidak ada konten WP "baru" — yang belum in-house hanyalah **tampilan/komponen** untuk satu `set` template.

---

## 4. Arsitektur Target

Mirror pola existing:

```
/w/[slug]  (server component)
   → supabaseAdmin.read wedding_profiles (+ gift_accounts, gift_addresses, web_tracks)
   → getTemplateComponent(code)  // TEMPLATE_MAP
   → <Template {...props dari wedding_profiles} />   // render in-house
   (hapus redirect ke demo_url)
```

### Cara kerja `/w/[slug]` saat ini (line 60–72)
- Bila `guest` + `web_templates.demo_url` → `redirect(demo_url)`.
- Bila ada komponen → render; bila tidak → fallback default.

**Perubahan kritis:** set `demo_url` menjadi `''` untuk semua template produksi agar `redirect` tidak pernah aktif & selalu render in-house.

---

## 5. Strategi Migrasi (paling mudah → urut)

### Tahap 0 — Baselines & Kewaspadaan
- Ambil `document` statis setiap WP demo (`ayomarried.com/{slug}`) sebagai referensi section order & visual.
- karena milik: (a) konten=profile, (b) tampilan=komponen React.

### Tahap 1 — Clear redirect (mempercepat, tanpa binaan baru template)
- `UPDATE web_templates SET demo_url = '' WHERE code IN (semua)`
- Membuat semua pasangan dengan template in-house **langsung render**.
- Template yg belum ada komponen → fallback (tidak `redirect` ke luar).

> 5 template bereksisting (heritage-jawa, parallax, editorial, watercolor, heritage-dinamis) **langsung aman** setelah `demo_url=''` karena komponen ada.

### Tahap 2 — Buat komponen in-house untuk remaining 5 code
- `src/components/templates/{code}.tsx`, register di `TEMPLATE_MAP` + `TEMPLATE_CONFIGS` di `index.ts`.
- Langganan terhadap `TemplateProps` yang sama (`TemplateProps` ssdh memuat data editor).
- Urutan seksi mengikuti snapshot WP: cover → countdown → the couple → kisa cinta → acara/resepsi → galeri → gift → RSVP/ucapan → footer/musik (default), menyesuaikan tiap tema.

### Tahap 3 — Pastikan editor bisa ubah seluruh konten
- Editor (`editor/page.tsx`) sudah mensubsuk semua field. Render `create` template perlu mengonsumsi prop yang sama; tidak ada kerja DB tambahan.
- Bila template tambahan butuh konten baru (contoh: countdown durasi, warna aksen, ekstra seksi) → **tambah field opsional** di editor + `TemplateProps` (opsional), tanpa Wajib.

### Tahap 4 — QA (regresi)
- Puppeteer: render setiap undangan di prod/staging untuk pasangan (desktop+mobile): semua section tampil, data pasangan benar.
- **Tidak boleh ada `redirect` ke `ayomarried.com`** (assert `307` hilang; 200 timeout).
- Uji edit: ubah nama/tanggal/kisah/galeri lewat editor → halaman live update.

### Tahap 5 — Deploy
- Build lokal (env prod) → rsync → `pm2 restart`. (update `demo_url` via DB).

---

## 6. Prioritas / Effort

| Tahap | Effort | Bisnis impact |
|---|---|---|
| **T1 Clear redirect** | rendah (1 migration) | tinggi — hentikan redirect, semua in-house mulai |
| **T2 Komponen untuk 5 code WP-only** | sedang (5 komponen) | tinggi — buka full template list in-house |
| **T3 / (dict) edit & QA** | sedang | tinggi — pemastian |

> Rekomendasi: **kerjakan Tahap 1 dulu** (netralisasi redirect). Lalu Tahap 2 untuk 3–5 template paling digunakan (cek usage di `web_templates` by `selected_template_id`) sebelum pasang sisanya.

---

## 7. Keamanan / Rollback
- Cadangkan nilai `demo_url` lama sebelum di-act (SQL output).
- Rollback bila regresi: kembalikan `demo_url` (revert) — cepat.
- Setiap render baru: pastikan **tidak ada JSX/HTML error** yang mematikan fallback.

---

## 8. Terkait Capacity
- Nol tambahan bandwidth/storage: konten sudah dari `wedding_profiles` & `media` bucket. Template in-house = komponen (build), bukan media baru.
- Lihat `docs/capacity-planning.md` untuk storage/egress VPS/Supabase.