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

The second pass re-derived every placement from the preset's own stylesheet
(`/css-tema/custom-…`, 335 rules) instead of eyeballing screenshots, and
vendored the four assets the first pass had skipped.

| File | Reference source | Use |
|---|---|---|
| `cover-bg.webp` | `546f5ce0-…jpg` (preset cover, 1080×2218) | full-bleed gate illustration |
| `quote-bg.webp` | `contenful/bg.jpg` (550×1067) | hero (`#separator`) background |
| `decor-puunbugis.webp` | `puunbugis.png` | hero `.decorSeparator .tree` (top-left, 44 %) |
| `decor-puun2bugis.webp` | `puun2bugis.png` | hero `.flowerfive` (top-right, 26 %) |
| `decor-img-0543.webp` | `IMG_0543.png` | hero `.ship` (bottom, 78 %) |
| `decor-bngquote.webp` | `bngquote.png` | hero `.flowerzero` (left, bottom 11 %) |
| `decor-bungaQuote2.webp` | `bungaQuote2.png` | hero `.flowerone` (left, bottom −5 %) |
| `decor-bungaBugis4.webp` | `bungaBugis4.png` | hero `.flowertwo` (right, bottom 50 px) |
| `decor-bunga-quote-3.webp` | `bungaQuote3.png` | hero `.flowerfour` (right, bottom 23 px) |
| `decor-mitos-1/2/3.webp` | `mitos_…_1/2/3_.png` | story `.flowerStory` (bottom-left ×2, top-right) |
| `decor-dup-1.webp`, `decor-untitled-13-2.webp`, `decor-dup-2.webp` | `dup1.png`, `Untitled_13_2.png`, `dup2.png` | gallery `.ornGallery` (3 ornaments around the quote) |
| `decor-dfafda.webp`, `decor-dsdasfdas.webp`, `decor-img-0652.webp` | `dfafda.png`, `dsdasfdas.png`, `IMG_0652.png` | gallery `.ornGalleryBottom` (bottom three) |
| `decor-gll-1/2/3.webp` | `gll1/2/3.png` | countdown `.ornCountdown` (two mirrored groups + `fdsfsd` spray) |
| `decor-fdsfsd.webp` | `fdsfsd.png` | countdown `.ornCountdown::before` |
| `decor-rundown-5/4/2/3/1.webp` | `rundown5/4/2/3/1.png` | per-event `.decorRundown` left + right groups |
| `decor-rundown-frame.webp` | `IMG_0631.PNG` | event card rails (repeat-y) |
| `frame-crest.webp` | `IMG_0632.PNG` | event card crest above the rails |
| `decor-merak.webp`, `decor-bngarsvp-3.webp`, `decor-bngarsvp-1.webp`, `decor-bnggg.webp` | `merak.png`, `bngarsvp3.png`, `bngarsvp1.png`, `bnggg.png` | Turut Mengundang `.decor-bottom` (peacock + lilies) |
| `decor-tree-left.webp` | `IMG_0696.png` | closing `.decorThankYou .done` |
| `decor-tree-right.webp` | `phnnnn.png` | closing `.dtwo` |
| `decor-banana.webp` | `cScSc.png` | closing `.dthree` |
| `decor-foliage-band.webp` | `bgwishes.png` | closing `.dfour` (full-width floral band) |
| `decor-flowers.webp` | `dfd.png` | closing `.dfive` |
| `decor-lily.webp` | `fada.png` | closing `.dseven` |
| `decor-purple.webp` | `tmnknan.png` | closing `.dsix` |
| `decor-ship.webp` | `IMG_0543.png` | closing `.ship-lax` |
| `floral.webp` | `dcrbtmrundown.png` | rundown corner floral |
| `cover-art.webp` | `bugis_bg.png` | gallery footer mosque band |
| `watermark.webp` | `bgrdwn.png` | countdown background |
| `wishes-bg.webp` | `c7d66f50-…jpg` | wishes section background (blended with cream) |
| `story-panel.webp` | `mitos_…_47_.png` | story + Turut Mengundang panel texture |
| `decor-countdown-band.webp` | `IMG_0541_copy.png` | countdown lace band (`#countdown::before`) |
| `decor-frame-top.webp` / `decor-frame-bottom.webp` | `frametop.png` / `frmaebottom.png` | Turut Mengundang gold arch |
| `frame.webp` | `IMG_0549.PNG` | peach arch drawn over each portrait |
| `mask-frame.webp` | `mask-frame.png` | portrait silhouette mask |
| `frame-backdrop.webp` | `framejv.png` | gold oval behind each portrait |
| `decor-profile-band.webp` | `phonld.png` | tree branch above the bride's portrait |

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

