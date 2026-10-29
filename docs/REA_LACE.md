# REA — The Digital Yes "Lace" → Aksaraa in-house template

Reverse-engineering analysis for `lace`. Same structure as
`docs/REA_EMBROIDERED_GARDEN.md`: what the reference is, what had to be removed,
and what actually shipped (including the traps that cost time).

---

## 1. Verdict

| Question | Answer |
|---|---|
| Reference URL | `https://www.thedigitalyes.com/demo/lace` (their catalogue) + the standalone invitation SPA it links to |
| All assets available? | **Yes** — 34 reachable files, no referer lock, no signed URLs, `access-control-allow-origin: *` |
| Fonts available? | **No** — the reference uses Adobe Fonts. Substituted with locally hosted `Cormorant` (display), `WindSong` (script) and `DM Sans` (body) from `public/fonts` |
| Music | The reference has its own track (`until-were-gone-opt.mp3`). **Not shipped.** The demo uses `ASSETS.defaultMusic`; a couple's real invitation uses their own upload |
| Branding removed | Footer credit "Made with love by The Digital Yes", the reference couple (Beatriz & Alexander), the reference venue/date, the baked `B & A` wax seal on the cover plate |
| Photo slots | **Zero.** See §7 |

---

## 2. What the reference actually is

| URL | What it is | Stack |
|---|---|---|
| `thedigitalyes.com/demo/lace` | Marketing/catalogue page. Renders the invitation in an embedded frame | Vite + React SPA (`assets/index-*.js`, 448 KB) |
| the linked invitation host | **The guest invitation** — one `<section>` per beat, Tailwind utility classes, no data layer of its own | Vite + React SPA |

Because the invitation is Tailwind utility soup (`min-h-[100dvh]`,
`bg-[#6f2a3b]`, `pt-20 md:pt-28`), the visual design had to be reconstructed
from screenshots + sampled pixels rather than read from a stylesheet. Captures
live in `/private/var/.../opencode/garden-rea/lacecap2/` (`01-landing.png`,
`03-opening.png`, `10-scroll-01..12.png`, plus `text.txt`, `assets.txt`,
`structure.json`).

---

## 3. Section inventory (measured)

Twelve reference blocks, in order:

| # | Reference section | What we shipped | Notes |
|---|---|---|---|
| 1 | Landing (sealed cover) | `cover` (gate) | Sealed portrait plate + wax seal + guest + "Open the Invitation". Tapping plays the frame film, then hands over |
| 2 | Opening / names | `cover` (section) | "Together with their families", names, `20.05.2027`, villa illustration, venue, city |
| 3 | Welcome copy | `welcome` | Lace band lead-in, still-life vignette, greeting |
| 4 | Countdown | `countdown` | Burgundy panel (`#511f2b` base, `#702b3c` body) with the bow frame at 55 % and lace bands top/bottom |
| 5 | Location | `location` | Script venue, gold city caps, lace oval plate, "Get directions" |
| 6 | The Day | `day` | Pearl-garland header + timeline rows (vignette · time · thread · text) + banquet-table footer |
| 7 | Dress code | `dresscode` | Lace frame, illustrated couple, swatch row, pearls down both edges |
| 8 | **Transportation** | **`inviting` — "Turut Mengundang"** | Deliberate replacement, see §5 |
| 9 | Where to Stay | *dropped* | No Aksaraa field for it; keeping it would mean inventing hotel copy per couple |
| 10 | Wedding Gift | `gift` | Lace panel (`panel-lace.webp`) around the accordion accounts + address |
| 11 | RSVP | `wishes` | Name + note form, then the approved-wishes feed, 5 per page |
| 12 | Closing | `closing` | "We cannot wait to celebrate with you.", names in script, long date, balcony art, Aksaraa footer |

Section order shipped:

```
cover → welcome → countdown → location → day → dresscode
      → inviting → gift → wishes → closing
```

`gallery`, `story`, `video`, `quote`, `livestream` are **off** in
`TEMPLATE_CONFIGS["lace"].content.sections` — the design has no surface for them.

---

## 4. Palette + type (sampled, not guessed)

Pixels sampled from the captures:

| Token | Value | Where it came from |
|---|---|---|
| `--lc-ivory` | `#f7f5f3` | page background (`10-scroll-02.png` @ 100,400) |
| `--lc-wine` | `#511f2b` | dress/Transportation/closing panels (`10-scroll-07/11.png`) |
| `--lc-wine-2` | `#702b3c` | countdown body (`10-scroll-02.png` @ 400,1480) |
| `--lc-ink` | `#4e1e29` | heading + script darkest pixel (`10-scroll-03.png`) |
| `--lc-body` | `#704952` | body copy darkest pixel |
| `--lc-gold` | `#b3997a` | small caps labels |

The reference's countdown class string is literally `bg-[#6f2a3b]`, which agrees
with the sampled `#702b3c` within rounding.

Fonts — all self-hosted from `public/fonts`, declared in `src/app/fonts.css`:

