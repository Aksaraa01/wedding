# REA — our-wedding.link "Silver Gelatin" → Aksaraa in-house template

Code `silver-gelatin`. Component `src/components/templates/silver-gelatin/`
(`index.tsx`, `silver-gelatin.css`, `Wishes.tsx`). Reference:
`https://our-wedding.link/design/silver-gelatin`.

## 1. Verdict

A monochrome editorial invitation built like a printed photo book: one white
390-wide canvas floating on a warm ivory page, Bodoni Moda capitals, Monsieur La
Doulaise script, Jost body copy, and every photograph rendered in
`grayscale(100%) contrast(104%)`. Layout is deliberately asymmetric — photographs
sit flush to one edge, captions run vertically in the gap, and the cover letters
are cropped by a white notch that cuts into the photo.

The reference is a Vue SPA (dynamic-layout blocks, WOW.js `fadeInUp`, an RSVP
form, a QR gift block). It is a **design, not a feature list**: it ships cover,
welcome, mempelai, story, venue, countdown, dresscode, a full-bleed photo band,
gifts, RSVP, gallery and closing, with no turut mengundang, no rundown and no
film section. All missing §0.5 sections were rebuilt in the reference's own
visual language (Bodoni headings, Jost caps labels, 12.5 px body, grayscale
plates with 16–36 px radii) rather than bolted on as generic cards.

**No reference asset is shipped.** Unlike `teatro`, `iris` or `lace`, this design
needs none: every image is the couple's own photograph and every ornament is a
rule, a radius or a type size. The only vendored files are the three fonts.

## 2. What the reference actually is

- Single page, no router, no server data. Copy comes from the block editor
  (`data-block-id` per text widget); the demo hard-codes Nadia/Raka and
  22.05.27.
- Motion is WOW.js `animate__fadeInUp` / `zoomIn` / `fadeInLeft|Right` on
  `IntersectionObserver` with 0.03 s stagger, 0.7–1 s durations.
- The cover is a fixed 390×844 composition in absolute pixels. Every offset was
  measured from the rendered DOM (see §6) and converted to `cqw` with
  `--sg-u: calc(100cqw / 390)` so it scales with the canvas instead of the
  viewport.
- The page is **not** scroll-locked: the cover's "Open Invitation" button plays
  the music and smooth-scrolls to `.sg-body`, leaving the cover as a normal
  first screen.
- Section rhythm is generous and fixed: `96px` top / `110px` bottom, no surface
  alternation — the entire body is the same white sheet.

## 3. Section inventory (measured) → what shipped

