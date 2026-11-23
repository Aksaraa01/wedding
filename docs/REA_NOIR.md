# Noir — reference port (Katsudoto "exclusive-noir")

Reference: `https://oliviamichael.katsudoto.id/629425` (body class
`noir original`, theme asset key `src/template/exclusive-noir`). The owner
confirmed the design may be ported; no reference asset, photograph or couple
data ships here. Every ornament is authored in CSS, the two typefaces are
vendored Google fonts, and the demo uses Aksaraa's own sample content.

- Component: `src/components/templates/noir/` (`index.tsx`, `Wishes.tsx`,
  `noir.css` = authored layer in the reference's visual language)
- Assets: `public/templates/noir/thumbnail.webp` only (the design has **no
  ornament images** — the reference CSS contains zero `url()` rules)
- Fonts: `Cormorant Unicase` (300–700) + `Newsreader` (variable, 400 ± italic),
  both SIL OFL 1.1, vendored into `public/fonts/`
- Row: `web_templates.code = 'noir'`, tier `Baru`, category `Elegant`,
  `sort_order` 1, every package (copied from `olan`)
- Demo: `DEMO_PROPS_BY_CODE.noir` — Aksaraa demo couple/photos, English copy

---

## 1. What the reference is

A **split-screen poster**, not a long single column:

| Breakpoint | Behaviour |
|---|---|
| ≥ 961 px | fixed cover pane (61 %) + scrolling black column (39 %). The pane carries the photograph and a small caption; the column carries the type |
| < 961 px | single column. A full-screen gate ("Open Invitation") slides up on tap, then the poster cover scrolls normally |

Palette and type come straight from the reference:

| Token | Value |
|---|---|
| paper | `#000000` |
| display ink | `#E6D8D5` |
| body ink | `#FFFFFF` |
| primary button | cream fill, black label |
| display face | Cormorant Unicase 500 |
| text face | Newsreader 400 |

Motion: the reference drives AOS (`fade-up`, `fade-down`, `zoom-in`) plus slick
and lightgallery. This port keeps the same mechanism — one `IntersectionObserver`
that adds `.aos-animate` once, per-element `data-aos-duration` / `data-aos-delay`
— and re-implements the sliders with CSS transitions / scroll-snap. No new
dependency was added.

---

## 2. Section order (shipped)

The reference order is `opening_cover → cover(+countdown) → quote → couple →
gallery_photo → gallery_video → event → rundown → rsvp → live_streaming →
love_story → filter_instagram → wedding_gift → wedding_wish → greet_thanks →
footnote`. The minimum-section contract reorders it; the shipped order is:

1. Cover
2. ~~Opening video~~ — **omitted by design** (see §3)
3. Welcome
4. Kalimat pembuka (+ the reference's quote card)
5. Mempelai
6. Event
7. Countdown
8. Love story
9. Rundown
10. Gallery
11. Video
12. Wedding gift
13. Dress code
14. Wishes
15. Turut mengundang
16. Closing

Deliberate moves vs the reference: the countdown leaves the cover and becomes
its own poster block after Event (contract #7); love story moves above Rundown
(contract #8); Turut mengundang lands after Wishes (brief); the inline RSVP
form is replaced by the shared `InvitationOverlay` dock (playbook §6).

---

## 3. Deviations

| Deviation | Reason |
|---|---|
| **No opening video** | The design opens on a still cover, not a film. Section 2 is conditional ("only when the design opens with a film"); the couple's `video_url` still renders in section 11 under `feature_gates.video` + `video_section_visible`. |
| **No inline RSVP** | Playbook rule: RSVP/QR is the floating dock, never a section. |
| **Instagram filter dropped** | Outside the 16-section contract and no `wedding_profiles` column feeds it. Reported here instead of shipping a dead block. |
| **Quote merged into Kalimat pembuka** | The reference's `.quote-wrap` is the couple's words surface; `opening_title` + `opening_description` sit above it on the same surface, so the editor's `quote_text` / `quote_source` stay reachable without inventing a 17th section. |
| **No "The Groom"/"The Bride" labels** | Playbook §0.5(3): two portraits with their own names, parents and Instagram. |
| **No live streaming** | The reference has none and the contract does not require it; `livestream` is `false` in the content spec. |

---

## 4. Per-section contract

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `cover_photos[0]`, names, `estimated_wedding_date`, `guest_name` | always | no photo ⇒ black poster + type; photo ⇒ full-bleed with gradient veil | `tc.cover_kicker`, `tc.cover_guest_label`; date from profile | `fade-up` 1.2 s (names), 1.1 s (date/guest) |
| 3 | Welcome | names, date, guest | always; hidden only when the couple has no names | single date; range comes from `sessions` | `t("theWeddingOf")`, `tc.welcome_note` | `zoom-in` 1 s |
| 4 | Kalimat pembuka | `opening_title`, `opening_description`, `quote_text`, `quote_source` | `!hidesOpeningSection("noir")` (active) | no title/description/quote ⇒ whole section absent; quote alone ⇒ quote card only | profile columns | `fade-up` 1 s on the card |
| 5 | Mempelai | names, full names, portraits, parents, Instagram | `person_photos !== false` | one portrait ⇒ one card with monogram-free fallback photo; missing IG ⇒ link absent | `tc.mempelai_title`, `tc.mempelai_intro`, `t("sonOf"/"daughterOf")` | `fade-up` 1 s, 120 ms step |
| 6 | Event | `sessions[]` | always (publish blocked without it) | 1 event ⇒ one card; N ⇒ stacked cards; no `maps_url` ⇒ button absent | `tc.agenda_title`, `tc.events_intro`, `tc.maps_label` | `fade-up` 900 ms, 90 ms step |
| 7 | Countdown | `estimated_wedding_date` (falls back to first session date) | always when a date exists | past date ⇒ zeros; 3-digit days fit | `tc.countdown_*`, `tc.calendar_button` | 1 s tick, no entrance animation |
| 8 | Love story | `stories[]` | `feature_gates.story !== false` **and** `story_visible !== false` | 0 ⇒ section absent; 1 ⇒ slide without nav; a milestone without `image_url` becomes a typographic slide with its ordinal; photo per `story_photo` | `tc.love_story_title`, `t("storyPart")` | cross-fade 900 ms + bars |
| 9 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ absent; 1 ⇒ single row | `tc.rundown_title` | none (list must stay scannable) |
| 10 | Gallery | `gallery_photos[]` | `no_photo === false` + data | 1 photo ⇒ track without arrows; N ⇒ snap track + lightbox (keyboard + arrows) | `tc.gallery_title`, `tc.gallery_intro` | hover scale 0.9 s |
| 11 | Video | `video_url` | `feature_gates.video !== false` **and** `video_section_visible !== false` | YouTube ⇒ poster + click-to-mount; file ⇒ `<video>`; no poster ⇒ black frame | `tc.video_title`, `tc.video_caption` | poster fades on hover; player mounts on click |
| 12 | Wedding gift | `gift_accounts[]`, `gift_address_name`, `gift_address` | `gift_section_visible !== false`; address also needs `feature_gates.gift_address !== false` | accounts only ⇒ no tabs; address only ⇒ no tabs; both ⇒ tabs; none ⇒ absent | `tc.gift_*`, `tc.copy_*` | none |
| 13 | Dress code | `dresscode{title, description, colors[]}` | `dresscode_visible !== false` | colours only ⇒ swatches; text only ⇒ paragraph; neither ⇒ absent | `tc.dresscode_title`, `tc.dresscode_intro` | none |
| 14 | Wishes | `/api/wishes` + form | always | 0 approved ⇒ empty state; >10 ⇒ "load more"; preview ⇒ demo feed | `tc.wishes_*` | none |
| 15 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families !== false` **and** `inviting_families_visible !== false` | 0 ⇒ absent; N ⇒ wrapped list with hairlines | `tc.inviting_title`, `tc.inviting_intro` | none |
| 16 | Closing | `closing_message`, names, second cover slot | always | no closing message ⇒ `t("withLoveAndGratitude")`; no second cover slot ⇒ text-only closing | `tc.closing_title`, `tc.closing_message`, `tc.closing_brand` | none |

Chrome: music toggle (`track_url` only), `InvitationOverlay` dock
(`anchor="bottom"`), toast for copied account/address.

---

## 5. State matrix (verified)

Rendered through a throwaway probe route (deleted before commit) at 390 × 844,
plus the demo page at 1440 × 900:

| State | Result |
|---|---|
| all content empty | cover, welcome, mempelai, wishes, closing only — no empty shells |
| `feature_gates` all false | story, inviting, video and gift address disappear; accounts stay (they are not gated) |
| every section toggle false | story, rundown, gift, video, dresscode, inviting disappear |
| one session / one photo / one story / one rundown row / one family | single-item branches render, no stretched cards |
| every story without `image_url` | designed typographic slide per milestone, never an empty black frame |
| gift accounts only / address only / none | tabs vanish when they cannot switch; section hides when empty |
| `prefers-reduced-motion` | all copy visible, no transforms |
| JS disabled | `<noscript>` rule forces every reveal target visible |
| 390 × 844 and 1440 × 900 | `scrollWidth === innerWidth`, no crushed children |

---

## 6. Migration

`supabase/migrations/20261123000000_noir.sql` inserts the `web_templates` row
(`ON CONFLICT (code) DO UPDATE`) and is safe to replay: it only touches
`code = 'noir'`. Apply with the usual `supabase link --project-ref …` +
`db push`; check for duplicate versions first
(`ls supabase/migrations/*.sql | sed 's|.*/||' | cut -d_ -f1 | sort | uniq -d`).

---

## 7. Checks

```bash
npm run audit:copy -- noir        # 0 findings, no ledger entry
npx node --experimental-strip-types scripts/template-extras-check.mjs noir
node scripts/check-material-icons.mjs
npx tsc --noEmit
```
