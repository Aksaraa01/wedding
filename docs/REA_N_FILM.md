# REA — Our Wedding Link "N Film" → Aksaraa in-house template

Reference: <https://our-wedding.link/design/n-film> · analysed 2026-11-01
Template code: `n-film` · Source type: `inhouse`
**Status: ported** — component, CSS, fonts, registration and demo props are in
the tree (§17). The `web_templates` row still has to be applied to local /
staging / production before the public gallery can list it.

Method: rendered the Nuxt SPA in a real browser, resolved the SSR payload
(`window.__NUXT__`) to read the preset's own data model, dumped the rendered DOM
(114 KB) and all 4 323 computed CSS rules, then measured every block's box,
typography and paint. Nothing below is eyeballed from a screenshot — every
number is a computed style or a `getBoundingClientRect()`.

Analysis artefacts (throwaway, not committed):
`$TMP/opencode/nfilm/{design.html, nuxt.json, dom.html, outline.txt, all.css}`.

---

## 1. Verdict

| Question | Answer |
|---|---|
| What is it | **Not a hand-built site.** It is Our Wedding Link's *dynamic builder* (`layout_dynamic`) running a **preset skin** called "N Film": a Netflix/"now streaming" film-poster invitation |
| Data source | Fully public. The whole invitation is in the SSR payload as JSON — no auth, no signed URLs |
| Assets available? | **Yes** — 20 content photos, 3 full-bleed film stills, 1 cover film (1271×720, 5.15 s, **174 KB**), 1 track (4.27 MB). `cdn-uploads.owlink.id`, no referer lock |
| Fonts available? | **Yes, and it's the easy case** — `Anton` (display) and `Archivo` (body) are both **Google Fonts / OFL**. Unlike Lace and Embroidered Garden there is no Adobe kit and therefore no substitution |
| Schema changes needed | **None.** Every section maps onto existing `wedding_profiles` columns; only `web_templates` + `template_content` extras are new |
| Biggest risk | **Copy and idiom, not code.** The design quotes Netflix's UI (profile picker, "Who's Watching?", "#1", Top-10 badge). Section 11 proposes the rename |
| Verdict | **Portable as-is in structure**; ship it as `n-film` with the streaming-idiom copy reworded and the platform chrome dropped |

---

## 2. What the reference actually is

Two layers, and it matters which is which:

| Layer | What it is | Do we port it? |
|---|---|---|
| **The renderer** — `layout_dynamic` | A block/widget engine. Every section is a `widget-block` (`text`, `image`, `shape`, `button`, `link`, `date`, `video`, `guest_name`, `open_button`, `rsvp`, `gift`, `wishes`, `grid`, `group`, `canvas`) absolutely positioned on a 390 px canvas, animated with animate.css + WOW | **No.** We re-implement in React like every other in-house template |
| **The preset skin** — `nfs-*` | ~30 CSS rules that restyle those widgets into the film/streaming look, plus the widget positions and theme colours | **Yes** — this is the design |

Preset identity from the payload:

```js
state.pratinjauDesain.peta["n-film"] = {
  slug: "n-film", nama: "N Film", paket: "Eksklusif",
  preset_id: "6a4fe68e96c1f8cbb7d57606",   // TemplateSetting.version D2tG3I93C3i8IMKYbpaC
  sub_id:    "6aa0552a25539b1a44b7bf45",
  thumbnail: "e81b60f0-d4ba-11f1-bf0e-2396c516d73e.jpg"
}
invitation_data.TemplateSetting = {
  template: "layout_dynamic", mode: "normal",
  font_title: "malatan", font_content: "default",
  background_color: "#faf6f4",   // ← never used; the skin repaints to #0B0B0B
  text_color: "#ff1900", title_color: "#a05a4f", secondary_color: "#005d17"
}
```

The theme row's pastel variables are **dead** — `main-page { background-color:
#0B0B0B }` and the `nfs-*` rules override everything. Do not read the palette
out of `TemplateSetting`; read it out of the computed styles (§5).

### There is no cover gate

`state.invitation.is_open === false`, there is **no `.dl-cover` element in the
DOM**, and `.dl-col__content` starts at y = 844 — i.e. exactly one viewport
below the cover. The "Who's Watching?" screen is **the first scroll section, not
a blocking gate**. The three CTAs are plain anchors:

| CTA | Target |
|---|---|
| `Start Watching` (cover) | `#` — scroll continues |
| `Play` | `#Galeri` |
| `More Info` | `#Time&Place` |

Body scroll is never locked. **This is a design decision we must make
explicitly**: every other Aksaraa template gates the invitation behind a tap
(playbook §5). Port options are in §11.

---

## 3. Section inventory (measured, 390 px column)

Document height **8 180 px**. Ten content blocks, in order:

| # | Block | Skin class | y | h | Background | What it holds |
|---|---|---|---|---|---|---|
| 0 | Cover — "Who's Watching?" | `.nfs-sampul` | 0 | 844 | `#0B0B0B` + full-bleed cover film | hashtag kicker, title, 2 profile tiles, 2 names, divider, "To our beloved", apology line, guest name, `Start Watching` |
| 1 | Hero — "Today's Couple" | `.nfs-scrim` | 844 | 824 | film still `b68c6ad0` + `nfs-scrim` double mask + `nfs-kaki` bottom mask (504 px) | `#1` flag, eyebrow, 46 px name lockup, streaming meta line, verse (3-line clamp), source, countdown label + clock, `Play` / `More Info` |
| 2 | Main Cast (couple) | `wb-ratiobox` | 1 667 | 1 040 | `#0B0B0B` | wide couple still (346×300), intro paragraph, "MAIN CAST", two 166×216 portraits, names, parents, 2 Instagram pills |
| 3 | Time & Place | `.nfs-acara` | 2 706 | 378 | `#0B0B0B` | "TIME & PLACE" + one event plate (title / date / time / address / `View Location`). The demo's second plate (Reception) is `display:none` — the builder only shows one |
| 4 | Our Moment (gallery) | `.nfs-galeri-seksi` | 3 083 | 1 424 | `#0B0B0B` | "OUR MOMENT", "click to preview", justified grid 2×5 |
| 5 | Episodes (love story) | — | 4 507 | 812 | `#0B0B0B` | "EPISODES", "LOVE STORY · SEASON 1", N episode rows (16:9 thumb + play badge + numbered title + synopsis) |
| 6 | RSVP & Wishes | `.nfs-form` | 5 318 | 1 222 | `#0B0B0B` | RSVP form, wishes feed, wish form |
| 7 | Wedding Gift | `.nfs-hadiah` | 6 539 | 735 | still `b7f4fb80` at 27 % black + `overlay_gradient` | "WEDDING GIFT", copy, tabs `QRIS / Direct Transfer / Send Gift` |
| 8 | Closing | `.nfs-scrim` | 7 273 | 600 | still `b80b42a0` + masks | "WITH JOYFUL HEARTS", names, blessings-of-families line |
| 9 | Platform credit | — | 7 872 | 150 | `#0B0B0B` | "DIGITAL INVITATION BY / OWLINK.ID" — **drop** |
| 10 | Platform footer | `.dl-brand` | 8 022 | 158 | `#0B0B0B` | owl mark + Instagram + "powered by OUR WEDDING LINK" — **drop** |

