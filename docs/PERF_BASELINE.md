# Baseline Performa — Aksaraa Wedding

Diukur: 2026-11-02, dari mesin di jaringan yang sama dengan HP yang dipakai
menguji (bukan dari VPS, bukan dari CDN).

Cara mengukur ulang ada di `docs/PLAN_PERF_CDN.md` §2.1. Semua angka di bawah
harus dibandingkan dengan metrik yang sama setelah Fase 1 dan Fase 2.

---

## 1. Throughput origin (VPS `103.93.135.176`)

| Uji | Hasil |
|---|---|
| 1 koneksi, `cover-door.mp4` 2,4 MB | 2,49 s per 0,5 MB → **2,0 Mbps** |
| 1 koneksi, `dresscode-garland.webp` 413 KB | **3,0 Mbps** |
| 4 paralel (4 × 413 KB) | **4,30 Mbps** total |
| 8 paralel (8 × 413 KB) | **4,15 Mbps** total |
| 4 paralel (4 × 2,4 MB) | **3,76 Mbps** total |

Pembanding di jaringan yang sama:

| Target | Hasil |
|---|---|
| Cloudflare `speed.cloudflare.com` 10 MB | 6,8 Mbps |
| OVH `proof.ovh.net` 10 MB | **13,6 Mbps** |

Kesimpulan: paralel 4 vs 8 tidak menambah throughput → **plafon ±4 Mbps ada di
sisi VPS/uplink, bukan di jaringan pengunjung**.

Latensi origin sehat: TTFB HTML 170–310 ms, `dns` 3–60 ms, TLS 110–230 ms.

---

## 2. Berat halaman

| Halaman | Request | Byte | `load` event |
|---|---|---|---|
| `/templates/embroidered-garden/preview` | 52 | **5,2 MB** | — |
| `/templates/adat-jawa/preview` | 39 | **1,7 MB** | 17,5 s |
| `wp.aksaraa.com/template-1/?aksaraa_preview=1` | **121** | **3,6 MB** | 24,8 s |

`load` 17,5 s dan 24,8 s diukur di koneksi 180 Mbps → penyebabnya stall
third-party, bukan bandwidth:

- `ylmfgorryxzpdckkebnr.supabase.co/.../aksaraa-logo.jpg` → **10,7 s** (revalidasi 304)
- `wp.aksaraa.com/template-1` memanggil 4 request ke `ayomarried.com`

Rincian host pada preview `embroidered-garden`:

| Host | Request | Byte |
|---|---|---|
| `wedding.aksaraa.com` | 50 | 5.334 KB |
| `ylmfgorryxzpdckkebnr.supabase.co` | 1 | 0 (304) |
| `fonts.googleapis.com` | 1 | 0,4 KB |

File terberat: `cover-door.mp4` 2.423 KB, `dresscode-garland.webp` 413 KB,
`welcome-swans.webp` 322 KB, `ceremony-bg.webp` 266 KB, `countdown-frame.webp`
184 KB, `story-frame.webp` 128 KB, `cover-door-poster.webp` 121 KB.

---

## 3. Aset template (dari `node scripts/check-media-budget.mjs`)

```
Total 25 templates: 158,6 MB, 86 warning(s), 25 violation(s)
```

Pelanggaran batas saat ini (batas: gambar 800 KB, video 1,2 MB):

| Template | Item | Ukuran |
|---|---|---|
| `adat-bali` | `parallax-overlay.webp` | 2.310 KB |
| `adat-bali` | `fallback.webp` | 1.567 KB |
| `adat-jawa` | `assets/opening.mp4` | 6.666 KB |
| `adat-jawa` | `assets/Comp-11-9c8078.webp` | 1.381 KB |
| `lunar-blossom` | `opening.mp4` | 5.414 KB |
| `lunar-blossom` | `assets/the-wedding-of-3.webp` | 1.929 KB |
| `piano-garden` | `opening-garden.mp4` | 4.159 KB |
| `altar-garden` | `opening-garden.mp4` | 3.912 KB |
| `evermore` | `assets/couple-holding-signs.svg` | 1.008 KB |
| `evermore` | `assets/bride-kid.png` | 915 KB |
| `sandhya` | `parallax-overlay.mp4` | 2.217 KB |
| `embroidered-garden` | `cover-door.mp4` | 2.423 KB |
| `lace` | `opening.mp4` | 1.952 KB |
| `adat-*` (6 template) | `opening-garden.mp4` | 2.688–3.133 KB |