Two layers, both ported from the preset (animate.css + WOW.js + the theme's
`animation_upDown` / `animation_toLeft` loops).

**Reveal** — one `IntersectionObserver` adds `.is-aos-visible` to every
`[data-aos]` target once. Variants map to the preset's animate.css classes:

| `data-aos` | Preset class | Used by |
|---|---|---|
| `fade-in` | `animate__fadeIn` | gallery quote block, wishes, closing |
| `fade-up` (default) | `animate__fadeInUp` | quote, story title, gallery track, save-the-date, events intro, inviting, livestream, rundown, dresscode, gift |
| `slide-left` / `slide-right` | `animate__fadeInLeft` / `fadeInRight` | bride / groom portrait |
| `zoom-in` | `animate__zoomIn` | story panel, event cards |

Duration 0.9 s, `--aos-delay` per element (60/80 ms steps), `prefers-reduced-motion`
and `@media (scripting: none)` leave every target at `opacity: 1; translate: none;
scale: 1`.

**Ambient** — the preset keeps its florals breathing with
`animation_upDown` (rotate −3°…3°) and `animation_toLeft` (5°…0°), 2 s
alternate. Ported as `pinishi-sway` / `pinishi-to-left` driven through the
individual `rotate` property (never `transform`) so it never overwrites a
placement `transform`:

| Element | Animation |
|---|---|
| Hero `.flowerzero` / `.flowerone` / `.flowerfour` / `.flowertwo` | `pinishi-sway` 2 s |
| Story `.flowerstorytwo` | `pinishi-sway` 2 s |
| Gallery `.orn3`, `.ornGalleryBottom .orn1` | `pinishi-sway` 2 s |
| Countdown `.ornCountdown img:nth-child(2)` / `(3)` | `pinishi-sway` 2 s / `pinishi-to-left` 1.5 s |
| Event `.decorRundown` second + left flowers | `pinishi-to-left` / `pinishi-sway` 2 s |
| Turut Mengundang lily | `pinishi-sway` 2 s |
| Music vinyl | `pinishi-vinyl-spin` 2 s |

Reduced motion turns every one of them off.


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

Copy audit: `npm run audit:copy -- traditional-bugis-pinishi` is clean; the 61
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
3. **The couple block has no intro paragraph.** The preset goes straight from
   the verse to the first portrait; the "Dengan memohon rahmat…" line only
   appears above the event cards. `profiles_intro` is therefore not registered
   for this template (no dead control).
4. **The peach RSVP panel now carries Turut Mengundang.** The preset puts the
   RSVP form, the also-invite list, the gold arch and the peacock/lily art in
   one peach panel. RSVP is the shared `InvitationOverlay` dock here, so the
   panel renders only the also-invite list — same arch, same peacock, same
   lilies, same 160 px top radius.
5. **Demo photos are ours** (`pembuka.webp` / `galeri-*.webp`); the reference's
   `bugis-vintage-sampul.webp` is a photo of the vendor's demo couple. The demo
   copy is the `adat-bugis` sample (Andi & Nurul, Makassar), not the vendor's
   demo couple.
6. **Live streaming, rundown, dress code and contacts** are ADDED sections from
   the 16-section contract; the reference shows only some of them per preset.
   They reuse the preset's own language (olive cards, Waterfall headings,
   plum pills) instead of inventing a new one.
7. **`hidesOpeningSection`** is on: this design has no separate "Kalimat
   Pembuka" card — the verse carries the quote.
8. **The gallery keeps both copy fields.** The preset shows the quote *and* the
   editable note under it (`*title and words can be edited in the gallery
   menu`), so `gallery_quote` and `gallery_intro` are both rendered — the
   latter smaller, as in the preset.
9. **Portraits keep the preset's real construction**: photo clipped by
   `mask-frame.png`, the gold oval (`framejv.png`) behind it, the peach arch
   (`IMG_0549`) drawn on top, and the `phonld.png` branch above the bride. The
   branch is omitted on the groom because in our (single-column) layout it
   would cover the bride's parent line.
10. **No Google Maps embed in the venue block.** The address section renders
    the address text and the `Lihat Lokasi` button only (user decision); each
    event card still carries its own `Lihat Lokasi` pill.
11. **Desktop decor containment (≥1024).** The invitation renders in a 540 px
    column beside the stage photo; `.pinishi-main` gets `overflow-x: clip` and
    a cleanup block at the end of the stylesheet tucks every floral inside the
    column (hero corners, portrait decors, story/gallery/countdown/savedate/
    closing pieces, peacock) and hides the edge florals that were tuned for the
    390 px canvas (live/rundown/dresscode/gift). Verified by measuring every
    decor's bounding box against the column edges at 1440.
