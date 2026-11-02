# REA — "WW12 Navy Blue & Ivory" (Imperfectly Paperie) → Aksaraa in-house template

Reverse-engineering analysis for a new in-house template, working code
**`navy-ivory`**. Same shape as `docs/REA_IVORY_LACE.md`, written against the
**§0.5 minimum-section contract** (`docs/INHOUSE_TEMPLATE_PLAYBOOK.md`).

**Status: shipped.** Phase 0 decisions (§11) were answered by the owner on
2026-11-02 and Phase 1 is built: `src/components/templates/navy-love/`,
`public/templates/navy-love/`, `20261045000000_navy_love.sql`. This document is
kept as the teardown record — the evidence behind every choice below.

---

## 1. Verdict

| Question | Answer |
|---|---|
| Working code / name | `navy-love` / **Navy Love** (`Minimalis`, sort 27, tier `Baru`) |
| Reference | `https://imperfectlypaperie.my.canva.site/ww12-navy-blue-and-ivory` |
| What it is | A **Canva Website export** (`export_website`), **five linked pages**: `ENVELOPE` (cover) → `homepage` → `details` → `rsvp` → `love-story` |
| Data layer | **None.** No CMS, no `?to=` guest merge, no per-couple fields. Every string is baked into the Canva design |
| Media pool | 266 design entries → **188 unique files**: 120 PNG, 61 JPEG, 7 SVG. **Zero video in the pool** |
| Video | One separate asset: `VAHVJy7Xh98`, 187 s, 320×240, has an audio track — it is the **soundtrack**, played by the vinyl widget (verified in the DOM: tapping "Tap to listen" creates a `<video>` with that mp4, `muted: false`). It is **not** an opening film |
| Fonts | **All five are open-licence Google Fonts**: Cinzel, Cormorant SC, Parisienne, Josefin Sans, Cormorant Garamond. (Plus Arimo, but only inside the embedded RSVP form.) **No vendoring, no licensing problem** |
| Assets | Stationery art is Canva stock (watercolour wallpaper, navy lace envelope, deckled cards, torn labels, doily/registry illustration, engraved venue, 5 line icons) — vendor or redraw, see §5 |
| Motion | **Essentially none.** No opening animation, no parallax, no scroll-linked reveal. The only running animation is the vinyl `spin` while the soundtrack plays. Page changes are instant route swaps |
| Mobile | **Good.** Genuinely responsive (its own layout, not a scaled 1366 canvas). Captured at 390×844 — no clipped headings, no overflow |
| Photography | Reference couple (Isabella & Julian) at The Ritz Paris — replaced entirely by Aksaraa data |

**Verdict:** highly portable. The design is a **paper-scrapbook collage** — navy
lace envelopes, deckled ivory cards, torn-paper labels, watercolour florals,
engraved venue art, a vinyl record, a monogram seal — and every one of those is
reproducible from fields we already have. Type is free of licensing risk, which
makes this the cleanest reference ported so far in that respect.

It fills a real gap: there is no navy/ivory stationery template in the library,
and no template whose visual language is *layered paper objects* rather than
photos in frames.

**What the port must not do** (the ivory-lace lesson, applied): there is no
opening motion to copy, so **do not invent one**. `Open envelope` is an `<a>` to
`/homepage`; the reference simply swaps pages.

---

## 2. What the reference actually is

| Path | Page | Height @ 390 px | Content |
|---|---|---|---|
| `/` | `ENVELOPE` | 910 | Cover gate: botanical wallpaper, "THE WEDDING", couple names, navy lace envelope, cream oval crest, `OPEN ENVELOPE` |
| `/homepage` | `homepage` | 1 674 | Collage: open envelope with petals → welcome card → vinyl → "The Details" plaque → RSVP band → love-story banner → countdown band |
| `/details` | `details` | **4 768** | At a glance → Live Map → Wedding Timeline → Dress Code → Travel & Stay → Registry → FAQ |
| `/rsvp` | `rsvp` | 1 387 | `RSVP` heading + copy + **embedded Canva form** (511×1 445 iframe) |
| `/love-story` | `love-story` | 910 | Torn photo + polaroid + three paragraphs |

