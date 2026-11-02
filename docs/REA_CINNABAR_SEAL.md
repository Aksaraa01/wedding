# REA — Cinnabar Seal (`cinnabar-seal`)

Reference: `https://our-wedding.link/design/cinnabar-seal` (Our Wedding Link
preset, "Cinnabar Seal", Eksklusif). Intake 2026-11-02, 390×844 canvas.

> This document is the port contract. The table in §6 is filled before review
> (playbook §0.6). Anything marked **ADDED** is not in the reference and was
> rebuilt in the reference's own visual language because the 16-section
> contract requires it.

---

## 1. Reference facts

| | |
|---|---|
| Stack | Nuxt 2 page-builder (`widget-block` / `wb-children`), no framework CSS we can reuse wholesale |
| Canvas | 390 wide, phone-first; the site letterboxes it inside a 420 px frame on desktop |
| Fonts | **Cormorant Garamond** (display, 300/400 + italic) · **Montserrat** (body, 300–700) |
| Palette | bg `#4a0f12`, deep bg `#3a0a0d`, cream `#f3e8d8`, gold `#d6b676`, seal red `#9c1c22` |
| Motion | animate.css 4.1.1 classes (`fadeIn`, `fadeInUp`, `fadeInDown`, `zoomIn`) + WOW.js scroll trigger. Cover plays on load (no `wow` class). 78 animated elements. |
| Sections | 6 page-builder groups: `quotes`, `couple`, `stories`, `gallery`, `wedding_detail`, `live_streaming` (empty) |
| RSVP | reference has a "Kindly Reply" form — **removed**, RSVP is the shared `InvitationOverlay` dock (playbook §0.5 rule 4) |
| Live streaming | declared in `sort_elements` but renders nothing in the preview — **not ported** |

The page builder places every element absolutely (`top`/`left`/`right` in px at
390). We keep the **proportions and rhythm**, not the absolute coordinates, so
the design survives variable content (see §5).

---

## 2. Measured geometry (390 canvas)

### Cover (`cs-sampul cs-sampul-gerbang`, 390×844)

| Element | Measure |
|---|---|
| Photo | full bleed 390×844, `object-fit: cover`, shifted −96 px (over-scan) |
| Top vignette | 390×330, `#4a0f12e0`, mask to transparent at bottom |
| Bottom vignette | 390×472 from y372, `#4a0f12`, mask to transparent at top |
| "The Wedding Of" | Montserrat 500 · 10.5 px · ls 5.4 px · uppercase · `#f3e8d8e6` · y146 |
| Seal | 46×46 · red `#9c1c22` · seal mask · rotate −5° · y176 |
| Initials | Cormorant 19 px ×2, diagonal (19 px offset), cream, rotate −5° |
| Slash | 21×1 cream 60%, rotate 60° |
| Names | Cormorant 300 · 46 px / 47.84 · `#f3e8d8` · two lines |
| Rule | 120×1 `#d6b676b3` |
| Date | Montserrat 400 · 11.5 px · ls 4.6 · gold |
| "Dear" | Montserrat 9 px · ls 3.2 · uppercase · cream 70% |
| Guest | Montserrat, cream |
| Open button | 42 px high · red `#9c1c22` · radius 2 · Montserrat 500 10.5 px · ls 3.57 px · uppercase; padding 0 28 0 32 |

### Welcome / hero (`cs-tetap`, 390×844)

Photo full bleed (over-scan −76 px), top vignette 210, bottom vignette 484.
Seal 54 px at 24/34; initials 23 px; names Cormorant 300 **54 px**; rule 342×1
(cream 30%); countdown 200 px wide (4 × 45.5 + 6 gaps); vertical rule 1×58;
"Save the Date" (upright + italic) at 128 px; date Montserrat 10/2.4 gold.

### Quote (`cs-tinta`, 390×512)

`box-shadow: inset 0 0 0 100vmax #090506d1` (dark ink wash). Ring 168 px
(1 px gold 85%) at y34; 囍 mask 56×55 gold inside; plum-blossom mask 176×177
gold 90%, rotated 10°, overlapping right; kicker Montserrat 500 10/3.6 gold;
body Montserrat 300 **13 px / 24.7** cream 94%, width 302.

