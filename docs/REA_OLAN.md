# Olan — reference port (Katsudoto "exclusive Olan")

Reference: `https://axelalice.katsudoto.id/344983` (body class `olan original`,
theme asset key `src/template/exclusive-olan`). The owner confirmed the design
and its artwork are ours to vendor, so every ornament is shipped locally and the
layout follows the reference 1:1 instead of being re-skinned.

- Component: `src/components/templates/olan/` (`index.tsx`, `Wishes.tsx`,
  `olan.css` = ported reference CSS, `olan-extra.css` = authored layer, `assets.ts`)
- Assets: `public/templates/olan/` (39 files, **2.0 MB**; the reference ships
  6.2 MB of PNG/JPG)
- Row: `web_templates.code = 'olan'`, tier `Baru`, category `Floral`,
  `sort_order` 44, all packages (copied from Fresco/Majestic)
- Demo: `DEMO_PROPS_BY_CODE.olan` — Aksaraa's demo couple/photos, English copy

---

## 1. What the reference is

A **split-screen** invitation, not a long single column:

| Breakpoint | Behaviour |
|---|---|
| ≥ 961 px | `.kat-page__side-to-side` = fixed 61 % painting pane (`primary-pane`) + 39 % scrolling pane (`secondary-pane`). No splash: the left pane *is* the cover. |
| ≤ 960 px | one column; `.primary-pane` is hidden and `section.top-cover` becomes a full-screen splash with the painting, the couple names, the guest greeting and "Open Invitation". |

The defining visual traits, all reproduced:

- **Paper**: `overlay.webp` (778×4710 watercolour paper) tiled `repeat-y` at
  `background-size: 100% auto` over `#EEE8E5`.
- **Painting**: `bg-cover.webp` on the left pane and behind the closing, plus
  `bg-savedate.webp` inside the countdown scene.
- **Palette** (the reference injects it inline on `body`): paper `#EEE8E5`,
  sand `#E4D5C0`, maroon `#7E3942` (headings/buttons), deep teal `#1E3F43`
  (body copy), cream `#EEE8E5` (text over the painting).
- **Type**: `Cormorant Infant` for headings, `Cormorant` for body (both OFL,
  now vendored: `public/fonts/cormorantinfant-*.woff2`).
- **Ornament vocabulary**: watercolour flower cluster at the bottom of every
  cream band, a branch that sways (`rotateLeft`), drifting clouds (`cloud`), a
  masked arch portrait, wreath-framed couple portraits, a baroque countdown
  stage (tiled ceiling, two pillars, bridge, stairs, two urns), a peacock and a
  cut-paper arch frame in each event card.

## 2. Section order (reference → ours)

Contract order from the playbook is in the comment; the reference's *pairings*
are kept and only contract-required sections are inserted, as §0.5 allows.

| # | Section | Reference block | Ours |
|---|---|---|---|
| 1 | Cover | `top-cover` (splash, ≤960) + `cover-outer` | same, plus desktop left pane |
| 2 | Opening film | — (reference has none) | **added**, `.olan-film` (arch frame, same language) |
| 3 | Welcome | cover greeting (`Dear <guest>`) | same |
| 4 | Kalimat pembuka | `couple-head` (`The Wedding Of` + paragraph) | `opening_title` / `opening_description` |
| 5 | Mempelai | `couple-body` (two wreath portraits) | same, groom/bride photos |
| 6 | Gallery | `photo-wrap` (5-up mosaic) | `gallery_photos`, lightbox added |
| 7 | Video | `video-gallery` (`Our Footage`) | `video_url` → modal |
| 8 | Countdown | `save-date-wrap` | same + Add to Calendar |
| 9 | Event | `agenda-wrap` (day, date, arch cards) | `sessions[]`, grouped per date |
| 10 | Turut mengundang | — (reference has none) | **added**, `.olan-inviting` (sand band, urn ornaments) |
| 11 | Rundown | `rundown-container` (dashed timeline) | `rundown[]` |
| 12 | Live streaming | `live-streaming` | `livestream` JSONB |
| 13 | Love story | `love-story-wrap` (photo slider) | `stories[]`, arrows + dots |
| 14 | Gift | `wedding-gift-wrap` (bank select + transfer form) | `gift_accounts[]` + address card |
| 15 | Dress code | — (reference has none) | **added**, `.olan-dresscode` (swatch dots) |
| 16 | Wishes | `wedding-wish-wrap` (+ WP comment list) | `Wishes.tsx` + review-pending copy |
| 17 | Closing | `notes-container` + `quote-wrap` + `footnote-wrap` | same, `closing_message` / `quote_*` |
| — | Footer | "Powered by KATSUDOTO" | Aksaraa badge (vendored logo) |