Navigation between them is a client-side route swap (`Go Back`, `Go RSVP →`,
`Go Envelope ↑`, and the six-item nav list). **There is no transition film, no
envelope flap, no dissolve** — `document.getAnimations()` returns only `spin`
(the vinyl) on every page.

### Capture recipe (this reference needs all of it)

Unlike Ivory Lace, the DOM here *is* the design (real `<img>`, real text), so no
bootstrap parsing is required for structure — but four quirks will waste a
session if unknown:

1. **The page has an internal scroller.** `document.documentElement.scrollHeight`
   is always `844`; the content lives in a `div.ZRRuDw` whose `scrollHeight` is
   910 / 1 674 / 4 768 / … `window.scrollTo()` does nothing. Scroll that element,
   or set the viewport tall and let it expand.
2. **Text is one `<span>` per character.** Reconstruct lines by grouping leaf
   text nodes by `y` (±0.45 × font-size) — reading `textContent` of a block
   gives you the line but loses the per-run styling that identifies the font.
3. **Font families are hashed** (`YACgERSYqTw_0`). The mapping is in
   `window['bootstrap'].page.B`:
   `YACgEZ1cb1Q`→Arimo, `YACgEeV8bIQ`→**Cinzel**, `YAFdJg7KuRM`→**Cormorant SC**,
   `YACgERSYqTw`→**Parisienne**, `YAFdJjvw9Ps`→**Josefin Sans**,
   `YAFdJhX-538`→**Cormorant Garamond**.
4. `window['bootstrap']` still needs the two decode layers (JS string escapes →
   JSON). The literal contains `\x3c`-escaped iframe HTML, so a regex-based
   unescape dies; slice the exact quoted literal and `eval` it.

Screenshots: headless Chrome, one capture per page with the viewport set to that
page's height (the SPA renders the whole page). Give it **8–12 s**: blocks fade
in on paint (`transition: opacity .3–.5s`), and a fast capture yields a
half-transparent collage (this cost one false "desktop is broken" reading).

### Geometry notes

- **Cover @ 390**: wallpaper covers the viewport (source is 1512×844, so it is
  cropped centre); names at y≈287; envelope plate **384×256** at y≈321 (nearly
  full-bleed width); crest 63×61 on the flap; `OPEN ENVELOPE` at y≈567.
- **Homepage @ 390**: single centred column; blocks 44→1 560. Collage pieces
  overlap deliberately (card over envelope, plaque over illustration).
- **Desktop**: the same single centred column, ~600 px wide in a 1 366 viewport;
  the countdown band alone is full-bleed. **There is no desktop two-column
  layout** — one layout, scaled.
- **Rhythm**: `details` blocks — glance 262→700, map 720→1 150, timeline
  1 184→1 900, dress 1 988→2 270, travel 2 273→2 835, registry 2 873→3 340,
  FAQ 3 510→4 450. Paper sections are tight (280–560 px); the navy timeline and
  the FAQ are the long ones.

---

## 3. Section inventory → the 16-section contract

"Added" = the reference has no such block; it must be **drawn in the reference's
own language** (§0.5 rule 1) — navy plaque, deckled card, torn label, floral
sprig — never a generic white card.

