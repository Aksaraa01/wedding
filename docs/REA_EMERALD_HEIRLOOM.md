# REA — Emerald Heirloom (`emerald-heirloom`)

Port of the Viding theme **175** reference invitation
(`https://studio.viding.co/theme/preview/175`, builder theme id `13735`, demo
couple "Vidi & Hening"). The reference is a builder composition: a 390px canvas
of absolutely-positioned artwork plates with live text on top, plus a desktop
split (fixed art panel + a ~33% scrolling column). This template rebuilds that
composition as one responsive component.

- Component: `src/components/templates/emerald-heirloom/`
- Assets: `public/templates/emerald-heirloom/`
- Registry: `TEMPLATE_MAP` + `TEMPLATE_CONFIGS` (`cover_slots: 0`)
- Migration: `supabase/migrations/20261118000001_emerald_heirloom.sql`

---

## 1. Section order shipped

The reference order is *cover → welcome → countdown → mempelai → story →
gallery/event → RSVP → wishes → gift → livestream → thank you*. The minimum
contract fixes the order, so countdown and gallery moved; adjacent pairs from
the reference (welcome/painting, event/venue, gift/mural, wishes/envelope) stay
together.

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover (gate) | painted cover plate, `groom_name`, `bride_name`, `estimated_wedding_date`, `guest_name` | always | 1 or 2 names; empty name falls back to the full name | `cover_kicker`, `open_button`, `cover_apology`, `cover_guest_label` | gate slides/fades on open; no reveal on the gate |
| 2 | Welcome | `groom_name`/`bride_name`, date, welcome frame + garden scene | always | same 1/2-name branch | `welcome_invite` | 2 trumpets + 2 fans + lilies + swan (animated WebP), reveal `up` |
| 3 | Kalimat pembuka + kutipan | `opening_title`, `opening_description`, `quote_text`, `quote_source` | always (template has an opening block) | quote hidden when empty; card grows with copy | profile columns + `opening_kicker` | fan + lily spray + swan, reveal `up` |
| 4 | Mempelai | `groom_full_name`, `bride_full_name`, portraits, `groom_parents`, `bride_parents`, Instagram | `person_photos !== false` | 2 portraits; 1 photo ⇒ that person's card only; name wraps | `mempelai_title`, `mempelai_kicker`, `profiles_intro`, `parents_label` | 3 swans, 2 fans, 2 trumpets, 2 lilies, reveal `up` 0.1s step |
| 5 | Love story | `stories[]` | `feature_gates.story` **and** `story_visible !== false` | 0 ⇒ section gone; 1 ⇒ no arrows/dots; n ⇒ arrows + dots; story without a photo renders text only | `love_story_title`, `story_kicker`, `story_intro` | card + garden backdrop, reveal `fade` |
| 6 | Event | `sessions[]` | always | 1 event = one wave plate; n = alternating wave plates; long address pushes the plate taller | `events_title`, `events_kicker`, `events_intro`, `events_note`, `maps_label` | wave plates + swan/trumpet/fan, reveal `up` 0.06s step |
| 7 | Countdown | `estimated_wedding_date` / first session | always when a target exists | 4 units; no date ⇒ section gone | `countdown_title`, `countdown_intro`, `save_date_label` | pond plate + fan (animated), reveal `up`/`fade` |
| 8 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | 0 ⇒ section gone; n rows with hairlines | `inviting_kicker`, `inviting_title`, `inviting_intro` | sage card, fan + swan, reveal `fade` |
| 9 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ section gone; n rows | `rundown_title`, `rundown_kicker`, `rundown_intro` | lilies + swan, reveal `up` 0.05s step |
| 10 | Gallery | `gallery_photos[]` | needs data | 1 photo ⇒ no arrows/thumbs; n ⇒ carousel + thumbs + lightbox | `gallery_title`, `gallery_intro`, `gallery_quote` | fan + trumpet, reveal `fade`, lightbox Esc/←/→ |
| 11 | Video | `video_url` | `feature_gates.video` **and** `video_section_visible !== false` | direct file **or** YouTube embed; hidden ⇒ no player | `video_kicker`, `video_title`, `video_intro` | mounts on intersection, poster + play, lilies + fan |
| 12 | Live streaming | `livestream.url`, `livestream.title`, `livestream.description` | `livestream_visible !== false` and a URL | no URL ⇒ section gone; direct file / YouTube | `livestream_cta` + `profile.livestream` | mounts on intersection; 4 fans + swan |
| 13 | Wedding gift | `gift_accounts[]`, `gift_address`, `gift_address_name` | `gift_section_visible !== false`; address also needs `feature_gates.gift_address` | accounts only / address only / none ⇒ section gone; n accounts | `gift_intro_title`, `gift_intro_description`, `gift_wish`, `gift_button`, `copy_*` | mural backdrop, beige plate, per-row ornaments |
| 14 | Dress code | `dresscode.title/description/colors` | `dresscode_visible !== false` and any data | 0 colors ⇒ only copy; n swatches wrap | `dresscode_kicker`, `dresscode_title`, `dresscode_intro`, `dresscode_note` | lily + swan, reveal `up` 0.05s step |
| 15 | Wishes | name + message + approved feed (`/api/wishes`) | always | 4 per page, 0 ⇒ empty state; demo profile ⇒ sample wishes, no POST | `wishes_*` keys | heart + envelope + fans/lilies/swan, reveal `fade`/`up` |
| 16 | Closing | `closing_message`, names, date, `display_name` | always | hashtag derived when `display_name` is not a `#tag` | `closing_kicker`, `closing_message` | carved frame + fans + trumpet + lilies, Aksaraa footer |

