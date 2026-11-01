# REA — Our Wedding Link "Boarding Pass" → Aksaraa in-house template

Reference: <https://our-wedding.link/design/boarding-pass> · analysed 2026-11-01
Proposed template code: `boarding-pass` · Source type: `inhouse`
**Status: analysis only.** Nothing is ported yet — §13 contains the one decision
(an INFO TAMU sheet) that has to be made before the component is written.

Method: same as `docs/REA_N_FILM.md`. Resolved the SSR payload (`window.__NUXT__`),
dumped the rendered DOM (170 KB) and all 4 378 computed CSS rules, then measured
every block's box and typography. The preset is `layout_dynamic` with sub-preset
`6ab888e1099ae674b6f66631`; its skin is the `tp-*` rule set.

Artefacts (throwaway): `$TMP/opencode/bpass/{design.html, nuxt.json, dom.html, all.css}`.

---

## 1. Verdict

| Question | Answer |
|---|---|
| What it is | A **boarding pass / travel document** invitation: cream paper, teal ink, perforated tickets, passport card, departure board countdown, barcode and machine-readable zones |
| Stack | Same preset engine as N Film — every section is a `widget-block` on a 390 px canvas, skinned by ~60 `tp-*` rules |
| Data source | Public. Whole invitation is in the SSR payload |
| Fonts | **All four OFL** — `DM Serif Display` (display), `DM Mono` (labels/data), `Jost` (body), `Caveat` (script). Two are already vendored in our repo |
| Art | **CSS-drawn, almost entirely.** Ticket notches, perforations, barcode, waves, stripes and stamps are gradients/SVG data-URIs. The only raster ornaments are **stock clipart** (palm tree, hibiscus, rings) — do not vendor |
| Schema changes | **None.** Everything maps to existing `wedding_profiles` columns |
| Verdict | **Portable.** Visually the strongest reference we have analysed — and the cheapest, because the design is paper and ink rather than photography |

---

## 2. What the reference is

A printed travel document as an invitation:

- **Cover** = a real boarding pass. Stub on top with the ticket heading and a
  barcode, perforated tear line, then FROM / TO / PASSENGER / DATE / GATE /
  BOARDING / DESTINATION fields, a "Tunjukkan tiket ini dengan senyuman." line
  and the wedding reference `OWL 26 · 01A`.
- **Couple** = the **passenger manifest** (`DAFTAR PENUMPANG`), one "passport"
  card per person with a photo, full name, parents, an Instagram pill and a
  machine-readable line (`P<IDN<<ARGA<<<<…`).
- **Events** = **flights** (`PENERBANGAN 01 / 02`) with gate, seat and
  `LIHAT PETA` / `SIMPAN` actions.
- **Countdown** = an airport **departure board** (`PAPAN KEBERANGKATAN`) with
  split-flap digits, plus `TUJUAN / STATUS · HARI BAHAGIA / TEPAT WAKTU`.
- **Gallery** = `ALBUM PERJALANAN` — photos matted like prints.
- **Closing** = full teal-deep panel, `Sampai jumpa di pantai,` in script.

Everything is `#FFFCF6` paper on `#F3EDE2` cream, with `#1F5A60` teal ink.

---

## 3. Section inventory (measured, 390 px column)

Document height **9 718 px**.