- display `Cormorant` (`--font-cormorant`)
- script `WindSong` — **no `--font-*` variable**; the `@font-face` is declared
  directly at `src/app/fonts.css:625`, so reference it by family name
- body `DM Sans` (`--font-dmsans`)

---

## 5. The Transportation → Turut Mengundang decision

The reference's `Transportation` block is a shuttle/logistics block ("buses
leave at…"). Aksaraa has no per-couple transportation data, and couples here
expect their inviting families ("Turut Mengundang") somewhere in the flow.

So the slot keeps the reference's *visual* language — burgundy panel, lace band
top and bottom, ornament — and renders `inviting_families`. **The title stays
Indonesian** ("Turut Mengundang") while every other string in the template is
English, because that phrase is a fixed cultural label, not translatable copy.
It is gated exactly like every other template: `feature_gates.inviting_families`
and `inviting_families_visible`.

An empty list removes the whole panel — no orphan heading.

---

## 6. Asset audit — what shipped

28 files, 3.3 MB total, in `public/templates/lace/`:

| Group | Files |
|---|---|
| Cover | `cover-sealed.jpg` (1080×1920, the baked-seal plate), `cover-frame.webp` (720×1280, seal-free frame extracted from the film), `cover-film.mp4` (720×1280, 2.4 s) |
| Lace bands | `band-lace.webp` (1300×533, crown: flowers + foliage), `band-border.webp` (1400×594, rose-and-net border), `panel-lace.webp` (992×925) |
| Ornament | `bow-frame.webp` (1627×1513 full countdown frame), `pearls.webp` |
| Location | `oval-location.webp` (1100×1629 lace oval), `villa.svg` (219×105 line illustration, `#511F2C`) |
| Dress code | `dress-frame.webp` (848×1264), `dress-couple.webp` (640×994) |
| The Day | `garland.webp` + `garland-0..4.webp` (pearl garland, base + 5 strands), `step-{welcome,ceremony,cocktail,champagne,dinner,dancing}.webp`, `table.webp` |
| Scenery | `balcony.webp`, `tulle.webp` |
| Listing | `thumbnail.webp` (720×1520, 9:19 crop of the sealed plate) |

**Dropped on purpose:** `until-were-gone-opt.mp3` (their music),
`banquet-breeze-map.png` (a New York map — reference data), `dance-floor.mp4`,
`dancing-details.png`, `welcome-details.png`, `lace-bow-prev.webp`,
`lace-corner-swag.webp` (never used by the reference render), and
`hotel-ornament.png` (it belongs to the "Where to Stay" block we do not ship).

Compression is `sharp` webp at q68–86; the two heaviest originals
(`dress-frame` 1.1 MB, `dress-couple` 2.1 MB) came down to 123 KB / 80 KB. The
oval is the one deliberately fat file (492 KB) because it is a large photographic
plate on a cream background where banding shows at lower quality.

---

## 7. Photo-less: why `no_photo` is true

The reference has **no photo slots** — every surface is either lace art or type.
Shipping it with photo slots would have meant inventing a gallery that the design
does not have room for.

Therefore:

- `web_templates.no_photo = true` for `lace`
- `TEMPLATE_CONFIGS["lace"].content.cover_slots = 0`, and the gallery / story /
  video / quote sections are off
- `src/lib/invitationCompleteness.ts` already waives `galeri` and `video` when
  `no_photo_template` is true (lines ~127–137), so a couple on Lace can publish
  without ever opening a photo field
- the editor hides the photo accordions off the same flag

Stored photos are never deleted — switching a couple to a photo template brings
their existing photos back.

---

## 8. Build log — what actually shipped (and why)

### 8a. The gate is a pure sealed cover

Two separate art files, and they must not be confused:

- `cover-sealed.jpg` — the reference poster, **with** a `B & A` wax seal baked
  into the pixels at centre 50.2 % / 50.9 %, 23.7 % × 16.35 % of the plate.
- `cover-frame.webp` — a frame pulled out of `cover-film.mp4`, **no** seal.

Because the bake is not a DOM element it cannot be removed — only covered. Our
seal is an SVG plaque sized **25 % × 17.6 %** (slightly larger than the measured
footprint) on the same centre, carrying *our* couple's initials. That is why the
gate shows `cover-sealed.jpg` and the film shows `cover-frame.webp`.

The gate owns the tap on the whole surface (`onClick` on `.lc-gate`, with the
button as a duplicate affordance) and the video's `ended` event reveals the
invitation, capped at 4.5 s so a stalled download can never trap a guest.
`prefers-reduced-motion` skips the film entirely.

### 8b. Names live in the cover section, not on the gate

Mirrors the reference's landing → opening flow: the gate is sealed and anonymous
except for the guest's name; the couple's names, date, venue and city appear in
the `cover` section the moment the invitation opens.

### 8c. Band overhang: the bottom border is mirrored

