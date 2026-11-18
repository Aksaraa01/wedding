# REA — The Digital Yes "Fresco" → Aksaraa in-house template

Code `fresco`. Component `src/components/templates/fresco/` (`index.tsx`,
`fresco.css`, `Wishes.tsx`, `assets.ts`). Reference:
`https://fresco-template.thedigitalyes.com` (linked from
`thedigitalyes.com/demo/fresco`).

## 1. Verdict

An illustrated Mediterranean villa invitation: a real linen envelope — the bow
and the flap are a **film** — opens onto a painted coast; the names sit on the
paper, the countdown lives inside a blue-and-white tiled frame, "Our Story" is
prose on painted clouds, the celebration is an olive paper band behind an
ornamented frame, the programme is a heart-marked timeline with painted icons,
the invited families sit inside an olive arch with falling petals, and the
closing is a painted arch over the sea. Palette is olive on cream; type is Antic
Didone (display + body) with a calligraphic script and a handwritten accent.

The reference is a React/Vite SPA (Tailwind + Framer Motion, hashed assets).
It ships eleven blocks; the §0.5 minimum-section contract needs sixteen, so
Mempelai, Kalimat Pembuka, love story (it has one — prose), Turut Mengundang,
Gallery and the couple's film were rebuilt in the reference's own language
(olive paper, cenefa bands, arch frames, script headings). One reference block
outside the contract — "Where to Stay" — is **not shipped**; see §9.2.

## 2. What the reference actually is

- Single page, no router, no server data. Copy comes from an i18n object
  (`en` / `de`); the demo hard-codes the couple, the date, the venue, the
  hotels and the RSVP form.
- The gate is a **fixed full-screen overlay** (`z-50`) with `envelope-poster`
  under `envelope-video.mp4` (720×1280, **8.04 s**, 1.4 MB). Tapping plays the
  film once; the overlay fades out over the last ~1.6 s and the cover copy
  (which has been sitting at `opacity: 0`, `transition: 1800ms`) fades in
  underneath. Measured: play starts at tap, fade begins ≈ 6.4 s, released at
  ≈ 8.0 s.
- Behind the gate, the cover is a **3.04 s muted loop**
  (`hero-video.mp4`, 1080×1916, 13.3 Mbps / 5.1 MB) with the villa in the
  painting, plus names, invitation line, date block (month / day / weekday /
  year with two almond sprigs), venue and a chevron.
- Motion is Framer Motion `initial → whileInView` (`once: true`, ~0.9 s
  easeOut, 0.06–0.12 s steps) plus scroll-linked parallax on the clouds
  (±9 px), CSS keyframes for the falling petals, the breathing cenefa leaves
  and the beating heart markers.
- No `<audio>` element is mounted until the invitation is open; the reference
  plays `semo-fireflies.mp3` (6.1 MB) as background music.

## 3. Section inventory (measured) → what shipped

Reference order and heights at 390×844:

| Reference block | Height | Notes |
|---|---|---|
| Envelope gate + cover | 844 | fixed envelope film over the loop |
| Countdown | 747 | blue checkered frame, script numerals |
| Our Story | 948 | clouds behind the heading, 4 prose paragraphs, hand-signed |
| The Celebration | 811 | olive band, fountain over the top edge, framed event card |
| Villa | 218 | painted villa bleeding into the paper |
| The Day | 1047 | date strip + heart, alternating timeline, 8 icons |
| Cenefa strip | 147 | base band + five leaf overlays breathing on 1.7 s steps |
| Dress Code | 1526 | group painting, caption, then the welcome-soiree arch |
| Where to Stay | 1312 | two hotel cards — **omitted**, see §9.2 |
| Wedding Gift | 577 | wreath with the wish inside, "View bank details" |
| RSVP | 1857 | window, numbered form, five questions |
| Closing + footer | 845 | painted arch, names, date, vendor line |

Shipped order in `fresco` (14 rendered surfaces, 16-section contract):

```
sampul → countdown → pembuka → mempelai → story → acara →
rundown → dresscode → inviting → galeri → video → gift → wishes → closing
```

Mapping to §0.5:

