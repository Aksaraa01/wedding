# REA — The Digital Yes "Embroidered Garden" → Aksaraa in-house template

Reverse-engineering analysis. **Nothing is ported yet** — this document answers
three questions: what the real invitation URL is, whether every asset is
reachable, and what has to be removed/blocked before it can ship as an Aksaraa
in-house template.

---

## 1. Verdict

| Question | Answer |
|---|---|
| Real invitation URL | `https://embroidered-garden-template.thedigitalyes.com/` (the URL you gave, `/demo/embroidered-garden`, is their **marketing page**) |
| All assets available? | **Yes, technically** — 21 media files, every one returns `200/206` with `access-control-allow-origin: *`, no referer lock, no signed URLs, `cache-control: immutable`. ≈ 5.1 MB of art + 17.5 MB cover video/poster |
| Fonts available? | **No** — every face is Adobe Fonts (Typekit kit `yyb5qhs` / `dbv4jbd`). EULA forbids self-hosting; substitutions required |
| Branding to remove | Footer credit `Made with love by The Digital Yes` + its outbound link, the page `<title>`/OG tags, and the **`C&A` monogram baked into the cover video/poster** |
| Blocking risk | The illustrations themselves are The Digital Yes's commissioned artwork. Re-vendoring them byte-for-byte is a **copyright question, not a technical one** — see §8 |

---

## 2. What the two URLs actually are

| URL | What it is | Stack |
|---|---|---|
| `thedigitalyes.com/demo/embroidered-garden` | Marketing/demo landing page. Their SPA (`/assets/index-BgfI4Svq.js`, 448 KB) renders a catalogue of 30 themes and embeds the invitation | Vite + React SPA |
| `embroidered-garden-template.thedigitalyes.com` | **The actual guest invitation** — `<title>Camille & Antoine \| 12 June 2027</title>` | Separate Vite SPA: `index-OJTGFioL.js` (774 KB) + `index-DVuZLTi6.css` (82 KB), Supabase project `vqetrxorwzxzlighwgry`, no auth on reads |

The demo catalogue entry lives at byte ~315 394 of `app.js`:

```js
{slug:"embroidered-garden", name:"Embroidered Garden",
 tagline:{en:"A hand-embroidered Provençal garden"},
 demoUrl:"https://Embroidered-Garden-template.thedigitalyes.com"}
```

Only `/es/demo/…` is a locale mirror; there is one invitation host per theme
(LACE is `plantillalace.thedigitalyes.com`, etc.). **The invitation is a plain
public SPA** — no build secrets, no obfuscated config, so it reads like any
reference we have ported before.

---

## 3. Section inventory (measured)

Desktop 1086×928 → `scrollHeight 13 629`; mobile 390×844 → `8 801`. Twelve
`<section>` blocks:

| # | Section | Desktop h | Mobile h | Notes |
|---|---|---|---|---|
| 1 | **Cover / intro** | 928 | 844 | Full-bleed 10.4 s muted `intro-doors-open.mp4`, `poster=intro-doors.jpg`, names overlaid in DOM with `mix-blend-mode: multiply`, `TAP TO OPEN`; body scroll locked until it finishes |
| 2 | **Welcome** (`Bienvenue`) | 2017 | 724 | Wisteria + swans hero art, greeting paragraph |
| 3 | **Countdown** | 960 | 860 | Three pearl medallions (days/hours/minutes) in an embroidered frame |
| 4 | **Couple** | 500 | 457 | "Together with their families" + both full names |
| 5 | **Ceremony & Reception** | 726 | 593 | Venue, address, both events with times, `OPEN IN MAPS` + `ADD TO CALENDAR` |
| 6 | **Dress Code** | 819 | 573 | Black Tie, note, hanging-garland art, 6 illustrated guests |
| 7 | **Our Story** | 1969 | 798 | Long-form paragraph inside an embroidered arch |
| 8 | **Timeline** | 932 | 837 | 5 rows, dotted thread + pearl bead, one small illustration per row |
| 9 | **Recovery Day** | 1142 | 900 | Next-day brunch: venue, date/time, address, maps + calendar |
| 10 | **Gifts** | 1683 | 621 | Wishing-well copy inside a gold frame with a satin bow |
| 11 | **RSVP** | 1103 | 1094 | Name, attending (y/n), allergies, **shuttle seat (y/n)**, message, `SEND RSVP` |
| 12 | **Closing** | — | — | Names, date, château-and-garden illustration, **`Made with love by The Digital Yes`** |

