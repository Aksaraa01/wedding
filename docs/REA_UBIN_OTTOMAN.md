# REA Ubin Ottoman — Ceriavite kids invitation

Port of the reference preset **`ubin-biru-ottoman`** (`preset_id 6a4fe68e96c1f8cbb7d57606`,
`sub_id 6ae2f7f7e9edc7234a45431c`), read from data, not screenshots:

```bash
curl -s "https://api.owlink.id/subpreset/6ae2f7f7e9edc7234a45431c" > sub.json
jq -r '.data.layout_schema.css' sub.json > ref.css
```

- `layout_schema.theme` → `title #1E3A7B`, `text #3A4A6B`, `background #F6EEDC`,
  `secondary #E8922B`
- `layout_schema.master` → Marcellus (title), Lora (content), Cinzel Decorative
  (names)
- every node's `style.top/left/width/height/zIndex/class` is absolute against a
  **390 × 844** canvas, and `node.anim` is `animate.css` `fadeInUp` with
  0.04–0.1 s steps
- `ref.css` gave the real artwork recipes: `ub-bk-lengkung` (arch frame = 7 px
  white border + `999 999 16 16` radius), `ub-g-lengkung` (gallery arch +
  `translateY(18px)` on even tiles), `ub-tiang` (pillar mask `black 78%`),
  `ub-apung` (floating 4.8 s), `ub-ayun` (hanging lantern 5 s, origin top),
  `ub-goyang-kiri/kanan` (corner flowers, 6 s / 6.6 s reverse)

Geometry is authored in reference pixels and multiplied by `--u`
(`min(calc(100vw / 390), 1.103px)`): exactly 1 px at a 390 px viewport, scaled
proportionally below that, capped where the column stops growing (430 px), so
390 × 844 is pixel-identical to the reference canvas. No `container-type` is
used on the root — it would make the root a containing block for the fixed music
button and the RSVP dock.

## Section order (as shipped)

| # | Section | Reference canvas | Notes |
|---|---|---|---|
| 1 | Cover | `cover` | corner flowers, two lanterns, arch portrait, crescent, date line, guest, "Buka Undangan" |
| 2 | Pembuka | `Pembuka` (navy) | star tile, basmalah, salam, opening text |
| 3 | Putra/Putri Kami | `Putra Kami` (cream) | pillar-framed arch, name, "putra dari", diamond divider, Instagram, quote |
| 4 | Hari Acara (countdown) | `Hari Acara` (navy) | hanging lanterns, kicker, title, `14 / MARET / 2027`, weekday, 4 countdown boxes |
| 5 | Susunan Acara | `Susunan Acara` (cream) | one ruled card per `sessions[]` item |
| 6 | Lokasi Acara | `Tempat` (cream) | arch venue photo, place, address, "Lihat Lokasi" pill |
| 7 | Galeri | `Galeri` (cream) | 2-column arch grid, even tiles offset |
| 8 | Doa & Ucapan | `Ucapan` (cream) | form + approved feed, 10 per page |
| 9 | Tanda Kasih | `Tanda Kasih` (cream) | account cards + address card |
| 10 | Turut Mengundang | **added** | hairline-separated names |
| 11 | Penutup | `Penutup` (navy) | lanterns, name, closing words, salam, parents, floral band |

Reference `RSVP` canvas is **dropped on purpose**: RSVP is the shared
`InvitationOverlay` dock (§0.5 rule 4), never a section.