RSVP is **not** a section: it is the shared `InvitationOverlay` dock, rendered
inside the template and suppressed in `preview_mode` / `template_demo`
(playbook §6).

---

## 2. Reference teardown (what was measured)

**Structural facts (390px canvas):** 12 builder sections, 11 006px of scroll;
cover is `position: fixed` and slides out `translateX(390px)`; desktop is a
fixed art panel at `965/1440` (67%) plus a 480px column; text is
`Abhaya Libre` (body), `Zzcinzel Decorative` (display) and `Akkurat`
(countdown units); `FogtwoNo5` is a single "E-gift" label.

**Palette (sampled from the plates, not the CSS):**

| Token | Value | Use |
|---|---|---|
| `--eh-paper` | `#5f725f` (paper texture) | page ground |
| `--eh-cream` | `#daf1d8` | body / headings on paper |
| `--eh-ivory` | `#fffaf3` | names, buttons |
| `--eh-ink` | `#2f3e2d` | copy on cards |
| `--eh-burgundy` | `#6e2237` | buttons, account numbers |
| `--eh-sage` | `#e9f6e4` | card plate |
| `--eh-beige` | `#e9d2bc` | gift card plate |
| `--eh-gold` | `#c9a24b` | swatch accent |

**Frame windows (measured from the PNG alpha):**

- welcome frame `1119×2093`, window `12.4% / 11.6% / 73% × 54.9%`
- portrait frame `1119×1883`, window `12.4% / 12.9% / 73% × 61%`
- the welcome plate is drawn at `132.3%` width, `left −16.2%`, `top −7.4%` of a
  `691/390` band — that is the reference's crop, kept in `.eh-welcome`.

**Assets vendored** (all from `cdn-builder.viding.co/stepper/13735/…`):