## 3. Per-section contract

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `cover_photos[0]`, names, `estimated_wedding_date`, `guest_name` | always | 0 photos ⇒ `/defaults/couple.png` | `template_content.cover_kicker`, `cover_guest_label` | AOS `zoom-out`/`fade-down`/`zoom-in`, 1 s–3.5 s, 0.7–2 s delays |
| 2 | Opening film (gate) | `video_url` | `feature_gates.video` **and** `video_section_visible` | file ⇒ `<video autoplay muted loop>`; YouTube ⇒ lazy player; neither ⇒ the painting (§4.7) | — | fades in on `playing`, unmounted 1.9 s after open |
| 4 | Kalimat pembuka | `opening_title`, `opening_description` | always; hidden when both empty | — | profile columns | `zoom-in` / `fade-up` |
| 5 | Mempelai | `groom_full_name`, `bride_full_name`, portraits, parents, Instagram | `person_photos !== false` | 1 photo ⇒ defaults.groom/bride; Instagram hidden when empty | profile columns | 4 wreath layers per portrait, 0.3–0.8 s |
| 6 | Gallery | `gallery_photos[]` | needs data | 1 photo ⇒ single full-width plate (CSS first-child rule); ≥9 ⇒ ninth full width | `gallery_title`, `gallery_intro` | `fade-up` heading |
| 7 | Video | `video_url` | `feature_gates.video` **and** `video_section_visible` | file or YouTube; poster from YouTube id when possible | `video_title`, `video_caption` | `zoom-out-up`, `zoom-in` |
| 8 | Countdown | `estimated_wedding_date` → first session date | needs a date | always 4 boxes in 2×2 | `countdown_*`, `calendar_button` | `fade-down-right`→`fade-up-left`, 0.2–0.5 s delays |
| 9 | Event | `sessions[]` | needs data | 1 event ⇒ one card, no blank half; sessions grouped by date | `agenda_title`, `events_intro`, `maps_label` | `zoom-in` card, ornaments 0.5–0.75 s |
| 10 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | empty ⇒ section hidden | `inviting_title`, `inviting_intro` | `fade-right`/`fade-left` urns, `fade-up` rows |
| 11 | Rundown | `rundown[]` | `rundown_visible !== false` | empty ⇒ hidden; group title = first session name | `rundown_title` | none (reference) |
| 12 | Live streaming | `livestream` | `livestream_visible !== false` | no URL ⇒ hidden; poster only for YouTube | `livestream.title`, `.buttonLabel` | `zoom-in` |
| 13 | Love story | `stories[]` | `feature_gates.story` **and** `story_visible !== false` | 1 story ⇒ no arrows/dots; photo falls back to cover | `love_story_title` | `fade-up` per slide change |
| 14 | Gift | `gift_accounts[]`, `gift_address`, `gift_address_name` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / both; copy button per account | `gift_*`, `copy_*` | `zoom-in` title, ornament `fade-*` |
| 15 | Dress code | `dresscode.{title,description,colors[]}` | `dresscode_visible !== false` | no colours ⇒ text only; empty ⇒ hidden | profile `dresscode` | swatches `zoom-in`, 0.09 s step |
| 16 | Wishes | `/api/wishes`, guest name | always | 0 wishes ⇒ empty line; 10/page + "Show more" | `wishes_*` | `fade-up` |
| 17 | Closing | `closing_message`, `quote_text`, `quote_source`, `display_name` | always | no quote ⇒ no quote band | `closing_title`, `closing_message` | `fade-up` 0.1–0.5 s |

## 4. Deviations (and why)

1. **"Wedding Filter" (Instagram AR filter) is omitted.** The block needs an
   Instagram filter link; `wedding_profiles` has no column for it. Approved by
   the owner on 2026-11-18 (see playbook §0.5 rule 2). If it is ever wanted:
   add `instagram_filter_url` + editor/ops field + the block back in.
2. **The reference's RSVP card is not ported.** RSVP is the shared
   `InvitationOverlay` dock only (§0.5 rule 4); the cover's `RSVP` button scrolls
   to the wishes section instead of a second attendance form.
3. **The gift transfer-confirmation form is not ported.** The reference lets a
   guest submit name / account / amount / transfer screenshot. We have no
   schema or ops review surface for that, so the section ships accounts +
   address + copy, which is what the rest of the in-house family does.
4. **`effects chindy` petal layer is dropped** — it is commented out in the
   reference markup itself; the two `orn-0*.png` files were not vendored.
5. **No monogram.** `initials: false` in the content spec: the design never
   prints one.
6. **Desktop has no splash.** Matches the reference (the splash is
   `display:none` above 960 px); music therefore starts on the first
   interaction, and the guest dock is available immediately.