### Mempelai (`cs-seksi`, 390×677 / 688)

Ring block 392 px tall; ring 250×334 portrait (3:4) with 14 px offset gold
frame; vertical label "The Bride" rotated −90° (Montserrat 10/6.4, gold 85%);
hanzi mask 70×147 gold 42% at the outer edge; name Cormorant 300 **29.04 px**
(bride) / 31.68 px (groom); label Montserrat 500 9.5/3.4 gold; parents
Montserrat 300 12.5/21.875 cream 88%; IG Montserrat 11, opacity .85.
Copy column is 270 px, offset 24.6% (left) / mirrored (right).

### Story (`cs-seksi`, 390×2286)

Header Cormorant 42, "Our" upright + "Love Story" italic gold. Medallion:
ring 236 + photo 236 + cloud mask 132×48 gold. Each item: photo 288×360 (4:5)
with offset frame, italic title Cormorant 31 gold, body Montserrat 300 12.5/22.5
cream 86%, 302 wide, 58 px between items.

### Gallery (`cs-seksi`, 390×1271)

Kicker, fret mask 132×11 gold, intro. Grid 342 wide, **2 cols**, gap 14,
items 164×218.7 (3:4), every 2nd item offset +44 px.

### Event (`cs-seksi`, 390×1114)

Two lantern masks (40×117, 30×88) hanging at the right. Kicker "Save the Date";
title Cormorant 30/3.6 gold "The Celebration"; medallion ring 196 + photo.
Each event: Cormorant 26/3.4 gold name, 32×1 rule, date Montserrat 10/2.8,
time 10/2.8 cream 75%, venue Cormorant 22/300, address Montserrat 12/300 cream
75%, outlined button 232×42, 44 px divider between events.

### Dress code (`cs-tinta`, 390×406)

Kicker, title Cormorant 38 ("Shades of **Red**", last word italic), body
Montserrat 12.5/22.5, 4 swatches: 46 px circles + Montserrat 8.5/1.6 labels,
74 px columns, 10 px gaps.

### Gift (`cs-seksi`, 390×757)

Three envelope layers: seal 160×166, card 165×335 (rises with `csKartuNaik`),
back 165×391 rotated. Body 290 wide, button 196×44 red, uppercase 11/1.76.

### Wishes (`cs-seksi`, 390×864)

Kicker "Words for Us"; title "Wishes" all italic Cormorant 44 gold; intro
Montserrat 12.5/22.5; feed bubbles on a translucent ink panel; form inputs
1 px cream 20% borders, radius 2; submit 42 px.

### Closing (`cs-tetap`, 390×844)

Photo 390×480 at the top of the block; full mask 300 top + 140 bottom; seal
60 px; "Thank You" Montserrat 10/3.6 gold; message 318 wide Montserrat 12.5/22.5;
names Cormorant **46/300**; date 10.5/4.2 gold; cloud mask 150×54.

---

## 3. Asset audit

All vendored to `public/templates/cinnabar-seal/`. These are **design masks /
envelope art**, not couple media and not third-party branding.

| File | Source | Intrinsic | Use |
|---|---|---|---|
| `seal.png` | `35ace740-…` | 366×365 | rough-edged red square behind initials |
| `double-happiness.png` | `35d7eee0-…` | 375×370 | 囍 inside the quote ring |
| `blossom.png` | `354aca10-…` | 635×640 | plum branch behind the quote |
| `cloud.png` | `3446c790-…` | 720×259 | cloud band under medallions |
| `fret.png` | `34c1eb00-…` | 960×48 | gallery divider |
| `lantern.png` | `35332360-…` | 178×520 | hanging lanterns in the event header |
| `bride.png` | `35f19160-…` | 285×597 | 新娘 side ornament |
| `groom.png` | `35e387a0-…` | 283×597 | 新郎 side ornament |
| `envelope-seal.png` | `4f29a3e0-…` | 440×457 | gift: wax seal |
| `envelope-card.png` | `4ec6c360-…` | 420×852 | gift: letter card |
| `envelope-back.png` | `4e8b4100-…` | 520×1231 | gift: red envelope |