| # | Block | y | h | Ground | Contents |
|---|---|---|---|---|---|
| 0 | **Boarding pass cover** | 0 | 844 | photo + `tp-sampul-redup` wash | ticket stub, barcode, FROM/TO, names, date, gate, boarding, destination, disclaimer, wedding reference |
| 1 | **Hero** | 844 | 760 | photo | `PERNIKAHAN`, `Arga & Kirana`, `11 . 12 . 26`, script "tujuan akhir: hari bahagia kami" |
| 2 | **Salam Hangat** | 1 603 | 590 | `#F3EDE2` | greeting paragraph + verse (`QS. AR-RUM: 21`) |
| 3 | **Daftar Penumpang** | 2 192 | 840 | `#F3EDE2` | 2 passport cards: photo, `MEMPELAI PRIA/WANITA`, full name, `PUTRA/PUTRI DARI`, MRZ line, Instagram |
| 4 | **Itinerary** | 3 031 | 806 | `#F3EDE2` | 2 flight cards: `PENERBANGAN 01/02`, name, date, time, venue, address, gate/seat, map + calendar |
| 5 | **Papan Keberangkatan** | 3 836 | 500 | `tp-papan` teal board | split-flap countdown, destination/status, calendar button |
| 6 | **Kisah Kami** | 4 335 | 1 000 | `#F3EDE2` | 3 year entries + "…dan perjalanan kami baru saja dimulai." |
| 7 | **Album Perjalanan** | 5 334 | 691 | `#F3EDE2` | print-matted gallery |
| 8 | **Persiapan / INFO TAMU** | 6 024 | 628 | `#F3EDE2` | a guest-info sheet opened by `BUKA INFO` ("dress code, pilihan penginapan, dan tips") |
| 9 | **Check-in (RSVP)** | 6 651 | 622 | `#F3EDE2` | form: name, WhatsApp, address, position select, yes/no, submit |
| 10 | **Buku Tamu** | 7 272 | 151 | `#F3EDE2` | heading only — the list + form render inside the gift block below |
| 11 | **Tanda Kasih** | 7 422 | 1 263 | `#F3EDE2` | wish list + "Send a wish" + QRIS / Direct Transfer / Send Gift tabs |
| 12 | **Closing** | 8 684 | 760 | `#163F44` | script farewell, thank-you, `Wassalamu'alaikum` |
| 13 | Platform credit + brand | 9 443 | 276 | `#F3EDE2` | **drop** |

Sections 2–11 share one cream ground; only the cover, hero, countdown board and
closing carry a different surface. That is the whole rhythm: **paper pages with
two "documents" (the ticket, the board) and one teal panel at the end**.

---

## 4. The document system (this is the design)

Nothing here is a texture. It is all drawn:

```css
/* ticket: rounded top, notched bottom, perforation, shadow */
.tp-tiket-atas {
  background:
    repeating-radial-gradient(circle at 94% 10%, rgba(31,90,96,.055) 0 1px, transparent 1px 8px) 0 0 / 100% 78% no-repeat,
    radial-gradient(circle at 0 100%,    transparent 12px, #FFFCF6 12.5px) left  top / 51% 100% no-repeat,
    radial-gradient(circle at 100% 100%, transparent 12px, #FFFCF6 12.5px) right top / 51% 100% no-repeat;
  border-radius: 18px 18px 6px 6px;
  filter: drop-shadow(0 16px 22px rgba(8,30,34,.32));
}

/* the tear: a dashed rule inset 18px, plus two notches */
.tp-tiket-bawah { background:
    repeating-linear-gradient(90deg, rgba(31,90,96,.5) 0 6px, transparent 6px 12px) 18px 0 / calc(100% - 36px) 1.5px no-repeat, … }

/* route line: two dot endpoints and a dashed middle */
.tp-rute { background:
    radial-gradient(circle at 5px 50%, #1F5A60 3.5px, transparent 4px),
    radial-gradient(circle at calc(100% - 5px) 50%, #1F5A60 3.5px, transparent 4px),
    repeating-linear-gradient(90deg, rgba(31,90,96,.55) 0 5px, transparent 5px 10px) 12px 50% / calc(50% - 36px) 1.5px no-repeat, … }

.tp-barkode     { background: repeating-linear-gradient(90deg, #1D2A2D 0 2px, transparent 2px 5px, #1D2A2D 5px 6px, transparent 6px 9px), … }
.tp-isian       { border-bottom: 1.5px dotted rgba(29,42,45,.32); }   /* the dotted "write here" rule */
.tp-mrz         { white-space: nowrap; overflow: hidden; }             /* machine-readable zone */
.tp-putus       { border-top: 1.5px dashed rgba(31,90,96,.3); }
```

Reusable document primitives worth porting **as CSS, not images**: ticket with
notches (`tp-tiket-atas/bawah`), perforation, barcode, route line with
endpoint dots, dotted field rule, MRZ, passport card (`tp-paspor`), stamp
(`tp-cap` + `tp-cap-kiri/kanan`), label/bag tag (`tp-label`), split-flap
countdown (`tp-cd`), and the torn-edge wave divider (`tp-ombak-atas/bawah`,
inline SVG).

---

## 5. Palette + type (computed)

