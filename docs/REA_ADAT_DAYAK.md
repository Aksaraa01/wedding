# REA — Momentus "Adat Dayak" → Aksaraa in-house `adat-dayak`

Reverse-engineering notes for the port of
`https://momentus.id/preview/adat-dayak` (invitation shell:
`https://momentus.id/invitation/preview-adat-dayak`). Same shape as the Adat
Melayu/Bugis/Batak ports; written against the §0.5 minimum-section contract
(`docs/INHOUSE_TEMPLATE_PLAYBOOK.md`).

---

## 1. Verdict

| Question | Answer |
|---|---|
| Reference | Momentus theme `adat-dayak` (preview shell + iframe invitation) |
| Family | **Same component as `adat-bugis`** — the two reference CSS bundles share the same rule set; only palette values, art URLs and copy differ |
| Data layer | Momentus profile (same fields our `wedding_profiles` already expose) |
| Palette | `--warm #1B1B1B`, `--dark #0B0B0C`, `--cream #E8E2D6`, `--cream-2 rgba(232,226,214,.10)`, `--brown #6E6E72`, `--sage #1B1B1B`, `--sage-deep #6E6E72`, `--warm-fg #fff`, `--sage-text #1B1B1B`, `--paper #E8E2D6`, `--ink #0B0B0C` (dark charcoal + warm taupe) |
| Fonts | Pinyon Script (display) + Cormorant Infant (serif) + Poppins (body) — same Adat family fonts |
| Sections | cover-gate → video-intro → verse → mempelai → Turut Mengundang → events/countdown → live streams → rundown → dress code → gallery → love story → gift → RSVP & wishes → contacts → thank-you |
| Mobile | Responsive two-column desktop / single column mobile, same as Melayu |

**Decision:** the port is a re-skin of `adat-bugis` (the just-shipped sibling),
not a re-port. Copy the component, rename the root class, swap the palette, the
motif/parallax art, the opening video and the copy defaults.

---

## 2. Section decisions

Same §0.5 minimum-section contract as `docs/REA_ADAT_BUGIS.md` — all 16 minimum
sections + extras (live streaming, contact, gift) ship on.

## 3. Assets

| Asset | Reference | Aksaraa |
|---|---|---|
| `motif-atas/bawah.webp` | Dayak longhouse floral borders | vendored (own art) |
| `parallax-overlay.webp` | Dayak vignette | vendored (own art) |
| `fallback.webp` | Dayak illustration | vendored (own art) |
| `bouquet.webp` | Dayak bouquet | vendored (own art) |
| `couple-1/2.webp` | Dayak florals | vendored (own art) |
| `cover-garden.webp` | Dayak cover | vendored (own art) |
| `opening-garden.mp4` | 606×1080, ~20 s | re-encoded to **2.25 MB**, 538×960, H.264 CRF 31, no audio, `+faststart` |
| Music | `/musics/purnawandi-wawan-tabayang.mp3` (4.05 MB) | **vendored** → `/templates/adat-dayak/purnawandi-wawan-tabayang.mp3` |
| Gallery photos | 16 reference webp | not vendored (demo uses Aksaraa sample photos) |

## 4. Demo content

Aksaraa-owned demo couple: **Andi & Nurul**, Dayak-themed events at
`Rumah Betang Dayak` (Jl. Tjilik Riwut No. 7, Palangka Raya, Kalimantan Tengah).

## 5. Registration

- `TEMPLATE_MAP` + `TEMPLATE_CONFIGS["adat-dayak"]` (3 cover slots, all sections on)
- `demoProps.ts` → `DEMO_PROPS_BY_CODE["adat-dayak"]`
- `templateExtras.ts` → `adat-dayak` copy keys
- preview route `keepDemoIds`
- migration `20261052000000_adat_dayak.sql`, `sort_order` 35,
  `category` Adat/Tradisional, `tier` Baru, same `package_eligibility` array