Sections 2–6 and 8 all sit on flat `#0B0B0B`; only the hero, gift and closing
carry photography. That is the design's whole rhythm: **black pages, poster
type, and three film stills**.

---

## 4. Layout mechanics

### 4.1 It is a phone column with black rails

```css
.main-page      { background: #0B0B0B; }
.dl-side        { position: fixed; inset-block: 0; background: #050505; width: calc(50vw - 195px); }
.dl-col         { width: 390px; margin: 0 auto; background: #0B0B0B; }
```

At the 800 px desktop demo viewport the rails are 205 px each. There is **no
desktop re-layout** — desktop = the same 390 px column, centred, with darker
rails. Compare Lace (§8j) and Embroidered Garden, which re-set the art as a
printed card above `min-aspect-ratio: 4/5`. For us the honest adaptation is the
same one-line idea: keep one column and let the gutters carry a blurred copy of
the hero still (or just `#050505`) — do **not** stretch a 390 px poster layout
to 1440 px.

### 4.2 The content grid is 346 px inside 390 px

Every section insets its children by **22 px** a side, except three blocks that
run 30 px (Time & Place, wish cards, gift form) and the gallery/grid which is
edge-to-edge. Two-column splits are `166 + 20 + 166` and `150 + 20 + 150`.

### 4.3 Full-bleed stills are masked, not overlaid

The hero and closing use a **masked colour block**, not a `rgba()` gradient:

```css
.nfs-scrim::after {                       /* darkens the top 16 % */
  content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
  background-color: currentcolor;         /* = #0B0B0B on the section */
  mask-image:
    linear-gradient(#000 0%, rgba(0,0,0,.55) 6%, transparent 16%),
    linear-gradient(to top, #000 0%, rgba(0,0,0,.9) 26%, rgba(0,0,0,.3) 58%, rgba(0,0,0,.12) 100%);
}
.nfs-kaki {                               /* the "footer" leg of the scrim */
  background-color: currentcolor;
  mask-image: linear-gradient(transparent 0%, rgba(0,0,0,.82) 38%, #000 100%);
}
```

`nfs-kaki` is a 504 px block pinned to the bottom of the hero; it is what makes
the still fade into the countdown instead of ending on a hard edge. Port this
pair **verbatim** (scoped under our root) — a normal `linear-gradient` overlay
bands visibly over a 0.88-alpha white text stack.

### 4.4 Motion

animate.css classes driven by WOW.js on scroll: `fadeIn`, `fadeInUp`,
`fadeInLeft`, `fadeInRight`, `zoomIn`. Everything on the cover animates in
(`fadeIn`, `fadeInUp`, `zoomIn`) and every content block reveals once. We
re-implement with `IntersectionObserver` per playbook §1 (`data-aos` →
`is-aos-visible`); no new dependency.

---

## 5. Palette + type (computed, not sampled)

| Token | Value | Where |
|---|---|---|
| `--nf-black` | `#0B0B0B` | page + every flat section, `main-page` |
| `--nf-rail` | `#050505` | desktop gutters |
| `--nf-paper` | `#F5F5F1` | all primary text, "Play" button fill |
| `--nf-muted` | `#8C8C8C` | eyebrows, meta lines, body copy, countdown labels |
| `--nf-body` | `rgba(245,245,241,.88)` | the hero verse (`.nfs-deskripsi`) |
| `--nf-red` | `#E50914` | hashtag kicker, "View Location", wish counter, wish submit |
| `--nf-card` | `#141414` | wish cards, gift cards, rundown items |
| `--nf-hair` | `rgba(245,245,241,.14)` | countdown column dividers |
| `--nf-hair-` | `rgba(245,245,241,.16)` | form field borders |
| `--nf-btn2` | `rgba(140,140,140,.38)` | "More Info" fill |

`#E50914` is Netflix's brand red. Colour alone is not protectable, but §11
still recommends the copy rename so the whole skin reads as *cinema*, which is
what an Indonesian couple is actually buying — not a Netflix knock-off.

### Type scale (measured)

| Role | Font | Size | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Hashtag kicker | Anton | 10 | 400 | 5 px | — |
| Cover title ("Who's Watching?") | Anton | 27 | 400 | — | — |
| Profile name | Archivo | 13 | 400 | 1.4 px | upper |
| Cover small caps ("To our beloved") | Archivo | 10 | 400 | 2.4 px | upper |
| Cover apology | Archivo | 7 | 400 | 2.4 px | upper |
| Hero flag `#1` | Anton | 15 | 400 | — | — |
| Hero eyebrow | Archivo | 12 | 600 | 2.6 px | upper |
| **Hero names** | Anton | **46** | 400 | — | upper |
| Hero meta | Archivo | 11.5 | 400 | 0.6 px | — |
| Hero verse | Archivo | 13 | 400 | — | — (3-line clamp) |
| Countdown number | Anton | 30 | 400 | 0.02 em | — |
| Countdown label | Archivo | 9 | 400 | 0.22 em | upper |
| Button | Archivo | 11 | 600 | 1.54 px | upper |
| Section title (Main Cast / Time & Place / Our Moment / Gift) | Anton | 24–26 | 400 | 0.4–0.5 px | upper |
| "RSVP" | Anton | 40 | 400 | 0.5 px | upper |
| Couple name (cast) | Anton | 18 | 400 | — | — |
| Event title | Anton | 20 | 700 | — | — |
| Episode title | Archivo | 15 | 600 | — | — |
| Body / synopsis | Archivo | 12–12.5 | 400 | — | — |
| Closing names | Anton | 30 | 400 | — | upper |

