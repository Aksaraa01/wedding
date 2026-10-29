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
| 1 | Landing (sealed cover) | `cover` (gate) | Still sealed plate + our wax plaque + guest + "Open the Invitation". Tapping plays the reference's own envelope film (`opening.mp4`, 5 s) with the plaque riding the baked seal, then fades the gate over 2 s |
| 2 | Opening / names | `cover` (section) | "Together with their families", names, `20.05.2027`, villa illustration — no venue/city (dropped on request) |
| 3 | Welcome copy | `welcome` | Lace band lead-in, still-life vignette, the couple's *kalimat pembuka* |
| 4 | Mempelai | `couple` | Two matted portraits, script full names, parents, Instagram — added in-house, no reference block |
| 5 | Countdown | `countdown` | Burgundy panel (`#511f2b` base, `#702b3c` body) with the bow frame at 55 % and lace bands top/bottom |
| 6 | Events (akad / resepsi) | `events` | One card per `sessions` row: script name, date + time, venue, address, "Get directions". Replaces the reference Location block |
| 7 | The Day | `day` | Pearl-garland header + timeline rows (vignette · time · thread · text) + banquet-table footer |
| 8 | Dress code | `dresscode` | Lace frame, illustrated couple, swatch row, pearls down both edges |
| 9 | **Transportation** | **`inviting` — "Turut Mengundang"** | Deliberate replacement, see §5 |
| 10 | Where to Stay | *dropped* | No Aksaraa field for it; keeping it would mean inventing hotel copy per couple |
| 11 | Wedding Gift | `gift` | Lace panel (`panel-lace.webp`) around the accordion accounts + address |
| 12 | Gallery + Film (in-house) | `gallery`, `video` | Ivory gallery grid (first tile 16:10, rest 4:5 in gold-matted ivory), burgundy film panel with a 16:9 autoplaying, muted, looping player |
| 13 | Wishes | `wishes` | Name + note form, then the approved-wishes feed, 5 per page — titled "Wishes", not "RSVP" |
| 14 | Closing | `closing` | "We cannot wait to celebrate with you.", names in script, long date, balcony art, Aksaraa footer |

Section order shipped:

```
cover → welcome → couple → countdown → events → day → dresscode
      → inviting → gallery → video → gift → wishes → closing
```

`story`, `quote` and `livestream` stay **off** in
`TEMPLATE_CONFIGS["lace"].content.sections` — the design has no surface for them.
`gallery` and `video` are **on**: they are the only blocks that carry the couple's
own photographs and film. The reference's `location` block is gone; the venue now
lives inside the event cards, so `location_intro` was removed from
`src/lib/templateExtras.ts`.

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

28 files, 5.5 MB total, in `public/templates/lace/` (two of them video):