7. **The opening-film band only appears for a direct upload.** The reference has
   no such band, so it was rebuilt as an arch — a 16:9 YouTube embed letterboxes
   inside an arch and mounting the same embed twice costs ~1.5 MB on a phone.
   A hosted link (YouTube/Vimeo) still plays in "Our Footage", so the couple's
   film is never lost; a short clip they upload crops into the arch instead.
8. **Only one cover slot.** The closing uses the painting, not a photo (that is
   how the reference is built), so no second slot is offered.
9. **The cover has no RSVP button** (owner request): the reference's pill was the
   only entry point to its own RSVP form, and RSVP here is the dock.
10. **The gate is the opening-video surface.** The separate `.olan-film` band
   from the first pass is gone: the film now plays behind "Open Invitation",
   with the painting as the fallback while it loads. It is unmounted 1.9 s after
   the gate slides away so a YouTube player cannot keep streaming in the
   background.
11. **Event cards carry their own date.** The reference prints one date per
   *group* of activities; the editor lets each event have a different date, so
   the section renders date → card → date → card.
12. **"With Honor" reuses the event section's bottom flower band** (owner
   request). The reference scopes those seven slots to `.agenda-inner`, so the
   band is re-declared for `.olan-inviting` in `olan-extra.css`.
13. **Story is a slide track with one photo per story.** No cover-photo
   fallback: the editor's story photo (`story_photo: true`) is the slide image.

## 5. Assets

Vendored from `katsudoto.id/media/template/exclusive/olan/original/*` (plus the
paper texture referenced from CSS). All were re-encoded to the smallest of
webp/PNG, and the four largest art files were downscaled to 1100 px wide
(the widest they are ever drawn is ~560 CSS px at 2×).

| Group | Files | Notes |
|---|---|---|
| Paper + paintings | `overlay.webp` (3.0 MB → 289 KB), `bg-cover.webp`, `bg-savedate.webp` | background art |
| Cover | `ranting-pohon.png`, `awan-1-min.webp`, `awan-2.webp`, 7 × `bunga-cover-*` | the swaying branch, clouds, flower cluster |
| Portraits | `frame-mempelai-01..04`, `mask-frame-couple.webp` | wreath layers + CSS mask for the arch portrait |
| Countdown stage | `bg-savedate`, `ubin`, `pilar`, `jembatan`, `tangga-savedate`, `lantai`, `bunga-ubin`, `vas` | |
| Sections | `orn-galeri-kiri/kanan`, `orn-story-kiri/kanan`, `orn-gift-kanan` | |
| Event cards | `frame-agenda`, `orn-acara-01..04`, `bunga-orange-agenda`, `merak` | |
| Brand | `aksaraa-logo.jpg` | vendored copy (the `ASSETS.*` path is storage-relative and 404s locally) |

Not vendored: the reference's music track, the couple's photos, the YouTube
films, the Katsudoto wordmark/footer, the theme switcher and the
selectize/lightgallery/AOS/slick libraries (their behaviour is re-implemented).

## 6. Motion mechanism

The reference drives `AOS 2` (159 `data-aos` targets, `fade-*` / `zoom-*`,
1 s–3.5 s durations, 0.2–2.5 s delays). We port the mechanism, not a lookalike:

- the same `data-aos` / `data-aos-duration` / `data-aos-delay` attributes on the
  same elements,
- one `IntersectionObserver` (`index.tsx`) that adds `.aos-animate` once and
  writes `transition-duration` / `transition-delay` inline from the attributes,
- the reference's own transform values for each type, scoped in `olan.css`,
- `prefers-reduced-motion: reduce` and `@media (scripting: none)` force every
  target to `opacity: 1; transform: none`, so nothing stays invisible without JS,
- all AOS keyframes/rules are scoped to `.olan-root`, and the three ported
  keyframes (`cloud`, `rotateLeft`, `rotateLeftRight`, `savedate`, `Agenda`, …)
  are renamed `olan-*` so they cannot collide with other templates.

## 7. CSS port

`olan.css` is generated from the reference's three compiled sheets
(`src/template/global`, `src/template/exclusive-olan`, `src/universal`):

- every selector is prefixed with `.olan-root`, `body.olan` → `.olan-root`,
- `@media` / `@supports` wrappers are preserved (whole-block extraction, so the
  mobile layout is not silently dropped),
- vendor `@font-face` (Butler/Bebas/Montserrat) and unrelated platform chrome
  (navbar, modal, alert, selectize, slick, lightgallery, video-js) are removed,
- asset URLs are rewritten to `/templates/olan/…`.

`olan-extra.css` adds the shell (`position: fixed`, scroll container), the
palette variables the reference injected inline, and the pieces the contract
adds (opening film, turut mengundang, dress code, wish list, gift address card,
lightbox, film modal, toast, vinyl music button, Aksaraa badge).

