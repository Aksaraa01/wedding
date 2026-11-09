# REA — Traditional Bugis Pinishi (`traditional-bugis-pinishi`)

Reference: `https://our-wedding.link/design/traditional-bugis-pinishi`
(Our Wedding Link, preset `bugis-vintage`; Vue + Elementor-generated markup).
Intake 2026-11-05.

> Port contract: the table in §6 is filled before review (playbook §0.6).
> **ADDED** marks a section that is not in the reference and was rebuilt in its
> own visual language because the 16-section contract requires it.

---

## 1. Reference facts

| | |
|---|---|
| Stack | Vue 2 + jQuery carousels, `#welcome` gate + `.layout-cover` sections |
| Canvas | phone-first 390; the desktop page is the same column split beside a marketing panel |
| Fonts | **Waterfall** (names, 400), **Ysabeau Infant** (body/labels, 300–700) |
| Palette | cream `#f7ecde`, peach overlay `rgba(242,196,176,.4)`, deep purple `#65485c`, text `#683875`, secondary `#ebc6b4` |
| Motion | animate.css (`fadeIn`, `slideInLeft/Right`, `slideInUp`) + `animation_upDown` loop on the floral corners |
| Sections | cover/welcome, quote, couple, invited families, save-date + countdown, events, livestream, rundown, dresscode, gallery + film, story, gift, wishes, contacts, closing |

---

## 2. Measured geometry (390 canvas)

| Section | Measure |
|---|---|
| Cover | Mobile: 100 svh; full-bleed cream illustration `cover-bg.webp`; peach arch panel **75 % width × 83 % height**, radius 150 px; six floral corner cut-outs; round photo 52 % of the panel; "The Wedding Of" Ysabeau 18; names Waterfall; date `31 . 12 . 2027`; pill `#65485c` / `#ebc6b4`. Desktop ≥900 px: reference split hero — couple photo full-bleed on the left half, cream art panel on the right with the same copy and no round photo |
| Verse | initials (Waterfall) above the arched `pembuka.webp` photo (radius `150px 150px 0 0`, 300 px wide) + label "Allah's blessings message" + quote 14 px `#867d65`; plus the vendored ships/palms art, 785 px tall like the reference `#separator` |
| Couple | two portraits inside the ornate peach frame `frame.webp` (transparent window, `aspect-ratio: 900/1000`, 260 px wide); instagram handle above the script name, as plain text; names Waterfall 40 `#65485c`; parents 13 |
| Events | crest above "Save the Date"; four open countdown columns (serif numerals, rules above and below, labels Days/Hours/Minutes/Seconds); calendar pill; one card per session with a maps pill |
| Venue | reference `#adressWrapper`: rounded map card (`aspect-ratio: 4/5` mobile, `16/9` desktop), address line, outlined "Lihat Lokasi" pill |
| Story | Waterfall title, peach slider panel (`#ebc6b4`, radius 25) holding one white card per chapter with a photo |
| Rundown | floral cut-out bottom-right, time + description list |
| Gallery | title + quote over the cream panel, then a one-up horizontal slider of 4:5 plates (the photo wash was dropped) |
| Closing | "Thank You" + closing message + names + Aksaraa footer on cream |

---

## 3. Asset audit

Vendored to `public/templates/traditional-bugis-pinishi/`. No reference couple
photos are copied; the demo uses our own `pembuka.webp` / `galeri-*.webp`.

| File | Reference source | Use |
|---|---|---|
| `cover-bg.webp` | `546f5ce0-…jpg` (preset cover, 1080×2218) | full-bleed cover illustration |
| `quote-bg.webp` | `contenful/bg.jpg` (550×1067) | verse / quote background |
| `decor-tree-left.webp` | `IMG_0696.png` | cover, top-left tree |
| `decor-tree-right.webp` | `phnnnn.png` | cover, top-right tree (rotated −30°) |
| `decor-banana.webp` | `cScSc.png` | cover, left banana plant |
| `decor-flowers.webp` | `dfd.png` | cover, bottom-right bouquet |
| `decor-purple.webp` | `tmnknan.png` | cover, bottom-left purple plants |
| `decor-lily.webp` | `fada.png` | cover, right lily (behind the panel) |
| `decor-blossom.webp` | `bungaBugis4.png` | verse, watercolour blossom |
| `decor-foliage.webp` | `puun2bugis.png` | verse, faint green foliage |
| `decor-foliage-band.webp` | `bgwishes.png` | verse, tropical foliage band |
| `cover-art.webp` | `bugis_bg.png` | gallery footer mosque art |
| `watermark.webp` | `bgrdwn.png` | page watermark behind the main column |
| `floral.webp` | `dcrbtmrundown.png` | rundown corner floral |
| `frame-crest.webp` | `IMG_0632.PNG` | crest above Save The Date |
| `frame.webp` | `IMG_0549.PNG` | gold oval frame around the portraits |

Couple media: `pembuka.webp`, `galeri-1…4.webp`, `pria.webp`, `wanita.webp`,
`music.mp3`, `thumbnail.webp` (real 9:19 cover capture, 720×1520).

Removed during the reference pass (not used by the final composition):
`arch-top`, `arch-bottom`, `section-frame`, `frame-lines`, `tree`, `blob-mask`,
`birds.svg`, and the marketing collage `sampul.jpg` / `thumbnail.jpg`.