| File | Source | Role |
|---|---|---|
| `cover.webp` | `92853/group-123436-(5)` | gate + desktop art panel |
| `welcome-scene.webp` | `92409/gemini…-5` | painting inside the welcome window |
| `welcome-frame.webp` | `92412/2-902713-(1)` | carved frame (window above) |
| `welcome-scene-alt.webp` | `92822/1-9970608` | dimmed opening backdrop |
| `portrait-frame.webp` | `92457/image` | mempelai frame |
| `countdown-scene.webp` | `92414/group-123433-(1)` | pond + lace side columns |
| `paper.webp` | `92464/image` | page texture |
| `lace-band.webp` | `92417/5-269` | wide lace divider |
| `lace-thin.webp` | `92434/rectangle-2576` | thin lace divider |
| `garden-scene.webp` | `92470/gemini…-1` | story backdrop + closing |
| `event-wave.webp` | `92430/mask-group-(4)` | event plate A |
| `event-wave-2.webp` | `92473/mask-group-(6)` | event plate B |
| `envelope.webp` | `92437/10-9970603-(2)` | wishes header |
| `heart.webp` | `92436/13-4-(2)` | wishes ornament |
| `card-sage.webp` | `92432/rectangle-1392-(3)` | sage card plate |
| `card-beige.webp` | `92433/rectangle-1392-(4)` | gift card plate |
| `video-frame.webp` | `92428/group-123417-(1)` | film / live window |
| `edge-florals.webp` | `92429/group-123432` | tall forest mural behind gift + wishes |
| `shadow-soft.webp` | `92435/vector-701` | ground shadow under the fan |
| `fan.webp` | `92415/2.gif` | fan (17-frame WebP) |
| `flower-trumpet.webp` | `106499/3.gif` | trumpet cluster |
| `lilies.webp` | `106497/2.gif` | lily cluster |
| `swan.webp` | `106501/4.gif` | swan boat |
| `lily-spray.webp` | `92426/5.gif` | lily spray |
| `lily-spray-b.webp` | `92420/7.gif` | lily spray (alt) |
| `shadow-{lilies,trumpet,swan,fan}.webp` | `106498/106500/106502/92416 _shdw.gif` | the reference's paired silhouettes, one static frame |
| `*-still.webp` | first frame of each GIF | `prefers-reduced-motion` variant (see §4) |

**Deliberately NOT vendored**

- `110732–110735/Kelana-*.jpg` — the reference couple's photographs. Demo
  content comes from Aksaraa's own set (`/images/dark-elegance`), as the
  playbook requires.
- The Viding theme switcher, the preview banner, the "saves paper" footer and
  the demo social links.
- The 11 remaining builder stylesheets and the `Akkurat` / `FogtwoNo5` TTFs
  (licence + weight). Substitutions below.

**Fonts**

| Reference | Ours | Why |
|---|---|---|
| Cinzel Decorative | Cinzel Decorative (`--font-cinzeldecorative`, already vendored) | exact match, OFL |
| Abhaya Libre regular/bold | Abhaya Libre (`--font-abhaya`, added to `scripts/fetch-fonts.js`) | exact match, OFL |
| Akkurat (countdown units, form labels) | Inter | Akkurat is a commercial Lineto face; Inter matches the optical size |
| FogtwoNo5 ("E-gift") | not used — the label is set in Cinzel Decorative | licence unclear; the label is decorative only |

---

## 3. Geometry that is load-bearing

- The cover and the desktop art panel are **one fixed layer**; after opening,
  `@media (min-width: 1000px)` keeps it as the left panel (`right: var(--eh-col)`)
  and the invitation scrolls in the right column. On a handset it fades out.
- Cards are the reference's **painted plates** stretched to the content height
  (`object-fit: fill`) on top of a solid background of the same tone: the plate
  carries the grain and the soft edge, the fill stops ornaments showing through
  the 194/255 alpha.
- Card surfaces therefore never use `background-image` for the plate; swapping
  to CSS gradients loses the deckled edge the reference has.
- Photographs sit in **positioned wrappers** (`left/top/width/height` from the
  measured window), never `inset` + `auto` width (playbook §8.8).

---

## 4. Motion

The reference's ornaments are **50-frame GIFs** (2.0–2.5 MB each). We ship the
same animation as **17-frame animated WebP** (every 3rd frame, 288px, 120 ms):
fan 142 KB, swan 187 KB, lily spray 187 KB, trumpet 357 KB, lilies 400 KB,
lily-spray-b 402 KB — ~1.7 MB total, all `loading="lazy"` below the fold.

- `prefers-reduced-motion`: each `<picture>` swaps to `*-still.webp` (a single
  frame) via `<source media>`; no JS, no layout shift.
- The reference's paired `_shdw` GIFs are shipped as one static frame under each
  ornament (`opacity .5`, 1.5px blur) instead of a per-frame `drop-shadow`
  filter (which repaints a 288px animated layer on every frame).
