# Ceriavite — undangan acara anak (khitanan, aqiqah, ulang tahun)

Ceriavite is the second product surface of the Aksaraa wedding platform. Same
codebase, same Supabase project, same dashboard, editor and ops console. Only
the brand surface, the field labels and the templates differ.

- Marketing site: **https://ceriavite.aksaraa.com**
- Guest invitations: **https://{slug}.aksaraa.com** (shared with wedding)
- Price: **one package, Rp 199.000** — mapped to the existing `essential` code
- Included: digital invitation, RSVP, doa & ucapan (wish wall), unique guest
  links, amplop digital (tanda kasih)
- Excluded: buku tamu QR, galeri kenangan tamu (candid), scanner, LED, WA blast

## Why the invitations are on the apex wildcard

`{slug}.aksaraa.com` is one DNS level under the apex, so Cloudflare Universal
SSL covers it and the host can stay **proxied** (`rafi-novi.aksaraa.com` already
answers 200 through the edge with `cf-cache-status: DYNAMIC`). That is strictly
faster than `{slug}.wedding.aksaraa.com`, which is DNS-only because a two-level
host needs Advanced Certificate Manager.

Rule: **mint one form, serve many.**

- Everything new is minted as `{slug}.aksaraa.com` by `coupleUrl()`.
- `*.wedding.aksaraa.com` and `*.undangananak.aksaraa.com` stay as aliases
  forever. Printed cards, QR codes and WhatsApp links already in the wild keep
  working; those are pure Caddy rewrites.
- The landing hosts (`wedding.aksaraa.com`, `ceriavite.aksaraa.com`) are
  marketing only and never resolve a couple.

## Data model — one table, no side table

`sessions`, `gallery_photos`, `quote_text`, `gift_accounts`, `stories`,
`inviting_families` and `template_content` are already event-agnostic. A kids
invitation needs nothing new (verified against the three reference designs:
cover, salam/doa, ananda + orang tua, waktu & tempat, countdown, galeri,
konfirmasi, doa & ucapan, tanda kasih, closing, musik).

Child data maps onto the **first person slot** (`groom_*`). The slot is never
conditional on gender:

| Field | Column |
|---|---|
| Ananda (foto · nama · Instagram, boleh lebih dari satu) | `children[]` |
| Nama panggilan ananda pertama (cover + slug) | `groom_name` |
| Nama lengkap ananda pertama ("Putra/Putri Kami") | `groom_full_name` |
| Foto ananda pertama | `groom_photo_url`, `cover_photos` |
| Orang tua ("Bapak X & Ibu Y"), SATU untuk semua ananda | `groom_parents` |
| Doa / hadith | `quote_text` + `quote_source` |
| Acara (boleh lebih dari 2) | `sessions[]` |
| Tanggal | `estimated_wedding_date` |
| Second person slot | left empty (`bride_*`) |

`children` is the source of truth for the "Putra/Putri Kami" block:
`[{ name, full_name, photo_url, instagram }]`. Ops and the couple editor edit
that list; the API mirrors **child #1** into `groom_*` on every save, so the
slug, `resolveCoupleName()`, OG copy, ops queue rows and every older reader keep
working untouched. `resolveChildren()` (`src/lib/children.ts`) falls back to the
`groom_*` slot when `children` is empty, so invitations created before the
column existed render exactly as before. The parent line is never repeated per
child — it is the same Bapak/Ibu for every ananda.

`resolveCoupleName()` already collapses to a single name when one slot is
empty, so nothing in the display path needs a gender branch.

New columns only:

- `wedding_profiles.event_type` — `wedding | khitanan | aqiqah | birthday`
- `wedding_profiles.subject_gender` — `putra | putri` (copy only)
- `wedding_profiles.children` — jsonb list of ananda (default `[]`)
- `web_templates.event_type` — same enum, drives gallery filtering

`bride_name` stays `NOT NULL`; kids profiles store `''`.

## Reserved slugs (mandatory)

