# Plan: Migrasi WordPress Undangan → In-House Template

**Revisi:** 07 Aug 2026
**Penulis:** Tech Lead

---

## 1. Masalah (Bukti)

- Undangan asli pasangan **tidak dirender in-house**; `/w/[slug]` me-`redirect` (307) ke `ayomarried.com/*`.

  ```
  GET https://dela-dela.wedding.aksaraa.com/           → 307 https://ayomarried.com/james-enna
  GET https://dela-dela.wedding.aksaraa.com/?to=...   → 307 https://ayomarried.com/james-enna
  ```

- **Hanya 1 komponen yang benar-benar in-house & lengkap → `HeritageJawa` (896 baris).**
- 4 komponen lain di `TEMPLATE_MAP` adalah **stub** — section terhardcode, belum mengonsumsi data `wedding_profiles` penuh:
  - `ParallaxSinematik.tsx` 64 baris · `EditorialModern.tsx` 62 · `AnimasiWatercolor.tsx` 62 · `HeritageDinamis.tsx` 77.
- **Skala sebenarnya: konversi ±100 template WordPress** (bukan memindahkan 5 komponen). Semua template produksi (`demo_url = ayomarried.com/*`) perlu direimplementasikan sebagai komponen React in-house yang hidup dari data user.

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

**Kesimpulan: semua konten undangan sudah hidup di DB in-house.** Yang perlu dikonversi hanyalah **bagian tampilan** — membangun komponen React per template (±100) yang memetakan data ini. Konten ulang di editor tidak perlu kerja DB baru.

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

> **Skala: ±100 template.** Karena bukan sekadar 5, strategi memakai **komponen bersama (shared section) + presets tema**, bukan menulis 100 komponen dari nol — sehingga tiap port = ringan dan konsisten.

### Tahap 0 — Socio resource: profil tiap WP preset
- Ambil `document` statis tiap `ayomarried.com/{slug}` sebagai referensi: urutan section & gaya visual.
- Klasifikasi tiap template → **polar kelas**: (a) konten = `profile`; (b) tampilan = komponen React + tema.

### Tahap 1 — Clear redirect (berhenti kirim tamu ke luar, cepat)
- `UPDATE web_templates SET demo_url = ''`.
- Setelah ini semua `/w/[slug]` render in-house; template tanpa komponen → fallback HTML (bukan redirect).
- `heritage-jawa` sudah penuh; 4 stub akan tetap render (belum penuh) sampai T2 — ini transisi aman, tanpa kirim ke WP.

### Tahap 2 — Bangun fondasi reusable (kunci utk skala 100)
Buat **komponen section shared** sekali, dipakai semua template:
- `TemplateSection/*`: Cover, Countdown, TheCouple, LoveStory, Events/Sessions, Gallery, Gift, Rsvp, Wishes, Footer, MusicPlayer — masing-masing menerima bagian `TemplateProps` & `theme`.
- Ini **inti biaya tetap** → setelah ada, tiap template = komposisi section + tema, bukan tulis ulang.

### Tahap 3 — Port template (per template, ±100)
- Tiap template WP → 1 file `src/components/templates/{code}.tsx` = **assembly shared sections** + tema/ornamen preset.
- Register di `TEMPLATE_MAP` + `TEMPLATE_CONFIGS` (`index.ts`), isi `web_templates.{code,name,description,theme}`.
- Urutan seksi contoh: cover → countdown → couple → kisa cinta → acara/resepsi → galeri → gift → RSVP/wishes → footer → musik.
- **Ganti stub** existing (parallax/editorial/watercolor/dinamis) dengan assembly penuh.

### Tahap 4 — Editor (pasangan ubah konten)
- Semua template mengonsumsi `TemplateProps` yang sama; editor (`editor/page.tsx`) sudah menyokong amatir field. Tidak ada kerja DB baru.
- Bila tema butuh param ekstra (countdown durasi, accent, extra section) → field **opsional**+`TemplateProps`; tanpa wajib.

### Tahap 5 — QA (regresi)
- Puppeteer render tiap undangan (desktop+mobile): semua section tampil, data pasangan benar.
- **Assert tidak ada `redirect` ke `ayomarried.com`** (`307` hilang).
- Uji edit: nama/tanggal/kisah/galeri → halaman live update.

### Tahap 6 — Deploy
- Build lokal (env prod) → rsync → `pm2 restart`. (`demo_url` sudah kosong via migration.)

---

## 6. Prioritas / Effort

> Biaya dominan = **fondasi shared sections** (Tahap 2, sekali). Setelah itu tiap template = port murah.

| Tahap | Effort | Bisnis impact |
|---|---|---|
| **T1 Clear redirect** | rendah (1 migration) | tinggi — berhenti kirim tamu ke WP |
| **T2 Fondasi shared sections + tema engine** | sedang-besar (sekali) | kunci agar 100 template feasible |
| **T3 Port per template** | per-template: rendah (assembly) | tinggi — full in-house catalog |
| **T4–T6 edit, QA, deploy** | sedang | jaminan kualitas |

> Rekomendasi: **Tahap 1 dulu** (netralisasi redirect). Lalu **Tahap 2** (fondasi shared sections) — tanpa ini 100 template mustahil dikelola. Port template mengikuti prioritas yang paling digunakan (cek `web_templates` by `selected_template_id`).

---

## 7. Keamanan / Rollback
- Cadangkan nilai `demo_url` lama sebelum di-act (SQL output).
- Rollback bila regresi: kembalikan `demo_url` (revert) — cepat.
- Setiap render baru: pastikan **tidak ada JSX/HTML error** yang mematikan fallback.

---

## 8. Terkait Capacity
- Nol tambahan bandwidth/storage: konten sudah dari `wedding_profiles` & `media` bucket. Template in-house = komponen (build), bukan media baru.
- Lihat `docs/capacity-planning.md` untuk storage/egress VPS/Supabase.