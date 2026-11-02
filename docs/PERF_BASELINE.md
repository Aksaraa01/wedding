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