| Token | Value | Where |
|---|---|---|
| `--bp-paper` | `#FFFCF6` | every ticket, card and input |
| `--bp-cream` | `#F3EDE2` | page ground |
| `--bp-teal` | `#1F5A60` | ink, rules, buttons, labels |
| `--bp-teal-deep` | `#163F44` | countdown board, closing panel |
| `--bp-mint` | `#BFD6D0` | pale accent, board labels |
| `--bp-ink` | `#1D2A2D` | body copy and data |
| `--bp-muted` | `rgba(29,42,45,.55)` | field labels |
| `--bp-shadow` | `rgba(29,42,45,.14) 0 16px 34px` | cards |

### Type scale (measured)

| Role | Font | Size | Tracking | Notes |
|---|---|---|---|---|
| Cover heading `BOARDING PASS` | DM Mono | 10 | 2.6 px | teal |
| Field labels (`KELAS VIP`, `DARI`, `PENUMPANG` …) | DM Mono | 8.5 | 1.8–2.2 px | uppercase, 55 % ink |
| Ticket names | **DM Serif Display** | 30 | — | |
| `&` between names | DM Serif Display | 19 | — | teal |
| Script fields (`Pelaminan`, destination) | **Caveat** | 24 | — | |
| Disclaimer | Jost | 11 | — | 58 % ink |
| Wedding reference (`OWL 26 · 01A`) | DM Mono | 8.5 | 3.2 px | uppercase, 55 % |
| Section titles (`Kedua Mempelai`, `Catatan Perjalanan`, `Potret Kami`) | DM Serif Display | 32 | — | |
| Sub-titles (`Jadwal Keberangkatan`) | DM Serif Display | 30 | — | |
| Event names (`Akad Nikah`) | DM Serif Display | 28 | — | |
| Story year | DM Mono | 11.5 | 1 px | teal |
| Story title | DM Serif Display | 21 | — | |
| Countdown digits | DM Mono | 30 | — | on a split-flap tile |
| Countdown labels | DM Mono | 8.5 | 0.2 em | mint, 80 % |
| Buttons | DM Mono | 9.5 | 0.18 em | uppercase, 34 px tall, radius 999 |
| Forms | Jost | — | — | paper fill, `1px rgba(31,90,96,.22)`, radius 10 |

**Two of the four faces are already vendored** (`DM Serif Display`, `Caveat`).
The port needs **`DM Mono` (400)** and **`Jost` (400/500/600)** added to
`scripts/fetch-fonts.js` — both OFL Google Fonts, no substitution.

---

## 6. Asset audit

| Group | Files | Bytes | Verdict |
|---|---|---|---|
| **Clipart ornaments** | palm tree (520×729), hibiscus (560×550), rings line-art (360×268), + 3 more 360×247 / 560×597 / 520×550 | 39 KB–568 KB, **≈ 2.6 MB** | **Do not vendor.** Stock clipart, and heavier than the CSS it replaces |
| Couple photos (demo) | 5 × 867×1300 JPG | — | demo data, never ship |
| Gallery (demo) | 4 × `pexels-photo-*.jpeg` (external Unsplash/Pexels URLs) | — | licensed stock, never ship |
| Cover/hero still | `b13b4f10` 865×1300 PNG | 578 KB | demo photo |
| Cover video | 1 × `<video muted autoplay loop preload="metadata">` | — | couple's own film |
| Music | 1 × `<audio loop preload="auto">` | — | couple's own track |

**The clipart is the only real decision here, and the answer is: rebuild it.** We
don't need a palm tree or a hibiscus to read as a boarding pass — those are a
beach theme the *reference couple* chose. What makes the design work is paper,
perforation, mono type and a departure board, all of which are CSS. Ship our own
inline SVG for the few marks we do want (rings, a stamp, the torn-edge wave).

---

## 7. Copy inventory

Structural (safe to keep — it is the metaphor): `BOARDING PASS` · `KELAS VIP` ·
`DARI` · `TUJUAN` · `PENUMPANG` · `TANGGAL` · `GERBANG` · `BOARDING` ·
`UNDANGAN PERNIKAHAN` · `DAFTAR PENUMPANG` · `MEMPELAI PRIA/WANITA` ·
`NAMA LENGKAP` · `PUTRA/PUTRI DARI` · `ITINERARY` · `PENERBANGAN` ·
`LIHAT PETA` · `SIMPAN` · `PAPAN KEBERANGKATAN` · `STATUS` · `TEPAT WAKTU` ·
`KISAH KAMI` · `ALBUM PERJALANAN` · `CHECK-IN` · `BUKU TAMU` · `TANDA KASIH`

