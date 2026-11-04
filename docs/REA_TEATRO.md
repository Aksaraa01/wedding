# REA — The Digital Yes "Teatro" → Aksaraa in-house template

Code `teatro`. Component `src/components/templates/teatro/` (`index.tsx`,
`teatro.css`, `assets.ts`). Reference: `https://template-teatro.thedigitalyes.com`.

## 1. Verdict

Theatre programme: a closed burgundy velvet curtain, a hand-drawn gold frame,
Cormorant Garamond capitals, Lora body copy, Great Vibes for names. Tapping the
gate pulls the curtain apart on a real 5 s film, and the invitation copy behind
it is uncovered **as the drapery parts** rather than fading in on a timer.

The reference is a React/Vite SPA (Tailwind + Framer Motion, hashed `/assets/*`).
It is a **design**, not a feature list: it ships nine blocks (cover, reveal,
countdown, venue, programme, dress code, gifts, RSVP, closing) and has no
welcome copy, no mempelai block, no love story, no turut mengundang, no gallery
and no film section. All of those were rebuilt in the reference's own visual
language (kickers in Lora caps, script headings, gold flourishes, deckled mats,
line-art ornaments) — never bolted on as generic cards.

Everything ornamental is the reference's own file. Nothing is redrawn in CSS or
inline SVG: the two drapery posters, the curtain film, the gold foil, the venue
/ dress-code / gift / RSVP line art, the programme frame, the flower divider
**and the intro music** are vendored under `public/templates/teatro/`.

## 2. What the reference actually is

- Single page, no router, no server data. Copy comes from a `bF` i18n object
  (`en` / `it` / `ca`); the demo hard-codes the couple, the date and the venue.
- Motion is Framer Motion: `initial → whileInView` pairs with `once: true` and
  `0.6–0.8 s easeOut` plus 0.1-step delays. Nothing scroll-linked except the
  reveal gate's IntersectionObserver.
- The cover film is `curtain-video-*.mp4` (1072×1928, **5.083 s**, muted,
  `playsInline`, `preload="auto"`), with `curtain-closed` and `curtain-open`
  posters either side of it. The sequence is: closed poster → tap → film plays
  → open poster, and the copy is clipped to the gap the drapery has opened.
- The reveal gate is its own full-height section. It locks the page
  (`body`/`html` `overflow: hidden`, plus `wheel` / `touchmove` / `keydown`
  blockers) while the section is ≥ 90 % visible and fewer than three discs are
  open, then releases on the third.

## 3. Section inventory (measured) → what shipped

Reference order (measured from the live DOM):

| Reference block | Height @ 390×844 | Notes |
|---|---|---|
| Cover / “Tap to continue” | 1 screen | curtain gate, copy clipped to the gap |
| Reveal (“SCRATCH TO DISCOVER THE DATE”) | 1 screen, locked | three gold discs, 10 / Sept / 2027 |
| Countdown | 356 px | four cells, “until the big day” |
| Venue + events | 671 px | line-art villa, “THE CELEBRATION WILL TAKE PLACE AT” |
| Programme (“APERITIVO … PRIMO …”) | 974 px | drawn menu frame |
| Dress code | 632 px | line-art suit + dress, swatches |
| Gifts | 736 px | line-art gift, accordion |
| RSVP | — | icon + confirmation film |
| Closing | — | names + thank you |

Shipped order in `teatro` (15 rendered sections; recorded here because it
deliberately differs from §0.5 — the reference puts the reveal **before** the
countdown, and the contract's 16-section list is order-flexible where the
reference pairs blocks):

```
sampul → reveal → countdown → pembuka → mempelai → story → acara →
inviting → rundown → galeri → video → gift → dresscode → wishes → closing
```

Mapping to the §0.5 contract:

| §0.5 # | Contract section | In `teatro` |
|---|---|---|
| 1 | Cover | `sampul` — curtain gate |
| 2 | Opening video | **absent** (documented omission, §9) |
| 3 | Welcome | `sampul` programme behind the curtain (shares the cover surface — §0.5 allows 3 and 4 to share) |
| 4 | Kalimat pembuka | `pembuka` |
| 5 | Mempelai | `mempelai` |
| 6 | Love story | `story` |
| 7 | Event | `acara` |
| 8 | Countdown | `countdown` (+ the `reveal` gate immediately before it) |
| 9 | Turut mengundang | `inviting` |
| 10 | Rundown | `rundown` (the menu frame) |
| 11 | Gallery | `galeri` |
| 12 | Video | `video` |
| 13 | Wedding gift | `gift` |
| 14 | Dress code | `dresscode` |
| 15 | Wishes | `wishes` |
| 16 | Closing | `closing` |

