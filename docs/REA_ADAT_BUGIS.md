# REA — Momentus "Adat Bugis" → Aksaraa in-house `adat-bugis`

Reverse-engineering notes for the port of
`https://momentus.id/preview/adat-bugis` (invitation shell:
`https://momentus.id/invitation/preview-adat-bugis`). Same shape as the Adat
Melayu/Batak ports; written against the §0.5 minimum-section contract
(`docs/INHOUSE_TEMPLATE_PLAYBOOK.md`).

---

## 1. Verdict

| Question | Answer |
|---|---|
| Reference | Momentus theme `adat-bugis` (preview shell + iframe invitation) |
| Family | **Same component as `adat-melayu`** — the two reference stylesheets are byte-for-byte the same rule set (425 rules each) except palette values, two asset URLs and the video-copy colour |
| Data layer | Momentus profile (same fields our `wedding_profiles` already expose) |
| Palette | `--sage #29421C` (deep forest green), `--sage-deep #3D4E3D` (antique gold/green), `--paper #F4F5EE`, `--ink #2B332A`, warm-fg `#ffffff` |
| Fonts | Pinyon Script (display) + Cormorant Infant (serif) + Poppins (body) — already shipped by the Adat family |
| Sections | cover-gate → video-intro → verse → mempelai → Turut Mengundang → events/countdown → live streams → rundown → dress code → gallery → love story → gift → RSVP & wishes → contacts → thank-you |
| Mobile | Responsive two-column desktop / single column mobile, same as Melayu |

**Decision:** the port is a re-skin of `adat-melayu`, not a re-port. Copy the
component, rename the root class, swap the palette, the motif/parallax art, the
opening video and the copy defaults. Do not re-extract CSS.

### Reference stylesheet diff (proof)

Normalising `.adat-melayu-root` ↔ `.adat-bugis-root` and the theme name, the two
reference CSS bundles differ in 4 places only:

1. palette root block (`--sage`, `--sage-deep`),
2. `.video-copy` / `.fallback-copy` text colour (`#000` → `#fff`, because the
   Melayu opening film is light and the Bugis film is dark green),
3. `.video-copy { top: 46% }` (Melayu: `46%`; port uses the reference value),
4. `.profile-card::before/::after` motif positioning (top / bottom).
5. `.tpl-gift__dialog-cancel` fallback colour literals.

Everything else — every section, every inner class, every media query — is
identical, which is why the Adat Melayu component is the correct base.

---

## 2. Section decisions

| # | Minimum section | Where it ships |
|---|---|---|
| 1 | Cover | `.cover` (desktop left panel) + `.cover-gate` (mobile / right panel) |
| 2 | Opening video | `.video-intro`, `preload="metadata"`, music preloaded on the cover |
| 3 | Welcome | carried by the cover gate (`The Wedding of`, guest name, apology) |
| 4 | Kalimat pembuka | **not used** (`opening_description: false`) — the design has no separate opening card; the verse block carries the couple's words |
| 5 | Mempelai | `.groom-bride-section` with 3 semantic cover slots used by verse/closing |
| 6 | Love story | `.love-story-section` (text-only, `story_photo: false`) |
| 7 | Event | `.events-section` + countdown |
| 8 | Countdown | inside `.events-section` |
| 9 | Turut Mengundang | `.inviting-section` (motif bands, compact 72 px) |
| 10 | Rundown | `.tpl-rundown` |
| 11 | Gallery | `.our-gallery-section` (two marquee rows + lightbox) |
| 12 | Video | gallery video card (YouTube / upload) |
| 13 | Wedding gift | `.gift-section` + `.tpl-gift` (envelope reveal) |
| 14 | Dress code | `.dress-code-section` |
| 15 | Wishes | `.rsvp-wishes-section` + `Wishes.tsx` |
| 16 | Closing | `.thank-you-section` + Aksaraa footer badge |

Extra reference blocks: `Live Streaming` (`.live-streams-section`) and
`Hubungi Kami` (`.tpl-contact`) — both already have schema fields
(`livestream`, `contacts`) from the Adat Melayu migration, so they ship as-is.
The reference's own RSVP form is **not** ported: RSVP is the shared
`InvitationOverlay` dock (§6 of the playbook).

`showGuestDock` carries **both** `!preview_mode` and `!template_demo` guards.

---

## 3. Assets

| Asset | Reference | Aksaraa |
|---|---|---|
| `motif-atas.webp` / `motif-bawah.webp` | 331 KB / 330 KB gold-green floral border | vendored (same art as the rest of the Adat family) |
| `parallax-overlay.webp` | 573 KB leaf vignette | vendored |
| `fallback.webp` | 371 KB forest illustration (video poster + fallback) | vendored |
| `bouquet.webp` | 212 KB | vendored |
| `couple-1/2.webp` | 245/257 KB florals behind the portraits | vendored |
| `opening-garden.mp4` | 14.4 MB, 606×1080, 5.7 Mbps, 20.1 s | re-encoded to **3.0 MB**, 538×960, H.264 CRF 31, no audio, `+faststart` |
| `thumbnail.webp` | 136 KB laptop/phone mockup (reference couple) | **not used** — a portrait cover screenshot of our own preview is generated instead |
| Music | `abi-rafdi-mula-macenning-cappa-makessing.mp3` (licensed) | **not vendored**; demo falls back to `ASSETS.defaultMusic`, real couples use `track_url` |
| Gallery photos | 16 reference `webp` | not vendored (demo uses Aksaraa sample photos) |

No reference couple names, quotes, stories, gallery photos or branding ship.

---

## 4. Demo content

Aksaraa-owned demo couple: **Andi & Nurul** (Makassar), `Mappacci` + `Resepsi
Pernikahan` at a generic Bugis hall, dress code inherited from the profile.
Copy follows the reference's Bahasa Indonesia wording, with
`quote_source` = "Doa Pernikahan Adat Bugis" and the events intro reading
"rangkaian pernikahan adat Bugis".

---

## 5. Registration

- `TEMPLATE_MAP` + `TEMPLATE_CONFIGS["adat-bugis"]` (3 cover slots: Sampul /
  Kutipan / Closing, `story_photo: false`, all sections on)
- `demoProps.ts` → `DEMO_PROPS_BY_CODE["adat-bugis"]`
- `templateExtras.ts` → `adat-bugis` on `cover_apology`, `gallery_intro`,
  `gallery_quote`, `gift_intro_title`, `gift_intro_description`, `wishes_intro`,
  `closing_message`
- preview route `keepDemoIds`
- migration `20261045000000_adat_bugis.sql`, `sort_order` 34,
  `category` Adat/Tradisional, `tier` Baru, same `package_eligibility` array
- no new profile columns; editor and ops pick the template up through the
  content spec