`overflowX === 0` at both sizes. No music: **no `<audio>`, no track URL, no
player control** anywhere in the bundle (`grep` for `music|track_url|.mp3|.m4a`
→ zero hits). The only `<video>` is the cover.

### Not in the reference (Aksaraa additions to make)

Gallery, livestream, video section, quote/verse, inviting families, gift
accounts/address, wishes wall, RSVP dock, QR entry card. Our other templates
all have these, so this port would *add* them in this template's visual
language rather than drop them.

---

## 4. Asset audit — all reachable

Base `https://embroidered-garden-template.thedigitalyes.com`. Every file:
`200`/`206`, `access-control-allow-origin: *`, `cache-control: public, max-age=31536000, immutable`, served through Cloudflare. Several `.png` URLs are
already converted to `image/webp` by the CDN.

| # | Reference path | Bytes | Dims | Role |
|---|---|---|---|---|
| 1 | `…/intro-doors.jpg` | 2 079 KB | — | Cover poster (**contains `C&A` medallion**) |
| 2 | `…/intro-doors-open.mp4` | 15 400 KB | 10.4 s | Cover door-opening film (**contains `C&A`**) |
| 3 | `…/embroidered-swans-hero-v2.png` | 488 KB | 1034×1920 | Welcome hero (wisteria + swans) |
| 4 | `/assets/countdown-embroidery-frame…webp` | 367 KB | 1072×1920 | Countdown surround |
| 5 | `/assets/countdown-pearl-medallion…webp` | 291 KB | 1920×1920 | Countdown dial (used ×3) |
| 6 | `…/ceremony-reception-bg-v2.webp` | 447 KB | — | Ceremony section background |
| 7 | `…/dresscode-hanging-garland-v2.webp` | 618 KB | 1920×1288 | Dresscode hanging garland |
| 8 | `…/dress-code-illustration-v2.webp` | 255 KB | 1920×1072 | 6 illustrated guests |
| 9 | `…/story-frame.png` | 433 KB | 1072×1920 | Our Story arch frame |
| 10 | `…/timeline-pearl-large.png` | 7 KB | 156×146 | Thread bead |
| 11 | `…/timeline-chapel-v2.png` | 175 KB | 1920×1920 | Timeline 4:45 PM |
| 12 | `…/timeline-rings-v2.png` | 403 KB | 1920×1920 | Timeline 5:00 PM |
| 13 | `…/timeline-cocktail-v2.png` | 247 KB | 1920×1920 | Timeline 6:00 PM |
| 14 | `…/timeline-disco-v2.png` | 334 KB | 1920×1920 | Timeline 7:00 PM |
| 15 | `…/timeline-champagne-v2.png` | 293 KB | 1920×1920 | Timeline 11:00 PM |
| 16 | `…/recovery-day-divider.png` | 122 KB | 1920×271 | Rose-thread divider |
| 17 | `…/recovery-venue-v2.png` | 256 KB | 1920×1072 | Recovery venue art |
| 18 | `…/gift-frame-v3.png` | 200 KB | 1288×1920 | Gift frame + bow |
| 19 | `…/rsvp-envelope-v2.png` | 253 KB | 1920×1920 | RSVP frame |
| 20 | `…/rsvp-topiary.png` | 266 KB | 1434×1920 | RSVP topiary |
| 21 | `…/footer-chateau.png` | 238 KB | 1920×1072 | Closing château |