## 7.1 Ornament slots are numbered out of order

The reference's `.orn-cover-bottom-event-N` and `.orn-event-frame-N` classes are
positioned per number, but the assets are listed in a different DOM order. The
vendored arrays in `assets.ts` are therefore keyed by the **class number**, not
by the order they appear in the reference markup:

| slot | cover flower | event card |
|---|---|---|
| 1 | `bunga-cover-1` | `orn-acara-01` |
| 2 | `bunga-cover-kiri` | `orn-acara-02` |
| 3 | `bunga-cover-2` | `orn-acara-03` |
| 4 | `bunga-cover-tengah` | `bunga-orange-agenda` |
| 5 | `bunga-cover-3` | `orn-acara-04` |
| 6 | `bunga-cover-kanan` | `merak` |
| 7 | `bunga-cover-4` | — |

Swapping two slots silently moves a flower across the card.

## 7.2 Ornament reveal: why the flowers "went missing"

Symptom (reported twice): the cover's bottom band showed only four of its seven
pieces and the event card's left branch was absent — while every file was
vendored and returned `200`.

Cause, in three layers:

1. **AOS triggers on the vertical band only.** The reference's AOS compares an
   element's `top` with `windowHeight - offset` and ignores horizontal overflow,
   so an ornament whose reveal transform parks it outside the left/right edge
   still animates. A 2D `IntersectionObserver` does not.
2. **`rootMargin` cannot defeat an ancestor clip.** `.olan-root`, `section.cover`
   and `.agenda-wrap` set `overflow: hidden` (they must — the art bleeds on
   purpose). Intersection is computed against those clips, so pieces that bleed
   past a section's *bottom* edge never intersect, whatever the root margin.
   Measured live: pieces 1/3/5/7 were inside the clip and animated; 2/4/6 sat
   6–27 px below it and stayed at `opacity: 0` forever.
3. **A reveal that waits for a scroll can wait forever** — at the bottom of a
   section, or on the gate, there is no scroll left to make.

Final rule (do not regress it):

- **Decorative bands never depend on an observer.** The cover band, the closing
  band, the event section's bottom band, the "With Honor" band and the event
  card ornaments use `.olan-orn-in`, a self-starting CSS animation with a
  per-piece `animation-delay`; `prefers-reduced-motion` and `scripting: none`
  turn it off.
- **`[data-aos]` is kept for copy and cards**, which sit inside their section's
  clip. The observer keeps `rootMargin: 0px 100% 160px 100%` for the horizontal
  case that is not ancestor-clipped.
- Verify with `getComputedStyle(el).opacity` on every piece of the band — one
  hidden piece reads as "fewer flowers", not as a bug.

## 7.3 Other visual fixes that are not in the reference sheet

- **Portrait crop.** `.couple-picture .img` uses `object-position: 50% 18%`: the
  wreath mask is a head-and-shoulders shape, so a full-body portrait cropped
  dead-centre shows a torso.
- **Copy glyph.** `.bank-account-number` is `inline-flex` with an 8 px gap so the
  icon sits beside the number instead of wrapping under it.
- **Gift bank picker.** The reference's maroon `<select>` is reproduced as a pill
  + dropdown (`.olan-bank__*`); with one account the pill is omitted.
- **Story card height.** `aspect-ratio: 9 / 10` (380 px minimum) keeps every
  caption readable; without it the card collapsed to the first slide's text.
- **Brand badge.** `aksaraa-logo.jpg` is a local file; the asset optimiser
  rebuilds `public/templates/olan/` from scratch, so it must be restored after
  re-running that script. Cloudflare also cached the 404 for that path — the
  edge purges are part of shipping a late-added asset.

## 7.4 Migration status (2026-11-18)

`20261118000000_olan.sql` was applied to **staging** (`supabase db push
--include-all`) and to **production** (single-statement apply + a recorded row in
`supabase_migrations.schema_migrations`). Production still lists
`20261117000002_fresco` and `20261118000001_emerald_heirloom` as pending — they
belong to those ports and were deliberately left alone: the `fresco` row already
exists on prod, so replaying that file would overwrite ops-edited columns.
Local (`supabase db reset`) was skipped because Docker was not running; the file
is a single idempotent `INSERT … ON CONFLICT (code) DO UPDATE`.

## 8. Known review notes

- The reference's own cover date format is `January 04th, 2025`; we print the
  correct ordinal (`1st`, `2nd`, `3rd`) instead of always `th`.
- The event card prints `venue` and `address`; the reference's third line
  (`Kota …`) has no field in `wedding_sessions`, so it is not rendered.
- The cover slot count is **1**. The closing uses the painting, not a photo
  (that is how the reference is built), so no second slot is offered.