**Two fonts total.** `Anton` carries every display role (it is the poster face —
condensed, all-caps, no italic). `Archivo` carries every functional role at
7–16 px with heavy tracking. The pair is the design; do not substitute a serif.

Both are **OFL on Google Fonts**, so: add `Anton:400` and
`Archivo:400,600,700` to `scripts/fetch-fonts.js` `FAMILIES`, run
`node scripts/fetch-fonts.js && node scripts/gen-font-css.js`, and declare them
in `src/app/fonts.css` like every other family. No `next/font` (playbook §9
"Fonts 404" row).

---

## 6. The streaming-idiom inventory

This is what actually makes the design feel like a film. Catalogued so we can
decide, one by one, what ships:

| Idiom | Reference usage | Ship? |
|---|---|---|
| Profile picker ("Who's Watching?") | 2 rounded tiles = the couple, initials below | **Yes**, renamed (§11) |
| `#1` flag + "Top 10"-shaped badge | hero + couple section | **Yes** — it reads as "the couple's own film" |
| Meta line `100% Likes · 2026 · 1 h 11 m · Romance` | under the couple name | **Yes**, as a couple-authored extra (it is the joke that lands) |
| `Play` / `More Info` pair | hero CTAs, white + grey fills | **Yes** |
| Episode list with numbered titles | love story (`1. The First Encounter`) | **Yes** |
| Play badge on 16:9 thumbs | episode thumbs (32 px ring + triangle) | **Yes** |
| "Season 1" | love-story label | **Yes** |
| `Start Watching` | cover CTA | **Yes**, renamed |
| Hashtag kicker | `#DamarNaylaForever` | **Yes** — auto-derive `#GroomBrideForever` |
| Netflix red | accent | **Yes**, keep `#E50914` |
| Netflix wordmark / logo | none rendered | n/a — never add one |
| Platform credit + owl/IG footer | 2 blocks, 308 px | **Drop** (Aksaraa badge instead, playbook §1) |
| Vinyl/builder chrome, reCAPTCHA, GTM/Hotjar/FB/TikTok pixels | in the page | **Drop** |

---

## 7. Component anatomy (the skin CSS worth porting)

Port these rules, scoped under `.nfs-root`, and **rewrite the selectors to our
own class names** — the reference's `nfs-*` are load-bearing only inside its
builder:

```css
/* film grade on every user photo */
.nfs-foto img        { filter: contrast(1.06) saturate(.88) brightness(.95); }
.nfs-galeri img      { border-radius: 4px; filter: contrast(1.06) saturate(.88) brightness(.95); }

/* the countdown is a bar of hairline-separated cells, separators hidden */
.nfs-cd .db-cd       { border-left: 1px solid rgba(245,245,241,.14); padding: 0 14px; }
.nfs-cd .db-cd:first-of-type { border-left: 0; padding-left: 0; }
.nfs-cd .db-sep      { color: transparent !important; font-size: 0 !important; }

/* buttons: shared shape, two fills */
.btn-widget          { text-transform: uppercase; letter-spacing: .14em; font-family: Archivo;
                       font-size: 11px; font-weight: 600; border-radius: 4px; padding: 12px 26px; box-shadow: none; }

/* forms are translucent, never white */
.nfs-form input, .nfs-form textarea, .nfs-form select {
  background: rgba(245,245,241,.05) !important;
  border: 1px solid rgba(245,245,241,.16) !important;
  border-radius: 4px !important; color: #F5F5F1 !important; font-family: Archivo !important;
}
.nfs-form ::placeholder { color: rgba(140,140,140,.7) !important; }

/* episode list is a CSS counter, not stored numbering */
.nfs-ep-wrap         { counter-reset: nfsEp 0; }
.nfs-ep-item         { counter-increment: nfsEp 1; }
.nfs-ep-item + .nfs-ep-item { margin-top: 26px; }
.nfs-ep-judul p::before { content: counter(nfsEp) ". "; }

/* 16:9 thumb gets a ringed play badge as a pseudo-element */
.nfs-ep-thumb::after {
  content:""; position:absolute; left:50%; top:50%; width:32px; height:32px;
  margin:-16px 0 0 -16px; border-radius:50%;
  border:1.5px solid rgba(255,255,255,.92);
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='white' d='M5 3.5v9l7.5-4.5z'/></svg>")
              55% 50% / 13px auto no-repeat rgba(0,0,0,.38);
}

/* long synopsis is clamped, so the episode rhythm never breaks */
.nfs-deskripsi p     { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }

/* instagram pill can never push the 166 px column */
.nfs-ig, .nfs-ig *   { min-width:0; max-width:100%; overflow:hidden; text-overflow:ellipsis;
                       white-space:nowrap; letter-spacing:.04em !important; }
```

Two things the reference does **not** have and we must add ourselves, because
Aksaraa couples expect them: a **lightbox** for the gallery ("click to preview"
is a promise the reference keeps via `#Galeri` navigation only) and the
**InvitationOverlay** RSVP/QR dock.

---

## 8. Asset audit

All files `200`, `image/jpeg|mp4|mpeg`, no referer lock, no signed URLs.

| Group | Files | Bytes | Dims |
|---|---|---|---|
| Cover film | `86f9bdc0-…mp4` | **174 080** | 1271×720, **5.15 s** |
| Hero still | `b68c6ad0-…jpg` | 88 709 | 1600 w |
| Gift still | `b7f4fb80-…jpg` | 72 637 | 1600 w |
| Closing still | `b80b42a0-…jpg` | 84 965 | 1600 w |
| Cover profiles | `b818b020`, `b8258160` | ~39 KB ea | 600×804 |
| Couple wide still | `b800bb50` | — | 800×800 |
| Cast portraits | `b6a486b0`, `b6b74b60` | — | 600×804 |
| Gallery | 10 × `b7185720 … b7e8ed90` | — | 800×1071 (×8), 800×800 (×2) |
| Episode thumbs | 4 × `b6cdb990 … b7036f90` | ~43 KB ea | 640×357 |
| Track | `33363aa0-…mp3` | **4 267 290** | `<audio loop preload="auto">` |

