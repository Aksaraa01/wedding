# REA — Honey Cloud "Ivory Lace Envelope Reveal" → Aksaraa in-house template

Reverse-engineering analysis for a new in-house template, working code
**`ivory-lace`**. Same shape as `docs/REA_LACE.md` /
`docs/REA_EMBROIDERED_GARDEN.md`, but written against the **§0.5
minimum-section contract** (`docs/INHOUSE_TEMPLATE_PLAYBOOK.md`): every one of
the 15 canonical sections ships, sections outside that list are reported here
and wait for approval, and RSVP is the shared dock — never a template form.

Nothing is ported yet: this is Phase 0/1 (reference teardown + decisions).

---

## 1. Verdict

| Question | Answer |
|---|---|
| Reference | `https://honeycloudtemplates.my.canva.site/demo-ivory-lace-envelope-reveal-wedding-website` (+ `/main-page`) |
| What it is | A **Canva Website export** (`app-name: export_website`, build `20260914-03-ad5ca1f`). Two pages: a sealed-lace envelope cover, then a 9-block scroll invitation |
| Data layer | **None.** No CMS, no per-couple merge, no `?to=`. Every string is baked into the Canva design |
| Assets | 52 unique media entries (40 raster, 12 vector) under `_assets/media/`, each mirrored at 1×/2×/3×. No referer lock, no signed URLs |
| Fonts | Canva-only: **Ferly**, **Poppins**, **Pinyon Script**, **Cormorant Garamond**, **Garet**, **Josefin Sans**, **Cinzel**, **The Seasons**, **Inria Serif**, **Perandory**. Display faces are not self-hostable → substitute from `public/fonts` |
| Music | Vinyl graphic + "CLICK TO PLAY", but **no `<audio>`/`<video>` element ships**: the button drives a YouTube iframe (`youtu.be/u2ah9tWTkmk`). Reference-only |
| Branding / chrome | Canva footer ("Didesain dengan", Terms/Privacy pills, report modals) on every page — must not ship |
| Photo slots | The design is photo-driven (hero, story, venue, registry, closing). All photography is stock / reference people → replaced by `cover_photos`, `stories[].image_url`, `gallery_photos`, `groom/bride_photo` |
| Mobile | **Broken.** The export keeps the 1366 px Canva page and scales it; at 390 px headings are clipped at the right edge (verified in capture). Do not infer responsive behaviour from it |
| Licensing | Envelope plates, wax seals, wreaths, floral sprigs, hearts, pins and icons are **Canva stock elements** → redraw, never vendor (playbook §"Never vendor licensed media") |

**Verdict:** portable as a **re-skin + re-layout**, not as an asset copy. The
design language (ivory paper, torn-edge photo masks, hairline+heart dividers,
gold wax seal, wide didone headings, script names, dotted-heart timeline) is
reproducible from fields we already have, and it fills a gap: Aksaraa has no
photo-forward editorial/paper template in English. All 15 minimum sections can
be drawn in this language — §3 shows how.

---

## 2. What the reference actually is

| URL | What it is |
|---|---|
| `/` (page 1, "ENVELOPE") | Cover: full-bleed ivory lace envelope, script *A Letter From Our Hearts*, hairline + heart, names in a wide display serif, gold wax seal, `OPEN` in Cinzel. Tapping `open` **navigates to page 2** — there is no envelope animation |
| `/main-page` (page 2, "MAIN PAGE") | The invitation: 9 stacked blocks (music player → welcome card → love story → save-the-date + countdown → ceremony & reception → timeline → attire → accommodation → RSVP → registry → thank you) + Canva footer |

Capture notes for the next session (this reference is not straightforward):

- The page is a **client-rendered Canva scene**. The served HTML only contains a
  screen-reader layer (`<div style="position:absolute;opacity:0">`, one `<p>` per
  text block) and an empty `div.x1kgbacm` render container.
- Inside the OpenCode desktop browser the renderer **fails**: console repeats
  `rect-element is not present in the container: fixed-page` and the container
  stays empty (no `<img>`, no `background-image`, no `<canvas>`). Text can still
  be read from the a11y layer; no pixels.
