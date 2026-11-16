# REA — Lentera Zamrud (Ceriavite)

Reference: `https://invtlink.id/template-desain?preset_id=6a4fe68e96c1f8cbb7d57606&sub_id=6adda00445a44aecfeff104a`
Payload: `https://api.owlink.id/subpreset/6adda00445a44aecfeff104a`
(`layout_schema.css`, the per-element `anim` blocks and the rendered DOM at a
390 × 844 canvas are the sources of truth — the px positions in `layout_schema`
are ignored wherever the node is not `position:absolute`, so measure the DOM.)

## Teardown

| | |
|---|---|
| Family | kids (khitanan / aqiqah / ulang tahun), one child |
| Palette | `background #F8F4EA` · `title #1F5C4B` · `text #34413B` · `secondary #E2E9DC` · gold ornaments (`#B08A4A` family) |
| Type | Cinzel (titles, 400/600/700) · Lato (body 400/700) · Great Vibes (script 400) · Amiri (Arabic) |
| Layers | cream sections: grey paper texture, `mix-blend-mode: overlay`, `opacity .8`, masked 70 px at both edges · emerald sections: eight-point star tile masked at `132px` over a 6 % tint |
| Desktop | fixed 390 px plate centred on `#1F5C4B` (`desktop.layout: "center"`, `sideBg`) |
| Music | `track_url` (kids track as demo). Reference chrome (`dl-music-btn`) re-skinned to the template palette, top-right. |
| Reveals | animate.css mechanism, ported as `lz-fade-in` / `lz-fade-up` / `lz-fade-down` / `lz-zoom-in`, 1 s, `fill: both`, per-element delays from the payload (`0`, `.04`, `.06`, `.08`, `.1`, …). One `IntersectionObserver`, one class (`.is-in`). |
| Idle motion | lanterns sway around the chain (`rotate -2.2°…2.2°`, 5.2 s / 6.1 s / 5.7 s), branches in the wind (`6.8 s` / `7.7 s`). Animating the inner `<img>` keeps the reveal on the wrapper, so neither transform clobbers the other. |

### Assets (vendored, 2× display size, webp)

`tekstur-kertas` (paper), `pola-bintang` (**mask** tile, 300 px), `lentera-1/2/3`,
`bingkai-lengkung` (arch frame), `lengkung-mask` (**arch photo mask** — every
framed portrait is clipped to it), `melati-kiri`, `melati-kanan`,
`ranting-daun`, `ranting-zaitun`, `pemisah-emas` / `-2` / `-3`,
`bulan-sabit`, `sudut-emas-1` (top-left corner), `sudut-emas-2` (top-right
corner, **no mirroring**), `kubah-masjid` (mosque skyline).

Fonts: `lato-400`, `lato-700`, `great-vibes-400`, `amiri-400` (Arabic subset),
`cinzel-700` (extends the global Cinzel, which ships 400/600). All OFL.

### Section order (final)

1. Cover — script kicker (`Walimatul Khitan`), arch portrait + jasmine/olive
   sprigs, uppercase name, gold divider, guest line + guest name, `Buka Undangan`
   pill, mosque skyline.
2. Pembuka — emerald: crescent, Basmalah, salam, welcome paragraph, divider.
3. Putra / Putri Kami — cream: kicker, 226 × 373 arch portrait with branches,
   full name, "putra dari", parents, optional Instagram, divider, Qur'an quote +
   source.
4. Menuju Hari Bahagia — emerald: two hanging lanterns, script title, date line,
   inline countdown, **calendar pill**, skyline band.
5. Waktu & Tempat — cream: gold corners, script title, lead, one ruled block per
   session (title, date, time, place, `Lihat Lokasi`, gold divider between
   events, never after the last).
6. Galeri — cream: script title, lead, 2 × 153 px mosaic (even tile offset 18 px),
   lightbox.
7. Doa & Ucapan — cream: crescent, script title, lead, form (name locked for
   terbatas links), approved feed, 10-per-page pager.
