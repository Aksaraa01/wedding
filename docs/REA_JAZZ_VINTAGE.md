# REA — Our Wedding Link "Velvet Overture" → Aksaraa `jazz-vintage`

Reverse-engineering + build record for the burgundy-and-olive jazz-age
invitation. Reference: `https://our-wedding.link/design/velvet-overture`
(public demo, sample couple Arya & Laras). Assets were vendored with the
owner's written permission ("Semua Aset boleh, Vendor all"); the reference
couple's photographs, the reference soundtrack and the Our Wedding Link
branding are **not** shipped.

---

## 1. Verdict

| Question | Answer |
|---|---|
| Real invitation | SSR Nuxt page at `/design/velvet-overture`; the invitation renders inside a phone stage (`style-mobile` even on desktop) |
| Assets available | Yes — 26 ornament files, all public, no referer lock. Re-encoded to WebP (1.57 MB total) |
| Fonts | Cormorant Garamond + Montserrat + Playfair Display, all already vendored in `public/fonts` — no Adobe Fonts, no new download |
| Music | Reference track is third-party audio → **not** vendored; `track_url` drives the gramophone card |
| Photos | Reference couple photos → **not** vendored; portraits/gallery come from `wedding_profiles` |
| RSVP | Reference ships an inline RSVP form → **not** ported; RSVP/QR is the shared `InvitationOverlay` dock |

---

## 2. Measured design system (390 px stage)

| Token | Value |
|---|---|
| Paper | `#f2e6d2` with `paper-texture` at `center / 300px repeat`, `multiply`, `.55` |
| Burgundy | `#6a1424` (calendar/music cards, headings, buttons) |
| Ink | `#3b2a22` |
| Olive | `#5d6838` (eyebrows, wishes border, dress swatches) |
| Gold | `#c9a15a` (hairlines, frames, gilding) |
| Section heading | Playfair Display 30 px / 400, `#6a1424` |
| Couple / story names | Cormorant Garamond 30 px / 500 |
| Cover names | Cormorant Garamond 54 px / 400, line-height 1.02 |
| Closing names | Cormorant Garamond 32 px; kicker 46 px |
| Eyebrow | Montserrat 10 px / 500, `letter-spacing 2.4px`, uppercase, olive |
| Body | Montserrat 13 px (12–13), ink at 75–92 % |
| Bank number | Montserrat 18 px / 700, `.5px` tracking |
| Motion | animate.css `fadeIn` / `fadeInUp` reveals on scroll → one `IntersectionObserver`, `translate`/`scale` only |

Ornament positions were sampled per section (390×N canvases) and are stored as
percentages in the component; `container-type: inline-size` + `cqw` keeps them
proportional from a 320 px handset to the 500 px desktop column.

---

## 3. Asset audit (vendored)

| File | Role | Bytes |
|---|---|---|
| `paper-texture.webp` | crumpled cream paper tile | 49 KB |
| `cover-curtain.webp` | burgundy curtain stage (cover + closing) | 32 KB |
| `cover-chandelier.webp` | crystal chandelier, transparent | 141 KB |
| `cover-table.webp` | olive velvet table with roses/candles, transparent | 131 KB |
| `garland-band.webp` | rose garland band | 190 KB |
| `sheet-music.webp` | antique sheet-music strips | 174 KB |
| `frame-oval.webp` | gilded oval mirror frame (transparent window) | 53 KB |
| `gramophone.webp` | gramophone still life (music card) | 60 KB |
| `welcome-jewel-box.webp` | antique jewel box with tulle | 138 KB |
| `card-cream.webp` | cream card with gold double border | 8 KB |
| `cameo-bow.webp` | cameo brooch with velvet bow | 30 KB |
| `tulle-bow.webp` | tulle bow | 33 KB |
| `calendar-tulle.webp` | tulle + white flowers under the calendar | 102 KB |
| `pocket-watch.webp` | gold pocket watch | 38 KB |
| `door.webp` | olive arched door | 35 KB |
| `orchid.webp` | burgundy orchid spray | 42 KB |
| `velvet-tag.webp` | velvet bow with blank tag ("LOCATION") | 23 KB |
| `lace-band.webp` | burgundy lace strip | 173 KB |
| `frame-cream.webp` | cream card with gold hairline frame | 22 KB |
| `velvet-bow.webp` | olive velvet bow with ruby | 23 KB |
| `bouquet.webp` | rose bouquet | 35 KB |
| `gift-envelope.webp` | envelope with wax seal | 28 KB |
| `rundown-hourglass/-ringbox/-champagne/-fan.webp` | rundown vignettes | 12–15 KB each |

Total **1.57 MB**. All decorative images are `aria-hidden`, lazy-loaded and
given an intrinsic box (`aspect-ratio` or explicit width) so no lazy ornament
can collapse to 0 px.

Not shipped: reference couple photos (`9f…`, `a04c…`), reference MP3, Our
Wedding Link logo/footer, inline RSVP form.

---