Total media ≈ **5.2 MB**, of which the music is 4.27 MB — the same ratio that
made `adat-melayu` and `lace` work, and the reason the playbook insists on
**music preloaded on the cover, film streamed on open** (playbook §5).

The cover film at **174 KB / 5.15 s** is unusually light; if we vendor it we
should re-encode to ~1280×720 CRF 26 and keep it under 400 KB. If a couple has
no `video_url`, this clip is a good fallback backdrop — **but** it is the
platform's own footage of its demo couple. Do not ship it; ship a poster still
and let `video_url` fill the slot (§11).

**Never vendor:** `e81b60f0-…jpg` (the preset thumbnail — replace with our own
`thumbnail.webp` crop), the demo couple's 20 photos, their names, dates,
venues, verses, or the track.

---

## 9. Copy inventory (what the reference says)

Structure labels (safe to keep — they are the layout, not the couple):

`Who's Watching?` · `To our beloved` · `Today's Couple` · `Main Cast` ·
`Time & Place` · `View Location` · `Our Moment` · `click to preview` ·
`Episodes` · `Love Story · Season 1` · `RSVP` · `& Wishes` ·
`Reservation (RSVP)` · `Your Response` · `Yes, I'll be there` ·
`Sorry, I can't` · `Wedding Gift` · `With joyful hearts` ·
`With the blessings of their families`

Data-driven (must come from the couple):

`#DamarNaylaForever` · `DAMAR` / `NAYLA` · `Damar & Nayla` ·
`100% Likes · 2026 · 1 h 11 m · Romance` · the verse + `Matthew 19:6` ·
event names/dates/times/addresses · the 4 episode titles + synopses ·
the intro paragraph · the gift paragraph · the closing paragraph

Placeholders observed (for our own copy parity):

`Your full name` · `Whatsapp number ex: 6289666613131` · `Address/Company` ·
`Your Positions` · `ex: congrats for this event` · `Your address` ·
`Your email address` · `Please input amount of transaction` · `Your message`

---

## 10. Mapping to Aksaraa

| Reference block | Aksaraa source | Notes |
|---|---|---|
| Cover hashtag `#DamarNaylaForever` | **derived** `#${groom}${bride}Forever` | + `template_content.cover_kicker` override |
| Cover title | `template_content.cover_title` (new) | see §11 rename |
| Profile tiles (2) | `groom_photo_url`, `bride_photo_url` | `groom_photo`/`bride_photo` = `"single"` |
| Profile names | `groom_name`, `bride_name` (upper) | |
| "To our beloved" | layout label | |
| Apology line | `template_content.cover_apology` | key already exists |
| Guest name | `guest_name` | lockdown rules per playbook §6 |
| Hero still | `cover_photos[1]` (fallback `gallery_photos[0]`) | **Kutipan slot** |
| `#1` flag | layout label + `template_content.hero_badge` | |
| Streaming meta line | `template_content.hero_meta` (new) | placeholder `100% Likes · 2026 · 1 h 11 m · Romance` |
| Verse + source | `quote_text`, `quote_source` | gate `sections.quote` |
| Countdown | `estimated_wedding_date` | gate `sections.countdown` |
| `Play` | opens `video_url` modal | gate `feature_gates.video` **and** `video_section_visible` |
| `More Info` | scroll to Time & Place | |
| Couple wide still | `cover_photos[1]` fallback | or `template_content`-free: reuse hero still |
| Intro paragraph | `opening_description` | gate `sections.opening_description` |
| Cast portraits + names | `groom_full_name`, `bride_full_name`, photos | |
| Parents | `groom_parents`, `bride_parents` | |
| Instagram pills | `groom_instagram`, `bride_instagram` | hide pill when empty (already the reference behaviour) |
| Time & Place | `sessions[]` (`name`,`date`,`time`,`venue`,`address`,`maps_url`) | one group per row |
| Our Moment grid | `gallery_photos[]` | 2-col justified, 10 per page in the reference |
| Episodes | `stories[]` (`title`,`description`,`image_url`) | `story_photo` = true |
| RSVP form | — | **Not a section.** RSVP is the shared `InvitationOverlay` dock (playbook §0.5 rule 4, §6) — attendance, pax and the guest QR all live there. The reference's form is dropped; only its wishes half is ported |
| Wishes feed + form | `/api/wishes` via a `Wishes.tsx` section | pattern: `nihara-mist/Wishes.tsx` |
| Wedding Gift tabs | `gift_accounts[]` (`provider_name`,`account_number`,`account_name`,`type`) + `gift_address` / `gift_address_name` | **QRIS tab has no source** — see §11 |
| Closing paragraph | `template_content.closing_message` | |
| Closing names | `couple_initials` / names | |
| Blessings line | `inviting_families[]` | gate `feature_gates.inviting_families` + `inviting_families_visible` |
| Closing still | `cover_photos[2]` (fallback gallery) | **Closing slot** |
| Platform credit + footer | — | replaced by the Aksaraa badge |

**No new columns.** Everything is `wedding_profiles` as it stands, plus
`template_content` keys.

---

## 10.5 Minimum-section gap analysis (playbook §0.5)

The playbook mandates **16 sections**. The reference ships 9. Four are missing
outright and three exist only as embedded fragments:

| # | Minimum section | In the reference? | Action |
|---|---|---|---|
| 1 | Cover | ✅ the profile picker | keep |
| 2 | Opening video | ✅ muted looping film behind the cover | keep — feed it `video_url` |
| 3 | Welcome | ❌ | **ADD** — the hero masthead becomes this surface |
| 4 | Kalimat pembuka | ⚠️ one paragraph buried inside Main Cast | **PROMOTE** — becomes the `SYNOPSIS` block |
| 5 | Mempelai | ✅ `MAIN CAST`, 2 portraits + parents + IG | keep — already carries no "Groom"/"Bride" labels |
| 6 | Love story | ✅ `EPISODES` — numbered rows, 16:9 thumbs, synopses | keep — **required**, not optional (playbook §0.5 rule 5) |
| 7 | Event | ✅ `TIME & PLACE` | keep |
| 8 | Countdown | ⚠️ embedded inside the hero masthead | **PROMOTE** to its own block (see order below) |
| 9 | Turut mengundang | ⚠️ a static line, `WITH THE BLESSINGS OF THEIR FAMILIES` | **CONVERT** to the `inviting_families[]` ledger |
| 10 | Rundown | ❌ | **ADD** — the preset's own skin already ships `.nfs-rundown` CSS unused |
| 11 | Gallery | ✅ `OUR MOMENT` | keep |
| 12 | Video | ❌ — `Play` just scrolls to the gallery | **ADD** — a `THE FILM` plate |
| 13 | Wedding gift | ✅ three tabs | keep two tabs (§11.3) |
| 14 | Dress code | ❌ | **ADD** — `COSTUME` swatches |
| 15 | Wishes | ✅ feed + form | keep — drop the RSVP half |
| 16 | Closing | ✅ | keep |