- Reveals: one `IntersectionObserver` adds `.is-in` to `[data-eh-reveal]`;
  properties animated are `opacity` and `translate` — never `transform`, so an
  element that carries `rotate` keeps it.
- `@media (scripting: none)` and `prefers-reduced-motion` leave every reveal
  target at `opacity: 1; translate: 0`.
- Body scroll is locked while the gate is up with both the effect class and the
  CSS `:has(.eh-root.is-locked)` fallback.

---

## 5. Reference sections outside the minimum contract

Reported per playbook §0.5 rule 2 before shipping:

1. **Live Streaming / "Join Live"** — kept. It is the reference's own block,
   there is a `wedding_profiles.livestream` JSONB (`title`, `description`,
   `buttonLabel`, `url`) plus `livestream_visible`, the editor already renders
   both, and `TEMPLATE_CONFIGS` declares `sections.livestream: true`. Nothing is
   hardcoded: the section disappears without a URL and is skipped in
   `demoProps` unless demo data is supplied.
2. **RSVP** — dropped as a section (rule 4): the shared dock owns attendance and
   QR. The reference's form is not reproduced.
3. **E-Angpao (payment gateway) / Prize List** — dropped. The reference embeds
   Viding's own payment form; Aksaraa has no such gateway. The **Wedding Gift**
   section carries the same surface (accounts + copy + address) in the same
   beige card.
4. **"Where to stay"/transport** — not present in this reference.

---

## 6. Editor / ops wiring

- Content spec: `cover_slots: 0` (the cover and the desktop panel are the
  design's painted plate — no cover-photo field), `person_photos: true`,
  `story_photo: true`,
  `initials: false`, sections opening/quote/countdown/inviting/video/story/
  gallery/gift/dresscode/livestream/rundown on, contacts off.
- Extras: 54 keys registered for `emerald-heirloom` with English placeholders;
  `npm run audit:extras -- emerald-heirloom` is clean, and
  `npm run audit:copy -- emerald-heirloom` passes with 38 allowlisted structural
  literals (WCAG names, countdown units, vendor credit).
- Editor/ops need no new code: every field is an existing profile column or
  extra key.
- Demo: `DEMO_PROPS_BY_CODE["emerald-heirloom"]` (English copy, Aksaraa demo
  photos, demo wish profile id; `keepDemoIds` includes the code).

---

## 7. State matrix (tested at 390×844 and 1440×900)

| State | Result |
|---|---|
| every gate off | cover/welcome/opening/mempelai/event/countdown/rundown/gallery/wishes/closing render; story, video, inviting, gift-address and dock do not |
| every gate on | the 16-section order above |
| 1 event | one wave plate, no stretched second card |
| 0 stories / `story_visible=false` | section gone, no heading left |
| 1 gallery photo | no arrows, no thumb row |
| gift accounts only / address only / none | card renders the rows present; section hides when empty |
| video hidden with `video_url` set | no player, no poster |
| livestream without URL | section gone |
| `prefers-reduced-motion` | still ornaments, no reveals pending |
| scripting disabled | gate hidden, all content visible |
| 390 / 1440 widths | `scrollWidth === innerWidth` (390/390, 1440/1440) |
| console | no exceptions in either pass |

---

## 8. Known limits

- **Desktop column scale.** The reference defines a separate desktop geometry;
  this port keeps one composition and lets the column drive the type
  (`cqw`), matching its proportions rather than its exact pixels.
- **Wish/gift ornament rhythm.** The reference flanks every list row with fans
  (its feed is long). We do the same with `::before/::after` on rows, so the
  count follows the data instead of a fixed pixel map.
- **The cover kicker is set in Abhaya Libre, title case** (reference: Cinzel
  Decorative title case). Cinzel has no lowercase — every string renders as
  small caps — which read as shouted over a photograph; the body serif keeps
  the invitation voice and the reference's size.
- **The cover is the reference's painted plate** (no cover-photo slot): the
  reference's cover is one flattened artwork, and a photo would break its lace
  frame. The guest greeting sits directly above the play button, not at the top.
- **No opening film.** This reference has no opening video; music starts on the
  gate's open gesture (`preload="metadata"` + `data-warm-audio`, per the
  invitation performance invariant).
