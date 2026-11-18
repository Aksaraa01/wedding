# REA — The Digital Yes "Majestic" → Aksaraa in-house template (`majestic`)

Reference teardown + decisions for the in-house template **`majestic`**, written
against the §0.5 minimum-section contract in
`docs/INHOUSE_TEMPLATE_PLAYBOOK.md`.

## 1. Verdict

| Question | Answer |
|---|---|
| Reference | `https://www.thedigitalyes.com/demo/majestic` (invitation inside the demo shell: `https://majestic-template.thedigitalyes.com`) |
| What it is | A React + Tailwind single-page invitation: one opening film, then 8 scroll blocks |
| Data layer | None in the demo (props are inlined per template); the real product is a paid atelier service |
| Type | Adobe Fonts: `classic-script-mn` (script), `span` (serif). **Not redistributable** → substituted with `Pinyon Script` + `Cormorant Garamond` (both in `src/app/fonts.css`). Pinyon is a copperplate of the same weight/width class; Parisienne was tried first and read ~30% larger at the same px |
| Palette | ivory `#f0e8e0`, sage ink `#5c6342`, gold `#c3a06a`, wine accent `#7c2b3a` (the cupid line art), white cards |
| Reference blocks | hero film · countdown · "The Details" plate · "Order of the Day" · dress code · gifts · RSVP · footer |
| Missing vs the 16-section contract | welcome words, mempelai, love story, turut mengundang, gallery, video, wishes feed (their RSVP is a form), closing copy |
| Licensing | Reuse asserted by the project owner (2026-11-17). The demo's own couple data, music and platform watermark are **not** shipped; see §6 |

**Verdict:** portable as a full 16-section invitation. The reference's ornament
language (beaded chandelier film, beaded string lights, engraved plates, beaded
architecture, script headings on ivory paper) is carried over intact; the blocks
the reference lacks were drawn from the same primitives (§4).

## 2. What the reference does

- **Opening film** (3.67 s, 1080×1920, 469 KB): a slow push-in on a cream
  envelope sealed with a wax stamp, then the page fades to ivory.
- **Cover film** (799 KB, 1080×1920 loop): a beaded chandelier between beaded
  curtains over an illustrated table with palms. Names in a classic script sit
  at ~42 % of the viewport, under the chandelier.
- **Countdown**: four numbers (no cards) with letterspaced unit labels.
- **The Details**: beaded string lights, script heading, and one engraved plate
  per event (script name, uppercase venue, date, time, address, two sage
  buttons).
- **Order of the Day**: beaded gramophone + lily, script heading, hairline
  timeline (time → description → thread).
- **Dress code**: beaded crowd illustration overlapping a white rounded card,
  with title, paragraph, italic note and swatch dots.
- **Gifts**: beaded envelope, intro paragraph, accordion per account, address
  card, all in translucent white cards on ivory.
- **RSVP**: a full form (attendance, pax, allergies, song) — **not ported as a
  section** (playbook §0.5 rule 4: RSVP is the shared `InvitationOverlay` dock).
- **Footer**: names, date, beaded arch, platform credit.

Motion: `whileInView` fades (opacity 0→1, y 20→0, 0.6–0.8 s, staggered
0.08–0.1 s), scale-in for small blocks, and `scaleY(0→1)` hairlines. Ported as
one `IntersectionObserver` + `.mj-reveal.is-in` (playbook §0.7), with
`prefers-reduced-motion` and `scripting: none` fallbacks.

## 3. Section order shipped