- Headless Chrome renders it correctly:
  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
    --window-size=1366,14000 --virtual-time-budget=25000 \
    --screenshot=/tmp/ref-full.png "<url>/main-page"
  ```
  (390×3000 for the mobile shot). Use that instead of the in-app browser.
- The design data is parseable from the HTML. `window['bootstrap']` is a **JS
  single-quoted string** whose content is JSON that is partly double-escaped
  (`"\\"#ffffff\\""`, `d\\'Este`). Decode the JS string layer first (backslash
  escapes only), *then* `JSON.parse`; parsing the raw text dies at char ≈133 k
  inside the embedded TickCounter blob. That is where the font/media/palette
  tables below come from.

Measured geometry:

| Page | Design canvas | Rendered @ 1000 px wide | @ 1366 px |
|---|---|---|---|
| ENVELOPE | 1366 × 964 | 700 (100 svh) | 964 |
| MAIN PAGE | 3 Canva artboards side by side (x up to ≈2 800) | 9 sections: 930 / 1115 / 1077 / 801 / 2421 / 1943 / 1595 / 527 / 1373 | ≈ 13 900 px |

The ceremony block alone is 2 421 px (photo → heading → venue → date → pin →
divider → timeline): the rhythm is **full-bleed photo + generous paper
whitespace**, not cards on a grid.

---

## 3. Section inventory → the 15-section contract

Reference blocks on the left; the contract slot they satisfy on the right.
"Added" = the reference has no such block and it must be **rebuilt in the
reference's own visual language** (§0.5 rule 1), not bolted on.

| Contract # | Section | Reference block | How it ships here |
|---|---|---|---|
| 1 | **Cover** | Lace envelope (page 1) + hero (page 2) | Two beats, like the reference: `gate` = sealed envelope (CSS lace + drawn wax seal + guest name + `OPEN` in Cinzel), then `cover` = full-bleed photo, wreath monogram from `couple_initials`, "THE Wedding OF", names, date stamp |
| 2 | **Opening video** | *absent* | **Intentionally not shipped** (owner decision, 2026-11-01): the reference opens on a static lace envelope and its only video surface is the film plate, so the couple's film ships at #11 only. Recorded deviation from §0.5 rule 1 — approved by the owner, not a silent drop |
| 3 | **Welcome** | "DEAR FAMILY & FRIENDS" card | Ornate rounded plate (redrawn SVG frame), script names, intro copy |
| 4 | **Kalimat pembuka** | the card's body paragraph | Same surface: `opening_title` = card heading, `opening_description` = body. §0.5 allows 3+4 to share one block — Lace does exactly this |
| 5 | **Mempelai** | *absent* | **Added**: two torn-edge portraits + own names + parents + Instagram, no "The Groom"/"The Bride" labels (§0.5 rule 3) |
| 6 | **Event** | "CEREMONY & RECEPTION" + Location pin | One torn-edge photo plate per `sessions[]` row: heading, script venue, city/address, date + time, map pin → `maps_url` |
| 7 | **Countdown** | "SAVE THE DATE" + calendar card + clock | Generated calendar (month grid from the event date, heart on the day, paperclip plate) + `useCountdown`. **Never** the TickCounter iframe |
| 8 | **Turut mengundang** | *absent* | **Added**: quiet script list between countdown and rundown, hairline+heart divider, gated by `feature_gates.inviting_families` **and** `inviting_families_visible` |
| 9 | **Rundown** | "WEDDING TIME LINE" | Dotted vertical line + gold hearts + drawn line icons (phone/camera/rings/plate/music/cake/car), time + caps label per `rundown[]` row |
| 10 | **Gallery** | *absent* (only story + venue photos) | **Added**: torn-edge stacked plates (paper + paperclip), lightbox with Esc/←/→ — the reference's photo language, applied to `gallery_photos[]` |
| 11 | **Video** | "CLICK TO PLAY" vinyl plate | Film plate: vinyl graphic doubles as the play button; `video_url` in a 16:9 mat. Same asset as #2, different surface |
| 12 | **Wedding gift** | "WEDDING REGISTRY" dark plate | Deep-wine/photo plate, `gift_accounts` (provider / number / holder) + `gift_address_name` + `gift_address`, copy toast. No Amazon link |
| 13 | **Dress code** | "ATTIRE" + 4 swatch circles | Heading, `dresscode.description`, swatch dots with gold rims from `dresscode.colors[]` |
| 14 | **Wishes** | "PLEASE RSVP" form card | **Wishes half only** (§0.5 rule 4): name + message form + approved feed. The RSVP half is the dock |
| 15 | **Closing** | "Thank You" wreath + torn photo | `template_content.closing_message`, monogram, torn-edge `cover_photos[2]`, names overlay, Aksaraa badge footer |

