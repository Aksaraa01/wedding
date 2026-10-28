# REA — Invistory "Still & Ever" → Aksaraa in-house template

Reference: <https://invistory.com/invitation-template/still-and-ever?lang=id>
Date: 2026-10-27 · Template code: `still-ever` · Source type: `inhouse`

Method: rendered the SPA in a real browser (mobile 800×~950 viewport), read the
public catalogue JSON (`/api/invitation-catalogue/still-and-ever?lang=id`), walked
every snap page, and extracted computed typography, palette, section order and
the asset manifest. Assets were then HEAD-checked and downloaded.

---

## 1. Verdict

**Feasible with no schema changes.** Every section in the reference maps onto a
column that already exists on `wedding_profiles` (`sessions`, `stories`,
`gallery_photos`, `dresscode`, `livestream`, `video_url`, `quote_text/source`,
`gift_accounts`, `cover_photos`, `template_content`). No new column, no new
feature gate — only a `web_templates` row.

All nine reference assets are **publicly reachable and hotlink-free** (HTTP 200,
`image/webp`, no `Referer` required). We vendor recompressed copies (~0.8 MB
instead of 1.37 MB) — see §4.

Two reference behaviours are intentionally **not** ported (both explained in §8):
the per-page scroll-snap paging chrome, and the platform footer/branding.

---

## 2. What the reference actually is

A **"stationery" snap-deck**: full-viewport pages, vertical scroll-snap
(`scroll-snap-type: y mandatory`, `scroll-snap-stop: always`), a dark charcoal
paper backdrop behind everything, cream editorial typography, and *one idea per
page*. It is not a long-scroll story like Sandhya — it is a photo album you page
through.

Its internal engine (`inv-snap-page` → `inv-canvas-section` →
`inv-canvas-scene` → absolutely positioned `inv-canvas-layer`, scene width
`484px` scaled to viewport) is Invistory's own canvas renderer. **Do not port
the canvas engine** — we re-implement the same layout with normal flow + a
section rhythm, which is what every other Aksaraa template does.

### Section order (19 rendered pages → 15 logical sections)

| # | Reference (`data-invitation-section`) | Eyebrow | Heading |
|---|---|---|---|
| — | cover gate (`inv-envelope-cover` + wax seal) | — | Alex & Michie |
| 1 | `hero` (3-photo slideshow) | PERNIKAHAN | Alex / & / Michie |
| 2 | `quote` | SEPATAH KATA DARI KAMI | Selalu kamu. |
| 3 | `couple` (groom) | MEMPELAI PRIA | Alex |
| 4 | `couple` (bride) | MEMPELAI WANITA | Michie |
| 5 | `stories` (3 chapters) | CERITA KAMI | Awal cerita kita |
| 6 | `countdown` | — | Hari yang kami nantikan |
| 7, 8 | `events` (one page per event) | — | Pemberkatan / Resepsi |
| 9 | `dresscode` (palette circles) | BUSANA | Busana untuk hari bahagia |
| 10 | `gallery` (2-col masonry) | MOMEN BERSAMA | Hari-hari bersamamu |
| 11 | `livestream` | SIARAN LANGSUNG | Hadir dari mana saja |
| 12 | `video` | DALAM REKAMAN | Sepotong cerita kami |
| 13 | `rsvp` | KONFIRMASI KEHADIRAN | Bisa hadir bersama kami? |
| 14 | `gift` (tabs: gift / registry) | — | Dengan terima kasih |
| 15 | `wishes` (tilted card scroller) | DENGAN CINTA | Sepatah kata untuk kami |
| 16 | `closing` | — | Sampai bertemu. |

There is **no** Turut Mengundang, Rundown, or Hubungi Kami section in this
reference. Both were added afterwards at the client's request and styled to the
same stationery system rather than copied from a reference page — Turut
Mengundang sits between `couple` and `story`, Rundown between `events` and
`dresscode`. Hubungi Kami stays off.

### Added sections (client request)

Both reuse the existing primitives (`se-section` / `se-wrap` / `se-eyebrow` /
`se-display se-heading` / `se-hr` / `data-se-reveal`), so they inherit the same
128px desktop padding, 18ch heading measure, and reveal stagger.

