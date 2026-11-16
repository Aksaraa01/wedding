# REA: `songket-marun` (Ceriavite, 2026-11)

Reference: an Our-Wedding-Link / Invtlink kids design ("Crimson Songket"), read
from `GET https://api.owlink.id/subpreset/6af02e02a3bef597e0bed5be` —
`layout_schema` (page-builder tree) + `css` + `theme` + `master` font fields.

This is the first Ceriavite (kids) template. It is a design port, not a re-skin
of a wedding template: the person model, the section list and the vocabulary all
differ (see `docs/CERIAVITE.md` § kids minimum-section contract).

## Reference teardown

**Palette** (from `layout_schema.theme`):

| token | value |
|---|---|
| background | `#4A1620` |
| secondary (gold) | `#C9A45C` |
| title | `#EFDFBB` |
| text | `#E0CDB6` |

**Type** (from `layout_schema.master`): `font_title` Marcellus, `font_content`
Cormorant Garamond, `font_additional` Parisienne. All three are already vendored
in `src/app/fonts.css`; the doa line falls back to the system Arabic face
(`Amiri` is not vendored).

**Sections, in reference order**

1. Cover — full-bleed photo, veil, jasmine (melur) in both corners, script name,
   date, guest line, "Buka Undangan".
2. Pembuka — eight-point star, `Assalamu'alaikum…`, opening paragraph, ribbon.
3. Putra Kami — portrait inside the carved-lacquer frame, tanjak above, melur
   below, full name, "putra dari", parents.
4. Doa — "Doa untuk Ananda" card: Arabic ayah, translation, source, blessing.
5. Save the Date — "Hari Bahagia", day number in display type, weekday/month/year,
   "Simpan Tanggal".
6. Acara — "Rangkaian Acara" / "Waktu & Tempat", venue photo with tepak sirih,
   one block per `sessions[]` row with "Lihat Lokasi".
7. Galeri — "Momen Bahagia" grid, first frame double width on mobile.
8. Tanda Kasih — folded-songket ornament, "Amplop Digital", accounts, address.
9. Doa & Ucapan — form + approved feed.
10. Penutup — closing photo with melur, "Terima Kasih", closing words,
    `Wassalamu'alaikum…`, "Kami yang berbahagia", "Keluarga Besar", parents.

RSVP is the shared floating dock, never a section (playbook §0.5 rule 4). The
reference renders it as a section; the dock is the platform contract.

## Assets vendored (design chrome only)

`public/templates/songket-marun/`: `bingkai-ukir-lak` (carved frame),
`tanjak-songket`, `tepak-sirih`, `songket-terlipat`, `melur`. Converted to webp
at 2x display size (447 KB total, all but the cover lazy-loaded).

**Not vendored**: the reference couple's photos, names, quotes and gallery. The
demo entry in `demoProps.ts` uses Aksaraa's own sample content, and the
per-couple photos come from `cover_photos[0..2]` + `groom_photo_url`.

## Data mapping

| Reference slot | Column |
|---|---|
| Cover photo | `cover_photos[0]` |
| Venue photo ("Foto tempat acara") | `cover_photos[1]`, gated on the event section |
| Closing photo ("Foto penutup") | `cover_photos[2]` |
| Portrait ("Foto putra") | `groom_photo_url` |
| Nickname (cover, script) | `groom_name` |
| Full name | `groom_full_name` |
| "putra dari …" | `groom_parents` |
| Arabic ayah | `template_content.doa_arabic` |
| Translation + source | `quote_text` / `quote_source` |
| Blessing line | `template_content.doa_blessing` |
| Events (2 rows) | `sessions[]` |
| Gallery | `gallery_photos[]` |
| Gift | `gift_accounts[]` + `gift_address` |
| Closing words | `template_content.closing_message` |

Second person slot (`bride_*`) is intentionally empty for a kids profile;
`resolveCoupleName()` collapses to one name everywhere else in the app.

## Deviations from the reference

- **Countdown removed as a separate block.** The reference has none; save-the-date
  carries the date. The numbers are not printed to avoid an empty-looking section
  when the date is far away.
- **No lightbox.** The reference has none and the gallery is nine frames; a
  lightbox is future work, not a port.
- **Instagram is not rendered.** The reference has no social row and the editor
  field is optional.
- **`Turut Mengundang` and `Rundown` are not implemented.** The kids contract
  omits both; the content spec sets `inviting: false`, `rundown: false`, so the
  editor and ops hide them (see the playbook contract table).
- **Ribbon dividers** are drawn in CSS rather than the reference's sliced images,
  which keeps five extra requests off the first scroll.

## Verification

- `npx tsc --noEmit` clean, production build clean, `/templates/songket-marun/preview`
  200 in the deploy smoke (all 24 previews green).
- Manual: opens from the cover, wish submit works, gift copy works, RSVP dock
  appears only with a resolved guest (or a flexible slug).