## 4. Section contract (final order, per the Aksaraa SOP)

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `groom_name`, `bride_name`, `estimated_wedding_date`, `guest_name` | always | names 0 ⇒ empty span, no NaN | profile + `tc.cover_guest_label`/`tc.open_button` | `fadeInUp` chorus on mount, chandelier sway |
| 2 | Opening video | — | omitted (see §5) | — | — | — |
| 3 | Welcome | `tc.welcome_title`, `tc.welcome_message`, `track_url` | always; music card only when a track exists | no track ⇒ no card, card still centres | extras → i18n `welcomeTitle`/`welcomeMessage` | reveal on scroll |
| 4 | Kalimat pembuka | `opening_title`, `opening_description` | hides when both empty (`opening_description` spec on) | empty ⇒ section dropped, no blank card | profile → `tc.pembuka_title` | reveal |
| 5 | Mempelai | `groom_full_name`/`bride_full_name`, portraits, parents, IG | `person_photos !== false` | 1 portrait ⇒ other falls back to `/defaults`; parents/IG optional | `tc.mempelai_title`, `tc.mempelai_intro`, i18n labels | staggered reveal |
| 6 | Event | `sessions[]` | always; needs ≥1 session | first = door hero, rest = cream cards; 1 ⇒ one hero, no blank card | `tc.events_title/intro/maps_label/calendar_button` | reveal per card |
| 7 | Countdown | `estimated_wedding_date` + `sessions[0].time` | needs a parseable date | always 6 calendar rows; past date ⇒ zeroes | `tc.countdown_title/intro`, i18n units | tick 1 s |
| 8 | Love story | `stories[]` | `gates.story` **and** `story_visible` | 0 ⇒ section gone; 1 ⇒ no trailing lace; photo optional per story | `tc.love_story_title/intro`, story fields | frame reveal per chapter |
| 9 | Rundown | `rundown[]` | `rundown_visible !== false` | icons cycle 4 art, any row count | `tc.rundown_title/intro` | reveal |
| 10 | Gallery | `gallery_photos[]` | needs data | nth-child 3n+1 spans; 1 photo ⇒ one wide tile, no gap | `tc.gallery_title/intro` | reveal, lightbox |
| 11 | Video | `video_url` | `gates.video` **and** `video_section_visible` **and** URL | file ⇒ `<video controls>`; YouTube/Vimeo ⇒ iframe; empty ⇒ hidden | `tc.video_title/intro/caption` | poster + play medallion |
| 12 | Wedding gift | `gift_accounts[]`, `gift_address[_name]` | `gift_section_visible`; address also `gates.gift_address` | accounts only / address only / both ⇒ tabs only when both | `tc.gift_*`, i18n leads | tab switch, copy toast |
| 13 | Dress code | `dresscode` `{title,description,colors[]}` | `dresscode_visible !== false` | 0 colours ⇒ no swatches; title/description optional | `tc.dresscode_title/kicker/note` | reveal |
| 14 | Wishes | `/api/wishes` + `wishNameState` | always | demo id ⇒ sample feed, never POST; 10/page pager | `tc.wishes_*` → i18n | reveal |
| 15 | Turut mengundang | `inviting_families[]` | `gates.inviting_families` **and** `inviting_families_visible` | 0 ⇒ section gone | `tc.inviting_title/intro` | reveal |
| 16 | Closing | `tc.closing_message`, names, date | always (fallback sentence) | no message ⇒ i18n default kept | `tc.closing_kicker/message` → i18n | reveal |

RSVP/QR is **not** a section: `InvitationOverlay` renders inside the template,
only after open, only for a real guest link, and never in `preview_mode` /
`template_demo`.

---

## 5. Deliberate deviations

1. **No opening film.** The SOP row 2 is conditional ("hanya jika desain dibuka
   dengan film"). The reference opens with a static curtain stage, not a film,
   so the cover opens straight into the invitation and `video_url` renders in
   section 11 only. Autoplaying the couple's (possibly long) wedding film as a
   gate would trap guests behind it.
2. **Reference inline RSVP dropped.** Attendance/pax/QR stay in the shared dock.
3. **Labels kept.** "Mempelai Pria / Mempelai Wanita" are part of the reference
   layout; they are i18n keys (`mempelaiGroom`/`mempelaiBride`), not filler copy.
4. **Music card controls.** The reference shows prev/pause/next; a couple has one
   track, so prev/next seek ±10 s instead of switching tracks.
5. **Reference photos/audio replaced** by Aksaraa sample content (`Albarn & Faye`,
   `DE` photography, repo demo track).
6. **Calendar year/month** is localised (MON… vs SEN…) instead of a fixed EN grid.

---

## 6. Build log

- Component: `src/components/templates/jazz-vintage/{index.tsx,jazz-vintage.css,Wishes.tsx,assets.ts}`.
- Registered in `TEMPLATE_MAP` + `TEMPLATE_CONFIGS` (`cover_slots: 0`,
  portraits/story photos on, initials off, quote/livestream/contacts off).
- `demoProps` entry (EN preview copy + ID sample extras), `templateExtras`
  (46 fields), i18n keys, preview `keepDemoIds`, migration
  `20261127000000_jazz_vintage.sql`.
- Guards: `npx tsc --noEmit` clean; `audit:copy` clean with **zero** allowlisted
  literals; `audit:extras` clean; `check-i18n` 139 used / 146 defined.
- QA: 390×844 and 1440×900, scrollWidth === innerWidth, no console errors, state
  matrix (all gates off/on, one event, no stories, one photo, gift variants,
  video hidden, reduced motion, JS disabled) — see §7.

## 7. QA results (staging)

Filled in after the staging deploy: preview URL, couple test URL, per-section
checks, and any fix that required a re-deploy.
