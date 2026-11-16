# REA — Songket Marun (Ceriavite)

Reference: `https://invtlink.id/template-desain?preset_id=6a4fe68e96c1f8cbb7d57606&sub_id=6af02e02a3bef597e0bed5be`
Payload: `https://api.owlink.id/subpreset/6af02e02a3bef597e0bed5be`
("Crimson Songket". The payload's `layout_schema`, its `css` masks and the
rendered 390 × 844 DOM are the sources of truth; `top` on a flow node is not a
position — measure the DOM.)

## Teardown

| | |
|---|---|
| Family | kids (khitanan / aqiqah / ulang tahun), one child |
| Palette | `background #4A1620` · `title #EFDFBB` · `text #E0CDB6` · `gold #C9A45C` · side plate `#2E0C13` |
| Type | Marcellus (titles, 11px letter-spaced labels) · Cormorant Garamond (body) · Parisienne (script) · Amiri (Arabic) |
| Layers | woven `tenun` tile masked at `120px` (5.5 % on maroon, 3.5 % on cream) · gold **pucuk rebung** bands (`16.83 × 40` tile, `repeat-x`, mirrored at the bottom) on every maroon canvas and the cover |
| Desktop | fixed 390 px plate centred on `#2E0C13` (`layout: center`, `sideBg`) |
| Ornaments | all CSS masks over `currentColor`: ribbon `pita-tenun` (150 × 15), star / pin / mail / pen icons, the 20 px woven frame tile around the closing photo |
| Motion | animate.css mechanism as `skm-fade-in/up/down`, `skm-zoom-in`, 1 s, `fill: both`, payload delays; melur sways (`skm-wind`), the folded songket floats (`skm-float`) |

### Assets (vendored, 2× display, webp)

`tenun-kain` (120 px mask tile), `tepi-pucuk-rebung` (16.83 × 40 mask tile),
`pita-tenun`, `pita-bingkai` (20 px frame tile), `ikon-bintang`,
`ikon-lokasi`, `ikon-pena`, `bingkai-ukir-lak` (carved frame 250 × 400),
`tanjak-songket`, `melur`, `tepak-sirih`, `songket-terlipat`.
Fonts: `amiri-400` (Arabic); Marcellus / Cormorant Garamond / Parisienne ship
globally in `src/app/fonts.css`.

Demo photos (preview only): `demo/cover`, `demo/putra`, `demo/venue`,
`demo/closing`, `demo/gallery-1`, `demo/gallery-2`.

### Section order (final)

1. **Cover** — full-bleed photo fading to maroon, pucuk-rebung bands, woven
   field below the photo, melur bottom-left, script kicker, Parisienne name,
   ribbon, uppercase date, guest line + guest name, solid gold `Buka Undangan`.
2. **Pembuka** (cream) — star, Basmalah, salam, ribbon, welcome paragraph.
3. **Putra / Putri Kami** (maroon) — kicker, carved frame with tanjak + melur,
   script full name, "putra dari", parents on two lines, optional Instagram.
4. **Doa untuk Ananda** (cream) — star, double-framed card: Arabic ayah,
   translation, source, ribbon, blessing.
5. **Save the Date** (maroon) — kicker, script title, ribbon, weekday, 92 px day
   between rules, month/year, countdown in a double frame, `Simpan Tanggal`.
6. **Acara** (cream) — pin, kicker, script title, ribbon, lead, arch venue photo
   with tepak sirih, one block per session (title/date/time/venue/address/pill),
   ribbon between events.
7. **Galeri** (maroon) — kicker, script title, ribbon, lead, 2 × 3:4 mosaic with
   an inner gold outline (even frames dropped 22 px).
8. **Tanda Kasih** (maroon) — folded songket, kicker, script title, ribbon, lead,
   double-framed account cards + address card with copy pills.
9. **Doa & Ucapan** (cream) — pen icon, kicker, script title, ribbon, lead, form
   (locked name for terbatas links), approved feed, 10-per-page pager.
10. **Turut Mengundang** (maroon) — added, see deviations.
11. **Penutup** (maroon) — woven-frame photo with melur, "Terima Kasih", closing
    words, salam, ribbon, "Kami yang berbahagia", family script, parents.
12. Aksaraa footer badge.

RSVP is the shared `InvitationOverlay` dock (both `preview_mode` and
`template_demo` guards), never a section.