Total ≈ 5.1 MB art, 17.5 MB cover video + poster. **No license/attribution file
is served with any of them.**

Cover video caveat: the `C&A` monogram is *inside the artwork*, not DOM text —
reusing the film means covering it with an Aksaraa-drawn plaque for the couple's
initials (the names themselves are DOM text, so they already work).

---

## 5. Fonts — the one hard blocker

Typekit kits `yyb5qhs` (Adobe Caslon Pro) and `dbv4jbd` (the rest). The CSS
documents their EULAs explicitly; self-hosting or proxying these files is not
permitted, and our VPS is not an allowed kit domain.

| Reference family | Used for | Substitute from `public/fonts/` |
|---|---|---|
| `novantique-serif-display` | H1/H2 display, 60px, `+1.5px` tracking | **Cormorant Garamond** 400/500 (airy, high-contrast) — Playfair Display 400 as the heavier alternate |
| `adobe-caslon-pro` | Body 16px/27.2px, `+0.19px` | **EB Garamond** 400/400i |
| `mrs-eaves-roman-small-caps` (+ variants) | Caps eyebrows | EB Garamond / Cormorant uppercase with `0.18em` tracking |
| `adorn-garland` / `adorn-coronet` / `adorn-bouquet` / `adorn-pomander` | Floral script accents | **Pinyon Script** or **Italianno** (already vendored) |
| `medusa`, `dickens-tale-script`, `altesse-std-24pt` | Occasional script | **Alex Brush** / **Dancing Script** |
| `span` family | UI/number labels | **DM Sans** or **Jost**-alike (DM Sans vendored) |

No new font downloads needed — everything maps onto the 27 families already in
`public/fonts/manifest.json`.

---

## 6. Design system (measured)

Background `#f6f3ee`; ink `#2a4132` (HSV 141/22/21); headings `rgb(75,88,82)` →
`#4b5852`. Their token layer is HSL-triplet Tailwind:

| Token | HSL | Hex |
|---|---|---|
| `--background` / `--ivory` | 38 32% 95% | `#f6f3ee` |
| `--foreground` | 141 22% 21% | `#2a4132` |
| `--card` | 38 30% 96% | `#f8f6f2` |
| `--gold` / `--ochre` | 34 58% 50% | `#c98936` |
| `--olive` | 80 26% 33% | `#5b6a3e` |
| `--countdown` | 176 26% 35% | `#42706d` |
| `--lilac` | 288 20% 52% | `#936c9d` |
| `--dusty-rose` | 4 46% 62% | `#cb7772` |
| `--champagne` | 37 42% 80% | `#e1d1b7` |
| `--border` | 37 34% 71% | `#cebb9c` |
| `--ink` | 141 24% 16% | `#1f3326` |

Type scale: display 60px/60px `+1.5px`; body 16px/27.2px `+0.192px`; caps
labels ≈ 11–12px with wide tracking. Rules are 1px hairlines in `--border`, and
every section is separated by an embroidered garland rather than a border.

---

## 7. Data mapping (Aksaraa fields)

| Reference | Aksaraa source | Gap |
|---|---|---|
| Cover names, date | `groom_name`/`bride_name`/`display_name`, `estimated_wedding_date` | — |
| Welcome paragraph | `quote_text`-style → new `template_content.welcome_message` | new extras key |
| Countdown | `estimated_wedding_date` + first session time | — |
| Couple names + "together with their families" | `groom_full_name`/`bride_full_name`/`*_parents` | — |
| Ceremony & Reception | `sessions[]` (name/date/time/venue/address/maps_url) | `ADD TO CALENDAR` uses existing `gcalLink` |
| Dress Code | `dresscode` jsonb (`title`, `description`, `colors[]`) | illustration is fixed art |
| Our Story | `stories[]` | reference has one long paragraph, we have chapters — render chapters inside the arch |
| Timeline | `rundown[]` (time/description) | **illustration per row is fixed art**, ours has no icon field |
| **Recovery Day** | — | **new section**; needs `template_content.recovery_*` (venue/date/time/address/maps) or a `recovery` jsonb |
| Gifts | `gift_accounts[]` + `gift_address` | reference only has a wishing-well paragraph |
| RSVP | `InvitationOverlay` dock | reference is inline in-page; ours is a modal — keep our dock for consistency with the rest of the suite |
| Shuttle / allergies / dinner | — | not in our RSVP schema; **do not port** (see §9) |
| Closing | `closing_message` | — |