### Closing the gaps, drawn in this template's own language

Every addition uses the measured scale (§5): Anton for display, Archivo
7–13 px with heavy tracking for everything functional, `#0B0B0B` ground,
`#F5F5F1` / `#8C8C8C` text, `#E50914` accent, 22 px content inset, 4 px radii,
`1px solid rgba(245,245,241,.14)` hairlines.

**3 — Welcome.** The reference's masthead already is one: `#1` flag,
`TODAY'S COUPLE`, the 46 px name lockup, the streaming meta line, and the
`Play` / `More Info` pair. Ship it as the welcome surface, minus the countdown
(which moves to §8). No new visual invention needed.

**4 — Kalimat pembuka / `SYNOPSIS`.** Label `SYNOPSIS` (Archivo 10 / 2.4 px
upper / `#8C8C8C`); `opening_title` in Anton 26 upper; `opening_description` in
Archivo 13 / 1.75 at `rgba(245,245,241,.88)`, 346 px measure, with a 24 px
`#E50914` rule on the left. The reference's "logline" voice, so it does not read
like a bolted-on section.

**9 — Turut mengundang.** The closing already says `WITH THE BLESSINGS OF THEIR
FAMILIES` as dead text — replace that text node with the `inviting_families[]`
ledger: same label, then one centered Archivo 12.5 / 1.9 line per family,
divided by `rgba(245,245,241,.14)` hairlines. (Or move the block to the
canonical position between countdown and rundown and keep the closing line
static — either reads correctly; the ledger position below is what the order
table assumes.)

**10 — Rundown / `RUN OF SHOW`.** The preset ships the CSS for this and never
uses it, so there is nothing to invent:

```css
.nfs-rundown .rd-item  { background:#141414; border:1px solid rgba(245,245,241,.1);
                         border-radius:4px; padding:18px 16px; }
.nfs-rundown .rd-when  { font: Archivo 11px; letter-spacing:.1em; text-transform:uppercase; color:#E50914; }
.nfs-rundown .rd-where { color:#8C8C8C; font-size:12px; line-height:1.7; }
```

A card list, not a timeline — the only place in this design with a raised
surface, which is exactly what makes it read as a "chapter list".

**12 — Video / `THE FILM`.** A 346 px-wide 16:9 plate, radius 4, wearing the
film grade (`contrast(1.06) saturate(.88) brightness(.95)`) and **the reference's
own play badge** — the 32 px ringed circle from `.nfs-ep-thumb::after` (§7). No
new affordance: the design already taught the guest what that badge means.
Honours `hasVideo` (gate + toggle), opens the existing modal.

**14 — Dress code / `COSTUME`.** Label `COSTUME`; `dresscode.title` in Anton 24
upper; `description` in Archivo 12.5 `#8C8C8C`; swatches as 44 px circles with a
`1px solid rgba(245,245,241,.16)` ring and the name below in Archivo 9 / 0.22 em
upper `#8C8C8C`. No card, no fill — the countdown's hairline idiom already
established how this design treats a row of small labelled units.

### Proposed section order (recorded for the next agent)

```
cover → opening video → welcome (masthead) → synopsis → mempelai
      → love story (episodes) → event → countdown → turut mengundang
      → rundown → gallery → video → gift → dresscode → wishes → closing
```