Documented deviation: the reference's only public demo is a phone composition,
so the *desktop* build keeps the mobile layout and centres it as one 460 px
column (see §7). Order below is the rendered order.

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Envelope gate + cover | gate film / cover film, names, date, `guest_name` | always (gate before open) | 1 name pair; guest block hides when the name is a placeholder | `template_content.cover_kicker`, `gate_hint`, `open_button`, `cover_guest_label`; names: profile | gate film plays on tap, 1.2 s ivory fade; names fade-up 0.28 s |
| 2 | Kalimat pembuka | `opening_title`, `opening_description` | `!hidesOpeningSection("majestic")` | always one block | profile + `opening_kicker` | lights fade-in, heading up, rule `scaleX` |
| 3 | Film | `video_url` | `feature_gates.video` **and** `video_section_visible` | file → `<video muted loop>`; YouTube → iframe; hidden when empty | `video_kicker/title/intro` | frame zoom-in 0.16 s |
| 4 | Mempelai | `groom_*`, `bride_*`, portraits, parents, Instagram | `person_photos !== false` | 2 rows, mempelai satu (groom) then dua (bride); default portrait per person | profile; labels `mempelai_kicker`, `person_one_label`, `person_two_label`, `parents_label` | staggered 0.16 s / 0.24 s |
| 5 | Kisah cinta | `stories[]` (title, year, description, image) | `feature_gates.story` **and** `story_visible !== false` | 1…n rows, hairline between; no rows ⇒ section hides | `story_kicker`, `love_story_title`, `story_intro` | rows fade up |
| 6 | Waktu & tempat | `sessions[]` | always (completeness requires an event) | 1…n plates; photo slot only when uploaded; maps button when a venue/address exists | `events_kicker/title/note`, `maps_label`; event data: profile | plate zoom-in, stagger 0.06 s |
| 7 | Hitung mundur | `estimated_wedding_date` / first session | always when a date exists | 4 cells; `--` until hydration | `countdown_title/intro`, `countdown_days…seconds`, `calendar_button` | clock zoom-in 0.1 s |
| 8 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | 1…n names, hairline between | `inviting_kicker/title/intro` | list fade-up |
| 9 | Susunan acara | `rundown[]` | `rundown_visible !== false` | 1…n rows; thread omitted after the last row | `rundown_kicker/title/intro` | art zoom-in |
| 10 | Galeri | `gallery_photos[]` | needs data | 1…n tiles (2 cols), lightbox with Esc/←/→ | `gallery_kicker/title/intro/quote` | tiles zoom-in, 0.05 s step |
| 11 | Hadiah | `gift_accounts[]`, `gift_address`, `gift_address_name` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / both; accordion per account | `gift_kicker/title/intro/send_label`, copy labels + toasts | envelope zoom-in, list up |
| 12 | Dress code | `dresscode.title/description/colors` | `dresscode_visible !== false` + non-empty | 0…n swatches; card still shows title/description | `dresscode_kicker/note` + profile dresscode | crowd fade, card up |
| 13 | Ucapan | name + message form, approved feed (`/api/wishes`) | always | 5/page pager; 409 ⇒ "already sent"; demo ids render sample wishes and never POST | `wishes_*` | form up |
| 14 | Penutup | names, date, `closing_message`, `cover_apology` | always | photo optional; arch always | `closing_title`, `closing_message`, `cover_apology` | photo zoom, names up |
| — | RSVP / QR dock | `InvitationOverlay` | `!preview_mode`, `!template_demo`, opened, no lightbox, identified guest (or fleksibel slug) | — | — | — |

Not shipped (reported here per §0.5 rule 2): the reference's **RSVP form**
(replaced by the dock), the **platform watermark** and its **background music**
(couples use `track_url`), and the reference couple's monogram baked into the
opening film (see §6).

## 4. How the missing blocks were drawn

- **Kalimat pembuka** — the string-lights band + script heading + hairline gold
  rule is the reference's own "The Details" header, reused for the couple's
  words.
- **Mempelai** — the reference has no portrait block; portraits use the arch
  (radius 999px top / 20px bottom) already present in their beaded door art,
  with a gold hairline inner border and the beaded rings as a divider. One row
  per person keeps the print-like rhythm of their timeline.
- **Kisah cinta** — the "Order of the Day" row rhythm (label, serif line,
  hairline) with the photo as a small paper-framed tile.
- **Turut mengundang** — a centred list with hairlines, closed by the beaded
  bouquet that sits above their gift block.
- **Galeri** — paper-framed square plates (same 4 px ivory border + soft shadow
  as their venue photo) on ivory.
- **Film** — a rounded card framed like their venue plate, with the painted
  rings as the ornament.
- **Ucapan** — their RSVP card language (translucent white inputs, full-width
  sage button) applied to the wishes form + feed.

## 5. Assets shipped (`public/templates/majestic/`)

| File | Source | Bytes | Use |
|---|---|---|---|
| `cover-film.mp4` | reference hero loop, faststart | 799 KB | cover |
| `cover-poster.webp` | hero poster frame | 191 KB | cover poster |
| `gate-film.mp4` | reference opening film, faststart | 469 KB | envelope gate |
| `gate-poster.webp` | opening poster frame | 37 KB | gate poster |
| `string-lights.webp` | beaded lights | 159 KB | pembuka + kisah cinta headers |
| `ornate-badge.webp` | engraved plate | 65 KB | event plates |
| `gramophone.webp` | beaded gramophone + lily | 75 KB | susunan acara |
| `dress-crowd.webp` | beaded guests | 74 KB | dress code |
| `gift-envelope.webp` | beaded envelope | 145 KB | hadiah |
| `flower-bouquet.webp` | beaded bouquet | 86 KB | turut mengundang |
| `closing-arch.webp` | beaded arch | 165 KB | penutup |
| `rings.webp` | painted gold rings | 27 KB | mempelai + film dividers |
| `thumbnail.webp` | composed from the cover art (1080×1920) | 151 KB | gallery plate |