`{slug}.aksaraa.com` makes every slug a hostname on the brand apex, so a couple
must never be able to take `cdn`, `wp`, `art`, `staging`, `ceriavite`, … before
this change, `check-slug` only checked DB uniqueness. `src/lib/reservedSlugs.ts`
is the single list, enforced by `check-slug`, `check-couple`,
`submit-registration` and the registration hint UI.

## Kids minimum-section contract

The wedding playbook demands 16 sections. Kids invitations ship 11, because
there is no second person, no love story, no dress code and no rundown:

1. Cover — nama panggilan, foto, guest line, date, "Buka Undangan"
2. Opening — salam + kalimat pembuka (`opening_title`/`opening_description`)
3. Doa / kutipan — `quote_text` + `quote_source`
4. Ananda + Orang Tua — satu frame ukuran penuh per ananda (foto berbingkai
   lengkung + ornamen yang sama dengan desainnya), disusul nama dan Instagram
   masing-masing, lalu satu baris "Putra/Putri dari …" untuk semuanya
5. Waktu & Tempat — `sessions[]` (acara + lokasi/alamat, maps button); jumlah
   sesi tidak dibatasi untuk kids (wedding tetap maksimal dua)
6. Countdown — `estimated_wedding_date`
7. Galeri — `gallery_photos[]`
8. Konfirmasi Kehadiran — the shared floating RSVP dock (never a section)
9. Doa & Ucapan — wish wall
10. Tanda Kasih — `gift_accounts[]` + `gift_address`
11. Closing + musik

Sections 2 and 3 may share one surface. Nothing may be dropped silently; a
deviation is recorded in the template's `docs/REA_*.md`.

## Templates

Three, cloned from the references shared by the owner:

| code | name | reference | palette |
|---|---|---|---|
| `songket-marun` | Songket Marun | Crimson Songket | maroon + gold, songket ornament, Malay |
| `ubin-ottoman` | Ubin Ottoman | Ubin Biru Ottoman | ivory + navy, Turkish tile, mosque arch |
| `lentera-zamrud` | Lentera Zamrud | Lentera Zamrud | emerald + gold, lantern + mosque skyline |

A shared kids kit (`src/components/templates/shared/kids/`) carries the section
shells, wishes feed and gift block so each template only owns its chrome,
type scale and ornament vocabulary.

## Ops impact

- Queue and detail rows show an event badge and "Ananda … (Bapak X & Ibu Y)"
  instead of "Mempelai Pertama/Kedua".
- Queue filter by event type.
- `AntrianDetail.tsx` placeholders and `messageTemplates.ts` /
  `notifyGroup.ts` / `reminderTemplates.ts` get kids wording.
- Dashboard hides (does not lock) the Check-in and Galeri tiles for kids.
- Revenue reporting groups by `event_type`; no new package code.

## Sequence

1. Migration + `eventType` + reserved slugs + `coupleUrl` apex — **foundation**
2. `w/[slug]` + preview prop assembly, `TemplateProps.event_*`
3. Registration mode (`?event=`) + `submit-registration` branch
4. Ceriavite landing on `ceriavite.aksaraa.com`
5. Shared kids kit + `songket-marun`
6. `ubin-ottoman`, `lentera-zamrud`
7. Editor + ops parity, template gallery filtering
8. Docs, deploy guard, smoke

## Status

Live in production (2026-11-16): landing on ceriavite.aksaraa.com, `/daftar`
registration, event-aware dashboard/editor/ops wording, per-host robots and
sitemap, per-invitation share metadata, and the first kids template row.

Deliberately **not** done yet:

- The three reference designs are not ported. `songket-marun` is a first pass in
  the reference's palette and section order; the faithful port (Marcellus +
  Parisienne, `bingkai-ukir-lak` frame, venue and closing photo slots, "Doa untuk
  Ananda", "Amplop Digital") is the next task. Ornaments are already vendored.
- `messageTemplates` / `reminderTemplates` still carry wedding wording. They are
  reachable only from the QR guestbook (not in the kids package) and the ops WA
  composer, where staff edit before sending. Revisit when kids get a share modal.
- The login page resolves its brand on hydration, so the SSR HTML still contains
  "Aksaraa". Making it SSR-correct requires making that route dynamic.