| §0.5 # | Contract section | In `fresco` |
|---|---|---|
| 1 | Cover | `sampul` — envelope film, then the loop |
| 2 | Opening video | **absent** (documented omission, §9.1) |
| 3 | Welcome | the cover itself (names, invitation, date, venue) |
| 4 | Kalimat pembuka | `pembuka` — optional quote + couple's words |
| 5 | Mempelai | `mempelai` — two arch portraits, parents, Instagram |
| 6 | Love story | `story` — the reference's prose on clouds |
| 7 | Event | `acara` — olive band, one framed card per session |
| 8 | Countdown | `countdown` — the reference's frame |
| 9 | Turut mengundang | `inviting` — the reference's welcome arch, titled **With Honor** |
| 10 | Rundown | `rundown` — "The Day" timeline |
| 11 | Gallery | `galeri` — arch-topped marquee + lightbox |
| 12 | Video | `video` — the couple's film |
| 13 | Wedding gift | `gift` — the wreath |
| 14 | Dress code | `dresscode` — the group painting |
| 15 | Wishes | `wishes` — the RSVP surface, wishes only |
| 16 | Closing | `closing` — the painted arch + Aksaraa badge |

The reference's RSVP block is not a section (§0.5 rule 4): its window, heading,
rule and field styling were kept, the QR/attendance form was replaced by the
wishes form, and RSVP/QR lives in the shared `InvitationOverlay` dock.

The reference order puts the countdown directly under the cover and the
celebration before the programme. Both pairings are kept; the new sections are
threaded in where the contract asks for them (Pembuka after the countdown,
Mempelai before the story, Gallery/Film after the programme, gift before dress
code per §0.5).

## 4. Asset audit — all vendored, none hotlinked

`public/templates/fresco/` — **9.6 MB** total (was 33 MB unoptimised, plus the
2.4 MB demo score), exposed through `FRESCO_ASSETS` in `assets.ts`. Rasters were capped at 2× their largest
CSS display size and re-encoded to WebP (quality 86–92, alpha preserved).

| File | Size | Used for |
|---|---|---|
| `envelope-poster.webp` | 66 K | gate poster before the film |
| `envelope-video.mp4` | 1.4 M | the linen envelope opening (720×1280, 8.04 s) |
| `hero-video.mp4` | 570 K | the cover loop (re-encoded CRF 27 from 5.1 MB) |
| `hero-poster.webp` | 148 K | first paint of the cover |
| `sprig.webp` | 15 K | almond sprigs either side of the date |
| `countdown-frame.webp` | 253 K | blue checkered frame |
| `clouds.webp` | 143 K | painted clouds behind "Our Story" |
| `fountain.webp` | 420 K | fountain over the band's top edge |
| `villa.webp` | 430 K | villa between celebration and programme |
| `olive-paper.webp` | 10 K | tiled olive paper for the band |
| `event-frame.webp` | 51 K | the reference's ornamented frame (cropped) |
| `band-base.webp` + `band-1…5.webp` | 232 K + 62 K | cenefa strip + breathing leaves |
| `icon-*.webp` (8) | 25–57 K | programme icons |
| `dresscode-group.webp` | 665 K | the illustrated wedding party |
| `arch-mask.webp`, `olive-texture.webp`, `arch-frame.webp`, `arch-garland.webp`, `arch-bottom.webp` | 6–204 K | the welcome arch |
| `petal-1…3.webp` | 3–4 K | falling petals |
| `almond-flower.webp`, `white-flower.webp` | 41 K, 80 K | portrait ornaments |
| `gift-wreath.webp` | 93 K | gift wreath |
| `wishes-window.webp` | 129 K | wishes header |
| `portrait-frame-v3.webp` | 61 K | the welcome-arch plate turned into a **frame**: cropped just under the ornament (582×820, so no dead olive band below the photo), with a single smooth elliptical transparent interior (13.2–86.8 % × 18.8–94.1 %); the vine and leaves around it stay opaque |
| `closing-arch.webp` | 505 K | closing arch |
| `music.mp3` | 2.4 M | the reference's own score (demo default, 128 kbps) |
| `thumbnail.webp` | 88 K | 720×1280 gallery plate |

Not vendored: the reference's theme switcher (EN/DE) and its demo couple data.
The score **is** vendored, on the owner's explicit instruction (§9.12): the
reference file at 128 kbps, used only as the demo's default track.

## 5. Fonts