Data-driven (never ship the reference's): names, dates, venues, the verse, the
story years and text, the wish wall, gift accounts, the closing message.

---

## 8. Minimum-section gap analysis (playbook §0.5)

The playbook mandates **16 sections**. The reference ships **10** of them; three
are present but merged into another surface, and three are missing.

| # | Minimum section | In the reference? | Action |
|---|---|---|---|
| 1 | Cover | ✅ the boarding pass itself | keep |
| 2 | Opening video | ✅ muted looping film behind the cover | keep — feed it `video_url` |
| 3 | Welcome | ✅ `SALAM HANGAT` | keep |
| 4 | Kalimat pembuka | ⚠️ the greeting paragraph inside `SALAM HANGAT` | **split out** as the couple's own word card |
| 5 | Mempelai | ✅ `DAFTAR PENUMPANG` passport cards | keep — see note below |
| 6 | Love story | ✅ `KISAH KAMI` | keep |
| 7 | Event | ✅ `ITINERARY` flights | keep |
| 8 | Countdown | ✅ `PAPAN KEBERANGKATAN` | keep |
| 9 | Turut mengundang | ❌ | **ADD** — in theme: a manifest "booking group" / `TURUT MENGUNDANG` block on paper |
| 10 | Rundown | ❌ | **ADD** — in theme: `JADWAL KEBERANGKATAN`, a departure timetable (time · activity) |
| 11 | Gallery | ✅ `ALBUM PERJALANAN` | keep |
| 12 | Video | ❌ (the film is only the cover backdrop) | **ADD** — in theme: an `IN-FLIGHT` film card with a 16:9 print and a play stamp |
| 13 | Wedding gift | ✅ `TANDA KASIH` | keep — two tabs (no QRIS image, see N Film §11.3) |
| 14 | Dress code | ❌ inline (only *mentioned* inside `INFO TAMU`) | **ADD** — in theme: `BAGAIMANA BERPAKAIAN` with swatches on a paper card |
| 15 | Wishes | ✅ `BUKU TAMU` | keep — name + message only |
| 16 | Closing | ✅ teal-deep panel | keep |

### Note on rule 3 (mempelai labels)

The reference prints `MEMPELAI PRIA` / `MEMPELAI WANITA` above each passport
card. Playbook §0.5 rule 3 says mempelai carries no gendered copy *unless the
design demands it*, and here it does: a passenger manifest names each traveller
separately, and the card is a passport. **Ship the labels, as the design's own
data** — not as filler — and record the exception here so the next agent does not
"fix" it.

### The three additions, in the reference's own vocabulary

1. **Turut mengundang** — a paper card headed `TURUT MENGUNDANG`, one line per
   family on a dotted field rule (`tp-isian`), closed by a stamp mark. No new
   visual language: it reuses the cover's dotted fields.
2. **Rundown** — `JADWAL KEBERANGKATAN`: a mono timetable, `time · description`
   rows divided by `1.5px dashed rgba(31,90,96,.3)` (`tp-putus`), i.e. the
   ticket's own tear line used as a row separator.
3. **Video** — `DALAM PERJALANAN` / an `IN-FLIGHT` card: a 16:9 print with a
   6 px white mat (the gallery's frame), and a round "PASTED" stamp
   (`tp-cap`) as the play affordance.
4. **Dress code** — `SEBELUM BERANGKAT · DRESS CODE`: a `tp-kartu` paper card,
   Jost description, and 44 px swatch circles with a 1 px teal hairline —
   centred, since the couple may pick one colour (same fix as N Film).

### Proposed section order

```
cover → opening video → hero → welcome → kalimat pembuka → mempelai
      → love story → event → countdown → turut mengundang → rundown
      → gallery → video → gift → dress code → wishes → closing
```

The reference's own order is kept wherever it already matches; `turut mengundang`
and `rundown` are placed between countdown and gallery, which is where the
sequence reads best (documents → schedule → album).

---

## 9. Sections outside the minimum — needs a decision

| Candidate | What it is | Data | If dropped | Recommendation |
|---|---|---|---|---|
| **A. `PERSIAPAN / INFO TAMU` sheet** | A modal opened by `BUKA INFO` that promises "dress code, pilihan penginapan, dan tips kecil" — the reference's info drawer | **none** — we have no lodging or tips column, and dress code is already a minimum section | Nothing is lost except the promise of lodging advice | **Drop the sheet, ship dress code inline.** If you want it, it needs a data source first |
| **B. Gate / seat fields (`GERBANG A1`, `KURSI VIP`)** | Printed on the ticket and the flight cards | `guest_table_number` for the guest-facing ticket; nothing for a "class" | The ticket keeps its layout but loses two fields | **Keep, bound to `guest_table_number`** when present, hidden when empty |
| **C. MRZ lines** (`P<IDN<<ARGA<<<…`) | Machine-readable zone under each passport card | derived from the names | Card still reads as a passport; loses one authentic detail | **Keep, derived** — never hardcoded |
| **D. `SIMPAN KE KALENDER`** | Google-calendar button on a flight card | `sessions[]` + date | Minor utility loss | **Keep** — `gcalLink()` already exists |

Only **A** needs your call. B/C/D are derivations or utilities inside sections we
already ship, so they are not "extra sections".

---

## 10. Mapping to Aksaraa

| Reference | Source |
|---|---|
| Cover names, date | `groom_name`, `bride_name`, `estimated_wedding_date` |
| Cover reference code (`OWL 26 · 01A`) | derived from initials + year, or `template_content.cover_kicker` |
| Cover disclaimer | `template_content.cover_apology` |
| Cover gate / seat | `guest_table_number` (hidden when empty) |
| Cover film | `video_url` (direct file) — same rule as N Film |
| Hashtag, if shown | `display_name` (**not** a derived value — see N Film) |
| Hero names + date | names + date |
| Welcome | `opening_title` / `template_content.welcome_message` |
| Kalimat pembuka | `opening_description` |
| Verse | `quote_text`, `quote_source` |
| Mempelai | `groom_full_name`, `bride_full_name`, photos, parents, `groom_instagram`, `bride_instagram` |
| Love story | `stories[]` (title, description, image_url) + year from the title or a leading 4-digit |
| Flights | `sessions[]` (`name`, `date`, `time`, `venue`, `address`, `maps_url`) |
| Countdown | `estimated_wedding_date` (+ first session) |
| Turut mengundang | `inviting_families[]` |
| Rundown | `rundown[]` (`{time, description}`) |
| Gallery | `gallery_photos[]` |
| Video | `video_url` |
| Gift | `gift_accounts[]` + `gift_address_name` + `gift_address` |
| Dress code | `dresscode` `{title, description, colors[]}` |
| Wishes | `/api/wishes` via `Wishes.tsx` |
| Closing | `template_content.closing_message` |
| RSVP | **the dock only** — the reference's CHECK-IN form is not ported |

**No new columns.**

---

## 11. Compliance & licensing

| Item | Status |
|---|---|
| DM Serif Display, DM Mono, Jost, Caveat | **OFL** — self-host freely |
| Palm / hibiscus / rings clipart | **Stock clipart — do not vendor.** Rebuild what we need as inline SVG |
| Demo photos (incl. 4 Unsplash/Pexels URLs) | Never ship |
| Platform credit `UNDANGAN DIGITAL OLEH owlink.id`, owl + IG footer | **Remove**, replace with the Aksaraa badge exactly as Sandhya/N Film do |
| `bebas_neu` | A custom uploaded font referenced by the skin but **used by zero elements** in the render — nothing to substitute |

---

## 12. Proposed content spec

```ts
{
  code: "boarding-pass",
  name: "Boarding Pass",
  description:
    "Undangan berbentuk tiket pesawat dan paspor perjalanan — papan keberangkatan, manifest penumpang, itinerary, dan buku tamu.",
  theme: {
    fonts: { display: "DM Serif Display", script: "Caveat", body: "Jost" },
    colors: { surface: "#f3ede2", text: "#1d2a2d", accent: "#1f5a60",
              accentMuted: "#bfd6d0", overlay: "#163f44", dark: "#163f44" },
    ornaments: { divider: "line", border: "minimal", frame: "square" },
    motion: { enabled: true, duration: 0.6, stagger: 0.12 },
  },
  content: {
    cover_slots: 3,
    cover_slot_labels: ["Sampul", "Kutipan", "Closing"],
    groom_photo: "single",
    bride_photo: "single",
    story_photo: true,
    extras: true,
    sections: {
      opening_description: true, quote: true, countdown: true, inviting: true,
      video: true, story: true, gallery: true, gift: true, dresscode: true,
      livestream: false, rundown: true, contacts: false,
    },
  },
}
```

Fonts: add `DM Mono: 400` and `Jost: 400,500,600` to `scripts/fetch-fonts.js`,
then `node scripts/fetch-fonts.js && node scripts/gen-font-css.js`.

New `templateExtras` keys for this code: `cover_kicker` (the `OWL 26 · 01A`
reference), `cover_apology` (the disclaimer), `gallery_intro`
("oleh-oleh dari perjalanan kami"), `closing_message`, `inviting_intro`,
`wishes_intro`, `gift_intro_description` — all of which already exist; no new
key is required.

Registration: migration `20261043000000_boarding_pass.sql` (next free version —
`20261042000000` is N Film, `20261044000000` is Ivory Lace),
`sort_order = 34` (33 is N Film; prod max is 33), `category 'Modern'`,
`tier 'Baru'`, `no_photo = false`.

---

## 13. Traps specific to this design

| Symptom | Cause | Fix |
|---|---|---|
| Ticket notches show a white box over the photo | the notch is a `radial-gradient` **painted in paper colour**; on a photo background it must punch through, not paint | put the ticket on a paper card, not directly on the photo (the reference does exactly this) |
| Perforation disappears at some widths | `background-size: calc(100% - 36px)` on a `repeating-linear-gradient` | keep the 18 px inset and re-check at 320/390/430 |
| Mono text wraps mid-field | DM Mono at 8.5 px + 3.2 px tracking in a 120 px field | `white-space: nowrap` on field labels and the MRZ (`.tp-mrz`) |
| Names overflow the ticket | DM Serif Display 30 in a 160 px column fits ~10 characters | first names only, `clamp(24px, 7.2vw, 30px)`, and let long names shrink |
| Split-flap digits look like plain text | missing the tile gradient + inset shadows | copy the four-stop `linear-gradient` and both inset shadows from `.tp-cd .db-cd span` |
| Countdown separators show | `.db-sep` not hidden | `display: none` on separators (the tiles read as separate flaps) |
| Buttons lose their "outline" look | the ring is an **inset box-shadow**, not a border | `box-shadow: inset 0 0 0 1.2px var(--bp-teal)` on the ghost variant |
| Forms look like web forms | default input styling | paper fill, 1 px `rgba(31,90,96,.22)`, radius 10, Jost |
| Bundled clipart drags 2.6 MB in | copying the palm/hibiscus PNGs | draw only what is needed as inline SVG; ship zero raster ornaments |
| Paper looks grey next to the cream ground | `#FFFCF6` card on `#F3EDE2` needs the shadow to separate | keep `0 16px 34px rgba(29,42,45,.14)` |
| Cover emblem re-appears after the couple clears it | derived hashtag | read `display_name` only, never derive (N Film §17) |

---

## 14. Definition of done

- [ ] `DM Mono` + `Jost` vendored, `--font-*` declared
- [ ] Component + CSS + `Wishes.tsx` + lightbox + film modal + dock
- [ ] All 16 minimum sections; the three additions drawn in `tp-*` vocabulary
- [ ] RSVP is the dock only; suppressed in `preview_mode` / `template_demo`
- [ ] No raster ornaments shipped; no stock clipart; no Unsplash/Pexels URLs
- [ ] Gate/seat bound to `guest_table_number`, MRZ derived from names
- [ ] Aksaraa footer badge identical in structure to Sandhya
- [ ] `tsc --noEmit`, staging build, preview 200, `scrollWidth === innerWidth`
- [ ] Row registered before the final build (`rm -rf .next`), gallery count checked
- [ ] Deploy + smoke `/templates/boarding-pass/preview`

---

## 15. Still open

1. **§9 A — the `INFO TAMU` sheet.** Ship it (needs a data source) or drop it and
   keep dress code inline? **Recommended: drop.**
2. **Language.** The reference is Indonesian and, unusually, *good* Indonesian —
   the boarding-pass puns only work in Indonesian. Recommend keeping Indonesian
   for this template (unlike N Film, which we shipped in English).
3. **Story years.** `stories[]` has no year column; the reference prints one per
   entry. Proposal: read a leading `YYYY` from the story title and fall back to
   no year, without a schema change.