Semua `*.mp4` sudah lolos cek faststart (`moov` sebelum `mdat`).

---

## 4. Perilaku UI preview (sebelum Fase 1)

| Kejadian | Nilai lama |
|---|---|
| Overlay "Memuat pratinjau…" hilang | `REVEAL_FALLBACK_MS` = 9.000 ms |
| Tombol "Buka di tab baru" muncul | saat `slow` = 7.000 ms |
| Banner "Jaringan lambat" muncul | 7.000 ms tanpa `onload` |
| Hard timeout → state error | 45.000 ms |
| Dasar deteksi | iframe `onload` (menunggu **semua** subresource) |

Artinya: di jaringan sehat pun banner bisa muncul karena satu request
third-party, dan iframe ditahan putih sampai 9 detik.

---

## 5. Target pembanding (go/no-go)

| Metrik | Baseline | Target |
|---|---|---|
| Byte first screen preview in-house | 2,4–5,2 MB | ≤1,5 MB |
| Byte total preview in-house | 5,2 MB | ≤3 MB |
| Byte preview WP | 3,6 MB | ≤2,5 MB |
| Throughput 4 paralel | 4,3 Mbps | ≥20 Mbps |
| TTFB HTML `*/preview` | 250 ms (origin) | ≤150 ms (edge) |
| Overlay preview hilang | 9.000 ms | ≤2.500 ms |
| Banner "memuat aset" | 7.000 ms (menuduh jaringan) | ≥8.000 ms, netral |
| Cache hit `/templates/*` | 0% | ≥85% |


---

## 6. Hasil setelah optimasi (2026-11-03)

Lighthouse, mobile, simulated throttling, halaman tamu production.

| Undangan | Byte | FCP | LCP | Score |
|---|---|---|---|---|
| manjari (sebelum) | 7.429 KB | 3,5 s | 42,7 s | 64 |
| manjari (sesudah audio + font) | **4.329 KB** | 3,8 s | **24,5 s** | 64 |
| pastel-dream (sebelum) | 7.731 KB | 6,1 s | 8,7 s | 55 |
| pastel-dream (sesudah) | **6.801 KB** | **3,3 s** | **4,0 s** | **74** |

Perubahan yang diukur:

| Perubahan | Efek terukur |
|---|---|
| Audio `preload=auto` → `metadata` + warm on first touch | transfer audio 3.158 KB → **97 KB** (manjari) |
| Material Symbols subset (171 ikon) | font 1.112 KB → **182 KB** (pastel-dream) |
| YouTube dimount 2 layar lebih awal | 0 di manjari (section film dekat cover, sengaja tetap dimuat); menghemat di template yang film-nya jauh |

Sisa penyebab LCP: YouTube (673+472 KB), foto Supabase (326–2.159 KB, **0%
thumbnail**), `public/images/church.jpeg` 1.010 KB, chunk JS 341 KB.


### 6.1 Tambahan (2026-11-03, setelah thumbnail disambungkan)

| Undangan | Byte awal | Byte akhir | LCP awal | LCP akhir |
|---|---|---|---|---|
| manjari | 7.429 KB | **3.227 KB** (−57%) | 42,7 s | **17,4 s** |
| pastel-dream | 7.731 KB | **2.584 KB** (−67%) | 8,7 s | **4,4 s** |

Perubahan tambahan:

| Perubahan | Efek |
|---|---|
| Guest/preview render memakai `thumbs/` (1200 cover, 800 galeri/portrait/story) | −1,1 s.d. −1,8 MB per undangan |
| `church.jpeg` 1.010 KB → `church.webp` 435 KB (q92, PSNR 40,1 dB) | −575 KB |
| Brush impasto 2.156 KB → thumb 1200w | −1,8 MB |

Sisa: chunk JS 341 KB, YouTube 673+472 KB pada template yang film-nya dekat cover
(autoplay sengaja dipertahankan), font Roboto 34 KB.