| Role | Reference | Shipped |
|---|---|---|
| Display + body | Antic Didone (Google) | `public/fonts/anticdidone-400.woff2` |
| Handwritten accent | Reenie Beanie (Google) | `public/fonts/reeniebeanie-400.woff2` |
| Script numerals / quote | **Parfumerie Script** (Adobe Typekit, licensed) | `public/fonts/fresco-script.woff2` — **Great Vibes**, the closest open-licence calligraphic script already used by Teatro |

The substitution is the only deliberate visual divergence: Great Vibes has the
same high-contrast, looped construction with a slightly larger x-height, so the
countdown numerals are set at 84/112 px instead of 88/128 px to keep the frame's
optical balance. All three faces are declared in `fresco.css` with
`font-display: swap`; Antic Didone and Reenie Beanie were added to
`scripts/fetch-fonts.js` so a font refresh reproduces them.

## 6. Design system (measured)

**Desktop is the phone layout, centred.** The reference has no separate desktop
composition — its `md:` rules only widen the same single column — so the
invitation ships as a 480 px sheet centred on a warm paper stage (`≥768 px`).
Every full-bleed painting (cover loop, fountain, villa, olive band, arch,
closing arch) is clipped to that column, the envelope gate is the same width,
and the music button sits 20 px inside the sheet's edge. Type sizes still take
the reference's `md` step (headings 46 px, cover names 40 px, countdown
112/50 px) so the sheet reads at desk distance.


| Token | Value |
|---|---|
| Paper / background | `hsl(40 60% 96%)` → `#fbf7ef` |
| Ink / olive | `hsl(64 32% 27%)` → `#585b2f` |
| Secondary / card | `hsl(40 50% 92%)` |
| Muted | `hsl(40 45% 89%)` |
| Border | `hsl(207 25% 82%)` |
| Rose (heart) | `hsl(349 58% 67%)` |
| Section heading | Antic Didone 34 px / 1.05 (46 px at ≥768 px) |
| Cover names | 34 px / 0.95 (40 px) |
| Countdown | script 84 px days, 38 px units; labels 16/15 px |
| Body | Antic Didone 15 px / 1.375 (25 px in Our Story) |
| Handwritten | Reenie Beanie 23 px (27 px) |
| Button | 11 px, `0.24em`, uppercase, 1 px olive border, square |
| Section rhythm | 72–116 px top, 48–131 px bottom; full-bleed art, centred text |
| Desktop sheet | 480 px column, `box-shadow: 0 0 90px rgba(64,66,32,.16)`, stage `hsl(40 32% 91%)` |

The reference overrides Tailwind's type scale for every heading
(`calc(10px + 1.5rem)` = 34 px, `md` = 46 px); those measured sizes are used
directly, not Tailwind's defaults.

## 7. Data mapping