8. Tanda Kasih — cream: script title, lead, white cards per account (`a/n` name,
   copy button) + address card.
9. Turut Mengundang — cream: kicker, script title, names with hairline
   separators.
10. Penutup — emerald: two lanterns, arch photo, closing words, salam, divider,
    "Kami yang berbahagia", family script, parents, skyline band.
11. Aksaraa footer badge.

The reference also ships an **RSVP section** ("Konfirmasi Kehadiran"). It is not
ported: RSVP is the shared `InvitationOverlay` dock (`docs/INHOUSE_TEMPLATE_PLAYBOOK.md` §6),
which this template renders with both `preview_mode` and `template_demo` guards.

## Section contract

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `groom_name`, `cover_photos[0]`, `groom_photo_url`, `guest_name` | always | 0 photos ⇒ portrait ⇒ `ASSETS.defaults.couple`; guest block hidden when the name is the placeholder | `template_content.cover_kicker`, `open_button`, `cover_guest_label`; name: `groom_name` | cover enter: fadeIn lanterns, fadeInDown kicker `.15s`, zoomIn photo `.3s`, fadeInUp name `.4s`, fadeIn divider/guest `.45–.55s`, fadeInUp CTA `.65s` |
| 2 | Pembuka | `template_content.basmalah`, `opening_salam`, `opening_description` | always | paragraph wraps to 5 lines at 390 | `basmalah`, `opening_salam`; body: `opening_description` | fadeUp `.06/.09/.12`, divider fade `.06` |
| 3 | Putra/Putri Kami | `groom_full_name`, `groom_parents`, `groom_instagram`, `groom_photo_url`, `quote_text`, `quote_source` | always; IG/quote hide when empty | 1 portrait; parents line optional; quote/source optional | names: profile; labels: `event_labels.subjectPossessive` / `subjectOf`; quote: profile | fadeUp `.06–.11`, stage fade `.04` |
| 4 | Countdown | `estimated_wedding_date`/`sessions[].date`, `sessions[0]` for the calendar | renders only when a parseable date exists | cells are always 4; digits `--` before hydration; calendar pill hidden without `sessions` | `countdown_intro`; calendar text `save_date_label` | fadeUp title/date, zoomIn clock `.08` |
| 5 | Waktu & Tempat | `sessions[]` | renders when ≥1 session | 1 event ⇒ no trailing divider; venue/address joined, either alone works | `events_title`, `events_intro`, `maps_label`; rows: sessions | fadeUp title/lead, fade list `.06` |
| 6 | Galeri | `gallery_photos[]` (max 8) | renders when non-empty | 1 photo ⇒ single 72 % column, no offset; 2+ ⇒ 2 columns, even tile `translateY(18px)` | `gallery_title`, `gallery_intro` | fadeUp `.0/.04/.08` |
| 7 | Doa & Ucapan | `/api/wishes` approved + form | always | 0 wishes ⇒ empty line; >10 ⇒ pager; name locked for terbatas links | `wishes_title`, `wishes_intro`, `wishes_name_*`, `wishes_message_*`, `wishes_submit`, `wishes_empty`, `wishes_loading` | fadeUp form `.08` |
| 8 | Tanda Kasih | `gift_accounts[]`, `gift_address`, `gift_address_name` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | 0 accounts + address ⇒ address card only; no address ⇒ accounts only; none ⇒ section hidden | `gift_intro_title`, `gift_intro_description`, `gift_transfer_note`, copy labels | fadeUp `.08` |
| 9 | Turut Mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | any count, hairline separator between rows | `inviting_kicker`, `inviting_title` | fadeUp `.0/.04/.08` |
| 10 | Penutup | `template_content.closing_message`, `closing_salam`, `cover_photos[2]`, `groom_parents` | always | missing closing photo ⇒ cover photo; parents optional | `closing_kicker`, `closing_family`, `closing_message`, `closing_salam` | fade photo/text, fadeUp `.04–.1` |
| — | Footer | `ASSETS.galeriEnvelope.aksaraaLogo` + `event_labels.brand` | always | — | brand | none |