---

## 8. The licensing question (read before any code)

Two different problems hide behind "remove the mark":

1. **The visible mark** — `Made with love by The Digital Yes` in the footer,
   plus the `<title>`/OG tags and the `C&A` monogram. Easy: delete the credit +
   link, retitle, overlay our own plaque. This is mechanical.
2. **The invisible mark** — the embroidered wisteria, swans, medallion, garland,
   château and the six illustrated guests are The Digital Yes's commissioned
   artwork, i.e. the entire visual identity of the template. Copying the files
   into `public/templates/embroidered-garden/` and shipping them on a paying
   competitor product is copyright infringement regardless of the footer text.
   No license, no attribution requirement, no "free for commercial use" notice
   is served with them.

Three ways forward, in increasing risk:

- **A. Art re-creation (recommended).** Keep the *layout and mechanics*
  (measured above) and commission/derive our own embroidery-style art. Highest
  fidelity to the structure, no IP exposure. Needs an art source we do not have
  today (no image generator in this repo/toolchain; `sips`/`sharp` only
  transform).
- **B. Asset licence.** Ask The Digital Yes for a redistribution licence, or buy
  the template and get it in writing. Then option C becomes clean.
- **C. Vendor as-is (not recommended).** Copy the 21 files, strip the credit.
  Technically trivial — every asset is already downloadable — but it is the
  pattern that gets a takedown notice, and unlike the Still & Ever port (which
  reused layout but *our* photography), here the art **is** the template.

I will not start C without your explicit go-ahead in writing, because it is the
one step in this port that cannot be undone by deleting a commit.

---

## 9. Deliberate omissions (if/when we build it)

- **Adobe Fonts** — substituted per §5, never proxied.
- **`C&A` monogram** — covered by an Aksaraa-drawn initials plaque.
- **Shuttle seat / allergies / dinner choice** — bespoke RSVP questions with no
  counterpart in `InvitationOverlay`; porting them would fork the RSVP flow for
  one template.
- **15.4 MB cover film** — would blow the mobile budget. Either poster + CSS
  door-split (our own animation, ~2 s) or a re-encoded ≤1.5 MB webm/mp4.
- **Scroll-jacking / body-scroll lock until the cover finishes** — we already do
  a locked gate in `still-ever`; reuse that pattern rather than a new one.

---

## 10. Port plan (if approved, staging first)

1. `docs/REA_EMBROIDERED_GARDEN.md` (done) → art decision (§8).
2. Vendor assets into `public/templates/embroidered-garden/` (optimised: webp +
   `thumbs/` backfill via `scripts/backfill-thumbs.mjs`), or their replacements.
3. Component `src/components/templates/embroidered-garden/{index.tsx,
   embroidered-garden.css}` — sections 1–12 above, minus the omissions in §9.
4. Register: `TEMPLATE_MAP`, `TEMPLATE_CONFIGS` (`cover_slots: 2` — cover art +
   closing château; `story_photo: false`, `sections.opening_description: false`),
   `demoProps.ts`, `templateSections.ts`, `templateExtras.ts` (welcome, recovery,
   gift intro, wishes intro, closing), preview `keepDemoIds`.
5. Migration `supabase/migrations/2026…_embroidered_garden.sql` — `code
   'embroidered-garden'`, `source_type 'inhouse'`, tier `Baru`, category
   `Elegant`, `sort_order` set, `package_eligibility` copied from a sibling.