`band-border.webp` grows its scallops downward. A bottom band therefore uses

```css
transform: translateY(44%) scaleY(-1);
```

so the scallops hang *past* the panel edge onto the ivory instead of stopping at
it. `scaleY(-1)` mirrors in place, `translateY(44%)` drops it by nearly half its
own height, and the flat net edge ends up hidden inside the panel.

### 8d. Container-query sizing inside the two "card" surfaces
The cover card and the dress frame change aspect ratio between phone and desktop
(§8e), so their inner type is sized in `cqw` units against
`container-type: size` on the card, not in `vw`/`px`. That keeps the greeting,
names and date optically identical whether the card is 390 px wide or 366 px
wide inside a 1440 px viewport. `vw` units here produce text that is either tiny
on desktop or overflowing on mobile.

### 8e. Desktop: the 9:16 art becomes a printed card

The art is 9:16. Stretched over a 1440×900 window it would be a watercolour smear.
So, exactly like `embroidered-garden`:

```css
@media (min-aspect-ratio: 4/5) { … }
```

centres the gate plate and the cover section as a **printed card**
(`height: min(74vh, …); aspect-ratio: 9/16`) with an ivory mat and a thin gold
rule, and moves the gate's greeting/button out of the absolute bottom strip into
a column beneath the card. The mobile rule stays the full-bleed strip.

### 8f. The declaration-order trap (cost a re-do on embroidered-garden)

All desktop overrides live at the **end** of `lace.css`. A media query earlier in
the file loses to a later base rule of equal specificity — that is precisely how
the embroidered-garden desktop card silently reverted to the mobile overlay on
first ship. Order is part of the design here; do not "tidy" the desktop block
upwards.

### 8g. The garland is one base + five strands

`garland.webp` is the shared pearl swag; `garland-0..4.webp` are the individual
hanging strands. Each strand is positioned with

```css
left: calc(13.5% + var(--lc-strand) * 18%);
```

so the swag keeps its shape as the container scales, instead of five absolutely
positioned images that drift apart at other widths.

### 8h. Timeline vignettes cycle for longer rundowns

Five rows map one-to-one onto the five reference beats (arrive → vow → toast →
dine → dance). A longer `rundown` cycles a six-image set so the sixth beat ends
on the champagne coupe rather than repeating the first vignette.

### 8i. Two band assets, two jobs

The reference uses two different lace strips and they are **not**
interchangeable:

- `band-lace.webp` — the crown (stylised flowers + foliage, transparent
  everywhere else). Reads as an embossed crest on ivory and as appliqué lace on
  burgundy. Used at the **top** of every section/panel and as the welcome lead.
- `band-border.webp` — the rose-and-net border. Its pink net has a **straight top
  edge**, so on ivory it leaves a hard seam unless it is bleeding off a section
  boundary. Used at the **bottom** of the burgundy panels, mirrored
  (`translateY(44%) scaleY(-1)`) so the scallops hang past the panel onto the
  ivory — exactly where the reference puts it.

Putting the rose border at the top of an ivory section was the first draft's
mistake: it produced a washed-out band with a visible cut.

### 8j. Desktop is the same invitation in a 720 px column

Lace is a 9:16 design. Rendering the panels full-bleed at 1440 px inflated the
crowns to ~510 px tall — the lace ate the sections and the headings sat on top of
it. Desktop therefore keeps **one 720 px column** (`.lc-band` max-width 720, the
same as `.lc-wrap`) and scales the panel paddings by the same factor as mobile
(128 px at 390 → 250 px at 720). Because the band art is cut off at its own side
edges, the desktop rule also fades them:

```css
mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
```

so the crest dissolves into the paper instead of ending in a hard vertical line.

---

## 9. Registration checklist (what a new template touches)

1. `src/components/templates/lace/{index.tsx,Wishes.tsx,lace.css}`
2. `public/templates/lace/` (28 assets)
3. `src/components/templates/index.ts` — `TEMPLATE_MAP` import + entry, and a
   `TEMPLATE_CONFIGS` entry (theme, `cover_slots: 0`, section flags, `extras: true`)
4. `src/components/templates/demoProps.ts` — `DEMO_PROPS_BY_CODE["lace"]`
5. `src/lib/templateExtras.ts` — per-template placeholders; `location_intro` was
   added as a new field for this template
6. `src/lib/templateSections.ts` — `TEMPLATES_WITHOUT_OPENING` (no "Kalimat
   Pembuka" block)
7. `src/app/templates/[code]/preview/page.tsx` — added to `keepDemoIds` so the
   RSVP feed shows the demo wishes
8. `supabase/migrations/20261039000000_lace.sql` — the `web_templates` row
   (`no_photo = true`, `sort_order = 3`, category `Floral`, tier `Baru`)

## 10. Still open

- The reference's "Where to Stay" block has no Aksaraa equivalent. If a
  per-couple accommodation field ever lands, it belongs between `inviting` and
  `gift` as a burgundy panel, not as a new section type.