Fonts: `public/fonts/waterfall-400.woff2`,
`public/fonts/ysabeauinfant-{300,400,500,600,700}.woff2`, declared in
`src/app/fonts.css` (`--font-waterfall`, `--font-ysabeau`) and fetched by
`scripts/fetch-fonts.js` / `scripts/gen-font-css.js`.

---

## 4. Motion

The template uses the shared AOS reveal (`data-aos="fade-up"` + `--aos-delay`)
and two cover keyframes.

| Element | Animation | Delay |
|---|---|---|
| Cover trees | `pinishi-slide-in-left` / `pinishi-slide-in-right` on mount | 0 |
| Cover panel | `fade-up` | 0 |
| Section titles | `fade-up` | 0 |
| Cards / list rows | `fade-up` | 60 ms step |
| Gallery tiles | `fade-up` | 40 ms step |

`prefers-reduced-motion` is honoured globally by the AOS stylesheet.

---

## 5. Responsive decision

The reference is a 390 phone canvas but it does not cap the cover: the arch is
`75 %` of the viewport at every width. We follow that — the cover panel has no
`max-width`, and the photo is a percentage of the panel. Inner sections keep a
readable max-width (`760–960 px`) because the reference's content column is
phone-width; on desktop they centre on the same cream canvas.

---

## 6. Section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `cover_photos[]`, names, `guest_name` | always | 0 photos ⇒ initials block; 1 name ⇒ no `&`; guest empty ⇒ "Tamu Undangan" | profile + `template_content.cover_apology` | load |
| 2 | Verse | `quote_text/source`, `pembuka.webp`, initials | always | no quote ⇒ `DEFAULT_QUOTE`; initials from the short names | profile + quote columns | up |
| 3 | Mempelai | `groom_*`/`bride_*`, parents, IG, photos | always | missing parent/IG row omitted; one portrait ⇒ shared fallback | profile | up |
| 4 | Our Love Story | `stories[]` | `feature_gates.story !== false` && `story_visible !== false` | 0 ⇒ omitted; 1 ⇒ one item; no chapter photo ⇒ gallery/cover fallback | profile | up |
| 5 | Precious Moment + film | `gallery_photos[]`, `video_url` | always with data; video also `feature_gates.video` && `video_section_visible` | horizontal one-up slider; 1 photo ⇒ single plate | profile + `gallery_intro`, `gallery_quote` | up |
| 6 | Save the Date | `estimated_wedding_date`, `sessions[]` | always | no date ⇒ `00` values; 0 events ⇒ countdown only | profile | up |
| 7 | Turut Mengundang | `inviting_families[]` (TEXT, `JSON.parse`) | `feature_gates.inviting_families !== false` && `inviting_families_visible !== false` | 0 ⇒ omitted | profile | up |
| 8 | Live Streaming | `livestream.url/title/description/buttonLabel` | `livestream_visible !== false` && url present | 0 ⇒ omitted | profile | up |
| 9 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ omitted; no time ⇒ description only | profile | up |
| 10 | Dress Code | `dresscode.colors[]` | `dresscode_visible !== false` | no colours ⇒ omitted; no description ⇒ generated palette line | profile | up |
| 11 | Hadiah | `gift_accounts[]`, `gift_address` | `gift_section_visible !== false`; address also `feature_gates.gift_address !== false` | accounts only / address only / neither ⇒ omitted; envelope discloses | `gift_intro_title`, `gift_intro_description` | up |
| 12 | Wishes | `/api/wishes`, guest identity | always | demo feed; 0 approved ⇒ empty state; wish list above the form | `wishes_intro` + `Wishes.tsx` form keys | up |
| 13 | Hubungi Kami | `contacts[]` | `contacts_visible !== false` | 0 ⇒ omitted; no WA ⇒ no button | profile | up |
| 14 | Penutup | closing photo, names | always | 0 photos ⇒ cover art fallback | `closing_message` | up |
| 15 | Music dock | `track_url` | track present | no track ⇒ no vinyl button | — | vinyl spin |

Section order follows the reference: cover → verse → couple → story → gallery →
save-the-date/events → inviting → live → (our rundown/dresscode) → gift →
wishes → contacts → closing.

Copy audit: `npm run audit:copy -- traditional-bugis-pinishi` is clean; the 62
structural literals (WCAG names, countdown units, fixed section labels, vendor
badge) live in the `allow` block with reasons.

---

## 7. Deviations from the reference

1. **No separate gate section.** The reference pins a second "Buka Undangan"
   overlay after the cover. On our first build that left the body scroll-locked
   and the button below the fold, so the invitation could not be opened. The
   gate is now the cover itself.
2. **Guest name and apology stay on the cover** (`Kepada Yth.`, guest name,
   `cover_apology`) — the reference hides them behind the `?to=` loop; ours are
   editable and always visible, as required by the shared invitation contract.
3. **Portraits use the gold oval frame** (`IMG_0549.PNG`) instead of the
   reference's decorative mask, because the frame art is the one the preset
   actually ships.
4. **Demo photos are ours** (`pembuka.webp` / `galeri-*.webp`); the reference's
   `bugis-vintage-sampul.webp` is a photo of the vendor's demo couple.
5. **Live streaming, rundown, dress code and contacts** are ADDED sections from
   the 16-section contract; the reference shows only some of them per preset.
6. **`hidesOpeningSection`** is on: this design has no separate "Kalimat
   Pembuka" card — the verse carries the quote.