## Per-section contract

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `cover_photos[0]` → `groom_photo_url` → `ASSETS.defaults.couple`; `groom_name`, `guest_name`, `estimated_wedding_date` | always | 0 photos ⇒ default art; long names shrink to one line (see below) | `cover_kicker`/`labels.eventKicker`, `cover_syukur`, `cover_guest_label`, `open_button` | corner flowers 6 s / 6.6 s, lanterns 5 s, crescent 4.8 s |
| 2 | Pembuka | `opening_description` (+ `quote_text` not used here) | `sections.opening_description` | empty ⇒ default paragraph | `opening_salam`, `opening_description` | fadeUp 0 / 0.04 / 0.06 / 0.08 |
| 3 | Putra | `groom_full_name`, `groom_photo_url`, `groom_parents`, `groom_instagram`, `quote_text`/`quote_source` | `person_photos !== false` (photo); parents/IG/quote render only when present | 0 photo ⇒ empty arch frame; 1 parent line; quote optional | `mempelai_title`, `labels.subjectPossessive`, `parents_label` | fadeUp 0 / 0.06 / 0.04 / 0.06 / 0.07 / 0.08 |
| 4 | Countdown | `estimated_wedding_date` | `sections.countdown` + date present | 1 event or 0 events ⇒ still one date block; no date ⇒ whole section hidden | `events_kicker`, `events_title` | fadeUp, ticks every second |
| 5 | Susunan Acara | `sessions[]` (`time`, `name`, `address`/`venue`) | `sessions.length > 0` | 1 event ⇒ one card, no stretch; many ⇒ cards stack | `agenda_kicker`, `agenda_title`, `labels.mainEventName` | fadeUp 0.06 + 0.02 per card |
| 6 | Lokasi | `sessions[0].venue/address`, first `maps_url`, `cover_photos[1]` | `sessions.length > 0` | no venue photo ⇒ text-only block; no maps ⇒ no pill | `venue_kicker`, `venue_title`, `maps_label` | fadeUp 0.04 / 0.06 / 0.08 / 0.1 |
| 7 | Galeri | `gallery_photos[]` (max 8) | `sections.gallery` + data | 1 photo ⇒ single centred arch (`is-single`); even tiles `translateY(18px)` | `gallery_kicker`, `gallery_title` | fadeUp 0.06 |
| 8 | Doa & Ucapan | `/api/wishes` (approved) + `useWishes` | always | 0 wishes ⇒ empty state; pagination only when > 10 | `wishes_*` fields | fadeUp 0.1 |
| 9 | Tanda Kasih | `gift_accounts[]`, `gift_address`, `gift_address_name` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / none ⇒ section hides | `gift_kicker`, `gift_intro_title`, `gift_intro_description`, `copy_account_button`, `copy_address_button`, `gift_send_label` | fadeUp 0.1 / 0.12 |
| 10 | Turut Mengundang | `inviting_families[]` | `feature_gates.inviting_families !== false` **and** `inviting_families_visible !== false` | 1 name or 10, hairlines only between | `inviting_kicker`, `inviting_title` | fadeUp 0.06 + 0.02 per name |
| 11 | Penutup | `closing_message`, `groom_name`, `groom_parents` | always | no parents ⇒ signature block hides | `closing_kicker`, `closing_message`, `closing_salam`, `labels.closingHeadline` | fadeUp 0 / 0.04 / 0.06 / 0.08 / 0.1 |

## Deviations (deliberate, with reasons)

1. **Cover carry a date line.** The reference cover has no date; the kids
   contract (§1 cover) asks for it. It is drawn in the reference's own kicker
   voice (`9.5 px`, `3 px` tracking, uppercase) and placed inside the empty band
   between "dengan penuh rasa syukur" (y 528) and "kepada yang terhormat"
   (y 588), so nothing else moves.
2. **Quote lives inside "Putra Kami".** The reference has no separate
   "Doa untuk Ananda" canvas; the ayah/quote sits under the portrait, exactly as
   the designer drew it. Ceriavite's `quote` section is therefore consumed here
   rather than as a standalone block (allowed: two sections may share a surface,
   §0.5).
3. **Turut Mengundang is added** after Tanda Kasih: the reference has no such
   canvas, but Ceriavite's 11-section contract includes it (`inviting: true`).
   It is drawn with the template's own header (`uo-title-row`) and hairline
   separators.
4. **Tanda Kasih gains an address card.** The reference demo ships accounts only;
   the contract requires `gift_address` when the package allows it.
5. **Wishes gains a form.** The reference demo only renders the platform wish
   widget (empty in the capture). The form uses the same section header, a
   white `border-radius 20` card and the navy pill button, so it reads as the
   designer's own block.
6. **Gallery keeps the reference's `3 / 4` arch crop.** The playbook's "never
   crop" rule is about templates whose gallery is unframed (Songket). Here the
   arch frame *is* the design; there is no lightbox in the reference either.
7. **Desktop column is capped at 430 px** (the reference fixes its canvas at
   390 px). Below 430 px everything scales proportionally with `--u`, so phone
   rendering is exact; the 430 cap only affects tablets/desktop, where the
   reference shows a cream-surrounded column as well.