Not shipped: their watermark, platform logos, couple monogram (`MJ`), the
reference couple's photos, the `E & J` wax seal, and the intro music.

## 6. Deviations & decisions

1. **Guest greeting lives on the envelope**, not the cover: label
   (`cover_guest_label`) + `guest_name` sit above the "Buka Undangan" button,
   so the first screen tells the guest this link is for them. Placeholder names
   ("Tamu Undangan", …) hide the name line and keep the label.
2. **The wax seal is ours, and it travels with the film.** The opening clip has
   `E & J` stamped into the wax, so a CSS wax seal (`41 %` of the film width,
   container-sized script) is drawn over it with `couple_initials`. The camera
   pans up during the clip, so the seal is driven by a measured track
   (`SEAL_TRACK`: centre 53.1 % → 26.9 % of the frame height, scale 1 → 1.07,
   sampled with a circular Hough on the frames) from a rAF loop reading
   `currentTime` — otherwise the filmed stamp slides out from under ours.
3. **"Simpan Tanggal" lives under the countdown**, not on the event plate. The
   event plate keeps only "Lihat Lokasi" (maps); the calendar CTA sits with the
   countdown it belongs to.
4. **Two photo slots**, not five: `cover_photos[0]` = venue photograph (on the
   event block, gated by that section), `cover_photos[1]` = closing portrait.
   The cover is the design's film, so there is no cover-photo upload.
5. **Quote is off** (`quote: false`): the reference has no verse band and the
   couple's words ship as Kalimat Pembuka.
6. **Desktop = the mobile composition, centred.** The reference is a phone
   design; stretching it to 1440 px produced a chandelier that swallowed the
   names and event plates with empty margins. The page is now a 460 px column
   centred on a warm ivory ground, with type sized in container units (`cqw`)
   so 390 px and 460 px render identically.
7. **Heading sizes follow the reference per section**, not one global scale: the
   countdown title is 36 px (`text-4xl`), every other script heading 48 px
   (`text-5xl`), cover names 60 px (`text-6xl`), closing names 30 px
   (`text-3xl`). A single 48 px heading made the countdown read oversized.
   Small caps are 14 px / 0.1em (`tracking-widest`), the cover kicker 14 px /
   0.3em, body copy 16 px / 24 px — all verified against the live reference's
   computed styles at 390 px. The countdown numerals are **Bodoni Moda 400**,
   not Cormorant: the reference sets them in `span` at 36 px/300/40 px, and
   Cormorant at the same px reads ~12 % smaller because of its small x-height
   (a 3-digit run measures 50.7 px against the reference's 56.5 px). Bodoni is
   already vendored and gives the same optical size and didone contrast.
8. **Lamp divider** between Hitung Mundur and Turut Mengundang: the same beaded
   string-lights artwork at its natural aspect ratio (no fade, no mask), tied to
   the inviting section so it never stands alone when that section is gated.
9. **Instagram hashtag in the closing.** The editor's "Hashtag Instagram Post"
   (`display_name`) prints above the closing message; a value that is not
   already a `#tag` is derived from the couple's names. Empty names ⇒ no line.
10. **Motion is reimplemented, not imported**: one observer, `opacity` +
   `translateY(20px)`, 0.8 s `cubic-bezier(.22,.61,.36,1)`, 0.06–0.28 s
   stagger, `scale(.94)` for plates; all reveal targets are visible under
   `prefers-reduced-motion` and `scripting: none`.

## 7. Verification log

- `npx tsc --noEmit` — clean.
- `npm run audit:copy -- majestic` — clean (4 allowlisted literals: Aksaraa
  badge alt/text/link name + the lightbox close WCAG name).
- `node scripts/check-material-icons.mjs` — `music_note` / `music_off` are in
  the subset.
- 390×844 and 1440×900: `scrollWidth === innerWidth` at both; no console
  errors; gate → film → fade → cover; countdown ticks; gallery lightbox
  Esc/←/→; gift accordion; wishes demo feed paginates 5/page.
- Every `template_content` key read by the component is registered for
  `majestic` in `src/lib/templateExtras.ts` (and no registered field is dead).