Three deliberate deviations from the reference, all required by the contract:
the **countdown leaves the masthead** and **Turut Mengundang moves before the
gallery** (minimum sections must exist in order), and the **love story moves up
next to the mempelai** (the reference puts Episodes after the gallery; the
contract's order is mempelai → love story). The reference's own pairing of
adjacent blocks is otherwise preserved.

---

## 10.6 Sections outside the minimum — decision

Per playbook §0.5 rule 2 these were reported before shipping. **Decision
(2026-11-01): both ship.** They are now in the content spec
(`quote: true`) and in the component.

| Candidate | What it is | Data | If dropped | Recommendation |
|---|---|---|---|---|
| **A. The masthead** (`#1` flag, 46 px name lockup, `100% Likes · 2026 · 1 h 11 m · Romance`, `Play` / `More Info`) | The design's identity. Not a named minimum section — it is the *welcome* surface | `groom_name`/`bride_name`, `template_content.hero_meta` | The template loses the poster entirely and has nowhere to put `Play`/`More Info`. Effectively not this design any more | **Keep** (as welcome, §10.5 #3) |
| **B. The verse** (`quote_text` + `quote_source`, "Matthew 19:6") | Rendered under the meta line, 3-line clamped | `quote_text`, `quote_source` | Nothing else changes; the block is simply absent. 24 of 27 templates ship it, so couples expect it | **Keep** — it renders only when filled |

Episodes is **no longer on this list**: love story is a minimum section
(playbook §0.5 rule 5), it ships in 26 of 27 templates, and `feature_gates.story`
is included in every package. `story: true` and `story_photo: true`.

Flipping either off later is a one-line change in
`TEMPLATE_CONFIGS.content.sections` (`quote: false`, or dropping the masthead
from the render) plus a note here.

---

## 11. Decisions to make before porting

These are the four places where a naive port would ship something wrong.

### 11.1 The Netflix copy (recommended rename)

The design is legible as "cinema" without quoting one specific product. Proposal:

| Reference | Ship as |
|---|---|
| `Who's Watching?` | `Now Showing` (or `Pilih Tamu` — pick one language and stay in it) |
| `Start Watching` | `Start the Film` / `Buka Undangan` |
| `100% Likes · 2026 · 1 h 11 m · Romance` | keep the shape, make the genre the couple's: `100% Love · 2027 · Forever · Romance` |
| `Episodes` / `Love Story · Season 1` | `Episodes` / `Love Story · Season 1` (generic, keep) |
| `#1` + `Today's Couple` | keep (generic) |

Everything else in §9 is generic streaming vocabulary and can stay. **Do not**
add a Netflix wordmark, the "N", or the "TOP 10" strip artwork.

### 11.2 Gate or no gate

Three options:

1. **No gate (faithful).** Cover is section 1, page scrolls freely, music starts
   on the first user interaction. Cheapest, and the design genuinely does not
   need a gate — but the couple loses the "sealed invitation" moment every other
   template gives them, and autoplay rules mean the music may not start until
   the guest taps something.
2. **Gate = the cover (recommended).** Keep the cover exactly as drawn, make
   `Start Watching` the open button (it already is), lock body scroll until
   tapped, start the track on that tap, then release scroll into the hero. This
   costs ~15 lines, keeps the poster intact, and matches playbook §5 (music
   preloaded on the cover, film streamed on open).
3. **Gate = a separate film strip.** Overkill; the cover *is* the film.

Take **(2)**. Concretely: `is-locked` on the root, `html:has(.nfs-root.is-locked),
body:has(...) { overflow:hidden }` as the CSS fallback, and
`openInvitation()` → `setOpened(true)` → `audio.play()` → `scrollTo(0,0)`.

### 11.3 QRIS tab

`gift_accounts` has no QR image column (`provider_name`, `account_number`,
`account_name`, `type`). The reference's three tabs therefore become **two**:

- **Direct Transfer** → one card per `gift_accounts` row.
- **Send Gift** → `gift_address_name` + `gift_address` (address alone is not
  enough — playbook §8.6).
- **QRIS** → only if the couple has an account whose `type`/`provider_name`
  says QRIS; render it as a normal card with the number. No image slot, so do
  not draw a fake QR.

### 11.4 Cover film

The reference's 5.15 s clip is the *platform's* footage. Use
`profile.video_url` (direct upload → `<video autoplay muted loop playsInline>`,
YouTube → iframe, per playbook §8.6) as the cover backdrop **after** opening, and
ship a still as the cover poster. If there is no video, the cover is the still —
that is still a good cover.

---

## 12. Compliance & licensing

| Item | Status |
|---|---|
| Anton, Archivo | **OFL** — self-host freely (add to the font pipeline) |
| Reference photos, film, track | Platform's own demo content — **never ship**; couples bring their own |
| Netflix marks (wordmark, N, TOP 10 strip) | **Not present** in the render, and must stay out (§11.1) |
| Netflix brand red `#E50914` | Colour only; keep as the accent |
| Platform credit, owl/IG footer, "DIGITAL INVITATION BY OWLINK.ID" | **Remove**, replace with the Aksaraa badge (logo + "Wedding by Aksaraa") |

---

## 13. Proposed content spec

```ts
// src/components/templates/index.ts
{
  code: "n-film",
  name: "N Film",
  description: "Undangan bergaya film/streaming — sampul pemilih tamu, poster nama, daftar episode kisah cinta, galeri, hadiah.",
  theme: {
    fonts: { display: "Anton", script: "Anton", body: "Archivo" },
    colors: { surface: "#0B0B0B", text: "#F5F5F1", accent: "#E50914",
              accentMuted: "#8C8C8C", overlay: "#0B0B0B", dark: "#050505" },
    ornaments: { divider: "line", border: "none", frame: "square" },
    motion: { enabled: true, duration: 0.6, stagger: 0.12 },
  },
  content: {
    cover_slots: 3,
    cover_slot_labels: ["Sampul", "Kutipan", "Closing"],  // section 1 / hero / closing
    groom_photo: "single",
    bride_photo: "single",
    story_photo: true,                                     // episode thumbs
    extras: true,
    sections: {
      opening_description: true,   // promoted out of the reference's cast block
      quote: true,                 // §10.6 B — keep
      countdown: true,             // own block, not inside the masthead
      inviting: true,              // the reference's static blessings line
      video: true,                 // §10.5 #11 — the reference has none
      story: true,                 // LOVE STORY — minimum section (§10.5 #6)
      gallery: true,
      gift: true,
      dresscode: true,             // §10.5 #13 — the reference has none
      livestream: false,           // no surface in the design
      rundown: true,               // §10.5 #9 — the reference has none
      contacts: false,             // no surface in the design
    },
  },
}

// If B (the verse) is dropped: `quote: false`.
```

`TEMPLATES_WITHOUT_OPENING`: **not** in the set — the intro paragraph is real
content the couple edits.

New `templateExtras` keys (each needs a `placeholders["n-film"]` entry in the
same language as the demo):

| Key | Purpose |
|---|---|
| `cover_kicker` | existing — the hashtag line override |
| `cover_apology` | existing |
| `cover_title` | **new** — "Who's Watching?" replacement |
| `open_button` | **new** — "Start Watching" replacement |
| `hero_meta` | **new** — the streaming meta line |
| `hero_badge` | **new** — `#1` / flag label |
| `opening_description` | column (not extras) |
| `gallery_intro` | existing — "click to preview" |
| `gift_intro_title` / `gift_intro_description` | existing |
| `wishes_intro` | existing |
| `closing_message` | existing |
| `inviting_intro` | existing — the blessings line |

Registration checklist (mirrors `docs/REA_LACE.md` §9):

1. `src/components/templates/n-film/{index.tsx, Wishes.tsx, n-film.css}`
2. `public/templates/n-film/` — `thumbnail.webp` (720×1520 crop) + any poster
   still we draw ourselves. **No reference media.**
3. `TEMPLATE_MAP` + `TEMPLATE_CONFIGS` in `src/components/templates/index.ts`
4. `DEMO_PROPS_BY_CODE["n-film"]` — Sandhya/English demo couple, not Damar & Nayla
5. `src/lib/templateExtras.ts` — the keys above
6. `keepDemoIds` in `src/app/templates/[code]/preview/page.tsx`
7. `supabase/migrations/20261042000000_n_film.sql` — next free version
   (`20261041000000` is the latest; no duplicate versions exist today), and
   `sort_order = 25` (24 is the current max), `tier 'Baru'`, `category 'Modern'`,
   `package_eligibility` copied from `lace`, `no_photo = false`
8. Editor GET/PUT + ops accordion, gated on the content spec above
9. **RSVP is the dock, not a section.** Render `InvitationOverlay` inside the
   template with `!profile.preview_mode && !profile.template_demo` (playbook
   §6). Do not port the reference's RSVP form; the `WISHES` block owns the
   name + message fields only.

---

## 14. Traps specific to this design

| Symptom (if handled naively) | Cause | Fix |
|---|---|---|
| Names overflow at 390 px | 46 px Anton uppercase: `DAMAR & NAYLA` measures 276 px of the 346 px box, `ALEXANDRA & CHRISTOPHER` measures 466 px — so a full-name lockup wraps to 2–3 lines and pushes the countdown out of the fold | render `groom_name`/`bride_name` (first names) not `*_full_name`, and clamp with `font-size: clamp(30px, 11.8vw, 46px)` |
| Photos look "flat/neutral" | our uploaded photos are already graded | keep `filter: contrast(1.06) saturate(.88) brightness(.95)` — it is the design |
| Hero text unreadable at the bottom | a plain gradient overlay replaces the masked `nfs-kaki` block | port the `mask-image` pair (§4.3), not `linear-gradient(rgba(0,0,0,.8),…)` |
| Episode numbers drift when one is deleted | storing "1." in the title text | CSS counter (§7) |
| Gallery rows jump between couples | fixed-height tiles | justified rows + `aspect-ratio: 3/4` (the reference's photos are 800×1071) |
| Cover is a dead end | the reference never locks scroll, so a literal copy lets the guest scroll straight past the poster | §11.2 option 2: lock scroll on the cover, release + `scrollTo(0,0)` on `Start Watching` |
| Countdown shows `:` separators | missing `.db-sep` rule | `color: transparent; font-size: 0` then hairline `border-left` per cell |
| Time & Place looks cramped with two events | the reference hides its second plate (Reception is `display:none`), so the 378 px block is sized for **one** | render `sessions[]` in flow with ~24 px between plates and let the block grow; do not copy the 378 px height |
| QRIS card is a blank box | `gift_accounts` has no QR image | §11.3 — two tabs, no fake QR |
| Instagram pill breaks the 166 px column | long handle | ellipsis rule (§7) |
| Music never starts | reference relies on a tap for autoplay | preload on the cover, `play()` inside the `Start Watching` click |
| Every visit re-downloads the 4.27 MB track | Supabase public objects are `private, no-cache` | set a long `cacheControl` on uploads (playbook §5) |
| Desktop looks like a phone sticker on a black wall | 390 px column copied as-is | keep the column, but let the gutters carry a blurred hero still — do not stretch to 1440 px |
| A bespoke RSVP form appears in the invitation | the reference's `RSVP & Wishes` block ported whole | drop the RSVP half; RSVP is the `InvitationOverlay` dock (playbook §0.5 rule 4) |
| RSVP/QR button shows in `/templates/n-film/preview` | dock rendered without the preview guards | `!profile.preview_mode && !profile.template_demo` (playbook §6) |
| Added sections look bolted on | welcome/rundown/video/dresscode drawn from generic components | draw each with this template's primitives — Anton display, Archivo labels, hairline rules, `#141414` only for the rundown cards (§10.5) |

---

## 15. Definition of done (for the port, when we do it)

- [x] **All 16 minimum sections present** (playbook §0.5) — the four missing ones
      plus the three buried fragments (§10.5), each drawn in this template's own language
- [x] **A / B decisions (§10.6) recorded here** — both ship
- [x] Love story ships (`story: true`, `story_photo: true`) — never `story: false`
- [x] **RSVP is not a section** — `InvitationOverlay` only, suppressed in
      `preview_mode` and `template_demo`; no bespoke RSVP form
- [x] Anton + Archivo added to `scripts/fetch-fonts.js`, fonts generated, declared
- [x] Component, CSS, `Wishes.tsx`, lightbox, `InvitationOverlay` dock
- [x] Gate decision implemented (§11.2 option 2) with the `:has()` scroll-lock fallback
- [x] Copy rename applied (§11.1) — no Netflix marks
- [x] Content spec + extras + demo props + `keepDemoIds`
- [x] Section order as recorded in §10.5, and it matches the render
- [x] Migration authored at `20261042000000_n_film.sql`, `sort_order` 25
- [ ] **Migration applied** local → staging → production (`db push`)
- [ ] Editor + ops clicked through (both are spec-driven; no code expected)
- [x] `tsc --noEmit`, staging build, preview 200, no overflow
      (`scrollWidth === innerWidth`), console clean
- [ ] Visual QA at a true 390×844 emulation (only 800×655 was available here)
- [ ] `web_templates` row registered **before** the final build, `rm -rf .next`,
      gallery count verified
- [ ] Deploy via `npm run deploy`, then smoke `/templates/n-film/preview`,
      `/w/rafi-novi`, the web-invitation API and the wishes API

---

## 16. Still open

- **Awaiting the §10.6 decision** — A (masthead), B (verse). The spec assumes
  both ship. Love story is settled: it is a required section.
- **Language.** The reference is English throughout. Sandhya is our English
  source of truth, so an English demo + English extras placeholders is the
  consistent choice — but confirm before writing copy, because switching later
  means touching every extras placeholder (playbook §1.4).
- **`livestream` / `contacts`.** No surface in the design; off.
- **Gallery paging.** The reference renders 10 photos in one justified grid with
  no paging. Above ~14 photos the block gets very tall; decide whether to cap or
  paginate.

---

## 17. Build log — what actually shipped

Phase 1 (component) and Phase 2 (registration) are done. Phase 2's database
step is authored but **not applied** to any environment yet.

### Files

| File | Change |
|---|---|
| `src/components/templates/n-film/index.tsx` | the component: gate, 16 sections, lightbox, film modal, gift tabs, music, dock |
| `src/components/templates/n-film/n-film.css` | the skin, scoped under `.nf-root` (~180 rules) |
| `src/components/templates/n-film/Wishes.tsx` | name + wish input + approved feed, 5 per page |
| `public/templates/n-film/thumbnail.webp` | 720×1520 poster, generated (not reference art) |
| `src/components/templates/index.ts` | `TEMPLATE_MAP` + `TEMPLATE_CONFIGS` entry |
| `src/components/templates/demoProps.ts` | `DEMO_PROPS_BY_CODE["n-film"]` (Albarn/Faye, English) |
| `src/lib/templateExtras.ts` | 4 new keys (`cover_title`, `open_button`, `hero_badge`, `hero_meta`) + `n-film` on 8 existing keys |
| `src/app/templates/[code]/preview/page.tsx` | added to `keepDemoIds` (wishes feed) |
| `supabase/migrations/20261042000000_n_film.sql` | `web_templates` row, `sort_order` 25 |
| `scripts/fetch-fonts.js`, `scripts/gen-font-css.js` | `Anton` + `Archivo` (OFL) added to the pipeline |
| `src/app/fonts.css` | regenerated — now declares `--font-anton` and `--font-archivo` |

### Decisions as built

- **Gate** = the cover (§11.2 option 2). `is-locked` on the root, locked body
  scroll, `Start the Film` opens, plays the preloaded track, `scrollTo(0,0)`.
- **Opening video** = the cover backdrop, direct-file only (`video_url` that is
  an mp4/webm/mov). A YouTube URL never becomes a cover iframe — it becomes the
  `THE FILM` plate instead, so the first screen stays cheap.
- **Countdown** is its own block, `Clock` is a separate component so the
  one-second tick cannot re-reconcile the invitation tree.
- **Love story** ships as `EPISODES` with CSS-counter numbering.
- **Dress code** ships as `COSTUME` swatches; **rundown** as `RUN OF SHOW` cards
  using the preset's own `.nfs-rundown` values.
- **Gift** ships two tabs (Direct Transfer / Send Gift). No QRIS tab and no
  drawn QR — `gift_accounts` has no image column.
- **RSVP** is the `InvitationOverlay` dock with `!preview_mode && !template_demo`;
  no RSVP form exists in the component.
- **Copy rename** applied: `Now Showing`, `Start the Film`, `100% Love · 2027 ·
  Forever · Romance`. No Netflix mark, wordmark or TOP-10 strip.
- **Desktop** keeps one 430 px column; the gutters carry a blurred hero still
  (`--nf-hero`), so it is not a phone sticker on a black wall.

### Verified locally

- `npx tsc --noEmit` — clean.
- `next build` with `.env.staging` — succeeds; `n-film` appears in the preview /
  `/w/[slug]` client manifests and the vendored fonts are in the bundle.
- `/templates/n-film/preview` → **200**, all 15 rendered `data-section` blocks
  (plus the gate = 16) in the documented order.
- No horizontal overflow (`scrollWidth === innerWidth`), body scroll locked
  before open and released after, gate removed on open, music button appears.
- **No RSVP dock in the preview** — `template_demo` guard holds.
- Gallery lightbox opens, arrow-keys step, `Escape` closes; film modal opens
  with the embed and `Escape` closes; console clean.

### Look-parity pass (after review)

The first cut matched the reference's *measurements* but not all of its
*composition*. Five mismatches were found by diffing the reference's own rules
against the rendered page, and fixed:

1. **Cover order** — the apology line now sits **before** the open button, as in
   the reference (it was after).
2. **Cover film** — the video was dimmed to 42 % under a heavy gradient. The
   reference plays it full-bleed with no veil; it is now at 82 % with only a
   radial + bottom gradient for legibility.
3. **Masthead height** — 88svh → **96svh**, matching the reference's 824 px of a
   844 px viewport.
4. **Gallery tiles** — every tile was forced to 3:4, which cropped square
   uploads. The reference sizes each row by the photo's own aspect
   (191×256 portrait rows, 191×191 square rows). Tiles now read
   `naturalWidth/naturalHeight` through a ref **and** `onLoad` — a plain
   `onLoad` never fires for lazy/cached images that finish before hydration.
5. **Gift tabs** — now the reference's own shape: 12 px radius, 13 px sentence
   case, white active fill with a 1 px inset red ring.
6. Also restored the **wide still** that opens the reference's cast block.

Type and button tokens were then compared computed-vs-computed on both pages:
kicker, 46 px names, meta line, Play/More Info fills, 26 px section titles, 20 px
event names, 30 px countdown values, 9 px / 0.22 em countdown labels, 15 px
episode titles, 12 px episode text, 4 px radii and the 8 px gallery gap are
**identical**. Section heads centre everywhere except Episodes, as in the
reference.

Still not pixel-verified: this environment cannot capture screenshots (no
visible desktop window), so parity below the token level — balance, optical
spacing, how a given couple's photos sit in the frames — is unconfirmed.

### Client-review fixes (post-deploy)

Four defects reported after the first deploy, all fixed:

1. **The cover hashtag ignored the editor.** `display_name` is the editor/ops
   field **"Hashtag Instagram Post"** (`strField("Hashtag", f.display_name, …)`),
   and the editor help says an empty value *hides* the hashtag. The component now
   reads `display_name` first, with `template_content.cover_kicker` only as the
   legacy fallback, and no derived `#GroomBrideForever` — a derived value would
   resurrect a hashtag the couple deliberately cleared.
2. **The closing photo was cropped at the top.** It was an absolutely-positioned
   `object-fit: cover` layer sized by the copy. It is now an in-flow image at
   natural height, so the whole photograph shows; the copy is absolutely
   positioned over its bottom with a bottom-only veil. `min-height: 320px`
   guards a very wide photo from clipping the text block.
3. **Footer now mirrors Sandhya's in-house closing block** — 64 px white badge
   with the Aksaraa logo, `Wedding by Aksaraa` at 10 px / 0.3 em tracking, and
   the `© <year> <couple>. All rights reserved.` line. The previous
   "Digital Invitation by" line is gone.
4. **Dress-code swatches are centred** (`justify-content: center`, 320 px
   measure), so a single colour still reads as deliberate instead of drifting to
   the left edge.

### Not done yet

1. **Database.** `20261042000000_n_film.sql` is authored but not pushed:
   `db push` to staging and production is a shared-resource action, so it needs
   an explicit go-ahead. Local `supabase db reset` / `migration up` likewise.
2. **Gallery listing.** `/templates` is prerendered at build time and reads
   `web_templates`, so the card appears only after the row exists **and** the
   build is re-run (playbook Phase 8: row → `rm -rf .next` → build).
3. **Editor / ops visual pass.** Both are spec-driven and need no code change
   (no template-code branches), but nobody has clicked through them for this
   template yet.
4. **Deploy.** Not deployed.