Reference couple photos were **not** vendored. Demo props use
`/images/dark-elegance/*` (Aksaraa sample), per playbook §1.

Fonts: Cormorant Garamond 300 + italic 300 are added locally
(`public/fonts/cormorantgaramond-300*.woff2`) because the reference's names use
300; Montserrat 300–700 already exist.

---

## 4. Motion spec

| Element | animate.css equivalent | Delay |
|---|---|---|
| Cover kicker / seal / names / rule / date / guest / button | `fadeIn` / `fadeInUp` | on load, 0 → 0.4 s, staggered |
| Section kickers | `fadeInUp` | 0 |
| Titles | `fadeInUp` | 0.06 |
| Body copy | `fadeIn` | 0.12 |
| Medallion ring | `zoomIn` | 0 |
| Medallion photo | `fadeIn` | 0.1 |
| Person portrait | `fadeIn` | 0 |
| Person copy rows | `fadeInUp` | 0.08 step |
| Story photo | `fadeIn` | 0 |
| Story title / body | `fadeInUp` | 0.1 / 0.18 |
| Gallery | `fadeIn` | 0 |
| Envelope | `fadeIn` / `fadeInUp` | 0 / 0.12 |
| Closing seal / kicker / copy / names | `fadeIn` / `fadeInUp` | 0 step |

Mechanism: one `IntersectionObserver` adds `.is-in`; keyframes animate the
individual `translate` and `scale` properties (never `transform`), so the seal's
`rotate(-5deg)` and the plum branch's `rotate(10deg)` survive. Reduced motion
and `@media (scripting: none)` leave everything visible.

---

## 5. Responsive decision

The reference is a 390 phone canvas letterboxed inside a 420 frame. We ship a
**max-width 480 px column**, centred on `#33080b`, on every viewport. No desktop
two-column rewrite: the design has no desktop variant, and inventing one would
break the reference's single-column rhythm. Inner geometry is expressed with
`cqw` (container = section body) so the 390 measurements scale, and all
variable blocks (event cards, person copy, gallery grid) are flow/`aspect-ratio`
based — never a percentage of a count-derived parent height.

---