| # | Contract | Reference block | How it ships |
|---|---|---|---|
| 1 | **Cover** | `ENVELOPE` page | Gate: botanical wallpaper, `THE WEDDING` (Cormorant SC, tracked), names in Cinzel, navy lace envelope plate + cream crest, `?to=` guest name, `BUKA UNDANGAN`. Reference has **no flap animation** — a short fade + scroll-to-top on open |
| 2 | **Opening video** | *absent* | **Added** (owner decision, §11.3): full-bleed 16:9 film plate in a torn cream mat on a navy band — silent autoplay for uploads, autoplay+mute embed for YouTube. **Ships after the welcome keepsake, not before it** (see §3.3) |
| 3 | **Welcome** | welcome card + the open envelope collage | The **keepsake**: lace flap behind, navy pocket in front, blossoms spilling out of the V, the cream card tucked into the pocket with a navy deckled card behind it, the couple's photo in the vendored deckled frame at its left, the vinyl player at its foot. `welcome_invite` / `card_invite` / names / date / venue / fleuron inside the card |
| 4 | **Kalimat pembuka** | the card's body | Same surface (§0.5 allows 3+4 to share): `opening_title` = card heading line, `opening_description` = body. Never dropped |
| 5 | **Mempelai** | *absent* | **Added**: two cream deckled frames (line-art oval frame, reference's own), own names, parents, Instagram. No "The Groom"/"The Bride" (§0.5 rule 3) |
| 6 | **Love story** | `love-story` page | Torn-edge b&w plate + polaroid with tape, `story_intro` paragraph, then `stories[]` milestones as paper slips (title / description / photo) |
| 7 | **Event** | "Wedding At A Glance" | Per `sessions[]`: Cinzel label (DATE / CEREMONY / RECEPTION), garland divider, time, venue, address, `maps_url` as the reference's `GET DIRECTIONS` outline pill. **Text-only** — the reference draws no event photos (see §3.2) |
| 8 | **Countdown** | bottom band of `homepage` | Floral-edged ivory band: "Counting every second until forever," / Cinzel numerals `HH : MM : SS : DD` / `DAYS HOURS MINUTES SECONDS` / couple names / dotted date. **Never** the TickCounter iframe |
| 9 | **Turut mengundang** | *absent* | **Added**: torn-paper slip list (one line per `inviting_families[]`), gated by `feature_gates.inviting_families` **and** `inviting_families_visible` |
| 10 | **Rundown** | "Wedding Timeline" | Navy band: hand-drawn line icons (rings / glasses / chandelier / table / heels) down a dotted rule, time + label per `rundown[]` row |
| 11 | **Gallery** | *absent* (photos only appear in the collage) | **Added**: torn-photo + deckled-frame wall, 2-up, lightbox (Esc/←/→) |
| 12 | **Video** | *absent* | **Added**: the torn-photo plate becomes the film plate — still + play, `video_url` in a 16:9 mat inside a deckled card |
| 13 | **Wedding gift** | "Registry" (paper + doily illustration + `HONEYMOON FUND` pill) | Cream-canvas plate with the doily/envelope/gift illustration, `gift_accounts` as paper slips (provider / number / holder) + copy toast, `gift_address` under a torn label |
| 14 | **Dress code** | "Dress Code" + 5 swatches | Cinzel heading, `Formal Attire Requested.` line, description, 5 rounded swatches from `dresscode.colors[]` |
| 15 | **Wishes** | *absent* (only the RSVP form) | **Added** (§0.5 rule 4): name + message + approved feed on a deckled card. The RSVP half is the dock |
| 16 | **Closing** | the countdown band doubles as a finale | `closing_message` on the floral band, names in Cinzel, dotted date, Aksaraa badge footer |

Shipped order:

```
gate → cover → welcome (+ kalimat pembuka) → mempelai → love story
     → event → countdown → turut mengundang → rundown
     → gallery → video → gift → dress code → wishes → closing
```

Movements, deliberate and recorded (§0.5): the reference puts its countdown
**last** (as a finale band) and its love story on a **separate page**; contract
order moves countdown to #8 and the story to #6. The reference's six-item nav
plaque, `Go Back` / `Go RSVP` / `Go Envelope` links and the page split are
**site chrome** — dropped, we ship one scroll.

### 3.3 The post-open screen is the keepsake, and the film follows it

First implementation shipped the contract order literally: cover → **opening film**
→ welcome. That was wrong for this design, and the owner said so: the reference
does not open onto a video, it opens onto a **paper object** — the card you just
took out of the envelope. A full-bleed film band in that slot turns the reveal
into "a website with sections".

So the shipped order deviates from the contract table in one place:

```
gate (envelope) → keepsake (welcome + kalimat pembuka) → opening film (#2) → mempelai → …
```

The film keeps its `data-section="video-intro"` and its contract number; only its
position moved. Two consequences worth knowing:

- the first thing after `Buka Undangan` is the envelope's own contents, which is
  what makes the opening feel like a keepsake rather than a page change;
- `#2` and `#12` now sit far apart (keepsake → film → … → film plate), so a
  couple with one video sees the silent loop once and the controlled player once,
  with the letter, the couple and the story in between.

The keepsake is built from the vendored pieces, not CSS shapes: `arch.webp` (lace
flap), `pocket.webp` (the navy envelope body, re-vendored from `43f5117d`), two
`8f1fa8f2`/`f27bf5e7` sprigs as the blossoms spilling out of the V, `card-navy.webp`
behind the cream card, `frame-portrait.webp` around the couple's photo.

### 3.1 Reference blocks outside the contract — approval requested

Per §0.5 rule 2 — reported, not shipped, not silently dropped:

| Block | What it is | Column that would feed it | Lost if dropped |
|---|---|---|---|
| **Travel & Stay** | `GETTING HERE` (nearest airport, travel time) + `WHERE TO STAY` (room block) + `BOOK NOW` | **none** in `wedding_profiles` | **Dropped (owner, 2026-11-02).** The venue address already sits in Event |
| **Guest FAQ** | 6 static Q&As (plus-one, children, photos, how to RSVP, arrival, parking) | **none** | **Dropped (owner, 2026-11-02).** No schema field; it would be invented copy per couple |
| **Registry links** | `HONEYMOON FUND` / `BOOK NOW` external registry buttons | **none** (we have `gift_accounts`, not registry URLs) | Nothing: our gift section renders bank/e-wallet accounts, which is what Indonesian couples actually need |
| **RSVP form** | Canva form: name / attending / pax / additional guests / entrée / allergies | — | Not applicable — §0.5 rule 4, RSVP is `InvitationOverlay`. Entrée choice has no schema field and goes with it |
| **Music widget** | vinyl + `Tap to listen` + running timer | `track_url` | Kept, but as our standard music toggle (§6) |

Also noted: the reference's `Live Map` is a **Google Maps iframe**. Our Event
section already links `maps_url`; we do not embed a third-party map.

### 3.2 Why Event ships without photos

The Ivory Lace post-mortem lesson was "give every event its own photo slot".
That lesson came from a reference whose event cards *were* photographs. Here the
glance block is pure paper — a Cinzel label column and Cormorant Garamond values.
Adding photo slots would invent a surface the design does not have and leave two
upload fields empty for every couple. Recorded here so the next agent does not
"fix" it.

---

## 4. Palette + type

Sampled from computed styles (not eyeballed from the JPEG):

| Token | Value | Evidence |
|---|---|---|
| `--ni-navy` | `#1b2a4a` | every navy surface: plaque, RSVP band, timeline, ribbon (`rgb(27,42,74)`) |
| `--ni-navy-deep` | `#172a3a` | deepest swatch, envelope shadow (`rgb(23,42,58)`) |
| `--ni-slate` | `#4c6072` | mid swatch / secondary navy (`rgb(76,96,114)`) |
| `--ni-slate-soft` | `#7d8fa0` | light swatch, floral leaves (`rgb(125,143,160)`) |
| `--ni-ivory` | `#f5f0eb` | text on navy (`rgb(245,240,235)`) |
| `--ni-paper` | `#f6f1e7` | deckled cards, torn labels (`rgb(246,241,231)`) |
| `--ni-paper-bright` | `#fbf8f1` | card interiors, countdown band (`rgb(251,248,241)`) |
| `--ni-ink` | `#172a3a` | body copy on paper |
| `--ni-black` | `#000000` | the one FAQ eyebrow label |

Seven colours, four of them navy. The palette carries the design: **navy shapes
on ivory paper**, never the reverse.

### Type

Every family is **Google Fonts / OFL** and already available to the shared
pipeline (`scripts/fetch-fonts.js` → `public/fonts` + `gen-font-css.js`):

| Role | Family | Sizes @ 390 | Notes |
|---|---|---|---|
| Display, names, section titles, dates, labels | **Cinzel** 400 / 600 / 700 | 13–67 px | Cinzel has **no lowercase** — its "lowercase" are small caps. Type source text in normal case and the design's `ISABELLA` / `12 September 2028` / `The Details` look comes for free. Do not `text-transform: uppercase` |
| Eyebrow / nav / micro-labels | **Cormorant SC** 400 / 700 | 12 px, `0.19em` tracking | `THE WEDDING`, `TOGETHER WITH THEIR FAMILIES`, `INVITE YOU TO`, `WE CAN'T WAIT` |
| Body, values, italic poetry | **Cormorant Garamond** 400 / 700 | **21 px / 29 px** (`1.38`), tracking normal | generous — this is why the reference reads calm. Values and labels are 21 px too; only the love-story paragraph adds `0.011em` |
| Tiny functional label | **Josefin Sans** 700 | 12 px, `0.11em` | `Tap to listen` only |
| Monogram | **Parisienne** 400 | 63 px | `couple_initials` on the envelope pocket |
| (form only) | Arimo | — | the Canva RSVP form; **not part of the design** |

Missing from the pipeline and **must be added**: `Cormorant SC` (400 + 700),
`Josefin Sans` (700), and **`Cinzel` 700** (the pipeline carries only 400/600,
but the reference sets dates, venue and `FREQUENTLY ASKED` at 700).
`Cinzel`, `Parisienne`, `Cormorant Garamond` are already vendored. Run
`node scripts/fetch-fonts.js && node scripts/gen-font-css.js`, then confirm the
new `@font-face` rules land in the generated CSS — no per-template font files.

---

## 5. Asset audit

The reference uses **30 distinct raster assets + 7 SVGs** (the 31st DOM image is
the soundtrack's black poster frame). Everything else in the 188-file pool is
either a 2×/3× mirror or unused.

### Vendored (stationery art — the design *is* these objects)

| Reference asset | Role | Vendored as |
|---|---|---|
| `6b0f600d…jpg` (146 KB) | ivory botanical wallpaper — cover background | `wallpaper.webp` |
| `7b4275dc…png` (371 KB) | navy lace-edged envelope (cover plate) | `envelope.webp` |
| `006b5d7f…png` (395 KB) / `82433d…svg` | ornate cream oval crest / frame | `crest.webp`, `frame-oval.svg` |
| `e1f32c93…png` (152 KB) | navy scalloped arch (open envelope top) | `arch.webp` |
| `43f5117d…png` (161 KB) | side flaps of the open envelope | `flaps.webp` |
| `17469d10…png` (248 KB) | navy scalloped plaque ("The Details" / section plaques) | `plaque.webp` |
| `285fdb4e…png` (509 KB) | navy deckled card (offset behind the welcome card) | `card-navy.webp` |
| `40386eb5…png` (229 KB) | cream deckled frame, portrait | `frame-portrait.webp` |
| `679a859a…png` (232 KB) | cream deckled frame, photo | `frame-photo.webp` |
| `004949a8…png`, `c6127004…png` (175 KB) | torn-paper label strips | `label.webp`, `label-sm.webp` |
| `1ebb7581…png` (174 KB) | crumpled paper strip (love-story caption) | `tape-label.webp` |
| `fd4aa652…png` (249 KB) | silver crinkle foil tape | `foil.webp` |
| `8409a9c6…png` (149 KB) | vinyl record | `vinyl.webp` |
| `f986a60f…png` (216 KB) | engraved venue illustration (Ritz façade) | `venue-etching.webp` |
| `caa30116…png` (**1.45 MB**) | doily + envelope + gift + bow (registry) | `registry.webp` |
| `8d887f6e…png`, `8f1fa8f2…png`, `f27bf5e7…png` | botanical sprigs (blue hydrangea / white blossom) | `sprig-*.webp` |
| `bf7073cb…jpg`, `fe1520bb…jpg` | navy floral header bands | `band-details.webp`, `band-faq.webp` |
| `b4f0a107…jpg` (302 KB) | cream paper texture (love-story page) | `paper.webp` |
| `c7c7d3af…jpg` | canvas texture (registry) | `canvas.webp` |
| `acf520/{36cd98}/{22277c}/{5504ae}/{66dff3}.svg` | timeline line icons: heels, banquet table, cocktails, rings, chandelier | `icon-*.svg` |
| `b7d3f8…svg` | hand-drawn rose bouquet | `bouquet.svg` |

**Shipped:** 30 files, **~880 KB** total (24 webp + `torn.svg`, `torn-soft.svg`,
5 icon masks + `thumbnail.webp`), `pocket.webp` included. The 1.45 MB registry PNG became a 117 KB webp;
the 800 KB oval-frame SVG was dropped in favour of the cropped PNG frames.

**Icons are masks, not images.** The SVGs ship black / dark-maroon / **orange**
strokes (the chandelier is orange). They were rasterised to 200 px alpha webp
and applied as `mask-image` over `background-color: ivory`, so the stroke colour
is whatever the section needs and no `invert()` filter is involved.

**The deckled frames have to be cropped.** `frame-tall`/`frame-wide` carry a
transparent margin around the frame itself, so a photo painted across the whole
box bleeds *outside* the frame. Both were cropped to their alpha bounding box
(`frame-portrait` 412×588, `frame-landscape` 509×316) and the photo is inset to
the measured window (≈14%/15% on each side).

### Not shipped

Reference photography (the couple, the wedding, the b&w portraits) → every photo
surface is `cover_photos` / `stories[].image_url` / `gallery_photos` /
`groom_photo` / `bride_photo`. The **soundtrack mp4** (187 s) is third-party
music → `track_url` with the demo fallback. The TickCounter iframe, the Canva
form, the Google Maps embed and the Canva footer modals are chrome.

> **Licensing.** The vendored files are Canva stock elements from the export, the
> same situation as `ivory-lace` (§5 there). Using them for the template follows
> the owner's earlier "reference look" decision; if this is ever resold as an
> asset pack they must be redrawn or licensed. Unlike Ivory Lace, **the type is
> clean** — all five faces are OFL.

---

## 6. Interaction inventory

| Behaviour | Reference | Port |
|---|---|---|
| Open the invitation | `<a href="#page-1">` → route swap to `/homepage`, **no animation** | `opened` state, gate fades out (`prefers-reduced-motion` respected), `scrollTo(0,0)`, scroll lock released with the `:has(.root.is-locked)` CSS fallback |
| Music | vinyl; tapping creates a `<video>` (mp4, audio only) and starts the **12 s `spin`** loop; small running timer | `track_url` via `<audio preload="auto">` on the gate; vinyl spins only while playing (`animation-play-state`), tap to toggle |
| Countdown | TickCounter iframe (Times, 4 cells, labels beneath) | `useCountdown` in Cinzel numerals, `HH : MM : SS : DD` with thin separators |
| Page navigation | 5 routes + `Go Back` / `Go RSVP` / `Go Envelope` / 6-item nav list | dropped — single scroll |
| Live map | Google Maps iframe + `GET DIRECTIONS` | `maps_url` link, outline pill |
| RSVP | embedded Canva form | **not ported**; `InvitationOverlay` dock with `!preview_mode && !template_demo` |
| Scroll reveal | **none** (verified at 4 scroll positions — opacity stays 1, only the vinyl animates) | optional: a single quiet fade-up for paper cards; if used, respect reduced-motion and keep it short (≤ 400 ms, ≤ 12 px) |
| Lightbox | none | Gallery lightbox (Esc/←/→) — expected for a photo wall |

---

## 7. Copy that must not ship

- **Isabella & Julian**, `12 September 2028`, `09.12.2028`, `The Ritz Paris`,
  `15 Place Vendôme, 75001 Paris, France`, `Salon Vendôme Ballroom`,
  `Charles de Gaulle Airport (CDG)`, `4:30 / 5:15 / 6:30 / 7:00 / 8:00 PM`.
- `RSVP kindly requested by AUGUST, 2028`, the six FAQ answers, the registry copy.
- The three love-story paragraphs ("Every love story begins with a simple
  hello…"), `Isabella & Julian` caption, `CH` monogram.
- The soundtrack mp4, the TickCounter widget id `11022790`, the maps short link
  `o68k8D1GtBUpmJWWA`, the Canva footer + policy modals.

Demo props reuse Aksaraa's own sample content: `...DEMO_PROPS_BY_CODE["sandhya"]`
overrides, `DE` photos, English copy — exactly like `ivory-lace`.

---

## 8. Port plan

Component: `src/components/templates/navy-ivory/`
(`index.tsx`, `Wishes.tsx`, `navy-ivory.css`, `ornaments.tsx`).

```
<root class="navy-ivory">
  gate      wallpaper · THE WEDDING · names · envelope + crest · guest name · BUKA
  cover     #1  wallpaper, names, date, monogram (no split/flap motion)
  welcome   #3+#4  deckled card: sprig, arch rule, names, opening_title/description
  mempelai  #5  two deckled frames, own names, parents, IG
  story     #6  torn b&w plate + polaroid + story_intro + milestones
  event     #7  per session: Cinzel label, garland divider, time, venue, address, directions
  countdown #8  floral-edged band, Cinzel numerals, names, dotted date
  inviting  #9  torn-label list
  rundown   #10 navy band, line icons + dotted rule
  gallery   #11 torn-photo wall + lightbox
  video     #12 film plate (still + play) in a deckled card
  gift      #13 canvas plate + registry illustration + account slips + address
  dresscode #14 heading, request line, description, 5 swatches
  wishes    #15 deckled card form + approved feed
  closing   #16 floral band, closing_message, names, badge
  InvitationOverlay dock
</root>
```

Content spec:

```ts
content: {
  // Three semantic photo slots — one per photo surface the design actually has:
  // the welcome card, the love-story plate, the closing. Events are paper only
  // (§3.2); the gallery uses gallery_photos.
  cover_slots: 3,
  cover_slot_labels: ["Foto Kartu Ucapan", "Foto Kisah Cinta", "Foto Penutup"],
  groom_photo: "single",
  bride_photo: "single",
  story_photo: true,
  sections: {
    opening_description: true,   // the welcome card carries the couple's words
    quote: false, countdown: true, video: true, story: true,
    gallery: true, gift: true, inviting: true, dresscode: true,
    livestream: false, rundown: true, contacts: false,
  },
  extras: true,
}
```

`templateExtras.ts` (code added to every key's `templates` array + a placeholder
in the demo's language): `welcome_heading`, `welcome_note`, `story_intro`,
`events_intro`, `timeline_title`, `gallery_intro`, `film_intro`,
`gift_intro_title`, `gift_intro_description`, `dresscode_intro`, `wishes_intro`,
`music_caption`, `closing_message`.

Editor/API/ops: **no new columns** — everything is `sessions`, `stories`,
`rundown`, `dresscode`, `gift_accounts`, `inviting_families`, `video_url`,
`gallery_photos`, `template_content`. Phase 2 is the `web_templates` row only:

```sql
INSERT INTO web_templates (code, name, description, preview_image_url, demo_url,
  sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES ('navy-ivory', 'Navy & Ivory',
  'Undangan kertas scrapbook navy–ivory — amplop renda bersegel monogram, kartu deckled, label kertas sobek, kaligrafi floral, hitung mundur, susunan acara, galeri, film, hadiah, dress code, dan ucapan.',
  '/templates/navy-ivory/thumbnail.webp', '/templates/navy-ivory/preview',
  27, 'Floral', 'inhouse',
  '<copy the ivory-lace package_eligibility array>', 'Baru', true, false)
ON CONFLICT (code) DO UPDATE SET …;
```

---

## 9. Traps found in this reference

1. **Five pages, one invitation.** Do not port the route split or the nav plaque;
   the contract order is one scroll. Keep the reference's *pairings* only.
2. **The `Open envelope` is a page link, not an animation.** Nothing spins, opens
   or dissolves. Inventing a flap/motion was the Ivory Lace mistake — do not
   repeat it.
3. **The internal scroller.** `window.scrollY` is pinned at 0; scroll `div.ZRRuDw`
   or the capture is a single screen.
4. **Text is per-character spans**, and font families are hashed — map them from
   `bootstrap.page.B`, do not guess from the rendering.
5. **Cinzel has no lowercase.** Its lowercase slots *are* small caps, so source
   copy is normal case and the design's caps look is automatic. `text-transform:
   uppercase` on Cinzel destroys the big-cap/small-cap rhythm that defines every
   heading here.
6. **Body copy is 21 px, not 13 px.** The calm comes from size and leading, not
   from tracking. Copying an Ivory-Lace-scale body into this design makes it look
   cramped and "cheap paper".
7. **The icons are orange/maroon/black line art.** Recolour to `currentColor`;
   an invert filter turns the ivory into mud on navy.
8. **The 1.45 MB registry PNG** is the single heaviest asset — convert, don't ship.
9. **The soundtrack is an mp4 with audio**, 187 s, in the video pool — not an
   opening film. Never vendor it (third-party music).
10. **The countdown and the RSVP are third-party iframes** (TickCounter, Canva
    form). Author both.
11. **The countdown numerals look like a designed serif but are Times**, because
    they are inside the iframe. Match the *layout* (4 cells, tiny caps labels,
    thin separators), use Cinzel for the digits.
12. **The RSVP page is 1 387 px, of which 1 016 px is the form iframe.** The
    *design* there is only the heading + two lines of copy — do not read the
    page as a long RSVP layout.
13. **Everything is Canva stock art** (§5 licensing note) except the type.
14. **A fast screenshot lies.** Blocks fade in on paint; wait 8–12 s or the
    collage looks half-transparent and you will "fix" a design that is fine.

---

## 10. Definition of done (template-specific)

- [x] **All 16 minimum sections** present in the §3 order, #2 opening video included
- [x] **No outside-list section shipped** — Travel & Stay and Guest FAQ dropped by the owner (§3.1)
- [x] **RSVP is the dock only**; `InvitationOverlay` with `!preview_mode && !template_demo`
- [x] Gate matches the reference cover (wallpaper, envelope, crest, guest name) and **opens without an invented animation**
- [x] Cinzel headings typed in normal case
- [x] Body copy at the reference's scale (19–21 px) with `1.38` leading
- [x] Timeline icons are alpha masks over `currentColor`
- [x] Countdown in Cinzel with thin separators; no calendar (the reference has none)
- [x] Love story, gallery, mempelai and turut-mengundang all drawn in the paper language
- [x] Gallery lightbox (Esc/←/→) + reduced-motion fallbacks
- [x] Vendored art **865 KB**; registry PNG converted to webp
- [x] `Cormorant SC` (400/700), `Josefin Sans` (400/700) and `Cinzel 700` added to the font pipeline
- [x] 390×844 and 1440×900 clean, `scrollWidth === viewport`
- [x] Music preloads on the gate; vinyl spins only while playing
- [x] Footer carries the Aksaraa badge
- [x] `web_templates` row registered; `is_active` verified after `db push`

## 11. Decisions (answered 2026-11-02)

| # | Question | Answer | Shipped as |
|---|---|---|---|
| 1 | Template identity | **Navy Love**, category **`Minimalis`**, sort 27, tier `Baru`, `no_photo: false` | code `navy-love` (`20261045000000_navy_love.sql`) |
| 2 | Travel & Stay + Guest FAQ | **Drop both** | not rendered; §3.1 records it |
| 3 | Opening video (#2) | **Implement it** | full-bleed film plate under the cover (`data-section="video-intro"`) |
| 4 | Vendored Canva art | **Vendor, no redraw** | 29 files / 865 KB in `public/templates/navy-love/` |
| 5 | Demo content | **English on the `sandhya` base** | `DEMO_PROPS_BY_CODE["navy-love"]` |
| 6 | Scroll reveal | **Add it** — not static | `[data-nl-reveal]` fade-up (0.7 s, 16 px), `prefers-reduced-motion` respected |

Consequences worth recording:

- The heading copy the component reads is **the existing `template_content`
  fields** (`welcome_invite`, `story_intro`, `rundown_title`, `gift_intro_*`,
  `wishes_intro`, `closing_message`, …), plus four new ones added to
  `templateExtras.ts` with `navy-love` in their `templates` array: `card_invite`,
  `music_caption`, `film_eyebrow`, `gift_lede`. Nothing the editor offers is
  unrendered, and nothing rendered is un-editable.
- The demo couple also got a `rundown[]` (five rows) — without it the navy
  timeline band never appeared in preview, which is exactly the "section looks
  missing" trap.
