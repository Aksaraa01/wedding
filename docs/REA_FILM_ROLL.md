# REA — our-wedding.link "Film Roll" → Aksaraa in-house template

Code `film-roll`. Component `src/components/templates/film-roll/`
(`index.tsx`, `film-roll.css`, `Wishes.tsx`). Reference:
`https://our-wedding.link/design/film-roll`.

## 1. Verdict

A fixed-viewport vertical reel: thirteen full-screen cards stacked like frames on
a film strip, driven by wheel, touch or drag. Each card is a poster — a
photograph, a giant Urbanist title whose letters roll into place, a Marcellus
label and a paper ticket — and the strip wraps around both ends so the guest can
keep scrolling forever. Type: **Smythe** for the gate wordmark and initials,
**Marcellus** for body and labels, **Urbanist** for display and UI.

The reference is a Vue SPA with a WebGL canvas behind the deck, an RSVP form, a
livestream scene and a QR gift block. It is a **design, not a feature list**. Our
port keeps the deck, the motion model and the paper components; drops the WebGL
(the renderer needs a shader the port does not ship, so the `.no-gl` path that
the reference itself uses is always on), drops the reference RSVP form (the
shared `InvitationOverlay` dock owns RSVP) and folds livestream into the trailer.

**No reference asset is shipped.** Every photograph is the couple's own; every
ornament is CSS (masks, dashed rules, the ticket notches). The only vendored
files are the three fonts.

## 2. What the reference actually is

- One screen, no scroll container. `.fr-home` is `position:absolute; inset:0`,
  `.fr-item` is `height: var(--fr-item-h)`, and a single `translate3d(0, w*H, 0)`
  per frame places every card (`w` = wrapped distance from the current index).
- Motion state is three numbers: `current` (rendered), `target` (committed) and
  `speed` (used only for the blur). A pointer gesture nudges `target` within
  `anchor ± 1`; a commit threshold snaps it back or forward and locks the wheel
  for 650 ms.
- `--fr-item-h` is `round(vh * .85)` on desktop and `round(vh * .9)` on mobile;
  `--fr-side` / `--fr-gap` are 16 / 8 on mobile, 61 / 48 on desktop. Cards are
  hidden at `|w| > 1.6` so only the current, previous and next are painted.
- The reference's shader canvas (`fr-gl`) is decorative. The same CSS has a
  `.no-gl` path (`opacity:1` on `.fr-item__img`), which the port always selects.
- Scenes are generated from the couple's data; there is no fixed page order. The
  reference's scene list is poster → prologue → cast → chapter → event → live →
  strip → gift → wishes → RSVP → credits.

## 3. Scene inventory → what shipped