## 6. Section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `cover_photos[0]`, names, `estimated_wedding_date`, `guest_name` | always | 0 photos ⇒ `#4a0f12` flat; 1 name ⇒ no `&` | `template_content.cover_kicker`, `open_button`, `cover_apology` | load fade/up |
| 2 | Opening film | `video_url` (file or embed) | `feature_gates.video` && `video_section_visible` for the *video* only | full-bleed `100svh`: video autoplays muted and is cover-scaled (a 16:9 YouTube iframe is scaled to `177.78svh` and centre-cropped); the cover photo + a gold play control hold the frame until playback starts, and stay if the browser blocks autoplay (tapping mounts a muted-autoplay iframe); no video ⇒ cover photo only | none | fade |
| 3 | Welcome | `cover_photos[1]`, names, date | always | no photo ⇒ cover photo | `template_content.welcome_line` | load fade/up |
| 4 | Kalimat pembuka | `opening_title`, `opening_description` | `!hidesOpeningSection` | kicker only when a title exists; empty description ⇒ paragraph omitted | profile + `opening_kicker` | up |
| 5 | Mempelai | `groom_*` / `bride_*`, parents, IG, photos | `person_photos !== false` per portrait | missing parent/IG row ⇒ row omitted; missing photo ⇒ BP frame only | names/parents/IG profile; `mempelai_kicker`, `parents_label` | fade/up |
| 6 | Love story | `stories[]` | `feature_gates.story` && `story_visible !== false` | 0 ⇒ section omitted; 1 ⇒ medallion + one item; story without image ⇒ text item | `story_kicker`, `story_title` | fade/up |
| 7 | Event | `sessions[]` | always | 1 event ⇒ no divider; 0 ⇒ section omitted | `events_kicker`, `events_title`, `maps_label` | up |
| 8 | Countdown | `estimated_wedding_date` / first session | always when a date exists | no date ⇒ block omitted, welcome still renders | `days/hours/minutes/seconds` (allowlisted) | up |
| 9 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` && `inviting_families_visible !== false` | 0 ⇒ section omitted; long names wrap | `inviting_kicker`, `inviting_title`, `inviting_intro` | up |
| 10 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ omitted; time-less row renders description only | `rundown_kicker`, `rundown_title` | up |
| 11 | Gallery | `gallery_photos[]` | always with data | 1 photo ⇒ single 3:4 frame, no offset column; odd count ⇒ last spans centred | none (titles not needed) | fade |
| 12 | Video | `video_url` (file or embed) | `feature_gates.video` && `video_section_visible` | plays inline on mount (muted autoplay; poster until the player starts); hidden video ⇒ section omitted and closing falls back to photo | `video_kicker`, `video_title`, `video_intro` | up |
| 13 | Gift | `gift_accounts[]`, `gift_address` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | cream paper stage with the copy printed on the white card; accounts only ⇒ no address card; address only ⇒ no account list; none ⇒ omitted; the button discloses the details | `gift_kicker`, `gift_intro_title`, `gift_intro_description`, `gift_button`, `copy_address_button` | fade/up |
| 14 | Dress code | `dresscode.title/description/colors[]` | `dresscode_visible !== false` | 0 colours ⇒ prose only; long names wrap under 46 px swatch | profile title/desc; `dresscode_kicker`, `dresscode_intro` | up |
| 15 | Wishes | `/api/wishes` + guest identity | always | demo ⇒ seeded feed; 0 approved ⇒ empty state | `wishes_kicker`, `wishes_title`, `wishes_intro`; form microcopy allowlisted | up |
| 16 | Closing | `cover_photos[2]`, `closing_message`, names, date | always | no slot 2 ⇒ cover photo; video gate off ⇒ photo | `closing_kicker`, `closing_message` | load/up |

Order shipped: cover → opening film (**ADDED**, contract #2) → welcome →
pembuka → mempelai → story → event → countdown (in welcome, reference
position) → inviting (**ADDED**) → rundown (**ADDED**) → gallery → video
(**ADDED** block) → gift → dresscode → wishes → closing.

Reference order was: hero → quote → bride → groom → story → gallery → event →
dresscode → RSVP → gift → wishes → closing. Event moved before gallery to match
the contract; RSVP dropped; dress code moved after gift to match the contract.

---

## 7. Deviations and approvals

| Reference block | Decision |
|---|---|
| RSVP "Kindly Reply" form | **Dropped.** Playbook §0.5 rule 4 — the dock owns RSVP. The section's visual language (kicker + italic title + rule) is reused for Turut Mengundang/Rundown. |
| Live streaming | **Dropped.** Declared in the builder but renders nothing; `livestream` has no content in the preview. |
| "The Bride" / "The Groom" vertical labels | Replaced with the neutral `mempelai_kicker` (default "Mempelai"). Hanzi masks stay as ornament (`aria-hidden`). |
| "Daughter of" / "Son of" | Replaced with `parents_label` (default "Anak dari"). |
| Reference couple names/photos/story text | Not copied. Demo uses Aksaraa sample data; all strings are live data. |
| Desktop layout | Centred 480 px column (reference has no desktop design). |
| Opening film / film section | Both autoplay muted so the first screen after the gate is motion. The opening is full-bleed `100svh` (no frame or padding), with the 16:9 YouTube iframe scaled to cover the portrait viewport. A poster (or the cover photo) and the gold play control hold the frame until the player actually starts, so a blocked embed never leaves a black box; tapping the control reveals the player. |
| Gift copy | Printed on the white card exactly like the reference; the reference's "Make a gift now" button now discloses the account/address details instead of opening a modal. |
| Envelope "Make a gift now" button | Replaced with account cards + address in the same envelope/red-button language, because the invitation must expose the actual account numbers (playbook §0.5). |

No section outside the 16 ships without approval.