| Surface | Source |
|---|---|
| Cover names | `groom_name` / `bride_name` |
| Cover invitation | `template_content.cover_kicker` (two lines) |
| Cover date block | `estimated_wedding_date` → month / day / weekday / year |
| Cover venue | `sessions[0].venue` |
| Gate salutation | fixed `Dear,` + `guest_name` |
| Countdown | `countdownTarget(sessions, estimated_wedding_date)`, `countdown_title`, `countdown_intro` |
| Kalimat pembuka | `quote_text` / `quote_source`, `opening_title`, `opening_description` |
| Mempelai | `*_full_name` (falls back to `*_name`), `*_parents`, `*_instagram`, `groom_photo_url` / `bride_photo_url`, `mempelai_kicker`, `profiles_intro`, `parents_label` |
| Story | `stories[]` → Antic Didone small-caps chapter title + description; `cover_photos[0]` (label *Foto Cerita Cinta*) → framed story photograph |
| Events | `sessions[]` → name, venue, address, date, time, `maps_url` |
| Turut mengundang | `inviting_families[]` (TEXT column, JSON.parse), `inviting_title` (default *With Honor*), `inviting_kicker` (optional, empty by default), `inviting_intro` |
| Rundown | `rundown[]` → `{time, description}`; icons cycle through the eight reference icons |
| Gallery | `gallery_photos[]` → two marquees (reverse above two photos) + lightbox |
| Film | `video_url` → `<video>` (mp4) or YouTube/Vimeo iframe; poster = first gallery photo |
| Gift | `gift_accounts[]` + `gift_address` / `gift_address_name`, `feature_gates.gift_address` |
| Dress code | `dresscode {title, description, colors[]}` + `dresscode_note` |
| Wishes | `Wishes.tsx` + `/api/wishes` |
| Closing | names + `estimated_wedding_date`, `display_name` (editor's *Hashtag Instagram Post*, derived from the names when it is not a hashtag), `closing_message` |
| Cover slots | one (`cover_slots: 1`, *Foto Cerita Cinta*) — the framed photograph at the head of Our Story; the cover itself is the design's own painting |

Every literal that is not data-driven is either a `template_content` key
registered in `src/lib/templateExtras.ts` for `fresco` (46 fields) or in
`scripts/template-copy-allowlist.json` under `templates.fresco.allow` (36
entries: salutations, countdown units, WCAG names, vendor credit, transient
states).

## 8. The gate: the film plays in full, then the cover takes over

1. The gate is a fixed, full-screen overlay (the 480 px column on desktop) with
   the envelope poster under `envelope-video.mp4`.
2. The film starts only after the tap (`preload` is warmed 1.2 s after paint),
   plays **to its last frame** — nothing is cut or skipped — and holds the
   envelope's fully open last frame.
3. On `ended` the overlay cross-fades out (1.6 s) while the cover copy fades in
   underneath (1.8 s). This is the reference's own hand-off; an earlier attempt
   that clipped the copy to the growing card opening was removed because the
   card's shape (a rotating sheet in 3D) never matched the printed card edge.
4. The envelope hint (Dear, …) is only mounted while the gate is idle; the body
   stays scroll-locked until `ended` (14 s cap, `error` releases at once,
   `prefers-reduced-motion` skips the film entirely).

## 9. Deliberate deviations (all recorded, none silent)

1. **Opening video (§0.5 #2) is not a separate section.** The cover is bound to
   the envelope film and the painted loop; a second autoplaying film at the top
   would fight both. The couple's `video_url` ships at #12 (same resolution as
   `iris` / `teatro`).
2. **"Where to Stay" is omitted — reported to the owner, not silently
   dropped.** *What it is:* two hotel cards ("Exclusive wedding guest rate",
   nightly price, address, parking, distance to the venue, "Book your stay").
   *Which column would feed it:* none — `wedding_profiles` has no hotels or
   accommodation field, and adding one means a JSON column plus editor + ops +
   publish wiring. *What is lost:* practical travel guidance for destination
   weddings. It is not in the 16-section contract, so it stays out until the
   owner approves the schema work. When it is approved, the cards belong inside
   the same olive band as the events (they already read as part of that surface).
3. **One cover slot, used by the story — not by the cover.** The cover itself is
   the reference's painting and loop, so the slot is repurposed: `cover_slots:
   1` labelled *Foto Cerita Cinta* feeds the framed photograph at the head of
   Our Story. Portraits live in Mempelai and photographs in the gallery.
4. **RSVP block → wishes.** The reference's attendance form (accept/decline,
   events, party size, children) is a second source of truth for attendance and
   would silently break QR check-in. Its window illustration, heading, diamond
   rule and field styling are kept; the form posts wishes. Counter, 409
   handling, pagination and the demo guard all follow the shared pattern.
5. **The gift wreath is static.** The reference ships a 62-frame animated WebP
   (2.76 MB). Every re-encode above 300 px stayed over 1.3 MB, which is a
   performance regression on this origin, so the first frame is vendored (93 K)
   and animated with a 9 s breathing loop (`scale` 1 → 1.012, `rotate` 0 →
   0.6°). The movement reads the same; the bytes do not.
6. **The hero loop is re-encoded** from 5.1 MB (13.3 Mbps) to 570 K (CRF 27) at
   the same 1080×1916 — visually identical on a phone and on a 1440 px desktop.
7. **Language switcher dropped.** The reference's EN/DE pill is reference
   chrome (the demo carries both language strings). Our invitations are written
   in the couple's own language.
8. **The story photograph is a cover slot, not a milestone photo.** `story_photo: false` keeps the editor's per-story image field hidden (Our Story is one prose column), and `cover_slots: 1` gives the couple a single framed photograph at the head of the section instead. The couple's stored milestone `image_url` values are kept but not rendered.
9. **The film autoplays, muted, in a rounded-square frame.** The reference has no film block; a "watch the film" surface that needs a tap reads as broken on a phone. The player mounts when the frame is 35 % on screen (`autoPlay muted playsInline controls` for uploads, YouTube/Vimeo with `autoplay=1&mute=1&controls=1`), so sound stays one tap away and nothing downloads for guests who never reach it.
10. **Every subtext ships with a default.** Mempelai intro, Turut Mengundang intro, rundown intro, gallery intro, film intro and the dress-code line all render their default copy when `template_content` is empty, so a real invitation never shows a bare heading where the design expects a sentence. The editor's EKSTRA fields override them.
11. **The reference's own score is vendored for the demo** (`public/templates/fresco/music.mp3`, 128 kbps, 2.4 MB) on the owner's explicit instruction — the same exception Teatro made for its reference track. A couple's `track_url` always wins; the file is only the demo's default.
12. **The band's ornamental frame is per card.** The reference's single frame is
   baked into its band plate, so it can only wrap one event. Each `.fr-event`
   now carries a cropped copy of that frame (`event-frame.webp`, stretched
   `100% 100%` exactly as the reference stretches its band), which keeps the
   design intact for one, two or three events without a frame cutting across a
   second card.
13. **Reduced motion / no scripting.** The film is skipped, petals/marquee/
    heartbeat/wreath stop, reveal targets are fully visible; with scripting
    disabled the gate is hidden and the cover copy is visible.
14. **A Save the Date button sits under the countdown** (the reference has no
    CTA there). It opens a Google Calendar event built from `sessions[0]` and is
    labelled by `template_content.save_date_label` (default *Save the Date*).

## 10. Per-section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | names, date, `sessions[0].venue`, gate envelope | always; gate until `ended` | 0 date ⇒ no date block; 0 venue ⇒ no venue line | `cover_kicker`, `open_button`, `cover_apology` | gate film 8 s played in full; 1.6 s gate fade + 1.8 s copy fade at the end; chevron bob 2.4 s |
| 2 | Countdown | `countdownTarget`, `sessions[0]` (calendar) | `dateObject` present | order is title → date → Save the Date → frame; date passed ⇒ `00` cells, never negative | `countdown_title`, `countdown_intro`, `save_date_label`, units (allowlisted) | reveal up 0.9 s, 0.06 s step; CTA opens a Google Calendar event |
| 3 | Pembuka | `quote_text`/`quote_source`, `opening_title`/`opening_description` | renders when either has content | quote only ⇒ no heading; body only ⇒ no quote; both ⇒ both | `quote_*`, `opening_title`, `opening_description` | cenefa fade, quote fade, body fade 0.06 |
| 4 | Mempelai | `*_full_name`, parents, IG, portraits | portraits when a photo exists | groom (**Mempelai Pertama**) first, then bride, one portrait per row; the portrait sits **behind a picture frame**: `portrait-frame-v3.webp` has a smooth elliptical transparent interior (no traced lace edge, no ornament pixels restored, so the boundary is one clean curve), and the card's aspect ratio is computed from the photograph on load (`Portrait`, `photoAR × 0.606/0.735`, clamped 0.5–0.8) so **the frame's height follows the photo** — the image fills the window uncropped, and a taller photo simply makes a taller frame; no photo ⇒ cream window | `mempelai_kicker`, `profiles_intro`, `parents_label` | up 0.9 s, 0.08 s step |
| 5 | Story | `stories[]`, `cover_photos[0]` | `feature_gates.story` **and** `story_visible !== false` | 0 ⇒ section gone; no photo ⇒ prose only; title empty ⇒ prose only; the plate follows the photograph's own aspect ratio | `love_story_title` | clouds parallax ±9 px, photo fade, paragraphs fade 0.06 steps |
| 6 | Events | `sessions[]` | always (completeness blocks without it) | 1 ⇒ one framed card; 3 ⇒ three frames; no map ⇒ no button | `events_title`, `events_kicker`, `events_note`, `maps_label` | head up, cards up 0.06 steps |
| 7 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ section + villa gone; icons cycle 8 | `rundown_title`, `rundown_kicker`, `rundown_intro` | rows up 0.05 steps, hearts beat 2.6 s |
| 8 | Dress code | `dresscode {title, description, colors[]}` | `dresscode_visible !== false` **and** data | colors only ⇒ swatches only; title only ⇒ no art caption | `dresscode_kicker`, `dresscode_note` | art fade, swatches up 0.05 steps |
| 9 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | 0 ⇒ section gone; long lists wrap in the arch | `inviting_kicker`, `inviting_title`, `inviting_intro` | petals 7 × 14–18 s, copy up 0.06 |
| 10 | Gallery | `gallery_photos[]` | needs data | 1 ⇒ single marquee, no reverse, no NaN; 0 ⇒ section gone; each plate takes the photo's own aspect ratio (never cropped) | `gallery_title`, `gallery_intro`, `gallery_quote` | marquee 34 s+, reverse above 2, lightbox Esc/←/→ |
| 11 | Film | `video_url` | `feature_gates.video` **and** `video_section_visible !== false` | mp4 ⇒ muted autoplay `<video>`; YouTube/Vimeo ⇒ muted autoplay iframe; no photo ⇒ poster-less frame | `video_kicker`, `video_title`, `video_intro` | player mounts at 35 % visibility, rounded-square frame |
| 12 | Gift | `gift_accounts[]`, `gift_address` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only ⇒ no address; address only ⇒ no accounts; neither ⇒ gone | `gift_intro_title`, `gift_intro_description`, `gift_wish`, `gift_button`, `copy_*` | wreath breathe 9 s, details up 0.05 steps |
| 13 | Wishes | `Wishes` + `/api/wishes` | always | empty feed ⇒ `wishes_empty`; >4 ⇒ pager | `wishes_*` | form static, wish rows alternate alignment |
| 14 | Closing | names, date, `display_name` (hashtag), `closing_message` | always | no message ⇒ arch + hashtag only; a stored value without `#` ⇒ hashtag derived from the couple | `closing_message` | none (static arch) |

The footer (Aksaraa badge + WhatsApp link) is structure, not a section.

## 11. State matrix (verified)

| State | Result |
|---|---|
| gate idle | envelope poster, hint plate with guest name, body scroll locked, film only metadata |
| gate tap | film plays, music starts, cover loop starts, hint fades |
| gate done | overlay hidden after 1.6 s, cover copy visible, scroll unlocked |
| no `estimated_wedding_date` | no countdown, no date block on the cover, no date on the closing |
| `opening_description` + no quote | Pembuka renders the heading + body only |
| quote + no `opening_description` | Pembuka renders the script dedication only |
| `stories = []` / `story_visible = false` | story section absent, no clouds left behind |
| no events | no olive band, no fountain, no villa; story keeps normal padding |
| `sessions.length === 1` | one framed card, frame proportions unchanged |
| `rundown = []` | no "The Day", no villa painting |
| `gallery_photos.length === 1` | single marquee, no reverse marquee, no NaN transform |
| gift: accounts only / address only / none | no empty block when a tab is empty; section gone when neither |
| video hidden but `video_url` set | no player, no poster left behind |
| every gate `false` | cover → countdown → pembuka → mempelai → (story hidden) → acara → dresscode → wishes → closing |
| `prefers-reduced-motion` | all copy visible, film skipped, petals/marquee/heartbeat/wreath stopped |
| scripting: none | gate hidden, cover copy and all reveals visible |
| 390×844 and 1440×900 | `scrollWidth === innerWidth` (390 / 1440), no horizontal overflow |

## 12. Registration

`supabase/migrations/20261117000002_fresco.sql` — code `fresco`, name `Fresco`,
`sort_order 42`, category `Floral`, `source_type 'inhouse'`, tier `Baru`,
`is_active true`, `no_photo false`, all packages eligible,
`preview_image_url /templates/fresco/thumbnail.webp`,
`demo_url /templates/fresco/preview`.

Also registered in `src/components/templates/index.ts` (`TEMPLATE_MAP`,
`TEMPLATE_CONFIGS` — 0 cover slots, portraits on, story photos off, quote on),
`src/components/templates/demoProps.ts` (`DEMO_PROPS_BY_CODE.fresco`),
`src/app/templates/[code]/preview/page.tsx` (`keepDemoIds`, background
`#fbf7ef`), `src/lib/templateExtras.ts` (46 `fresco` fields, including the new
`countdown_title`, `dresscode_title` and `gift_wish` keys), and
`scripts/template-copy-allowlist.json` (`templates.fresco.allow`).

**Content spec note:** the config entry in `TEMPLATE_CONFIGS` is what powers the
editor's EKSTRA accordion, the DRESS CODE / RUNDOWN / STORY / VIDEO blocks and
the single story-photo slot. If those controls ever disappear for this template,
check that the `fresco` entry still exists in `TEMPLATE_CONFIGS` (only the
`TEMPLATE_MAP` import is not enough) — a concurrent edit removed it once.

**Staging status:** the row **is** registered on staging
(`jclolnjkjhyjilvymagr`, id `995f07c6-33ba-4c81-98ec-efa30fa3ae6d`,
`sort_order 42`, `tier Baru`, `category Floral`) — inserted through the
service-role REST API, because `db push` would also carry another agent's
pending migration. The migration **version is therefore not recorded** in
`supabase_migrations.schema_migrations`; record it without executing before the
next push, or the (idempotent) file will replay and reset `sort_order` /
`preview_image_url` / `package_eligibility` to these values:

```bash
export SUPABASE_ACCESS_TOKEN=...
npx supabase link --project-ref jclolnjkjhyjilvymagr
npx supabase migration repair --status applied 20261117000002 --linked
```

**Production status:** the row is also registered
(`ylmfgorryxzpdckkebnr`, id `76bef99f-0580-480d-9b20-cbd885808c54`, same
`sort_order` / `tier` / `category`) through the service-role REST API, and the
template is deployed (BUILD_ID `mn8N3Gw0xTn2PU6lC6pXV`). The same repair step
applies there before the next `db push`:

```bash
npx supabase link --project-ref ylmfgorryxzpdckkebnr
npx supabase migration repair --status applied 20261117000002 --linked
```

Nothing was applied to production.

## 13. Verification log

- `npx tsc --noEmit` → clean.
- `npm run audit:copy -- fresco` → clean (36 allowlisted literals).
- `npm run build` → clean; standalone server (`node .next/standalone/server.js`
  on :3111 with `.env.local`) serves `/templates/fresco/preview` **200** and
  every vendored asset + font **200** (envelope film, hero loop, countdown
  frame, thumbnail, `fresco-script`, `anticdidone-400`, `reeniebeanie-400`).
- Preview DOM: `["sampul","countdown","pembuka","mempelai","story","acara",
  "rundown","dresscode","inviting","galeri","video","gift","wishes","closing"]`,
  no console errors, `body.fr-locked` before the gate, no RSVP/QR dock in
  preview (`template_demo` guard held), `scrollWidth === innerWidth` at 390 and
  1440.
- Visual QA against the live reference at 390×844 and 1440×900, section by
  section (gate, cover, countdown, story, celebration card, villa seam, day
  timeline, cenefa strip, dress code, arch, gift, wishes, closing). Reference
  section heights and ours match within a few pixels where the section is
  shared (countdown, villa, cenefa strip) and differ only where the contract
  adds or removes surfaces.
- Desktop sheet (`≥768 px`) verified at 1440×900: the 480 px column, its
  shadow, the gate constrained to the same width, the cover copy clear of the
  villa painting, the band heading below the fountain, the arch content fully
  inside its frame, the music button inside the sheet edge, and
  `scrollWidth === innerWidth` (1440).
- Thumbnail captured from the running preview at 390×844 (2×) and exported
  720×1280 WebP (88 KB).
- Gate timing sampled on the staging build: film `currentTime` reaches 7.00 s
  with the gate at opacity 1 and the copy at 0; at 8.04 s (`ended`) the gate is
  fading (0.77) and the copy rising (0.12); at 11 s the gate is gone and the
  copy is 1. Nothing is cut before the last frame.
- Real invitation (`/w/de-del` on staging): groom renders first, story slot
  photograph present, uppercase story chapters, dress-code line visible without
  any `template_content` value, Save the Date button opens the calendar event,
  no console errors.
- Mempelai frame checked at 390 and 1440: the portrait is clipped by the plate's
  own alpha window (no spill over the vine), and the gift cards are inset from
  the page edges (318 px inside a 390 px viewport) and centred.