Reference blocks, measured at 390×844 (heights are the block's own box):

| Reference block | Height @ 390 | Notes |
|---|---|---|
| Cover | 844 (one screen) | photo 346×372 r28 at (22,86); white notch 198×82; initials 104 px; scripts 52 px |
| Welcome | 620 | greeting (17 px), body 12.5 px, `22 . 05 . 27`, two rotated photo bands (237×218 r26, captions 46 px script) |
| Mempelai | 560 | “THE COUPLE”, rule, two script names + full names + parents |
| Love story | 1 460 | alternating full-width / 78 % plates, left/right copy |
| Venue | 690 | 222×250 photo flush right (r30 top-left), intro bottom-left at width 124 |
| Countdown | 360 | digits 44–46 px Bodoni, lowercase Jost labels |
| Dresscode | 565 | 26 px heading, 194×368 photo flush left (`0 36px 36px 0`), four 126×34 swatches at x 216 (54 px pitch), 12.5 px paragraph |
| Full-bleed band | 316 | 90 px top margin + a 226 px edge-to-edge photo |
| Gifts | 330 + cards | two buttons (Direct Transfer / Send Gift), account cards |
| RSVP | form | part of the reference's single page |
| Gallery (“Moments”) | open | 2-up `4/5` grid, every `3n+1` spans the canvas at `16/11` |
| Closing | 465 | message, “See you!”, overlapping initials, dot date |

Shipped order in `silver-gelatin` (16 rendered sections + the footer):

```
sampul → film → pembuka (welcome) → mempelai → story → acara →
countdown → inviting → rundown → galeri → divider → gift → dresscode →
wishes → closing
```

The reference's own order is `welcome → mempelai → countdown → venue →
dresscode → photo band → RSVP → moments → gifts → wishes → closing`. Ours
follows the §0.5 contract order (story before the events, gallery before the
registry, dresscode after the gift) and keeps every reference block, including
the full-bleed band, which now sits between the gallery and the registry.

Mapping to the §0.5 contract:

| §0.5 # | Contract section | In `silver-gelatin` |
|---|---|---|
| 1 | Cover | `sampul` — photo, notch, initials, scripts, guest, open button |
| 2 | Opening video | `film` — one band directly under the cover (§9.1) |
| 3 | Welcome | `pembuka` — greeting + date + the two rotated portraits |
| 4 | Kalimat pembuka | `pembuka` (`opening_description` / `welcome_invite`) |
| 5 | Mempelai | `mempelai` |
| 6 | Love story | `story` |
| 7 | Event | `acara` |
| 8 | Countdown | `countdown` |
| 9 | Turut mengundang | `inviting` |
| 10 | Rundown | `rundown` |
| 11 | Gallery | `galeri` (+ full-bleed `divider` after it) |
| 12 | Video | merged into #2 (§9.1) |
| 13 | Wedding gift | `gift` |
| 14 | Dress code | `dresscode` |
| 15 | Wishes | `wishes` |
| 16 | Closing | `closing` |

RSVP is the shared `InvitationOverlay` dock (`anchor="bottom"`, `bottom={80}`),
not a section (§0.5 rule 4), so the reference's RSVP form is not ported.

## 4. Assets — none from the reference

| Object | Source |
|---|---|
| All photographs | couple data (`cover_photos`, `groom_photo_url`, `bride_photo_url`, `gallery_photos`, `stories[].image_url`) |
| Every ornament | CSS (rules, radii, the notch, the swatch chips) |
| Fonts | vendored woff2 (see §5) |
| Music | couple's `track_url`; demo falls back to `ASSETS.defaultMusic` |
| Thumbnail | authored from the live preview: cover at 390×844 @2x, resized to 720 wide, cropped to 720×1520 (the tile's exact 9/19) |

`public/templates/silver-gelatin/thumbnail.webp` is the only file added for the
gallery. No third-party origin survives in the bundle.

## 5. Fonts

Reference: **Bodoni Moda** (display), **Monsieur La Doulaise** (script), **Jost**
(body/UI). All three are vendored through the shared pipeline
(`scripts/fetch-fonts.js` → `public/fonts/*.woff2`, `scripts/gen-font-css.js` →
`src/app/fonts.css`) and exposed as `--font-bodoni`, `--font-monsieur`,
`--font-jost`. Nothing is loaded from Google Fonts at runtime.

## 6. Design system (measured)

| Token | Value |
|---|---|
| Page (behind the canvas) | `#F4EFE9` (measured, not `#EFEBE4`) |
| Canvas | `#FFFFFF`, `max-width: 430px`, centred |
| Ink | `#111111` |
| Body | `#2E2E2E` |
| Muted | `rgba(46,46,46,.7)` |
| Hairline | `rgba(46,46,46,.14)` |
| Soft card | `#F3F0EB` |
| Photo treatment | `grayscale(100%) contrast(104%)` |
| Radii | 16 / 18 / 22 / 26 / 28 / 30 / 36 px depending on the plate |
| Heading | Bodoni 26 px, `0.085em`, uppercase, centred |
| Script | Monsieur 50 px (mempelai), 52 px (cover), 46 px (photo captions, bleeding past the plate like the reference), 34 px (closing) |
| Label | Jost 9.5 px, `0.27em`, uppercase, muted |
| Body | Jost 12.5 px / 1.5 |
| Section rhythm | `96px 0 110px`; welcome `84px` top |
| Cover unit | `--sg-u: calc(100cqw / 390)`, cover height `calc(844 * var(--sg-u))` |

Cover geometry at 390 (converted verbatim):

| Element | Box |
|---|---|
| Photo | 346×372, r28, `top: 86`, `left: 22` |
| White notch | 198×82, `top: 382`, `left: 0` |
| Initial A | 110 wide, `top: 388`, `left: 38`, `::first-letter` 104 px |
| Initial B | 110 wide, `top: 410`, `left: 80` |
| Script A (bride) | `top: 478`, `left: 70`, width 296, right-aligned, 52 px |
| Script B (groom) | `top: 526`, `left: 40`, width 310, left-aligned |
| “DEAR” | `top: 604`, 9.5 px, `2.6px` tracking |
| Guest | `top: 620`, 13 px |
| Open button | `top: 664`, 46 tall, 196 min-width keyline, 11 px `0.24em` |
| Apology | `top: 742`, 8.5 px |

## 7. Data mapping

| Surface | Source |
|---|---|
| Cover shape | `cover_photos[0]` (Sampul), `cover_photos[1]` (Acara → film poster), `cover_photos[2]` (Penutup → dresscode plate) |
| Cover initials | first letter of `bride_name`, then `groom_name` (bride first, matching the reference's N/R) |
| Cover scripts | `bride_name` (upper right), `groom_name` (lower left) |
| Cover salutation | `template_content.cover_kicker` (default “Dear”) + `guest_name` |
| Open button | `template_content.open_button` |
| Apology | `template_content.cover_apology` |
| Film | `video_url` → `<video>` / YouTube iframe; poster = cover slot 2 |
| Welcome greeting | `opening_title` → `template_content.welcome_message` |
| Welcome body | `opening_description` → `template_content.welcome_invite` |
| Welcome date lead | `template_content.events_kicker` + `estimated_wedding_date` (`26 . 06 . 2027`) |
| Welcome portraits | `bride_photo_url`, `groom_photo_url`; captions from `story_kicker` / `gallery_kicker` |
| Mempelai | `bride_full_name` / `groom_full_name`, `*_parents`, `*_instagram`, `template_content.mempelai_kicker` / `parents_label` |
| Story | `stories[]` → `title`, `description`, `image_url` |
| Venue | `sessions[]` → `name`, `venue`, `address`, `date`, `time`, `maps_url` |
| Countdown | `countdownTarget(sessions, estimated_wedding_date)` + `gcalLink` |
| Inviting | `inviting_families[]` (TEXT, `JSON.parse`, `[]` when empty) |
| Rundown | `rundown[]` → `{time, description}` |
| Gallery | `gallery_photos[]` minus the divider frame, `template_content.gallery_title` / `gallery_intro` |
| Divider | last gallery photo (removed from the grid so no frame repeats), only when 4+ photos exist |
| Gift | `gift_accounts[]`, `gift_address`, `feature_gates.gift_address` |
| Dress code | `dresscode {title, description, colors[]}`, `template_content.dresscode_kicker` / `dresscode_intro` / `dresscode_note`; plate = cover slot 3 → `gallery_photos[0]` → cover |
| Wishes | `Wishes` component + `template_content.wishes_*` labels |
| Closing | `template_content.closing_message` / `closing_see` + dot date + initials |
| Music | `track_url` (`preload="metadata"`, first pointerdown warms it) |
| Dock | `guest_id` / `guest_slug` + `feature_gates.qr_code_book` |

Every string is `template_content.<key> || "<default>"`. The 34 literals that are
not (countdown units, WCAG names, transient states, the vendor credit, the
calendar CTA) are listed with reasons in
`scripts/template-copy-allowlist.json` under `templates["silver-gelatin"].allow`.
`npm run audit:copy -- silver-gelatin` reports clean.

## 8. Motion

`data-sg-load` (cover, plays on mount) and `data-sg-reveal` (body, plays on
`IntersectionObserver` at 12 % with a `-6%` bottom margin) plus
`--sg-delay` per element. Four keyframe families match the reference's WOW.js
vocabulary: `sg-fade-up`, `sg-fade`, `sg-zoom`, `sg-fade-right/left` (the two
script names sweep in from their sides on the cover).

`prefers-reduced-motion: reduce` and `@media (scripting: none)` both force
`opacity: 1; animation: none; transform: none` on every reveal target, so the
invitation is fully readable without JS (playbook §4).

## 9. Deliberate deviations (all recorded, none silent)

1. **Opening video (§0.5 #2) and film (§0.5 #12) are one band.** The reference
   has no film block, and duplicating one `video_url` at the top and again at
   #12 would ship the same clip twice. One full-bleed 16/9 band sits directly
   under the cover, with a poster, a play control and `video_title` /
   `video_intro` copy; the gallery/closing keeps the editorial rhythm below it.
2. **The cover does not lock the page.** The reference scrolls freely too: the
   “Open Invitation” keyline is a real button that starts the music and scrolls
   to the welcome band. No `body` class, no gesture blockers.
3. **The cover letters are cropped by a white notch, not by a mask image.** The
   reference paints a 198×82 white rectangle over the photo's bottom-left and
   sets two 104 px `::first-letter` glyphs on top of it. Rebuilt identically in
   CSS so it stays pixel-correct at every canvas width.
4. **Mempelai carries no portraits.** As in the reference, the couple section is
   text only (script name, full name, “Daughter of / Son of”, parents,
   Instagram). The portraits appear in the welcome bands instead, which is what
   satisfies `person_photos`.
5. **The photo captions are real vertical type.** `writing-mode: vertical-rl` +
   `rotate: 180deg` on a span inside a 124×218 anchor keeps them inside the
   canvas (an element-level `rotate(-90deg)` used to push them out). They bleed
   *past the plate* at 46 px exactly as the reference does — the script is longer
   than the 218 px photo, and that overhang is the intended composition.
6. **Gift has one button, not two.** The reference splits “Direct Transfer” and
   “Send Gift”; Aksaraa has one gift surface, so `gift_button` toggles the
   account cards (and the address card) in place. The QR block is not ported —
   the guest QR lives in the shared dock.
7. **“SHOW QR” is not shipped.** It belongs to the reference's own gift flow and
   is redundant next to the dock's QR.
8. **Card logos are not shipped.** The account card prints `provider_name` as
   type — a logo wall would be unmaintainable and the reference's own are
   third-party marks.
9. **Swatch names are visual-only.** The chips render 126×34 blocks; the names
   stay in `title`/`aria-label` so screen readers keep them, but the reference
   hides them too (a colour that needs a caption is not doing its job).
10. **The dot date keeps four digits.** The reference prints `22 . 05 . 27`; a
    paying couple's guests read a year, so it is `26 . 06 . 2027` in the welcome,
    closing and cover-free sections.
11. **A trailing lone gallery tile closes full-bleed.** The reference's `3n+1`
    rule can leave one 4/5 tile alone; `:last-child:nth-child(3n+2)` promotes it
    to `16/11` so the grid never ends on a half-empty row.
12. **No "Send a wish" address field.** The shared `Wishes` component collects
    name + message only; the reference's city field is not stored anywhere.
13. **Moments ends on the grid.** The reference has no closing line after the
    photo wall, so `gallery_quote` is not offered by this template's editor —
    dead copy fields are worse than a missing flourish.
14. **The gallery and the full-bleed band never share a frame.** The band takes
    the last gallery photo and drops it from the grid (only when the couple has
    four or more photos, so the grid never collapses). The reference uses two
    separate photographs for exactly the same job.
15. **The dresscode plate is cover slot 3.** On the reference it is its own
    upload; ours is the "Penutup" slot, falling back to the first gallery photo
    and then the cover. A couple who fills all three slots therefore gets three
    distinct plates on the cover, the film and the dresscode.

## 10. Verification

- `npx tsc --noEmit` — clean.
- `npm run audit:copy -- silver-gelatin` — clean (34 allowlisted literals).
- Preview render at 390×844 checked section by section against the reference
  screenshots and its measured `sections.json`: cover geometry (photo, notch,
  initials, scripts, button), greeting 17 px, 237×218 welcome plates with 46 px
  bleeding captions, heading 26 px / `0.085em`, `96/110` rhythm, gallery spans,
  dresscode band (194×368 `0 36 36 0`, swatches at x 216 on a 54 px pitch,
  top-down), 90 + 226 full-bleed band, countdown digits, closing monogram.
- Width check: `document.documentElement.scrollWidth === innerWidth` (390) at
  every breakpoint; the page canvas is capped at 430 px.
- Reduced motion / no-JS: every reveal target visible (CSS-only).
- Section gates exercised with the demo props: story, video, countdown,
  inviting, rundown, gallery, gift, dress code, wishes all render from data;
  hiding `feature_gates.video` or `video_section_visible` removes the film band.
