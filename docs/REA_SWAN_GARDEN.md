# REA — Katsudoto "exclusive-aulia" → Aksaraa in-house `swan-garden`

Code `swan-garden`, name **Swan Garden**. Component
`src/components/templates/swan-garden/` (`index.tsx`, `swan-garden.css`,
`overrides.css`, `ornamentData.ts`, `Ornaments.tsx`, `assets.ts`, `Wishes.tsx`,
`sections/*`). Reference: `https://aulofandre.katsudoto.id/581249`
(theme `src/template/exclusive-aulia`, `body.aulia original`).

## 1. Verdict

A watercolour garden invitation. A painted stone arch over a swan pond sits on
the gate; behind it the cover frames the couple inside a carved oval; the quote
hangs inside a painted wreath, the couple's portraits sit in two more ovals, the
countdown is four plum-outlined cards under a hummingbird, each event is a gold
frame with the garden showing through its paper, the programme is a plum-lined
card, the gallery is a flexbin mosaic, the film is framed by leaves, the love
story is a gold scrollwork wreath, the gift is a painted ribbon, and the closing
is a soft garden fade. Type is **Imperial Script** over **Halant**; palette is
cream `#f4edde`, sage `#eaf1e6`, plum `#723d4c`, leaf `#3b5d3b`, gold `#ded19d`.

Desktop is a **side-by-side**: a fixed 61 % painted pane (mountain, arch, swans,
birds) beside a 39 % scrolling invitation column. Mobile is one column with the
arch gate; the pane is hidden.

The reference ships 18 blocks; the §0.5 contract needs 16, so Turut Mengundang
was built in the design's own language and two reference blocks were dropped
(see §9). All decorative art (87 ornaments + 5 css textures + 2 dress icons) is
vendored; nothing is hotlinked.

## 2. What the reference actually is

- Laravel/PHP server-rendered HTML with a jQuery runtime: AOS reveals, slick
  sliders (story + agenda), lightgallery, flexbin, video.js, selectize.
- One long document inside `.kat-page__side-to-side` (its own scroll container
  at ≤960 px; the document scrolls above that with `.primary-pane` fixed).
- Every section is wrapped in `.ornaments-wrapper` (absolute, inset 0) holding
  10–50 absolutely-positioned ornament images; **all** decorative art is `<img>`
  with `data-aos` + duration + delay.
- The event frame (`frame-event.png`) is a semi-transparent plate (alpha 89 of
  255): the garden ornaments behind it show through the paper.
- Platform chrome that is **not** ported: language switcher (EN flag), loading
  screen, GTM, the Katsudoto footer/logo, the vinyl button art, the reference
  couple's data, their music track.

## 3. Section inventory → what shipped

Reference order, heights at 390×844 (measured in a settled viewport):