6. Staging: apply migration → insert row → `rm -rf .next` → build → preview at
   390×844 and 1440×900 → zero console errors, `scrollWidth === innerWidth`.
7. Prod only after review: commit → push → build → `npm run deploy` → smoke.

**Effort:** 1.5–2 sessions for option A (layout + our own art), ~1 session for
option C (vendored art, still needs the cover rebuild + font substitution).

---

## 11. Build log — what actually shipped (and why)

Status: **built, staging-verified, not committed.** Component lives at
`src/components/templates/embroidered-garden/`, art in
`public/templates/embroidered-garden/` (21 files, 4.7 MB incl. the film).
Migration `supabase/migrations/20261038000000_embroidered_garden.sql` is written
but not applied.

### 11a. Cover: the medallion is painted into the film

The `C&A` medallion is **not** a separate layer in the reference — it is
rendered into every frame of `cover-door.mp4`. It cannot be removed, only
covered. It also **travels**: as the right-hand door swings, the medallion
slides right and grows slightly.

Measured from the film itself (17 frames sampled at 0.1 s, cream-pixel bounding
box inside the door band):

| t (s) | cx (% of film width) | width | height |
|---|---|---|---|
| 0.0 | 50.7 | 29.9 | 22.3 |
| 1.2 | 56.3 | 29.7 | 23.3 |
| 2.0 | 63.3 | 28.6 | 23.8 |
| 2.6 | 69.8 | 27.5 | 24.3 |
| 3.2 | 76.1 | 26.7 | 24.7 |

`MEDALLION_TRACK` in `index.tsx` holds these samples (scaled ×1.22/×1.29 to the
full cartouche extent), `medallionAt(t)` interpolates, and a `requestAnimationFrame`
loop reads `video.currentTime` and sets `left/width/height` on
`.eg-gate__plaque` every frame. Result: the Aksaraa cartouche stays glued to the
painted medallion instead of sitting still and fading like a sticker. It is not
faded separately — the gate fades as a whole when the doors are open.

Reveal timing: the doors are fully open at ≈3.3 s, so the gate reveals at 3.6 s
instead of waiting out the 10.3 s film (the remaining 6.7 s is an interior pan).

### 11b. Frames: border-image, not stretched artwork

First attempt stretched the whole framed illustration (`background-size: 100%
100%`), which distorted the bow and roses; the second attempt sliced it into
crown/foot/side `<span>`s, which left visible seams where the side vines were
stretched to a different vertical scale than the corner bands.

The shipped approach is a **single `border-image`** over the original artwork:

```css
.eg-card { container-type: inline-size; }
.eg-card__frame {
  border-width: 29.13cqw 13.82cqw 33.88cqw 13.82cqw;   /* 215/102/250/102 of 738 */
  border-image: var(--eg-card-art) 215 102 250 102 fill stretch;
}
```

Corners are drawn at their natural size, only the middle edge slices stretch, and
the padding box is automatically the painted gold line — so copy can never spill
onto the embroidery. `cqw` keeps the border proportional at every width. The
ceremony card uses `ceremony-bg.webp` with `300 146 300 146`; the gift card uses
`gift-frame.webp` with `215 102 250 102`.

### 11c. Gift: accordion, one open at a time

A long account list used to make the gift card very tall, which stretched the
side vines until they looked wrong. Accounts are now collapsed rows that show
only the bank name; tapping one expands the number, holder and copy button and
closes the others (`openAccount` state, `grid-template-rows: 0fr → 1fr`
transition). Card height is therefore constant for any number of accounts
(584 px closed / 693 px with one open at 390×844).

### 11d. Event card copy order

Per client feedback: kicker → title (*below* the floral arch) → intro → event
name → date and time (each on its own line) → venue → address → map link.
"Add to calendar" was removed from this card — the countdown card already has
it.

### 11e. Cover: greeting above the call to action, whole-surface tap