- **Turut Mengundang** (`data-section="inviting"`, `profile.inviting_families`):
  centered eyebrow `TURUT MENGUNDANG` → heading `With Honour` → centered 54px
  rule → one-line gratitude → a *ledger* of family names (DM Serif 19→24px,
  `text-wrap: balance`), each row between `--se-line-soft` hairlines inside an
  820px measure. No cards, no gold — the countdown clock already establishes
  the hairline-ledger idiom.
- **Rundown** (`data-section="rundown"`, `profile.rundown` `{time, description}`):
  left-aligned head (like `events`) then a two-column timeline list — time in DM
  Serif (72px column on mobile, 120px from 900px), description in `--se-soft`,
  rows divided by hairlines. A row with only a time or only a description spans
  both columns.

Both are hidden when their data is empty and honour
`inviting_families_visible` / `rundown_visible`.

### Layout mechanics worth copying

- `hero`: full-bleed desaturated photo, left-aligned eyebrow + 54px hairline
  rule, names stacked `Alex / & / Michie` with an oversized italic ampersand
  between, date at the bottom, and a vertical line + "GULIR UNTUK MEMBACA".
- `couple`: page-wide photo backdrop, portrait image floated as a tall card
  (336px wide, 4:5), eyebrow printed *over* the backdrop, then name (62px
  display) → full name (18px/600) → parents (16px) → Instagram handle.
- `stories`: heading left, a small portrait inset to the right of the heading,
  description, then chapters stacked vertically — each chapter = photo floated
  right (128×156) + year (11px, letter-spaced) + title (28px display) + copy,
  separated by `1px` cream-40% rules.
- `countdown`: oversized editorial date block (`18` at 130px next to
  weekday/month/year stacked with a vertical rule), full-width hairline, then a
  4-column clock with 1px dividers and hairline top border, then a pill
  "Simpan tanggal" (Google Calendar).
- `events`: same editorial date block, centered, then time / venue / address and
  a "Lihat lokasi" pill.
- `dresscode`: `display_mode: palette` + `swatch_style: circles` — 140px circles,
  inset hairline + soft shadow, label under each.
- `gallery`: column masonry, 2 columns, 10px gap, no radius, desaturated to
  match the print-album tone.
- `livestream` / `video`: a rounded (`14px`) 16:9 poster frame with a small icon
  badge, title and description inside; the reference wraps it in a
  "boarding-pass" chrome (`FOREVER AIRWAYS / FIRST CLASS MEMORIES`) which is
  **hidden by default** (`display:none`) for this skin — ignore it.
- `wishes`: a fixed-height (595px) internally scrolling stack of tilted
  (`±2deg`) dark translucent cards, plus a name + message form above.
- closing + footer: closing message and names over the closing photo, then the
  platform footer (not ported — we use the Aksaraa badge).