| Reference block | Height | Shipped as |
|---|---|---|
| `top-cover` (gate) | 844 fixed | `TopCover` — arch, VIP plate, names, guest, Open |
| `cover` | 699 | `Cover` — kicker, names, oval frame, hashtag |
| `quote-wrap` | 473 | `Quote` — wreath frame, quote + attribution (or couple's words) |
| `couple-wrap` | 1573 | `Couple` — two portraits, parents, Instagram |
| `save-date-wrap` | 729 | `SaveDate` — countdown cards + Add to Calendar |
| `agenda-wrap` | 2025 | `Agenda` — day/date head, one framed card per session, dress code |
| `rundown-container` | 543 | `Rundown` — plum-lined programme card |
| `rsvp-wrap` | — | **not shipped** (RSVP is the shared dock, §9.4) |
| `live-streaming` | 639 | `Live` — preview, title, Open Link |
| `photo-wrap` | 678 | `Gallery` — flexbin mosaic + lightbox |
| `video-gallery` | 639 | `Film` — couple's film (upload or YouTube) |
| `love-story` | 639 | `Story` — gold wreath, one slide at a time, dots |
| `wedding-gift-wrap` | 1303 | `Gift` — ribbon, bank accordions, gift address |
| `ig-filter-wrap` | 600 | **not shipped** (§9.1) |
| `wedding-wish-wrap` | 620 | `Wishes` — form + approved feed |
| `notes-container` | 600 | `Closing` — Thank You |
| `footnote-wrap` | 842 | `Footnote` — names + hashtag + Aksaraa badge |
| — | — | `Families` — Turut Mengundang (new, §9.5) |

Shipped order (keeps the reference's pairings, adds the contract's missing
block and keeps dress code inside the event section as the reference does):

```
sampul (gate + cover) → quote → mempelai → countdown → acara (+ dresscode) →
rundown → inviting → live → gallery → video → story → gift → wishes → closing
```

## 4. Per-section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover / gate | names, `cover_photos[0]` (oval), `cover_photos[1]` (gate portrait), `display_name` | always | no oval ⇒ frame shows paper; no gate portrait ⇒ painted arch only; no guest ⇒ no `Dear,` line; no hashtag ⇒ no line | `cover_kicker`, `open_button` | gate slides out 1.8 s; 190 ornaments fade/zoom per their own delay (0.5–3.5 s) |
| 2 | Live | `livestream {title, description, buttonLabel, url}` | `livestream_visible !== false` and a usable URL | YouTube ⇒ poster + play disc; any other link (Zoom, Meet) ⇒ `cover_photos[0]` behind a scrim + play disc; a bare word ("jbkjbkjbk") ⇒ section hidden, never a link back to the invitation host | `live_title`, `live_button`, `live_description` | header ornament fades in; disc scales on hover |
| 3 | Welcome | the gate itself (names, guest, open) | always | — | `cover_kicker` | as above |
| 4 | Kalimat pembuka | `quote_text`/`quote_source`, else `opening_title`/`opening_description` | renders when either has content | quote only / body only / both | profile + `quote_*` | wreath + 18 ornaments fade with the section |
| 5 | Mempelai | `*_full_name`, parents, IG, portraits | portraits only when a photo exists | 0 photos ⇒ `hide-picture` (frames hidden); 1 photo ⇒ one oval filled, the other paper | `mempelai_title`, `mempelai_intro` | two person blocks fade-up, 0.08 s step |
| 6 | Love story | `stories[]` | `feature_gates.story` **and** `story_visible !== false` | 0 ⇒ section gone; 1 ⇒ no dots, no timer; n ⇒ 6 s auto-advance + dots | `story_title` | slide swap 6 s; gold wreath breathes |
| 7 | Event | `sessions[]` | always (completeness blocks without it) | 1 ⇒ one frame, no gaps; n ⇒ n frames; no map ⇒ no button | `events_title`, `maps_label` | frame image scales 1.2 → 1 on reveal; garden layer fades 1.9 s |
| 8 | Countdown | `countdownTarget(sessions, estimated)` + `sessions[0]` | only when a date exists | past date ⇒ `00` cells (never negative); no date ⇒ no section | `countdown_title`, `save_date_label`, units (allowlisted) | four cards fade from four corners, 0.2–0.5 s steps |
| 9 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | 0 ⇒ section gone; long lists wrap | `inviting_title`, `inviting_intro` | reuses the rundown card reveal |
| 10 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ section gone; 1 ⇒ one row | `rundown_title`, `rundown_event_title` | card fade, rows static |
| 11 | Gallery | `gallery_photos[]` | needs data | 1 ⇒ single plate (first-child rule stretches it); n ⇒ mosaic; 0 ⇒ gone | `gallery_title` | reveal per plate; lightbox Esc/←/→ |
| 12 | Video | `video_url` | `feature_gates.video` **and** `video_section_visible !== false` and a playable source | mp4/webm ⇒ `<video>` loop; YouTube (`watch`, `youtu.be`, `embed`, `shorts`, `live`) ⇒ poster + play disc, iframe mounted on tap; Vimeo/other embeds ⇒ iframe straight away; unusable URL ⇒ section gone | `video_title`, `video_intro`, `video_caption` | poster reveal; player mounts on tap, muted loop |
| 13 | Wedding gift | `gift_accounts[]`, `gift_address(_name)` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / both / none | `gift_title`, `gift_intro`, `gift_address_title`, `copy_label`, `copied_label` | ribbon art static; accordions; copy toast |
| 14 | Dress code | `dresscode {title, description, colors[]}` | `dresscode_visible !== false` and any data | colors only ⇒ swatches only; no note ⇒ no footer | `dresscode_title`, `dresscode_note` | inside the event section, fades with it |
| 15 | Wishes | `Wishes` + `/api/wishes` | always | 0 wishes ⇒ empty line; >10 ⇒ numbered pager (prev/page/next) | `wishes_*` | form static, rows list |
| 16 | Closing | `closing_message` | always | no message ⇒ title only | `closing_title`, `closing_message` | garden band fades |
| — | Footnote | names, `display_name` | always | names split on `&` | `cover_kicker` | fade-up |

The gate hides itself after opening (`.top-cover.hide`, 1.8 s), body scroll is
locked while it is idle, and the page returns to the top on open.

## 5. Asset audit — all vendored, none hotlinked

`public/templates/swan-garden/` — **92 files, ~4.5 MB** (was 6.8 MB of PNG).
Every ornament keeps its reference filename (`orn-01…orn-70`, birds, herd,
clouds, butterflies, swans, `frame-*`, `tc-mask`, `bg-cover`); the five CSS
textures/masks are renamed (`texture-paper`, `mask-cover-frame`, `mask-couple`,
`mask-event`, `orn-agenda-4`).

- Re-encoded to WebP (q82–90, alpha preserved). Ornaments are capped at 820 px
  (1400 px for the full-bleed plates), so a 2× phone still gets native pixels.
- Each ornament carries its intrinsic `width`/`height` so the composition never
  collapses while the lazy image loads — this was the bug that hid the garden
  behind the event frame.
- The two dress icons (`ic-dress-man-elegant`, `ic-dress-woman-elegant`) were
  part of the reference host; they are vendored too.
- Not vendored: reference couple photography, the Katsudoto footer/logo, bank
  logos (we render the provider name), the vinyl button art (CSS vinyl instead),
  their music track (a couple's `track_url` or `ASSETS.defaultMusic` plays).

## 6. Fonts

| Role | Reference | Shipped |
|---|---|---|
| Display / script | Imperial Script (Google) | `public/fonts/imperialscript-400.woff2` |
| Body serif | Halant (Google) | `public/fonts/halant-300/400/600/700.woff2` |

Both are OFL, added to `scripts/fetch-fonts.js`; `overrides.css` declares the
`@font-face` blocks against `/fonts/…`.

## 7. Data mapping

| Surface | Source |
|---|---|
| Gate/cover names | `groom_name` / `bride_name` (fallback to `*_full_name`) |
| Gate greeting | `Hai {guest_name}` when a real guest is identified |
| Hashtag | `display_name` (a stored value without `#` gets one) |
| Cover kicker | `template_content.cover_kicker` (default *Wedding Invitation*) |
| Quote | `quote_text` / `quote_source`, else `opening_title` / `opening_description` |
| Mempelai | `*_full_name`, `*_parents`, `*_instagram`, `groom_photo_url` / `bride_photo_url` |
| Countdown | `countdownTarget(sessions, estimated_wedding_date)`; calendar from `sessions[0]` |
| Events | `sessions[]` (name, date, time, venue, address, `maps_url`) |
| Dress code | `dresscode {title, description, colors[]}` |
| Rundown | `rundown[]` + `rundown_event_title` |
| Turut mengundang | `inviting_families[]` (TEXT, JSON parsed upstream) |
| Live | `livestream {title, description, buttonLabel, url}` + `livestream_visible` |
| Gallery | `gallery_photos[]` |
| Film | `video_url` + feature gate + toggle; poster = first gallery photo |
| Story | `stories[]`; photo falls back to `cover_photos[0]` |
| Gift | `gift_accounts[]`, `gift_address_name`, `gift_address` |
| Wishes | `Wishes.tsx` + `/api/wishes` (demo ids keep the preview populated) |
| Closing | `closing_message`, `closing_title` |
| Footers | names + `display_name` + Aksaraa badge |

Every literal that is not data-driven is either a `template_content` key
registered in `src/lib/templateExtras.ts` for `swan-garden` (34 fields) or in
`scripts/template-copy-allowlist.json` under `templates["swan-garden"].allow`
(14 entries: VIP plate, countdown units, Men/Women, banking labels, brand badge,
WCAG names, the wish pager back label, the `Hai` salutation).

## 8. Motion

- One `IntersectionObserver` over every `[data-aos]` element adds
  **`aos-animate`** once (the reference's own class), so the vendored rules that
  key on it — butterfly `flap` + `fly-2`, bird `flap-2`, cloud `slideLeft/Right`
  — start exactly as designed. Each node carries its reference
  `data-aos-duration` / `data-aos-delay` through CSS variables.
- Reveal properties are individual (`opacity`, `translate`, `scale`), never the
  `transform` shorthand, so the reference's own `transform: translate/scaleX`
  placements are not overwritten.
- `prefers-reduced-motion` and `@media (scripting: none)` leave every reveal
  target fully visible; the gate is hidden without JS.
- `content-visibility: auto` is disabled for the template's sections: its
  placeholder height made scroll targets land on the wrong section and let the
  closing copy spill past its band.

## 9. Deliberate deviations (all recorded, none silent)

1. **Instagram filter block is not shipped — reported to the owner.** *What it
   is:* a card with a filter preview image and a "Use Filter" button.
   *Which column would feed it:* none; it needs a new URL column plus editor +
   ops + publish wiring. *What is lost:* a link to the couple's Instagram
   filter. It is outside the 16-section contract.
2. **Gift transfer-confirmation form is not shipped — reported to the owner.**
   *What it is:* a flip page with "Upload proof of transfer" (file, sender,
   account, amount, confirm). *Which column would feed it:* none — there is no
   proof-of-transfer storage flow, and the gift section must not become a second
   payment source of truth. *What is lost:* couples cannot collect transfer
   proofs from the invitation. The bank cards, copy buttons and gift address
   are kept.
3. **The "Kalimat Pembuka" accordion is hidden in the editor and ops**
   (`TEMPLATES_WITHOUT_OPENING`) because this design has no such block — the
   painted quote card carries the couple's words. The quote section itself
   still renders from `quote_text`/`quote_source`.
4. **The reference's own RSVP block is not a section, and its cover button is
   gone.** In the source the RSVP block is a heading with an empty body; the
   cover's plum `RSVP` pill only scrolled to it. Attendance/pax/QR belong to the
   shared `InvitationOverlay` dock, so the cover pill was **removed at the
   owner's request** (the floating dock is the only RSVP entry point in a real
   invitation). The dock is rendered inside the template with the
   `preview_mode` / `template_demo` guards and only after the invitation opens.
5. **Story slider renders one slide at a time.** The reference's slick clones
   both slides into the DOM (2×13 ornaments); ours renders the active slide's
   ornaments once — the same pixels, half the images.
6. **Turut Mengundang is new.** Rebuilt from the rundown's own paper card
   (frame, ornaments, script heading, Halant names) so it reads as part of the
   design rather than a bolted-on block.
7. **Dress code stays inside the event section** exactly as the reference draws
   it (Men/Women columns, same swatch list, note underneath) instead of becoming
   a separate section.
8. **Language switcher, loading screen and vendor footer are reference chrome**
   and are not ported. The footer carries the Aksaraa badge instead.
9. **Video is poster-first.** The reference shows a YouTube poster with a play
   disc; ours does the same and mounts the iframe on tap (silent, looped). The
   poster falls back from `maxresdefault` to `hqdefault`, then to the first
   gallery photo. `watch`, `youtu.be`, `embed`, `shorts` and `live` URLs all
   resolve. Vimeo/other provider embeds are mounted directly so the frame is
   never an empty box, and an unusable URL removes the section.
10. **Every EKSTRA field has a visible default.** A blank `template_content`
    value falls back to the design's own sentence (video intro/caption, inviting
    intro, wish intro, rundown session label, gift intro, closing, live
    description, open button), so a real invitation never shows a bare heading.
    Blank/whitespace values are treated as empty.
11. **Gift accounts have no logo.** `gift_accounts` carries no
    `provider_logo_url`, so the provider name is printed (the reference's bank
    PNGs are not borrowed). No logo also means no broken image slot.
12. **The gate salutation is `Dear, …`** (the owner's request), not the
    reference's `Hai`.
13. **Desktop shows the cover, it does not auto-open.** Above 961 px the gate is
    hidden and the 61/39 split is the cover: the left pane carries the names,
    `Dear, <tamu undangan>` and an **Open Invitation** pill, the right pane the
    carved oval portrait. The pill starts the music, drops the scroll lock and
    reveals the floating RSVP/QR dock; the page does not start open, so guests
    always hear music from their own tap. Phones keep the painted gate and its
    Open button.
14. **Two cover slots.** `cover_photos[0]` is the oval portrait on the cover,
    `cover_photos[1]` the portrait inside the gate's painted arch (masked, with
    a cream fade at the bottom). A couple with one photo gets the painted arch
    only, never a stretched or broken image.

## 10. State matrix (verified)

| State | Result |
|---|---|
| gate idle | arch art, VIP plate, names, guest, Open; body scroll locked |
| gate opened | `.top-cover.hide`, scroll stays at top, music starts |
| desktop ≥961 px | gate hidden by the vendored CSS, left pane shows `Dear, …` + Open Invitation; the pill starts music and reveals the RSVP/QR dock |
| no `estimated_wedding_date` and no session date | no countdown section, no calendar link |
| `sessions.length === 1` | one framed card, no gap |
| `sessions = []` | no event section at all |
| `stories = []` / `story_visible = false` | no story section, no dots |
| `stories.length === 1` | no auto-advance, no dots |
| `gallery_photos.length === 1` | one plate, no NaN |
| gift: accounts only / address only / none | accordion or address only; section gone when neither |
| video hidden but `video_url` set | no player, no poster |
| every gate `false` | gate → cover → quote → mempelai → countdown → event → rundown → gallery → gift → wishes → closing |
| `prefers-reduced-motion` | reveals visible, no transitions |
| scripting: none | gate hidden, all copy visible |
| 390×844 and 1440×900 | `scrollWidth === innerWidth`; desktop shows the 61/39 split |

## 11. Verification log

- `npx tsc --noEmit` → clean.
- `npm run audit:copy -- swan-garden` → clean (14 allowlisted literals).
- Ornament audit against the live reference (same 390 px viewport): every
  section renders the same image multiset; each event card holds the same 40
  decorative images, each `ornaments-wrapper` the same children. Expected
  differences only: the dropped RSVP/IG-filter blocks and the single-slide
  story.
- Geometry audit at 390 and 1440: section widths match exactly; heights match
  within 0–4 px on shared sections (`cover 699/695`, `quote 473/469`,
  `save-date 729/694` before the content-visibility fix and `…/694` after,
  `rundown 543/496` compensating for the reference's placeholder). The large
  `agenda`/`notes`/`photo` gaps in the raw table are the reference's
  `content-visibility` placeholders, not layout.
- Motion: butterflies/birds report `sg-flap` + `sg-fly-2` (1 s / 8 s) once
  revealed; `aos-animate` is applied by the single observer; reduced-motion
  branch leaves every target visible.
- Preview serves 200 with all vendored assets and fonts; no console errors.

## 12. Registration

- `supabase/migrations/20261119000000_swan_garden.sql` — code `swan-garden`,
  `sort_order 45`, category `Floral`, `source_type 'inhouse'`, tier `Baru`,
  all packages eligible.
- `src/components/templates/index.ts` (`TEMPLATE_MAP` + `TEMPLATE_CONFIGS`),
  `demoProps.ts` (`DEMO_PROPS_BY_CODE["swan-garden"]`),
  `src/app/templates/[code]/preview/page.tsx` (`keepDemoIds` + background
  `#eaf1e6`), `src/lib/templateExtras.ts` (34 fields),
  `scripts/template-copy-allowlist.json`, `scripts/fetch-fonts.js` (fonts).