Repeating blocks above (events, gallery tiles, accounts, families, wishes) are
the ones with count branches; all were exercised at 1 and many.

## Deviations from the reference (deliberate)

1. **No RSVP section** — replaced by the shared dock (see above).
2. **Turut Mengundang added** — the Ceriavite light contract (§0.5 of the
   in-house playbook) requires it; the reference has no slot for it. Drawn with
   the reference's own primitives: 9.5 px letterspaced kicker, 38 px Great Vibes
   title, hairline separators.
3. **Calendar pill added** under the countdown (reference has none). Outlined
   cream pill on the emerald band, in flow before the skyline, 28 px of air so it
   never sits on the mosque ornament or the lanterns.
4. **Instagram line added** under the parents (Ceriavite contract), hidden when
   empty.
5. **Putra name sits 34 px below the portrait** (reference: 16 px) so long names
   clear the olive branch; the reference's own branch boxes are letterboxed
   (`object-fit: contain`) so the branches stop where the reference's do.
6. **Guest line** renders only when `?to=` resolves to a real guest, so the demo
   preview matches the reference's no-guest render.
7. **Bold faces** follow the reference payload: Cinzel 700 for the cover name and
   countdown digits (review request; payload ships 600), Cinzel 600 for the
   in-body name and event titles, Lato 700 for every micro label and the
   parents line.
8. **Corner ornaments**: `sudut-emas-1` is the top-left corner, `sudut-emas-2`
   the top-right — the right one is used as-is. Mirroring it (an earlier
   revision) flipped the scroll into the wrong orientation.
9. **Section reveal**: 39 targets, one observer. `prefers-reduced-motion` and
   `@media (scripting: none)` leave every target at `opacity: 1`.
10. **Cover fits the viewport height.** The reference renders the CTA absolutely
    at `bottom: 16.6vh`, which lands on top of the guest block as soon as the
    small viewport height drops below ~800 px (a phone with the browser chrome
    visible is 667–740 px, not 844). The CTA is now the last flex item
    (`margin-top: auto`, so 390 × 844 is unchanged, CTA 664–704 as verified
    against the reference) and the arch photo is the flexible element:
    `width: min(52.4%, max(72px, calc((68.6svh - 255px) * 183 / 301)))`, where
    255 px is every fixed block below the photo plus the CTA and a 14 px air
    gap (206 px when the guest name is absent). At 390 × 667 the photo is 123 px
    wide (153 px with no guest block) and the guest name ends 20 px above the
    CTA; at 390 × 844 nothing moves. Item 11 covers names too long for one line.
11. **Names are measured on the element, not on a probe.** The one-line fitter
    used a detached `<span>`; when that span rendered with the fallback face it
    underestimated the webfont width by ~15 %, so a 50-character guest name
    stayed at 26 px and spanned 657 px across a 390 px plate. It now reads
    `scrollWidth` on the element itself, subtracts the fixed part
    (`letter-spacing` × chars, `text-indent`) before scaling, keeps the shrink
    floor for the guest at 0.42, ellipsises beyond it, and lets the Putra name
    wrap (its block is in flow) instead of spilling.

## Verification

- `npx tsc --noEmit` clean.
- `npm run audit:copy -- lentera-zamrud` clean (6 allowlisted structural
  literals: brand badge ×2, countdown units ×4).
- 390 × 844 and 1440 × 900: `scrollWidth === innerWidth`, reference plate
  390 px centred on `#1F5C4B`, no console errors.
- `prefers-reduced-motion: reduce`: 39/39 reveal targets at `opacity: 1`.
- Section heights against the reference (390 px): pembuka 434 / 434.4,
  countdown 481 / 378+calendar, galeri 524 / 524.5, penutup 827 / 829.5.
- Rendered geometry parity: cover kicker 124.9, photo 169.8 (183 × 301), name
  494.3, divider 541.3, guest label 559.2, CTA 664–703.5 (reference 662–703.5).