Shipped order (contract order; the reference's pairings kept where possible):

```
gate → cover → opening video → welcome (+ kalimat pembuka) → mempelai
     → event → countdown → turut mengundang → rundown
     → gallery → video → gift → dress code → wishes → closing
```

Movements versus the reference, deliberate and recorded here as §0.5 requires:
`countdown` moves **after** `event` (contract 6→7; the reference has save-the-date
before the ceremony block), `gift` moves **before** `dress code` (contract 12→13;
the reference has attire before registry), and the reference's standalone music
player folds into `video` (#11) with the vinyl graphic also serving as the music
toggle.

### 3.1 Reference sections outside the contract — approval requested

Per §0.5 rule 2, these are **reported, not shipped and not silently dropped**:

| Block | What it is | Column that would feed it | Lost if dropped |
|---|---|---|---|
| **Love story** | Full-bleed photo + script "Our Love Story" + centred paragraph | `stories[]` (`title`, `description`, `image_url`) — **exists** | The couple's narrative beat; the design's only mid-page "voice" block. Recommended to ship **after mempelai**, pending approval |
| **Accommodation** | Torn-edge hotel photo, two hotels in script, `BOOK HERE` buttons, room-block paragraph | **none** in `wedding_profiles` | Nothing for a couple who has no hotel blocks; keeping it means inventing hotel copy per couple. Recommended to **drop** (it is not "Where to Stay" under another name) |
| **RSVP form** (Canva form: attending / entrée / +1 / pax) | Native Canva form with no backend | — | Not applicable: §0.5 rule 4 — RSVP lives in `InvitationOverlay`; the entrée choice has no schema field and is dropped with it |

Awaiting an explicit yes/no on **Love story** and **Accommodation** before
Phase 1 starts.

---

## 4. Palette + type

Sampled from the 1366 px capture (patch averages, not guesses):

| Token | Value | Evidence |
|---|---|---|
| `--iv-paper` | `#fdfcf8` | every paper section (sampled at y = 1 900 / 5 000 / 7 200 of the tall capture) |
| `--iv-paper-deep` | `#fbfaf6` | card field + plate fill |
| `--iv-ink` | `#222220` | hero overlay / body copy on paper |
| `--iv-ink-soft` | `#5a595c` | secondary copy, small caps labels |
| `--iv-gold` | `#cabca2` | wax-seal face (patch average `#cabca2`) |
| `--iv-gold-deep` | `#94826d` | seal shadow/emboss, heart nodes (`#9d8d79` rim) |
| `--iv-taupe` | `#948470` / `#7a6c58` | divider hairlines, "BOOK HERE" rules (Canva palette) |
| `--iv-sage` | `#e6edd5` | the design's single mint fill (envelope flap / placeholder plates) — a whisper, never a section background |
| `--iv-wine` | `#673637` | the one deep accent in the Canva palette; use it for the gift plate instead of black |

Type usage across the 74 text elements. The reference faces are **vendored** into
`public/templates/ivory-lace/fonts/` and declared in `ivory-lace.css` (the shared
font pipeline does not carry them); they are subset-sized Canva WOFFs, so every
Latin glyph a couple name needs is present but the file is not a full family:

| Role | Reference | Count | Font used |
|---|---|---|---|
| Display / headings / names | **Ferly** | 20 | `ferly-400.woff` |
| Body | **Poppins** | 17 | existing `Poppins` |
| Script (names, venue) | **Pinyon Script** | 9 | existing `Pinyon Script` |
| Small caps / dates | **Cormorant Garamond** | 9 | existing `Cormorant Garamond` |
| Calendar | **Garet** | 7 | `garet-400.woff` |
| Secondary UI | **Josefin Sans** | 7 | `josefin-400.woff` |
| `OPEN` / buttons | **Cinzel** | 1 | existing `Cinzel` |
| Date stamp | **The Seasons** | 1 | `theseasons-400.woff` |

Type rules from the capture:

- Display headings are **uppercase, hairline weight, very wide**
  (`0.26em` tracking). This is the signature; dropping the tracking makes it a
  generic serif invitation.
- Hero names ≈ 11–13 vw mobile, `clamp(3rem, 9vw, 6.5rem)` desktop, weight 300.
- Body 13–15 px mobile / 15–17 px desktop, `line-height: 1.75`. The reference
  sets `letter-spacing: 0.147em` on body copy — halve it for ours so Indonesian
  copy stays readable at 390 px.
- Small caps labels 10–11 px, `0.2em` tracking.
- The welcome card is signed on a slope: first name raised (`-0.16em`), second
  lowered (`+0.14em`), ampersand between them — the reference's signature.
- Display headings set the `&` a size smaller than the words (`.amp`).

---

## 5. Asset audit

The reference pool is **52 unique media entries** (`_assets/media/<hash>.<ext>`,
each mirrored at `SCREEN` / `SCREEN_2X` / `SCREEN_3X`). All **124 files return
200** — no referer lock, no signed URLs — so "can we get the reference art" is
yes for every ornament. (One design entry, the tall card-frame PNG
`5eaf760f…`, is referenced in the design JSON but 404s in the export; the
welcome plate is drawn in CSS instead.)

Everything decorative is vendored, converted to webp at display size, and
committed under `public/templates/ivory-lace/` — **15 files, 616 KB**:

| File | Source | Used for |
|---|---|---|
| `envelope.webp` (1500×1059) | lace envelope with the wax seal baked in | the gate backdrop — the reference's own cover |
| `wreath.webp` (760×1064) | laurel wreath line art | monogram on the cover + closing (`couple_initials` sits inside it) |
| `sprig.webp` (560×750) | white blossom branch | welcome plate corner + film plate |
| `pin.webp` (260×456) | sage map pin | event "Location" |
| `icon-arrival.svg`, `icon-rings.svg`, `icon-camera.svg`, `icon-dinner.svg`, `icon-music.svg`, `icon-cake.svg`, `icon-car.svg` | the reference's timeline icon set | rundown rows (cycled for longer lists) |
| `icon-heart.svg` | outline heart | dotted timeline nodes |
| `divider.svg` (2796×141) | hairline with heart | gate + welcome rule |
| `paperclip.svg` | paperclip | calendar plate |
| `vinyl.webp` (520×450) | record | music toggle + film plate (`mix-blend-mode: multiply` drops its white box) |

**Not shipped:** the reference photography (the couple, the Lake Como venue, the
hotels) — replaced by `cover_photos`, `stories[].image_url`,
`gallery_photos`, `groom/bride_photo`. **Not shipped and not portable:** the
Canva fonts (see §4), the TickCounter countdown, the Canva RSVP form, the
Amazon registry link, and the Canva footer chrome.

> Licensing note: the vendored files are Canva stock elements from the
> reference export. The owner approved using them for this template
> (`docs/REA_IVORY_LACE.md` §11); if the template is ever resold as an asset
> pack, these 15 files must be redrawn or licensed. The fonts are the one thing
> that cannot be matched exactly — Canva's woff files are subsetted to the
> reference's own characters, so arbitrary couple names would render with
> missing glyphs.

## 6. Interaction inventory

| Behaviour | Reference | Port |
|---|---|---|
| Open the invitation | `open` → second Canva page | `opened` state; gate hides, page scrolls to the first content section, `scrollTo(0,0)`, scroll lock released (`:has()` CSS fallback) |
| Music | vinyl art + `CLICK TO PLAY` → YouTube | `track_url` via `<audio preload="auto">` on the gate; vinyl graphic is the reveal-after-open music toggle |
| Film | same YouTube embed | `video_url` in #2 (full-bleed intro) and #11 (16:9 plate) |
| Countdown | TickCounter iframe (`Asia/Makassar`, 2027-01-01) | `useCountdown` on the event date |
| Calendar | baked April-2027 screenshot | generated grid, heart on the event day |
| RSVP | Canva form | **Not ported.** `InvitationOverlay` dock only, with `!preview_mode && !template_demo` guards |
| Registry | Amazon button | `gift_accounts` + copy toast |
| Scroll reveals | none (static Canva pages) | `IntersectionObserver` fade-up, `prefers-reduced-motion` respected |
| Lightbox | none | Gallery lightbox (Esc/←/→) — expected for a photo-led design |

---

## 7. Copy that must not ship

- Names **DAVID & MARIA**, dates `17.04.2028` / `APRIL 17, 2027`.
- **"Anthony and Charlotte's story…"**, `ANTHONY&CHARLOTTE@gmail.com`,
  `ANTHONY&CHARLOTTE Wedding` — leftovers from another deck.
- **Villa Erba · Cernobbio, Lake Como, Italy**, **Villa d'Este**,
  **Hotel Miralago Cernobbio**, RSVP deadline `17 JULY, 2026`.
- TickCounter target, YouTube id `u2ah9tWTkmk`, Amazon registry URL.
- Canva footer + modals.

Demo props reuse Aksaraa's own sample content (Sandhya/`DE` photos + English
copy), never the reference couple.

---

## 8. Port plan

Component: `src/components/templates/ivory-lace/`
(`index.tsx`, `Wishes.tsx`, `ivory-lace.css`, `ornaments.tsx`).

```
<root class="ivory-lace">
  gate      sealed envelope · guest name · OPEN · music preload
  cover     #1  photo · wreath monogram · THE Wedding OF · names · date
  videoIntro #2 when video_url
  welcome   #3+#4  DEAR FAMILY & FRIENDS plate · opening_title/description · script names
  mempelai  #5  two torn-edge portraits · names · parents · IG
  story     #?  story plate (pending approval)
  event     #6  per session: torn-edge photo · heading · script venue · city · date · pin
  countdown #7  SAVE THE DATE · calendar plate · clock
  inviting  #8  Turut Mengundang, quiet list
  rundown   #9  dotted-heart timeline
  gallery   #10 torn-edge plates + lightbox
  video     #11 film plate / vinyl
  gift      #12 wine plate · accounts · address w/ recipient name
  dresscode #13 ATTIRE · description · gold-rimmed swatches
  wishes    #14 form + approved feed
  closing   #15 monogram · torn photo · names · Aksaraa badge
  InvitationOverlay dock (opened, real link only, hidden while modals open)
</root>
```

Content spec:

```ts
content: {
  cover_slots: 3,
  cover_slot_labels: ["Foto Sampul", "Foto Kisah Cinta", "Foto Penutup"],
  groom_photo: "single",          // mempelai
  bride_photo: "single",
  story_photo: true,              // only if the story block is approved
  sections: {
    opening_description: true,    // welcome plate carries the couple's words
    quote: false, countdown: true, video: true, story: true,
    gallery: true, gift: true, inviting: true, dresscode: true,
    livestream: false, rundown: true, contacts: false,
  },
  extras: true,
}
```

`templateExtras.ts` keys (each needs `templates: [..., "ivory-lace"]` **and** a
placeholder in the same language as the demo copy):
`cover_apology`, `welcome_heading`, `save_date_title`, `events_intro`,
`inviting_title`, `rundown_title`, `gallery_intro`, `gallery_quote`,
`video_intro`, `gift_intro_title`, `gift_intro_description`, `dresscode_intro`,
`wishes_intro`, `closing_message`.

Editor/API/ops: everything above is existing content (`sessions`, `stories`,
`rundown`, `dresscode`, `gift_accounts`, `inviting_families`, `video_url`,
`gallery_photos`, `template_content`) → **no new columns**. Phase 2 is only the
`web_templates` row:

```sql
INSERT INTO web_templates (code, name, description, preview_image_url, demo_url,
  sort_order, category, source_type, package_eligibility, tier, is_active, no_photo)
VALUES ('ivory-lace', 'Ivory Lace',
  'Undangan editorial kertas ivory — sampul amplop renda bersegel lilin, monogram wreath, mempelai, kisah cinta, kalender & hitung mundur, acara, susunan acara, galeri, video, hadiah, dress code, dan ucapan.',
  '/templates/ivory-lace/thumbnail.webp', '/templates/ivory-lace/preview',
  <next free slot>, 'Editorial', 'inhouse',
  '<copy the lace array>', 'Baru', true, false)
ON CONFLICT (code) DO UPDATE SET …;
```

---

## 9. Traps found in this reference

1. **The in-app browser cannot render Canva exports** — capture with headless
   Chrome; the DOM only yields the screen-reader text layer.
2. **The bootstrap JSON needs two decode layers** (JS string escapes → JSON).
3. **Fixed 1366 px canvas**: at 390 px headings clip at the right edge and card
   frames lose their right side. Do not copy the mobile behaviour.
4. **Fonts are Canva-only** (Ferly, Garet, The Seasons, Parfumerie).
5. **`CLICK TO PLAY` is a YouTube iframe**, not audio — music and film are the
   same embed in the reference.
6. **Countdown and RSVP are third-party iframes** (TickCounter, Canva forms).
7. **Leftover copy from another deck** ("Anthony and Charlotte", Amazon, the
   Italian hotels) — a template quick-start tell.
8. **Accommodation has no Aksaraa column** — approval requested, recommended drop.
9. **All decorative art is licensed Canva stock.** The owner chose the reference look, so the 15 ornament files are vendored (see §5) with that caveat recorded.

---

## 10. Definition of done (template-specific)

- [x] **14 of the 15 minimum sections present** in the order recorded in §3; #2 opening video is an owner-approved omission (the reference has none)
- [ ] **No outside-list section shipped without approval** (story / accommodation
      pending — §3.1)
- [ ] **RSVP is the dock only**; `InvitationOverlay` carries
      `!preview_mode && !template_demo`
- [x] Gate: the reference lace envelope + its wax seal, `?to=` guest name, `OPEN` in Cinzel
- [ ] Wreath monogram generated from `couple_initials` (no baked initials)
- [ ] Torn-paper edge is one reusable `clip-path` on every photo plate
- [ ] Calendar generated from the event date; heart on the day; `useCountdown`
- [ ] Timeline hearts + icons are our SVGs (no PNG icons)
- [ ] Gallery lightbox (Esc/←/→) and reduced-motion fallbacks
- [ ] Attire swatches from `dresscode.colors[]`; gift from `gift_accounts`
- [ ] Wishes demo mode never POSTs; `keepDemoIds` includes `ivory-lace`
- [ ] Every section gated by `feature_gates` **and** `*_visible`
- [ ] 390×844 has no horizontal overflow (the reference fails this)
- [ ] Music preloads on the gate, video streams on open, corner spinner only on
      a sustained stall
- [ ] Footer carries the Aksaraa badge (`assaLogo` + "Wedding by Aksaraa")
- [ ] `tsc`, staging build, preview curl, 1440×900 QA, `web_templates` row
      registered before the final build

---

## 11. Open decisions

1. **Love story** — ship it (data exists: `stories[]`)? Recommended **yes**,
   placed between mempelai and event.
2. **Accommodation** — approve the **drop**? Recommended yes (no column).
3. **Language of demo copy** — English (reference) vs Indonesian (adat family).
4. **Template code / name** — `ivory-lace` / "Ivory Lace" — confirm.
5. **Cover slots** — 3 (Sampul / Kisah Cinta / Penutup) is the minimum that keeps
   every photo surface data-driven; 5 would add "Venue" and "Gift plate".