Thirteen scenes in this order (the count varies with the couple's data):

| # | Scene | Reference block | Ours |
|---|---|---|---|
| 01 | Poster | cover with title, meta rows, countdown | gate wordmark, then the poster card with callout rows + countdown |
| 02 | Prologue | `fr-item--title` opening block | `opening_title` / `opening_description` + quote inside `.fr-inter` |
| 03 | Cast — groom | cast portrait | `groom_full_name`, parents, Instagram |
| 04 | Cast — bride | cast portrait, flipped | same, `is-flip` (head right, text left) |
| 05 | Chapter | story reel with progress bars | story auto-advance + tap-to-jump chapters |
| 06 | Event | ticket stubs slider | one stub per session, ± buttons, dots, maps + calendar |
| 07 | Rundown | paper programme | `.fr-paper` row list |
| 08 | Strip | two marquee rows + lightbox | same, duration from photo count |
| 09 | Trailer | video scene | poster → player mounts on tap (`videoLive`) |
| 10 | Gift | account cards + address card | accounts, address, copy toasts |
| 11 | Dresscode | palette | swatches + note |
| 12 | Wishes | wishes form + list | `Wishes.tsx` (form card + scrollable list) |
| 13 | Credits | closing + turut mengundang | closing copy, honoured families, share, Aksaraa badge |

Scenes that need no data are omitted rather than rendered empty: no stories → no
chapter; no sessions → no event; no gallery → no strip; no video → no trailer; no
gift → no gift; no dresscode → no dress. Poster, prologue, wishes and credits
always render (wishes and credits are contract sections).

Mapping to the playbook §0.5 contract:

| §0.5 # | Contract section | In `film-roll` |
|---|---|---|
| 1 | Cover | gate (wordmark + guest + Enter) → poster card; **9 cover slots** (`Sampul, Prolog, Acara, Rundown, Video, Hadiah, Dresscode, Ucapan, Penutup`) feed the gate/poster card and each scene background |
| 2 | Opening video | `video_url` fills the gate: a file plays in `<video>`; a YouTube/Vimeo link becomes a silent, chrome-less, cover-cropped iframe (§9.1). The trailer is a separate scene |
| 3 | Welcome | **folded into the poster** — the countdown, guest and venue live on the cover card so the reel opens on the hero, not on a second screen |
| 4 | Kalimat pembuka | **not shipped** — `film-roll` is in `TEMPLATES_WITHOUT_OPENING`, so the editor/ops hide the card. The prologue's paragraph is the template extra `welcome_message` (`Pesan Sambutan`), not the profile field |
| 5 | Mempelai | `groom` / `bride` cast scenes |
| 6 | Love story | `chapter` |
| — | Kutipan | quote on the prologue card (`quote_text`, `quote_source`) |
| 7 | Event | `event` — ticket stubs with Open Map; the calendar CTA lives on the poster |
| 8 | Countdown | on the poster card (`Clock`) + the `Save to calendar` CTA under it, always visible |
| 9 | Turut mengundang | inside `credits` — pairing the families with the closing copy keeps the reel at thirteen scenes and puts the "also inviting" line where a film would put its cast list |
| 10 | Rundown | `rundown` |
| 11 | Gallery | `strip` |
| 12 | Video | `trailer` |
| 13 | Wedding gift | `gift` |
| 14 | Dress code | `dress` |
| 15 | Wishes | `wishes` |
| 16 | Closing | `credits` + Aksaraa badge |

**Not shipped:** livestream (`livestream: false` — a live embed cannot autoplay
inside a fixed deck without hijacking the scene, and the trailer already carries
the film) and contacts (the reference has none; the WhatsApp vendor credit is the
only outbound link). RSVP is the shared dock, never a scene.

## 4. Assets — nothing from the reference

| Object | Source |
|---|---|
| All photographs | couple data (`cover_photos`, `groom_photo_url`, `bride_photo_url`, `gallery_photos`, `stories[].image_url`) |
| Paper, tickets, masks, grain | CSS |
| Fonts | vendored woff2 (`public/fonts/smythe-400.woff2`, `marcellus-400.woff2`, `urbanist-500/600/700.woff2`) |
| Music | `track_url`; demo falls back to `ASSETS.defaultMusic` |
| Thumbnail | authored from the live preview: 720×1520 webp of the gate |

## 5. Fonts

Reference: **Smythe** (wordmark), **Marcellus** (serif), **Urbanist**
(display/UI). All three are vendored through the shared pipeline
(`scripts/fetch-fonts.js` → `public/fonts/*.woff2`, `scripts/gen-font-css.js` →
`src/app/fonts.css`) and exposed as `--font-smythe`, `--font-marcellus`,
`--font-urbanist`. Nothing loads from Google Fonts at runtime.

## 6. Design system (measured)

| Token | Value |
|---|---|
| Page | `#000000` |
| Ink | `#FAF7EF` |
| Paper | `#FAF7EF` on `#000` |
| Mobile item | `--fr-item-h: 90dvh`, side 16, gap 8 |
| Desktop item | `--fr-item-h: 85dvh`, side 61, gap 48 |
| Card radius | 28 px mobile, 34 px desktop |
| Title | Urbanist 600, uppercase, `line-height:.8`, `letter-spacing:-.03em`; per-kind caps 38–90 px, fitted by `titlePx()` |
| Label | Marcellus 9.6 px, `.3em` (10.5 px desktop) |
| Lead | Marcellus 14 px / 1.55 (15 px desktop), clamped to 3 lines |
| Title fit | `min(cap, (min(vw,430) − 92) / (len × .6))` mobile, `min(cap, (poster ? 395 : 440) / (len × .56))` desktop |
| Blur | `min(lspeed × 10, 24)px` on every `.fr-item` |

There is no scrollbar: `html:has(.film-roll-root){overflow:hidden}` and the root
is `height:100dvh`. Without JavaScript the gate hides and the cards fall back to
a plain vertical stack (`@media (scripting: none)`), so the content is still
readable and the copy is all in the DOM.

## 7. Motion constants (kept verbatim)

| Gesture | Value |
|---|---|
| Wheel | `push(−deltaY × .5)`, commit at `|offset| ≥ .03`, 220 ms debounce, 650 ms key lock |
| Touch | `push(dy × 5)` per move, commit at `.12` |
| Drag | `target = dragTarget − dy × .005`, commit at `.1` |
| Springs | `target = lerp(target, round(target), .1)`; `current = lerp(current, target, intro || !mobile ? .05 : .09)`; `speed *= .85`; `lspeed = lerp(lspeed, |speed|, .1)` |
| Intro | entering sets `speed = lspeed = 10`, `intro = true`; intro ends when `|target − current| < .02` |
| Parallax | `[data-p]` gets `translate3d(0, w × depth × 10%, 0)` — desktop only |
| Char roll | `startRoll(chars, 8, 14, .04, 0, 50)` on scene entry; the glyph transform is `(base − eased × span)%` with `eased = ((1 − 2^(−10t)) × (rep + 1)) % 1` and `t ∈ [0,2]` |

The title roll is **one-shot per scene entry** — no timer replays it, so the deck
settles. `prefers-reduced-motion` disables the strip marquee, the equaliser, the
image fade, and forces every glyph back to `translate(0)`.

## 8. Data mapping

| Surface | Source |
|---|---|
| Gate wordmark | `groom_name` + `bride_name`; kicker `cover_title` → `cover_kicker`; date `estimated_wedding_date` |
| Gate guest | `guest_name`; "Dear" from `cover_apology` |
| Gate button | `open_button` |
| Couple initials | `couple_initials` (“Singkatan Pasangan”) used as typed, with the `&` removed — the template never inserts an ampersand or splits it. Only when empty fall back to the first letter of each name |
| Poster title | `groom_name` / `& bride_name` |
| Poster meta | `Date` and `Day` (no scene number) |
| Poster facts | `save_date_label` + date, `cover_apology` + guest, event name/venue |
| Countdown | `countdownTarget(sessions, estimated_wedding_date)` + `gcalLink` (`Save to calendar`) on the poster |
| Prologue | `template_content.opening_kicker`, `template_content.welcome_message`, `quote_text`, `quote_source` |
| Cast | `*_full_name`, `*_parents`, `*_instagram`, `mempelai_kicker`, `parents_label` (default “With the blessing of”, the same text as the editor placeholder, so an untouched field never switches to “Son of”) |
| Chapter | `stories[]` (`title`, `description`, `image_url`) + `story_kicker` |
| Event | `sessions[]` (`name`, `date`, `time`, `venue`, `address`, `maps_url`) + `gcalLink` |
| Rundown | `rundown[]` + `rundown_*` |
| Strip | `gallery_photos[]` + `gallery_*` |
| Trailer | `video_url` → `videoSource()` (file, YouTube or Vimeo) |
| Gift | `gift_accounts[]`, `gift_address`, `gift_address_name`, `gift_signature` |
| Dress | `dresscode {title, description, colors[]}` + `dresscode_kicker` / `dresscode_note`; with no description the intro is generated from the selected palette names (“…Sand, Terracotta and Cocoa.”). The “Pengantar Dress Code” extra is not used |
| Wishes | `Wishes` + `template_content.wishes_*` |
| Credits | `closing_message`, `closing_see`, `inviting_families[]`, `inviting_kicker` |
| Music | `track_url` (`preload="metadata"` + `data-warm-audio`) |
| Dock | `guest_id` / `guest_slug` + `qr_code_book`, `anchor="bottom" bottom={80}` |

Every string is `template_content.<key> || "<default>"` — an empty extra renders the template copy shown in the editor placeholder, so a fresh invitation never opens with blank section intros. The 28 literals that are
not (countdown units, WCAG names, stub field labels, transient states, the vendor
credit, the legal suffix) are listed with reasons in
`scripts/template-copy-allowlist.json` under `templates["film-roll"].allow`.
`npm run audit:copy -- film-roll` reports clean.

## 9. Gates & toggles

| Gate | Effect |
|---|---|
| `feature_gates.story` / `story_visible` | chapter scene appears/disappears |
| `feature_gates.video` / `video_section_visible` | trailer scene and cover film; hiding the video in the editor falls back to the cover photo |
| `rundown_visible` | rundown scene |
| `dresscode_visible` | dress scene |
| `gift_section_visible` / `feature_gates.gift_address` | gift scene / address card |
| `feature_gates.inviting_families` / `inviting_families_visible` | honoured families on credits |
| `preview_mode` / `template_demo` | dock + guest-only copy suppressed |
| `guest_link_strict` | dock/personalisation require a slug |

## 10. Accessibility & state matrix

| State | Behaviour |
|---|---|
| Gate | `.fr-word` rolls once; Enter joins the deck; Escape closes the menu/lightbox |
| Deck | wheel, touch, drag, ArrowUp/ArrowDown/Space; ArrowLeft/Right slide the event stubs |
| Menu | burger toggles the full panel; the ticket toggles the scene list (desktop); both close on jump |
| Scrolling | a `.fr-scroll` element inside the active card keeps its own scroll until its edge is reached |
| Chapter | pointer/touch hold pauses auto-advance; a wheel hold resumes after 1.8 s |
| Lightbox | `role="dialog"`, labelled, Escape closes, arrows step |
| Wishes | labelled inputs, `aria-busy` on submit, `role="status"` feedback |
| Reduced motion | marquee, equaliser, fades and glyph transforms off |
| No JS | gate hidden, cards stack, all copy readable |

## 11. Verification

- `npx tsc --noEmit` clean.
- `npm run audit:copy -- film-roll` clean (28 allowlisted literals).
- Preview captured at 390×844 @2x and 1440×900 @2x: gate, poster, prologue, cast,
  bride (flip), chapter, event, rundown, strip, trailer, gift, dress, wishes,
  credits, plus menu and scene-list states.
- Staging standalone build + `/templates/film-roll/preview` smoke before deploy.

## 12. Known limits

- The reference's WebGL grain/parallax layer is not ported; `.no-gl` is always
  applied and the grain is a CSS overlay on the gate only.
- The gate plays a **file** video when `video_url` is a direct file; a YouTube or
  Vimeo link stays in the trailer (an embed as a full-screen gate background
  hijacks the tap and leaks autoplay).
- `html:has(.film-roll-root){overflow:hidden}` needs a `:has`-capable browser
  (all current evergreen browsers); older ones simply keep the page scrollbar.