| Group | Files |
|---|---|
| Cover | `cover-sealed.jpg` (1080×1920, first frame: tulle + pearls + baked seal), `opening.mp4` (1080×1920, 5.04 s — the reference's envelope film), `cover-frame.webp` (720×1280, seal-free still), `hero-bg.mp4` (720×1280, 2.4 s — the living cover backdrop) |
| Lace bands | `band-lace.webp` (1300×533, crown: flowers + foliage), `band-border.webp` (1400×594, rose-and-net border), `panel-lace.webp` (992×925) |
| Ornament | `bow-frame.webp` (1627×1513 full countdown frame), `pearls.webp` |
| Cover art | `villa.svg` (219×105 line illustration, `#511F2C`) — the oval from the dropped Location block is not shipped |
| Dress code | `dress-frame.webp` (848×1264), `dress-couple.webp` (640×994) |
| The Day | `garland.webp` + `garland-0..4.webp` (pearl garland, base + 5 strands), `step-{welcome,ceremony,cocktail,champagne,dinner,dancing}.webp`, `table.webp` |
| Scenery | `balcony.webp`, `tulle.webp` |
| Listing | `thumbnail.webp` (720×1520, 9:19 crop of the sealed plate) |

`cover-film.mp4` and `oval-location.webp` were removed: the gate now plays the
reference's envelope film (`opening.mp4`) and the Location block was dropped.

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

## 7. Photos: no cover, but portraits + gallery + film

The reference's surfaces are lace art, but a real couple expects their own faces
and photographs somewhere. Lace therefore ships:

- `web_templates.no_photo = false` — photos ARE used
- `content.cover_slots = 0` — the cover is a sealed plate of art, so there is no
  cover-photo upload at all (the editor hides it off `cover_slots === 0`)
- `content.groom_photo` / `bride_photo` = `"single"` — one matted 4:5 portrait
  per person in the `couple` block
- `sections.gallery = true`, `sections.video = true`
- `story_photo = false` — there is no love-story block

`person_photos` exists in `ContentSpec` for designs that show no portraits at
all; Lace leaves it absent (⇒ portraits allowed). The editor and ops both gate
cover fields on `cover_slots` and portrait fields on `person_photos`, so neither
ever offers an upload the template would not render.

Stored photos are never deleted — switching a couple to another template keeps
everything they uploaded.

---

## 8. Build log — what actually shipped (and why)

### 8a. The gate is the reference's envelope film

The opening **is** a film, and it is the reference's own: `bellagio-2-opt.mp4`
(1080×1920, 5.04 s, 1.9 MB), shipped here as `opening.mp4`. Its first frame is a
tulle veil gathered by a wax seal; by 3 s the veil has lifted off and the seal
has travelled out of the top of the frame. `hero-bg.mp4` is a *different* asset —
the muted 2.4 s loop behind the opened hero — and is used as the cover card's
living backdrop (`cover-sealed.jpg` / `cover-frame.webp` are stills frame-grabbed
from the two videos, used as posters and as no-video fallbacks).

Three things follow from the film:

1. **The seal is baked into the pixels.** It carries the reference couple's
   initials and cannot be edited. As in Embroidered Garden, we cover it with our
   own SVG plaque (`.lc-gate__seal`) sized to the measured footprint.
2. **It moves, so the plaque must move with it.** `SEAL_TRACK` in `index.tsx` is
   a list of `{t, cx, cy, w}` samples read off the film's frames (centre 51 % at
   t=0 → 44.5 % at 1 s → 36 % at 1.6 s → out of frame by 3.1 s). A
   `requestAnimationFrame` loop reads `video.currentTime` and writes
   left/top/width, so the plaque is glued to the seal instead of drifting on its
   own timeline. Sampling the film *once* (rather than trusting a CSS
   transition) is what keeps the baked rim from peeking out mid-flight.
3. **Timing.** The gate fades over 2 s from the film's last second (`rest < 1.1`
   in `onTimeUpdate`) and the invitation is handed over when the fade completes —
   the same two-beat exit the reference uses. `onEnded` only guarantees the fade
   started; an 8 s cap covers a stalled download, and a `play()` rejection drops
   straight to the fade. `prefers-reduced-motion` skips the film entirely
   (`display: none`, poster remains).

The gate owns the whole surface as the tap target, and the film is paused once
the invitation is open so it never decodes behind the page.

### 8b. Names live in the cover section, not on the gate

Mirrors the reference's landing → opening flow: the gate is sealed and anonymous
except for the guest's name; the couple's names, date and villa illustration
appear in the `cover` section the moment the invitation opens. The venue and city
lines were removed on request and the stack was moved down (`padding: 24% 12% 3%`)
so it reads as centred in the frame rather than hugging the lace crown.

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
2. `public/templates/lace/` (28 assets, incl. `opening.mp4` + `hero-bg.mp4`)
3. `src/components/templates/index.ts` — `TEMPLATE_MAP` import + entry, and a
   `TEMPLATE_CONFIGS` entry (theme, `cover_slots: 0`, portraits on, gallery + video
   on, `extras: true`)
4. `src/components/templates/demoProps.ts` — `DEMO_PROPS_BY_CODE["lace"]`
5. `src/lib/templateExtras.ts` — per-template placeholders; Lace contributes
   `profiles_intro` (mempelai), `events_intro` (acara), the gallery/film copy and
   the wishes/closing copy
6. `src/lib/templateSections.ts` — **not** in `TEMPLATES_WITHOUT_OPENING`: Lace
   edits the couple's *kalimat pembuka*, so the accordion is required
7. `src/app/templates/[code]/preview/page.tsx` — added to `keepDemoIds` so the
   wishes feed shows the demo wishes
8. `supabase/migrations/20261039000000_lace.sql` — the `web_templates` row
   (`no_photo = false`, `sort_order = 3`, category `Floral`, tier `Baru`)

## 10. Still open

- The reference's "Where to Stay" block has no Aksaraa equivalent. If a
  per-couple accommodation field ever lands, it belongs between `inviting` and
  `gift` as a burgundy panel, not as a new section type.