## Section contract

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `groom_name`, `cover_photos[0]`, `guest_name` | always | 0 photos ⇒ portrait ⇒ `ASSETS.defaults.couple`; guest block hidden for the placeholder name | `cover_kicker`, `cover_guest_label`, `open_button` | fadeUp names `.2s`, fade ribbon/date/guest `.3–.55s`, fadeUp CTA `.65s` |
| 2 | Pembuka | `basmalah`, `opening_salam`, `opening_description` | always | paragraph wraps to 4–5 lines | `basmalah`, `opening_salam`; body: `opening_description` | zoom star, fadeUp `.06/.1`, ribbon fade `.06`, text `.14` |
| 3 | Putra/Putri | `groom_full_name`, `groom_parents`, `groom_instagram`, `groom_photo_url` | always; IG hides when empty | 1 portrait; parents split on `&` into two lines | names: profile; labels: `event_labels.subjectPossessive` / `subjectOf` | fadeUp `.0–.11`, stage fade `.04` |
| 4 | Doa | `doa_arabic`, `quote_text`, `quote_source`, `doa_blessing` | always | quote/source hide when empty | `doa_title`, `doa_arabic`, `doa_blessing`; quote: profile | fadeUp card `.06` |
| 5 | Save the Date | `estimated_wedding_date` / `sessions[].date` | renders date block only with a parseable date; countdown also needs the target; CTA needs a session | 4 countdown cells always; `--` before hydration | `save_date_kicker`, `save_date_title`, `save_date_label` | fadeUp `.0–.14`, day zoom `.06` |
| 6 | Acara | `sessions[]`, `cover_photos[1]` | renders when ≥1 session; venue photo hidden without a session/photo | 1 event ⇒ no trailing ribbon; venue/address lines render independently | `events_kicker`, `events_title`, `events_intro`, `maps_label`; rows: sessions | fadeUp header/lead, fade list, ribbon between rows |
| 7 | Galeri | `gallery_photos[]` (max 9) | renders when non-empty | 1 photo ⇒ single 4:5 column; 2+ ⇒ 2 columns of 3:4 with even-frame offset | `gallery_kicker`, `gallery_title`, `gallery_intro` | fadeUp `.0–.06`, fade grid |
| 8 | Tanda Kasih | `gift_accounts[]`, `gift_address`, `gift_address_name` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / none (section hidden) | `gift_kicker`, `gift_intro_title`, `gift_intro_description`, `gift_send_label`, copy labels | fadeUp ornament/heading/lead, list `.09` |
| 9 | Doa & Ucapan | `/api/wishes` approved + form | always | empty line, >10 ⇒ pager, locked name for terbatas links | `wishes_kicker`, `wishes_title`, `wishes_intro`, `wishes_name_*`, `wishes_message_*`, `wishes_submit`, `wishes_empty`, `wishes_loading` | fadeUp `.0–.09` |
| 10 | Turut Mengundang | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` | any count, hairline between rows | `inviting_kicker`, `inviting_title` | fadeUp `.0–.1` |
| 11 | Penutup | `closing_message`, `closing_salam`, `cover_photos[2]`, `groom_parents` | always | missing closing photo ⇒ cover photo | `closing_thanks`, `closing_message`, `closing_salam`, `closing_kicker`, `closing_family` | fade photo, fadeUp `.04–.08` |

## Deviations from the reference (deliberate)

1. **No RSVP section** — the shared dock replaces it (playbook §6).
2. **Turut Mengundang added** — required by the Ceriavite light contract; drawn
   with the reference's own primitives (Marcellus kicker, Parisienne title,
   ribbon, hairline rows, pucuk-rebung bands).
3. **Gift renders accounts and the address** instead of the reference's single
   "Kirim Hadiah" widget button: the platform has no gift modal, and the couple's
   data must be readable/copyable.
4. **Gallery is cropped 3:4** (reference geometry) with `object-position`
   centred, instead of the earlier natural-ratio grid, so the mosaic matches the
   design. One photo falls back to a single 4:5 frame.
5. **Parents split on `&`** into the reference's two deliberate lines.
6. **Instagram line** under the parents (contract requirement), hidden when
   empty.
7. **Countdown CTA** is an outlined gold pill (`Simpan Tanggal`) on the reference
   button geometry.
8. **Section reveals**: 56 targets, one observer; `prefers-reduced-motion` and
   `@media (scripting: none)` leave every target at `opacity: 1`.

## Verification

- `npx tsc --noEmit` clean · `npm run audit:copy -- songket-marun` clean
  (6 allowlisted literals: brand badge ×2, countdown units ×4).
- 390 × 844 and 1440 × 900: `scrollWidth === innerWidth`, 390 px plate on
  `#2E0C13`, no console errors.
- `prefers-reduced-motion: reduce`: 56/56 reveal targets at `opacity: 1`.
- Section heights against the reference (390 px): pembuka 587 / 599 ·
  putra 892 / 882 · doa 686 / 683 · save 683 / 683 · acara 1256 / 1297 ·
  galeri 1109 / 1111 · penutup 1060 / 1065.
- Cover geometry parity: names block 428.7, name 451.9 (h 82.1), ribbon 546,
  date 572, guest line 594, CTA 664 (h 44) — all equal to the reference.