The reference has a dedicated **RSVP** block. RSVP is not a section (§0.5 rule
4) — it is the shared floating dock — so the reference's RSVP icon and
confirmation film are **not** shipped, and wishes takes that slot (§4).

## 4. Asset audit — all vendored, none hotlinked

`public/templates/teatro/` (13 MB total, exposed through `TEATRO_ASSETS` in
`assets.ts`):

| File | Size | Used for |
|---|---|---|
| `curtain-closed.jpg` | 731 K | cover poster before the pull |
| `curtain-open.jpg` | 563 K | cover poster after the pull |
| `curtain-video.mp4` | 6.1 M | the real curtain pull (1072×1928, 5.083 s) |
| `scratch-gold.jpg` | 16 K | gold foil painted onto each scratch canvas |
| `venue-illustration.png` | 277 K | venue line art |
| `dresscode-illustration.png` | 303 K | suit + dress line art |
| `gift-icon.png` | 1.1 M | gift line art |
| `rsvp-icon.png` | 148 K | the reference's attendance-confirmation artwork (804x618, ticket-style line art) — worn by the save-the-date surface |
| `menu-frame.png` | 357 K | the programme's drawn frame (`border-image`) |
| `flowers-divider.gif` | 607 K | story divider (the reference's animated divider) |
| `intro-music.mp3` | 2.7 M | the reference's own track, wired into `DEMO_PROPS_BY_CODE.teatro.track_url` (self-hosted, so the demo does not depend on a prod-storage URL) |
| `thumbnail.webp` | 73 K | 720×1280 gallery plate |

No `template-*.thedigitalyes.com` origin, Google Fonts, Unsplash or Drive URL
survives in the bundle. The 6.1 MB film is the largest object and it is the
whole point of the design; it is fetched with `preload="metadata"` and only
starts downloading after the tap (deviation 9). The 9 MB RSVP confirmation film
stayed dropped (RSVP is the shared dock); the RSVP icon was kept and is now worn
by the save-the-date section, above its title, as the owner asked. The gallery
scene was switched to the Sandhya in-house template layout — a slow marquee
carousel (doubled for a seamless loop, reverse marquee when there are more than
two photos) plus the closing quote; the framed feature plate was dropped ("use
B"). The save-the-date section also gained the "Add to calendar" CTA under the
countdown (allowlisted as a structural CTA).

## 5. Fonts

Reference: Cormorant Garamond (display / kickers), Lora (body), Great Vibes
(script). The first two are already loaded by the app; Great Vibes is vendored
as `public/fonts/teatro-greatvibes.woff2` and declared with `@font-face` in
`teatro.css` with `font-display: swap`.

## 6. Design system (measured)

| Token | Value |
|---|---|
| Burgundy | `#5C2018` |
| Cream | `#FAF8F5` |
| Paper | `#FFFDFB` |
| Gold | `#C9A961` |
| Gold deep | `#A8863F` |
| Stage frame | 1 px gold rule at `inset: 12px`, drawn in CSS (`.te-cover::after`), not an image |
| Section rhythm | `70px 26px`, alternating cream / paper |
| Kicker | Lora 9.5 px, `0.3em`, uppercase, gold-deep |
| Script | Great Vibes 52 px (base), 58 / 46 / 38 px (`--lg` / `--md` / `--sm`) |
| Display | Cormorant Garamond 28 px, `0.05em` |
| Body | Lora 13 px / 2 |

## 7. Data mapping

| Surface | Source |
|---|---|
| Cover names | `groom_name` / `bride_name` (Great Vibes, `&` between) |
| Cover invite | `template_content.cover_kicker`, `cover_apology` |
| Gate salutation | fixed `Kepada Yth.` + `guest_name` |
| Reveal day / month / year | `estimated_wedding_date` → `pad2(day)`, `EN_MONTHS_SHORT`, `year` |
| Reveal announcement | `estimated_wedding_date` → `longDateEn(..., true)` |
| Countdown target | `estimated_wedding_date` |
| Mempelai | `bride_full_name` / `groom_full_name` (falls back to `*_name`), `*_parents`, `*_instagram`, `groom_photo_url` / `bride_photo_url` |
| Story acts | `stories[]` → Roman numeral + `title` + `description` + `image_url` |
| Events | `sessions[]` → `name`, `date`, `time`, `venue`, `address`, `maps_url` |
| Inviting | `inviting_families[]` (TEXT column, `JSON.parse`, `[]` when empty) |
| Rundown | `rundown[]` → `{time, description}`, drawn inside `menu-frame.png` |
| Gallery | `gallery_photos[]` → Sandhya in-house marquee carousel + quote + lightbox |
| Film | `video_url` → `<video>` (mp4) or YouTube iframe; poster from cover slot 2 |
| Gift | `gift_accounts[]` + `gift_address`, `feature_gates.gift_address` |
| Dress code | `dresscode {title, description, colors[]}` + `template_content.dresscode_note` |
| Wishes | `Wishes` component + `template_content.wishes_*` labels |
| Closing | `template_content.closing_kicker` / `closing_message` / `closing_see` |
| Cover slots | `cover_photos` → stage photo, film poster, closing mat (`keepDemoIds` maps 3) |

Every copy string is `template_content.<key> || "<default>"`; the 35 literals
that are not (letter salutation, `and`, countdown units, WCAG names, transient
states, monogram numerals) are listed with reasons in
`scripts/template-copy-allowlist.json` under `templates.teatro.allow`.
`npm run audit:copy -- teatro` reports clean.

## 8. The cover: text uncovered by the drapery, not faded

This is the part that cannot be guessed. The film parts the curtain along a
curve that changes every frame, so a CSS `clip-path` driven by a timer, a
`scaleX` on a mask, or an `opacity` ramp all read as fake — the type appears on
top of velvet.

The mechanism (same family as `embroidered-garden`):

1. **Measure the film once.** `GAP_FRAMES` is a table sampled every 250 ms of
   the 5.083 s clip: for each frame, the x position (percent of film width) of
   the inner edge of the left curtain at 11 rows (`GAP_ROWS`, 0–100 % of
   height). Values were read off the decoded frames, not estimated: at the end
   the gap is 30.8 % wide at the 30 % row and 8.4 % at the 70 % row — the
   opening is a bell, not a slot, and a rectangle mask shows fabric at the
   shoulders.
2. **Interpolate.** `gapAt(t)` linearly interpolates between the two bracketing
   frames; `gapLeftAt(edges, rowPct)` interpolates between rows. Cost is 22
   lookups per repaint.
3. **Project to the frame.** The stage is `object-fit: cover`, so a 368×655
   plate sees the *middle* 100 % of the film's width but only ~76 % of its
   height, while a 390×844 phone sees the full height and 83 % of the width.
   `veilPolygon()` converts screen fractions back to film fractions through
   `visibleW` / `visibleH`, so the same clip is correct at both aspect ratios —
   no per-device tuning.
4. **Repaint on every frame.** `.te-veil` sits above the film (`z-index`
   between the video and the open poster) and gets a 42-point `polygon()`
   rebuilt in `requestVideoFrameCallback` (rAF fallback), plus on
   `resize`/`orientationchange`. `scripting: none` unclips it and the copy is
   simply visible; `prefers-reduced-motion` keeps the mask but skips the film
   (the end poster shows through).

Verified by pausing at 1.4 / 1.6 / 2.0 / 2.4 / 3.0 / 3.2 / 4.6 s and sampling
where the top line of the copy sits relative to the curtain edge: the first
line is uncovered at ~1.5 s, the flourish at ~2.4 s, the apology at ~3.2 s,
and nothing ever paints outside the gap.

The copy is bottom-anchored (`.te-veil { align-content: end; padding-bottom:
14svh }`, `12svh` under `max-height: 720px`) so it lands in the widest part of
the opening. `svh`, not `%`: vertical padding on a percentage basis resolves
against the *width*, which dropped the copy to 93 % of the cover height.

## 9. Deliberate deviations (all recorded, none silent)

1. **Opening video (§0.5 #2) is not a separate section.** The reference has no
   such block, and the cover is bound to the curtain film — inserting a second
   autoplaying film at the top would fight the pull. The couple's `video_url`
   ships at #12 only (same resolution as `iris` / `ivory-lace`).
2. **The date is not on the cover.** The reference deliberately hides it behind
   the reveal gate; the cover carries names + invitation + apology, and the
   full date appears in the gate once the three discs are open. Copy on the
   cover uses `estimated_wedding_date` changes only through the gate.
3. **Reveal gate and countdown are two sections.** The reference stops the page
   at the gate (hand icon, “Scratch all three circles to continue”, three
   discs) and only continues after the third disc. The countdown is a plain
   block below it. Splitting them is what makes the stop honest: one full-height
   locked surface, then a normal section.
4. **Scroll lock is gesture-level, not just `overflow: hidden`.** `body.te-locked`
   plus `wheel` / `touchmove` / `keydown` (Arrow\*, Page\*, Home, End, Space)
   blockers, released on the third disc or when the gate leaves the 90 %
   threshold. iOS rubber-banding and trackpad scroll-chaining both survive
   `overflow: hidden` alone. `touchmove` is skipped inside `.te-scratch` so
   scratching still works on a phone.
5. **`preload="metadata"`, not `auto`.** The reference preloads 6.1 MB before
   the guest touches anything. This is the one perf change: the film is
   `preload="metadata"` and the poster carries the first paint, so a guest on
   mobile data pays for the curtain only after the tap. Deliberate divergence
   from the reference's `preload="auto"` (and consistent with the invitation
   performance invariants in `AGENTS.md`).
6. **The early text fade is dropped.** The reference fades the whole copy block
   in at 1.1 s as well as clipping it; the two together made the first line
   double-animate. Only the clip remains.
7. **The cover kicker is shortened** to *“You are cordially invited”*. The
   reference's “You are cordially invited to celebrate the wedding of” wraps to
   **three** rows in the 158 px copy column on a phone, which pushed the names
   out of the widest part of the opening. Two rows, same register, and it is
   still an editor field (`template_content.cover_kicker`).
8. **“Scroll” cue added.** The reference shows it on the opened cover; without
   it the cover reads as a poster and guests sit on it. `template_content.scroll_label`.
9. **The reveal hand only appears once the gate is on screen.** The guide
   (`te-reveal__guide`) mounts only while the gate is the *current* destination
   of the scroll lock — i.e. once the gate has reached the 90 % coverage that
   triggers the lock — instead of mounting with the section. The hint lives
   inside the same block, so the hand and the wording arrive together.
10. **Confetti is React, not canvas.** 60 burgundy pieces, auto-unmounted after
    6.2 s, fired when the third disc opens. Same look, no rAF loop left running.
11. **RSVP block dropped** (see §3) — RSVP is the shared dock.
12. **`prefers-reduced-motion`**: the curtain jumps straight to the open poster,
    the scratch discs lose their fade, the confetti is hidden, the ping/bob
    animations stop. Copy is never left at `opacity: 0`.

## 10. Per-section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover / welcome | names, date (gate), `guest_name`, 3 cover slots | always; gate until tap | 0 cover photos ⇒ gradient stage; 1 ⇒ stage only | `cover_kicker`, `cover_apology`, `open_button`, `scroll_label` | curtain poster → film → poster; veil clip per frame; `teTap` pulse on the hand |
| 2 | Reveal gate | `estimated_wedding_date` | `dateObject` present | 0/1/2 discs open ⇒ still locked, 3 ⇒ announce + confetti | `reveal_title`, `reveal_hint`, `reveal_scratch_hint`, `save_date_label` | `te-guide-in` 0.5 s, `te-ping` 1.5 s loop, foil fade 0.7 s |
| 3 | Countdown | `estimated_wedding_date` | `dateObject` present | date passed ⇒ four `00` cells, no negative | `save_date_label`, `countdown_intro` (units allowlisted) | `IN("up")` 0.95 s, 0/0.06/0.1 step |
| 4 | Prologue | `quote_text`/`quote_source` **or** `opening_title`/`opening_description` | always; copy hidden when empty | quote wins when present, else title+body | `quote_title` \|\| `opening_kicker` | kicker up, quote fade, flourish |
| 5 | Mempelai | `*_full_name`, parents, IG, portraits | `person_photos !== false` for portraits | 1 name ⇒ single card centred; no photo ⇒ deckled mat with monogram | `mempelai_kicker`, `profiles_intro`, `parents_label` | name up, parents fade 0.1/0.12, IG fade 0.16 |
| 6 | Love story | `stories[]` | `feature_gates.story` **and** `story_visible` | 0 ⇒ section gone; 1 ⇒ one act; >3 ⇒ all, numeral from index | `story_kicker`, `love_story_title`, `story_intro` | divider fade, act numerals up, frames fade |
| 7 | Venue + events | `sessions[]`, `estimated_wedding_date` | always | 1 event ⇒ single column; 0 ⇒ venue art + no cards | `events_kicker`, `events_title`, `events_intro`, `events_note`, `maps_label` | art fade 0.05, title up 0.08, per-event steps |
| 8 | Turut mengundang | `inviting_families[]` (JSON text) | `feature_gates.inviting_families` **and** `inviting_families_visible` | `[]` ⇒ section gone; long list wraps 2-up | `inviting_kicker`, `inviting_title`, `inviting_intro` | `fade` with `min(0.05·i, 0.24)` |
| 9 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ section gone; frame stretches, rows stay 1fr | `rundown_kicker`, `rundown_title`, `rundown_intro` | `menu-frame.png` up, rows fade |
| 10 | Gallery | `gallery_photos[]` | needs data | 1 photo ⇒ single marquee (no reverse marquee, no NaN); 0 ⇒ section gone | `gallery_kicker`, `gallery_title`, `gallery_intro`, `gallery_quote` | marquee tiles, reverse marquee when > 2, quote fade 0.1 |
| 11 | Film | `video_url` | `feature_gates.video` **and** `video_section_visible` | mp4 ⇒ `<video>` mounted on click; YouTube ⇒ iframe on click; no poster ⇒ stage photo | `video_kicker`, `video_title`, `video_intro` | poster fade, player mounts on play |
| 12 | Wedding gift | `gift_accounts[]`, `gift_address` | `gift_section_visible !== false`; address also needs `feature_gates.gift_address` | accounts only ⇒ no address tab; address only ⇒ no tabs; neither ⇒ section gone | `gift_kicker`, `gift_intro_title`, `gift_intro_description`, `gift_signature`, `gift_button`, `copy_account_toast`, `copy_address_toast`, `copy_address_button` | accordion up, accounts step 0.05 |
| 13 | Dress code | `dresscode {title, description, colors[]}` | `dresscode_visible !== false` **and** data present | colors only ⇒ swatches, no note; title only ⇒ no swatches | `dresscode_kicker`, `dresscode_intro`, `dresscode_note` | art fade, swatches fade |
| 14 | Wishes | `Wishes` + `/api/wishes` | always | empty feed ⇒ `wishes_empty`; >3 ⇒ pager | `wishes_kicker`, `wishes_title`, `wishes_intro`, `wishes_*` form labels | card up 0.12 |
| 15 | Closing | couple names, cover slot 3 | always | no photo ⇒ stage photo | `closing_kicker`, `closing_message`, `closing_see` | mat up, message fade, names up 0.16 |

The footer (Aksaraa badge + WhatsApp link) is structure, not a section.

## 11. State matrix (verified)

| State | Result |
|---|---|
| cover idle | closed poster, gate with guest name, body scroll locked, film not downloaded |
| cover playing | film plays once, veil clips per frame, copy uncovered progressively |
| cover done | open poster, copy fully visible, `Scroll` cue, lock released |
| gate at ≥ 90 % and 0–2 discs | `body.te-locked`, wheel/keys swallowed, hand + hint visible |
| gate after 3 discs | guide hidden, full date in script, confetti 6.2 s, lock released |
| gate re-entered after completion | no lock (guest can leave) |
| no `estimated_wedding_date` | no reveal gate, no countdown, no scratch canvases |
| `stories = []` / `story_visible = false` | story section absent, no heading left behind |
| `inviting_families` empty | inviting section absent |
| `rundown = []` | programme section absent |
| `gallery_photos.length === 1` | single marquee, no reverse marquee, no NaN transform |
| gift: accounts only / address only / none | no tabs when only one source; section gone when neither |
| every gate `false` | cover → reveal → countdown → prologue → mempelai → acara → wishes → closing only |
| `prefers-reduced-motion` | all copy visible, curtain at open poster, confetti hidden |
| `scripting: none` | veil unclipped, reveal/load targets all `opacity: 1` |
| 390×844 | `scrollWidth === innerWidth`, veil projection correct (visibleW ≈ 0.83) |
| 1440×900 | `scrollWidth === innerWidth`, cover copy inside the gap |

## 12. Registration

`supabase/migrations/20261056000000_teatro.sql` — code `teatro`, name `Teatro`,
`sort_order 37`, category `Elegant`, `source_type 'inhouse'`, tier `Baru`,
`is_active true`, `no_photo false`, all packages eligible,
`preview_image_url /templates/teatro/thumbnail.webp`,
`demo_url /templates/teatro/preview`.

**Staging status:** the row **is** registered on staging
(`jclolnjkjhyjilvymagr`, id `b7f0db11-4f2e-431e-a364-c842ad6a02cf`) — applied
through the service-role REST API, because this machine has no
`SUPABASE_ACCESS_TOKEN` and the project is not linked. The migration **version
is therefore not recorded** in `supabase_migrations.schema_migrations`; record
it without executing before the next `db push`, or the (idempotent) file will
replay and reset `sort_order` / `preview_image_url` to these values:

```bash
export SUPABASE_ACCESS_TOKEN=...
npx supabase link --project-ref jclolnjkjhyjilvymagr
npx supabase migration repair --status applied 20261056000000 --linked
```

Nothing was applied to production.

Also registered in `src/components/templates/index.ts` (`TEMPLATE_MAP`,
`TEMPLATE_CONFIGS` — 3 cover slots, portraits on, story photos on), in
`src/components/templates/demoProps.ts` (`DEMO_PROPS_BY_CODE.teatro` +
`keepDemoIds`), the preview background in
`src/app/templates/[code]/preview/page.tsx` (`#efe7dd`), and
`src/lib/templateExtras.ts` for the teatro-only copy fields (`reveal_title`,
`reveal_scratch_hint`, `scroll_label`, `countdown_intro`, `reveal_hint`,
`save_date_label`, `dresscode_note`, `gift_signature`).

## 13. Verification log

- `npm run audit:copy -- teatro` → clean, 35 allowlisted literals.
- `npx tsc --noEmit` → clean.
- Curtain clip sampled at 1.4 / 1.6 / 2.0 / 2.4 / 3.0 / 3.2 / 4.6 s — no copy
  painted on fabric.
- Reveal gate: `body.te-locked` true at the gate with 0 discs, false after the
  third; full date `Saturday, 19 June 2027` rendered in script; confetti fired.
- Cover + gate captured at 390×844 (emulated wrapper) and at 368×655; thumbnail
  captured from the same geometry and exported 720×1280 WebP (73 KB).
- Section order asserted from the DOM:
  `["sampul","reveal","countdown","pembuka","mempelai","story","acara",
  "inviting","rundown","galeri","video","gift","dresscode","wishes","closing"]`.
- Staging standalone build (`node .next/standalone/server.js` on :3100, staging
  env): `/templates/teatro/preview` **200**, `curtain-closed.jpg`,
  `curtain-open.jpg`, `curtain-video.mp4`, `scratch-gold.jpg`,
  `thumbnail.webp` and `/fonts/teatro-greatvibes.woff2` all 200, no console
  errors, gate locks (`te-locked` true at the gate, released after the third
  disc). First request 404'd until `.next/standalone/.next/server/route-cache`
  was deleted and the server restarted — the documented route-cache trap, not a
  code fault.
- `/api/web-templates?fresh=1` returns the `teatro` row (29 rows) and the tile
  renders in **Top 10 Terbaru** on `/templates` (thumbnail 720×1280, tier
  `Baru`, category `Elegant`) once the page is re-rendered past its 1 h ISR
  window.