8. **Names shrink to one line** like the reference renderer does: its payload
   ships 28 px but renders `19.04px` for a 25-character name. `useFitOneLine`
   (DOM probe measurement, re-run after `document.fonts.ready`) reproduces it,
   so a long `groom_full_name` can never spill over the arch or the music button.

## Copy ledger

Every visible string is a profile column, an `eventLabels` value, or a
`template_content` field registered in `src/lib/templateExtras.ts`
(`cover_kicker`, `cover_syukur`, `cover_guest_label`, `open_button`,
`opening_salam`, `mempelai_title`, `parents_label`, `events_kicker`,
`events_title`, `agenda_kicker`, `agenda_title`, `venue_kicker`, `venue_title`,
`maps_label`, `gallery_kicker`, `gallery_title`, `wishes_kicker`,
`wishes_title`, `wishes_intro`, `wishes_name_*`, `wishes_message_*`,
`wishes_submit`, `wishes_empty`, `wishes_loading`, `gift_kicker`,
`gift_intro_title`, `gift_intro_description`, `copy_account_button`,
`copy_address_button`, `gift_send_label`, `inviting_kicker`, `inviting_title`,
`closing_kicker`, `closing_message`, `closing_salam`).

`npm run audit:copy -- ubin-ottoman` → clean. The only allowlisted literals are
the two WCAG labels of the icon-only pagination buttons and the Aksaraa brand
badge (`Aksaraa`, `by Aksaraa`).

## Assets

Vendored into `public/templates/ubin-ottoman/` (2× display size, webp):

| file | display | source |
|---|---|---|
| `corner-left.webp`, `corner-right.webp` | 206 × 213 | preset `aab276e0…`, `aa628220…` |
| `lantern.webp` | 38 × 78 | `a9b244f0…` |
| `crescent.webp` | 44 × 45 | `a9d3afa0…` |
| `tile-star.webp` | 46 × 46 | `aa1ee970…` |
| `flower-band.webp` | 470 × 190 | `a87ece00…` |
| `pillar-left.webp`, `pillar-right.webp` | 80 × 400 | `ab540e10…`, `ab0ec7b0…` |
| `demo/*.webp` | — | reference demo photos, **preview only** |
| `thumbnail.webp` | 450 × 950 | screenshot of the shipped cover |

The demo track is the owner-supplied qasidah recording, vendored once as
`public/defaults/khitanan.mp3` and referenced through `ASSETS.kidsMusic` (shared
with Songket Marun; `profile.track_url` always wins for a real couple).

`Cinzel Decorative 400` was added to the vendored font pipeline
(`scripts/fetch-fonts.js`, `scripts/gen-font-css.js`, `public/fonts`,
`src/app/fonts.css`) because the reference's third voice is that Google font
(OFL). Marcellus and Lora were already vendored.

> Licensing note: `public/defaults/khitanan.mp3` is a commercial qasidah cover
> used only in the public template previews (`demoProps`, never written into a
> real invitation). Replace it with a licensed track before relying on it
> commercially.

## Verification performed

- `npx tsc --noEmit` clean; `npm run build` clean
- `npm run audit:copy -- ubin-ottoman` clean; `node scripts/check-material-icons.mjs` clean
- 390 × 844 walk-through of every section against the reference captures
  (`ref-step-00…05.png`): kickers, titles, rules, arches, countdown boxes,
  cards, gallery offsets and the closing band land on the reference's y-offsets
  (measured via `getBoundingClientRect` on both pages; remaining deltas are
  data-driven — the demo has an Instagram line and a longer quote)
- `document.documentElement.scrollWidth === innerWidth` at 360, 390, 430 and
  1440 px
- `prefers-reduced-motion: reduce` ⇒ 48/48 reveal targets at `opacity: 1`, no
  ornament animations
- one-photo gallery branch, empty wish feed, gift account-only branch
- `?opened=1` QA hook (same as Songket Marun) for screenshot tooling

## Registration

`supabase/migrations/20261116000007_ubin_ottoman.sql` — `event_type = 'kids'`,
`package_eligibility = ["ceriavite"]`, `sort_order = 12`, category `Ceriavite`,
`demo_url` absolute on `ceriavite.aksaraa.com`. Content spec lives in
`TEMPLATE_CONFIGS`; the wedding-only sections (story, video, dress code,
rundown, livestream, contacts) stay `false` and are hidden in editor and ops by
the same spec.