- cover gate (envelope): `body(perspective 3000, origin 50% 0)` →
  `shell > pocket` (clip `0 28.6% / 50% 63.6% / 100% 28.6%`, z2) and
  `lid` (height 64%, `transform-origin: center top`, `transform-style:
  preserve-3d`, z3). The reference lid is a **two-sided plane**: `lid-front`
  (`translateZ(.5px)`, `backface-visibility: hidden`, carries the drop-shadow,
  the flap, the flap's cast shadow and the stationery card) plus `lid-back`
  (`rotateX(180deg)`, clipped to the flap polygon, envelope paper + inset
  shadow) — without the back face the print shows through mirrored past 90°.
  Flap clip is `polygon(0 0, 100% 0, 100% 45%, 50% 100%, 0 45%)`, card at
  `top: 15%`, seal at `top: calc(64% - 44px)`, action at `top: 77%`. Timings
  matched by measurement: seal fades `0.45s`, action `0.3s`, lid
  `rotateX(170deg)` over `1.8s cubic-bezier(0.4, 0, 0.2, 1)` after a `0.38s`
  delay, gate released at `2800ms` (`120ms` under reduced motion); music starts
  on the gesture, not after the animation. `will-change: transform` on the lid
  and no React state ticking during the flip keep it at 60fps on phones.
- light out of the envelope (client direction: the inside must read **bright**,
  not dim-to-black): `.se-gate__inner` is the lit inside back of the jacket —
  warm `#ded6c4` paper with a hot core that scales `0.86 → 1.14` and lifts
  `opacity 0.3 → 1` over `1.5s` from `0.4s` once `.is-opening` lands, and
  `.se-gate__lid-back` uses the same lit cream paper (`#ded4c1`) so the flap's
  inner face is the light source, not a dark panel. A `.se-bloom` layer (fixed,
  z95, cream radial `#fffdf7 → #ddceb0`) fades in at `780ms`, peaks at `0.94`
  over `1.5s` while the flap is already past 90°, holds through the `2800ms`
  release, then lifts over `1.15s` as the invitation mounts — the hero is
  revealed *out of* the light instead of out of black. Reduced motion shortens
  both ramps to `0.25s`. Measured on 390×844: bright V of interior light at
  `800ms`, warm wash `1.6–2.6s`, invitation emerging `3.2s`.
- background film: once opened, the couple's YouTube film is mounted through the
  shared `dark-split-rail/BackgroundVideo` (muted, looping, `dim`, poster = hero
  slot 1) and a `.se-bgveil` charcoal gradient sits between it (z0) and the
  invitation (z2) so body copy stays legible. It is mounted only after the gate
  opens, so the envelope flip never competes with a video download. The film is
  wrapped in `.se-bgfilm`, which lifts and scales the (fixed, viewport-pinned)
  player layer by `translateY(-26px) scale(1.12)` so YouTube's own title band is
  cropped past the top edge — `controls=0` does not remove it.
- music (measured against the reference player in `assets/index-*.js`):
  `<audio loop preload="none">` — not `preload="auto"` — started by the open
  gesture, optional in/out points (`music_start_seconds`, `music_end_seconds`)
  clamped in `onLoadedMetadata` + `onTimeUpdate` exactly like the reference's
  `start_seconds` / `end_seconds`, paused as soon as the wedding film plays
  (`onPlay` from the IFrame-API player), and controlled by a bottom-right 48px
  disc whose record spins only while playing.

---

## 3. Design system (measured, not guessed)

| Token | Value |
|---|---|
| Background | `#242629` charcoal + paper-grain texture overlay |
| Text | `#f7f5f1` |
| Muted / eyebrow | `#d4d0ca` |
| Card (envelope stationery) | `#f7f5f1` with `#242629` ink |
| Wax seal | gold rim `#c5a16b → #dcb887`, seal body radial `#f9e6b9 → #8b6438` |
| Hairlines | `rgba(247,245,241,.32)` (rules), `rgba(215,194,162,.27)` (clock dividers) |
| Display font | **DM Serif Display** (400; the reference requests 500 → synthetic bold) |
| Body font | **DM Sans** (400/500/600) |
| Eyebrow | 11px / 2.4px tracking / uppercase |
| Display scale (mobile) | names 62–72px · section h2 34–46px · closing 34px |
| Body copy | 17px / 1.55 |
| Radius | 0 for photos, 13–14px for cards/frames, 999px for pills |
| Photo treatment | `filter: saturate(.2–.35)` + dark scrim — the whole deck is near-monochrome |

Neither font is in `public/fonts` yet → both were added to
`scripts/fetch-fonts.js` + `scripts/gen-font-css.js` and vendored
(`dmsans-300..700`, `dmserifdisplay-400`, `-400-italic`).

---

## 4. Asset audit (all reachable)

`HEAD` requests returned `200 image/webp`, `cache-control: max-age=3600, public`,
no hotlink protection. All eight template photos are **1122×1402 (4:5 portrait)**;
the paper grain is 1024×1536.

| Asset | Origin URL | Bytes | Use in reference | Shipped as | Shipped bytes |
|---|---|---|---|---|---|
| setting.webp | `api.invistory.com/storage/invitation-templates/still-and-ever/setting.webp` | 220,636 | hero slide 1, cover card, gallery, live/video poster, gift intro | `hero-1.webp` | 100,186 |
| hands.webp | …`/hands.webp` | 113,762 | hero slide 2, story chapter 2, countdown backdrop | `hero-2.webp` | 43,124 |
| garden.webp | …`/garden.webp` | 314,104 | hero slide 3, gallery | `hero-3.webp` | 144,960 |
| bride.webp | …`/bride.webp` | 110,826 | bride page portrait | not shipped | — |
| groom.webp | …`/groom.webp` | 71,230 | groom page portrait | not shipped | — |
| rings.webp | …`/rings.webp` | 99,062 | story intro, chapter 3, gallery | not shipped | — |
| table.webp | …`/table.webp` | 217,884 | story chapter 1, gallery | `gallery-4.webp` | 75,508 |
| flowers.webp | …`/flowers.webp` | 188,942 | gallery | not shipped | — |
| invitation-paper | `invistory.com/assets/invitation-paper-Nkut1kq0.webp` | 102,052 | full-page paper grain | `paper.webp` (720w, q52) | 6,436 |
| **total** | | **1,438,498** | | | **370,214** |

- Recompressed with sharp (widths 800–1000, q64–68); originals were oversized for
  a 390–430px viewport.
- Thumbnail generated for the template card (`thumbnail.webp`, 600×750).
- Only the assets the component actually consumes are vendored. Couple and gallery
  photos always come from profile data; the three hero slides and `gallery-4` are
  the decorative fallbacks (`ART_HERO`, `ART_STORY`, `ART_CLOSING`, `ART_POSTER`)
  used when a profile has no photos. `bride`/`groom`/`rings`/`flowers` derivatives
  were dropped after the story/couple sections were rebuilt to accept profile
  photos instead of per-chapter stock art.
- **Not vendored:** `logo-invistory-navy.png`, `images/banks/bca.svg` (we render
  `provider_name` / `resolveBankLogo`), the `FOREVER AIRWAYS` boarding-pass chrome,
  the language switcher, the reference couple's photos-as-data, and the music file
  (`Take-My-Hand….mp3` — licensed, and the reference itself ships
  `music.enabled: false`). Music comes from `profile.track_url`; demo falls back
  to `ASSETS.defaultMusic`.

**Asset risk: none.** No asset is behind a signed URL, no asset 404s, no asset is
loaded from a third-party brand kit except the paper grain (generic texture).

---

## 5. Data mapping

| Reference field | Aksaraa source | Notes |
|---|---|---|
| `cover.greeting` (PERNIKAHAN) | fixed copy | — |
| `cover.couple_display` | `groom_name & bride_name` | — |
| `cover.date_text` | `estimated_wedding_date` → `formatLongDate` | — |
| `guest_prefix` / guest name | `guest_name` (from `?to=`) | never patched into data |
| `hero.photo_*` (3 slides) | `cover_photos[0..2]` → gallery → groom/bride | `cover_slots: 3` |
| `quote.title` / `text` / `source` | `quote_text` + `quote_source` (+ section title from extras) | title defaults to a generic eyebrow |
| groom/bride names, full names, parents, IG, photos | `groom_*` / `bride_*` columns | — |
| `stories[]` (date/title/desc/image) | `stories` jsonb + `photo_background_path` | our `stories` shape has title/description/image_url (no year) → year rendered from `start_date`-style parse if present, else index label |
| `countdown.target_at` | `estimated_wedding_date` + first session time (`countdownTarget`) | + `gcalLink` for "Simpan tanggal" |
| `events[]` | `sessions` | name/date/time/venue/address/maps_url |
| `dresscode` (attire, colors, swatch_style) | `dresscode` jsonb (`title`, `description`, `colors[]`) | circles; `attire` comes from `dresscode.title` when set |
| `gallery[]` | `gallery_photos` | masonry 2-col, lightbox |
| `livestream` | `livestream` jsonb (`url`, `title`, `description`, `buttonLabel`) + gate `feature_gates`* | hidden when empty |
| `video` | `video_url` (YouTube or direct) + `video_section_visible` + gate `video` | — |
| `rsvp` | `InvitationOverlay` dock (RSVP modal + QR) | rendered inside template after open |
| `gift` (tabs) | `gift_accounts` + optional `gift_address` | bank card + registry tab |
| `wishes` | `/api/wishes` via `Wishes.tsx` | demo ids guard |
| `closing` | `template_content.closing_message` + `couple_short` | footer = Aksaraa badge |

**Gaps / decisions**

1. **Story year** — our `stories` jsonb has no `year`. The section renders a
   numbered eyebrow (`01`, `02`, …) instead of a year, and no extra key is exposed
   for it. No schema change.
2. **One page per event** — reference paginates events. We render them stacked in
   one section (consistent with editor/ops and countdown semantics).
3. **Scroll-snap** — not ported (see §8).
4. **`template_content` keys read by the component** (all need `templateExtras`
   entries for `still-ever`): `cover_apology`, `quote_title`, `love_story_title`,
   `gallery_title`, `gallery_quote`, `gift_intro_title`, `gift_intro_description`,
   `wishes_intro`, `closing_message`, `music_start_seconds`,
   `music_end_seconds`.

---

## 6. Feature gates honoured (both layers)

`story` (+`story_visible`), `video` (+`video_section_visible`),
`gift_address` (+`gift_section_visible`), `inviting_families`
(+`inviting_families_visible`), `rundown_visible`, `qr_code_book` (dock QR).
`dresscode_visible` / `livestream_visible` gate their sections; empty data hides
the section even when the toggle is on.

---

## 7. Content spec (shipped)

```ts
content: {
  cover_slots: 4,
  cover_slot_labels: ["Sampul 1", "Sampul 2", "Sampul 3", "Closing"],
  groom_photo: "single",
  bride_photo: "single",
  story_photo: true,
  sections: {
    opening_description: false,   // envelope cover has no opening paragraph
    quote: true, countdown: true, video: true, story: true,
    gallery: true, gift: true, dresscode: true, livestream: true,
    inviting: true, rundown: true, contacts: false,
  },
  extras: true,
}
```

Cover slot usage: slots 1–3 are the sliding hero covers (the hero crossfades
between them every 4.8s and pauses until the envelope opens), slot 4 is the
closing plate. The livestream card deliberately reuses slot 1 as its poster —
it is a companion surface, not a photo of its own.

`still-ever` also joins `TEMPLATES_WITHOUT_OPENING` (the cover is a stationery
envelope, not a "Kalimat Pembuka" block) so completeness/publish blockers stay
consistent.

---

## 8. Deliberate omissions (and why)

| Reference feature | Decision | Reason |
|---|---|---|
| Canvas engine (absolute-positioned layers, `484px` scene) | Replace with normal flow | Un-portable and unnecessary; every Aksaraa template is data-driven flow layout |
| `scroll-snap` paging on every page | Replace with long scroll + per-section reveal | Snap decks trap tall content (long stories/events) and break dynamic-height data; playbook already rejected it for dynamic templates |
| Boarding-pass media chrome (`FOREVER AIRWAYS`) | Omit | Hidden by default in the reference itself |
| "INVISTORY" signature + "Powered by Invistory" footer | Replace with Aksaraa badge | Third-party branding (playbook §1) |
| Language switcher, theme switcher | Omit | Platform chrome |
| Reference couple data, wish texts, bank "BCA" logo, music | Replace with Aksaraa demo data / `resolveBankLogo` / `profile.track_url` | Never ship reference data or licensed media |
| 19 api/invistory CSS files, 40+ Google font files | Port only DM Sans + DM Serif Display | Performance |

---

## 9. Build plan (staging first)

1. Vendor assets + fonts (done in this pass).
2. `src/components/templates/still-ever/{index.tsx,still-ever.css,Wishes.tsx}`.
3. Register in `templates/index.ts` (`TEMPLATE_MAP`, `TEMPLATE_CONFIGS`),
   `templateExtras.ts`, `templateSections.ts`, `demoProps.ts`,
   `templates/[code]/preview/page.tsx` (`keepDemoIds`).
4. Migration `20261037000000_still_ever.sql` (in-house row, tier `Baru`,
   eligibility copied from Manjari, `sort_order` next free).
5. `npx tsc --noEmit`.
6. Staging: apply the row to `jclolnjkjhyjilvymagr`, build with `.env.staging`,
   run the standalone server, smoke `/templates/still-ever/preview` + editor API.
7. Visual QA at 390×844 and 1440×900, then (separately) prod deploy + smoke on
   rafi-novi only.

### Status (staging verification)

| Step | Result |
|---|---|
| `tsc --noEmit` | clean |
| Staging row | upserted via PostgREST (`code=still-ever`, id `9c013565-af8e-4204-8ee2-c5c2bb548946`); `db push` was skipped because the local CLI had no staging DB password and `supabase/.temp/pooler-url` carries no credential. The migration file is the source of truth for the eventual `db push`. |
| Build | isolated worktree at `HEAD` (`d75f94e`), staging env sourced, standalone verified to bake only `jclolnjkjhyjilvymagr.supabase.co` |
| Preview | `200` and renders every section heading; all six vendored assets + DM Serif/DM Sans `200` |
| Mobile 390×844 | no horizontal overflow (`scrollWidth === innerWidth`), no console errors/exceptions, gate locks body scroll then releases, closing copyright clears the RSVP dock (56px) |
| Desktop 1440×900 | same, closing clears the dock by 32px |
| Lightbox | opens from a gallery tile, next/prev swaps the source, close restores the page |
| Countdown | renders a live value (demo date moved to 2027 so it is never negative) |
| Cover parallax parity | lid/nest/cover geometry + 3D chain (`perspective 3000px`, origin `50% 0`, `preserve-3d`) identical to the reference; card box `47,81,296` matches to the pixel; flip timeline (`firstMove 462ms`, `landed 2003ms`, `gone 2837ms`) matches the reference (`461 / 2045 / 2841`) |
| Opening smoothness | the seconds tick lives in `CountdownClock` and the lid is compositor-promoted, so nothing re-renders a 15-section tree mid-flip — 176 presented frames per opening (reference: 172) |
| RSVP dock | hidden when `preview_mode` / `template_demo` (previews simulate no guest context); on a real guest link it is anchored `bottom: 88` |
| Cover slots | 4 slots — 1–3 crossfade in the hero every 4.8s, slot 4 is the closing plate, the livestream card reuses slot 1 (verified by reading the rendered background URLs: hero `cover-2 · cover-1 · cover`, stream poster `cover-2`, closing `cover-3`) |
| Light out | bright cream bloom (`.se-bloom`, z95) starts `780ms` after the gesture, peaks `0.94` while the flap is past 90°, holds through the `2.8s` release then lifts over `1.15s`; interior (`se-gate__inner` + `lid-back`) is lit warm paper, never black. Screenshots at 0/400/800/1200/1600/2000/2300/2600/2900/3200/3600/4400ms: interior light at `800ms`, warm wash `1.6–2.6s`, invitation emerging `3.2s`. |
| Background film | mounted only after the cover opens (muted, looping, `dim`), poster = hero slot 1, `.se-bgveil` charcoal gradient keeps copy legible; `.se-bgfilm` crops YouTube's title band (`translateY(-26px) scale(1.12)`, player layer top `-77px` on mobile / `-80px` on desktop) — verified by screenshot at 390×844 and 1440×900 |
| Story header | the inset photo next to "Our Story" was removed on client request — `.se-story__head` is a plain block (`display: block`), no `.se-story__inset` in the DOM or CSS (incl. the desktop mq); chapters still carry their own images |
| Music parity | `<audio loop preload="none">`, starts on the open gesture, clamped to `music_start_seconds` / `music_end_seconds`, paused when the film starts (verified by clicking the film's play button → `aria-label` flipped to "Play music"), disc control measured 48×48 at 16px from the right/bottom, spin state follows playback |

### Status (production, 2026-10-28)

| Step | Result |
|---|---|
| Commits | `0b50d92` feat(fonts) + `30f069d` feat(still-ever), built in a detached worktree at `origin/main` so the other session's `minang-royal` WIP never entered the bundle |
| Migration | `20261037000000_still_ever` applied to prod `ylmfgorryxzpdckkebnr` (row `id 308f8d71-372b-40a7-a021-17711e9ef8b4`) and recorded in `supabase_migrations.schema_migrations` |
| Deploy | `BUILD_ID xx3hbw9zqICp_QOeq8Mcu`, all 25 previews `doc=200 rsc=200`, `/api/health` 200, dashboard web-invitation 200 |
| Gallery | `/templates` → 62 cards incl. Still & Ever (`62+ template`), card links `/premium-web-invitation?template=still-ever` + `/register?template=still-ever` |
| Preview | 390×844: DM Serif Display + DM Sans loaded (`document.fonts.check` true), gate opens, 15 sections, film + music mounted, `scrollWidth === innerWidth`, no console errors |
| Fonts | `/fonts/dmserifdisplay-400.woff2` + `/fonts/dmsans-400.woff2` 200 |

> Prerender gotcha: `/templates` is a build-time page (`templates.html`) and Next
> caches the Supabase response in `.next/cache/fetch-cache`. Inserting the
> `web_templates` row *after* the build, then rebuilding without
> `rm -rf .next`, serves the old 61-card page (this happened once here). Always
> register the row first, or clear `.next` before the build.
>
> After the deploy, the prod row was edited from the ops UI (thumbnail replaced
> with an uploaded `template-media/*.jpg`, `package_eligibility` lost `gt`) —
> that is operator-side data, not something this template's code controls.

> Repo note: `imagine` was being edited by another session during this REA, so the
> staging build must be produced from an isolated worktree at `HEAD` containing
> only this task's files (playbook §8), never from the shared dirty tree.
