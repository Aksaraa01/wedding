# REA — Momentus "Adat Banjar" → Aksaraa in-house `adat-banjar`

Reverse-engineering notes for the port of
`https://momentus.id/preview/adat-banjar` (invitation shell:
`https://momentus.id/invitation/preview-adat-banjar`). Same shape as the Adat
Melayu/Bugis/Dayak ports; written against the §0.5 minimum-section contract
(`docs/INHOUSE_TEMPLATE_PLAYBOOK.md`).

---

## 1. Verdict

| Question | Answer |
|---|---|
| Reference | Momentus theme `adat-banjar` (preview shell + iframe invitation) |
| Family | **Same component as `adat-dayak`/`adat-bugis`** — the reference CSS bundles share the same rule set; only palette values, art URLs, music and copy differ |
| Data layer | Momentus profile (same fields our `wedding_profiles` already expose) |
| Palette | `--warm #361111`, `--dark #171612`, `--cream #fffcf3`, `--cream-2 rgba(54,17,17,.10)`, `--brown #5A2020`, `--sage #361111`, `--sage-deep #5A2020`, `--warm-fg #fff`, `--sage-text #5A2020`, `--paper #fffcf3`, `--ink #171612` (deep maroon on warm paper) |
| Fonts | Pinyon Script (display) + Cormorant Infant (serif) + Poppins (body) — same Adat family fonts |
| Sections | cover-gate → video-intro → verse → mempelai → Turut Mengundang → events/countdown → live streams → rundown → dress code → gallery → love story → gift → RSVP & wishes → contacts → thank-you |
| Mobile | Responsive two-column desktop / single column mobile, same as Melayu |

**Decision:** the port is a re-skin of `adat-dayak` (the closest shipped
sibling), not a re-port. Copy the component, rename the root class, swap the
palette, the motif/parallax art, the opening video and the music, and the copy
defaults.

---

## 2. Section decisions

Same §0.5 minimum-section contract as `docs/REA_ADAT_DAYAK.md` — all 16 minimum
sections + extras (live streaming, contact, gift) ship on.

## 3. Assets

| Asset | Reference | Aksaraa |
|---|---|---|
| `motif-atas/bawah.webp` | Banjar house floral borders | vendored (own art) |
| `parallax-overlay.webp` | Banjar vignette | vendored (own art) |
| `fallback.webp` | Banjar illustration | vendored (own art) |
| `bouquet.webp` | Banjar bouquet | vendored (own art) |
| `couple-1/2.webp`, `couple-together.webp`, `bride/groom.webp` | Banjar florals | vendored (own art) |
| `cover-garden.webp` | Banjar cover | vendored (own art) |
| `opening-garden.mp4` | 606×1080, ~20 s, 11.8 MB | re-encoded to **2.46 MB**, 538×960, H.264 CRF 31, no audio, `+faststart` |
| Music | `/musics/h-anang-ardiansyah-kembang-goyang.mp3` (3.12 MB) | **vendored** → `/templates/adat-banjar/h-anang-ardiansyah-kembang-goyang.mp3` |
| Gallery photos | 16 reference webp (`gallery-01..16`) | vendored for reference; demo uses Aksaraa sample photos |

## 4. Demo content

Reference couple: **Joseph & Sandhya**, Banjar-themed events at
`Rumah Bubungan Tinggi Banjar` (Jl. Ahmad Yani No. 7, Banjarbaru, Kalimantan
Selatan) — Akad Nikah 08.00–10.00 WIB, Resepsi 11.00–14.00 WIB.

Dress code: maroon, dusty rose, gold, sage. Quote source
`Doa Pernikahan Adat Banjar`.

## 5. Registration

- `TEMPLATE_MAP` + `TEMPLATE_CONFIGS["adat-banjar"]` (3 cover slots, all sections on)
- `demoProps.ts` → `DEMO_PROPS_BY_CODE["adat-banjar"]`
- `templateExtras.ts` → `adat-banjar` copy keys
- preview route `keepDemoIds`
- migration `20261053000000_adat_banjar.sql`, `sort_order` 36,
  `category` Adat/Tradisional, `tier` Baru, same `package_eligibility` array