The guest greeting (`Dear,` + `guestName`, defaulting to `Tamu Undangan`) sits
inside `.eg-gate__guest` at `bottom: max(126px, safe-area + 116px)`, i.e. 33 px
above the "Tap to open" button at 390×844. It fades out with the button once the
doors start (`guestOpacity: 0`), so the parted curtain is left clean. The tap
handler is on the whole `.eg-gate`, not the button, so a tap anywhere on the
cover opens it (verified by clicking y=300, mid-poster).

Landscape is handled with a `min-aspect-ratio: 4/5` media query: the film keeps
its whole 9:16 panel (`width: auto; height: 100%; aspect-ratio: 9/16`) on
`#f1ece2` instead of being `cover`-cropped, which used to push the names off the
top of the screen on a desktop viewport.

### 11f. Gallery: two marquees, one viewer

Sandhya's concept — a quote between two sliding photo rows — rebuilt in this
palette. Two `.eg-gallery__row`s of `.eg-gilded` tiles (132 px wide, 3:4, gold
hairline, paper mat), the second running in reverse, with `gallery_title`,
`gallery_intro` and `gallery_quote` extras. The track is exactly
`[...gallery, ...gallery]` and animates to `translateX(-50%)`, so the loop is
seamless whatever the photo count; hover pauses, `prefers-reduced-motion` removes
the animation, and both ends are mask-faded into the paper. Rows fade at 7% so a
tile never pops in mid-slide.

The story lightbox was generalised from `number | null` to
`{ photos, index } | null`, so story tiles and gallery tiles share one viewer and
one keyboard handler (`stepLightbox`). Tapping a gallery tile opens the gallery
list at that photo, not the story list.

### 11g. Desktop cover: the film becomes a printed card

Full-bleed is right on a phone and wrong on a desktop: a 9:16 film stretched to
`100vh` on a 1920-wide screen is a 607 px strip of sage with bare cream either
side, the door seam runs through the greeting and the call to action, and the
credit line is clipped by the bottom edge. Measured at 1920×1080, 1440×900,
1280×800 and 1024×768 before the fix.

`@media (min-aspect-ratio: 4/5)` now lays the gate out as a flex column:
`.eg-gate__film` becomes a card (`height: min(76vh, 100vh - 250px)`, true 9:16,
`box-shadow` used as the paper mat + gold hairline so the artwork keeps its
exact geometry), and the greeting, button and credit move into the cloth below
it as normal flow — static positioning, ink `#2f3b34` on cream, no text shadow.
The medallion plaque still tracks the baked-on medallion because nothing crops
the video: the film box stays exactly 9:16.

Two traps worth remembering:

- **Declaration order beats media queries.** The desktop block was first placed
  next to `.eg-gate__film`, but `.eg-gate__guest`, `.eg-gate__open` and
  `.eg-gate__signature` are declared *later* in the file, so their
  `position: absolute` won on equal specificity and the greeting stayed glued
  inside the card. The media query now lives at the end of the stylesheet.
- Reserving only `100vh - 210px` overflowed the viewport at 768 px tall
  (padding 56 + card 518 + gaps 45 + stack 152 = 771 > 768). `250px` clears it.

Portrait tablets (834×1194, aspect 0.70) and phones keep the full-bleed film.

### 11h. Wedding film section

`profile.video_url` → `normalizeVideoUrl` → a gilded 16:10 poster (gallery[0],
else the closing portrait, else the cover) with a gold play medallion, captioned
`tc.video_caption`. Tapping opens the shared dark viewer (`.eg-lightbox` reuse)
with a 16:9 `min(1024px, 100%)` box — a YouTube embed with
`autoplay=1&rel=0&playsinline=1&modestbranding=1`, or a native `<video controls>`
when the URL is a direct file (`.mp4/.webm/.mov/.m4v`). Escape and the scrim both
close it, the guest RSVP dock hides while it is open, and the section disappears
entirely when the URL is empty, `feature_gates.video === false`, or
`video_section_visible === false`.
