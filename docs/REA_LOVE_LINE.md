# REA — Love Line (`love-line`)

Reference: `https://our-wedding.link/design/love-line` (Our Wedding Link,
"layout_dynamic" preset). Intake 2026-11-14.

> Port contract: the table in §6 is filled before review (playbook §0.6).
> **ADDED** marks a section that is not in the reference and was rebuilt in its
> own visual language because the 16-section contract requires it.

---

## 1. Reference facts

| | |
|---|---|
| Stack | Nuxt + `layout_dynamic` widget canvas (absolute `widget-block`s scaled from a 390×844 artboard) |
| Canvas | phone-first 390; the public design page centres the same column on pink |
| Fonts | **Mr Dafoe** (names and script section titles), **Caveat** (handwritten annotations and quotes), **Montserrat** (body, labels, data) |
| Palette | paper `#F5F2EC`, ink `#1B1B1B`, crimson `#C8242C`, soft line `rgba(27,27,27,.18)` |
| Art | monochrome line illustrations (couple, portraits, story, gallery, lineup, closing) rendered through a duotone filter; no photography anywhere |
| Motion | animate.css `fadeIn` / `fadeInUp` / `fadeInLeft` / `fadeInRight` / `zoomIn` with 0.2–0.9 s delays; decorative `gc-denyut` / `gc-goyang` loops |
| Sections | cover, welcome ("with grateful hearts"), couple, date & venue, schedule, story, gallery, confirm/RSVP (dropped), wishes, gift, closing |
| Music | one MP3 started on Open; the design page also carries platform chrome (demo banner, theme painter) which is not ported |

---

## 2. Asset audit

Vendored to `public/templates/love-line/`. Every file is derived from the
reference's own line art; no couple photograph is used (the template is
`no_photo`). JPG artwork was converted to white-transparent WebP (alpha =
255 − luminance) so the ink lines sit on the cream paper; the PNG artwork keeps
its alpha and is painted with `filter: brightness(0)` (ink) or a CSS mask
(crimson hearts), matching the reference's duotone filter.

| File | Use |
|---|---|
| `cover-couple.webp` | cover dancing couple |
| `heart.webp` | crimson heart doodles + inline section hearts |
| `welcome-bench.webp` | "with grateful hearts" welcome |
| `groom.webp` / `bride.webp` | the couple's two illustrated portraits |
| `icon-calendar.webp` / `icon-clock.webp` / `icon-pin.webp` | date, time, venue doodles |
| `story-1…4.webp` | first met / hanging out / engagement / towards halal |
| `gallery-1…4.webp` | decorative "our moments" band |
| `confirm-lineup.webp` | "Turut Mengundang" line-up |
| `closing-dance.webp` | closing dance + film poster |
| `thumbnail.webp` | gallery thumbnail (cover at 780×1688) |

Fonts: `public/fonts/mrdafoe-400.woff2` (added via `scripts/fetch-fonts.js` and
`scripts/gen-font-css.js`), plus the already-vendored Caveat and Montserrat.

---

## 3. Motion

Same mechanism as the reference: one `IntersectionObserver` adds `.is-in` to
`[data-ll-reveal]`; cover elements use `[data-ll-load]` and play on mount.
Keyframes animate `opacity`, `translate` and `scale` (individual properties, so
rotated annotations keep their rotation). `prefers-reduced-motion: reduce` and
`@media (scripting: none)` leave every target visible.

| Element | Animation | Delay |
|---|---|---|
| Cover kicker / names / guest / button | fade / up | 0 → 0.46 s |
| Cover illustration | fade | 0.18 |
| Section kickers / script titles | up | 0 → 0.04 |
| Body copy | fade | 0.06 → 0.14 |
| Notes ("the one", "the beauty") | fade | 0.06 |
| Countdown / tabs / forms | up | 0.1 |
| Swatch dots | zoom | 0.05 step |

---

## 4. Responsive decision

The reference is a 390 phone canvas. We ship a max-width **480 px** column
centred on the same cream paper (520 px above 720 px viewport), using flow
layout instead of absolute blocks so any number of events, stories, colours and
accounts reflows. Story rows are a two-column grid around a centre rule; the
one-story and odd-count branches leave no empty half.

---

## 5. No-photo contract

`web_templates.no_photo = true`. The editor/ops hide cover slots, the groom and
bride portrait uploads, the love-story photo field, the gallery uploader **and
the video section** (`cover_slots: 0`, `person_photos: false`, `story_photo:
false`, `sections.gallery: false`, `sections.video: false`). Stored photo/video
data is untouched (hide ≠ delete), but the invitation never renders it. Every
image the guest sees is fixed illustration art; the "our moments" gallery is a
static illustration band, not a photo gallery.

The Instagram hashtag (`display_name`) is printed only when the editor field is
filled. There is no derived fallback and no rewriting: an empty field hides it.
This template does **not** print a couple-initials monogram (`initials: false`);
the editor and ops hide the "Singkatan Pasangan" field.

---

## 6. Section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `groom_name`, `bride_name`, `guest_name`, `display_name`, fixed cover art | always | no bride ⇒ no `&`; no guest ⇒ "Dear Guest"; empty hashtag ⇒ hidden | `cover_kicker`, `cover_guest_label`, `open_button`, `cover_apology` | load fade/up |
| 2 | Opening film | — | — | **not shipped**: the reference opens straight onto the welcome; this is a no-photo template, so no film at all | — | — |
| 3 | Welcome | fixed bench art, `opening_description` | always | one surface, no second greeting block | `opening_kicker` | up/fade |
| 4 | Kalimat pembuka | `opening_title`, `opening_description`, `quote_text/source` | always | no quote ⇒ opening copy only; no title ⇒ kicker + copy | profile + `opening_kicker` | up/fade |
| 5 | Mempelai | `groom_full_name`/`bride_full_name`, `*_parents`, `*_instagram` | `person_photos !== false` (illustrations, not uploads) | one name ⇒ that person + no `&`; missing parents/IG row omitted | `mempelai_kicker`, `mempelai_title`, `person_one_label`, `person_two_label`, `parents_label_male`, `parents_label_female` | fade/up |
| 6 | Love story | `stories[]` | `feature_gates.story` && `story_visible !== false` | 0 ⇒ omitted; 1 ⇒ one row; fixed art cycles 1–4 | `story_kicker`, `love_story_title`, `story_intro` | fade/up |
| 7 | Event | `sessions[]` | always | 1 event ⇒ one block; 0 ⇒ section omitted | `events_kicker`, `events_title`, `events_intro`, `maps_label` | up |
| 8 | Countdown | `estimated_wedding_date` / first session date | always when a date exists | 4 units; no date ⇒ no countdown | `countdown_intro` | up |
| 9 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` && `inviting_families_visible !== false` | 0 ⇒ omitted; N rows with rules | `inviting_kicker`, `inviting_title`, `inviting_intro` | up/fade |
| 10 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ omitted; no time ⇒ description only | `rundown_kicker`, `rundown_title`, `rundown_intro` | up |
| 11 | Gallery | fixed illustration set | decorative band (no user photos) | always four plates, 2×2 | `gallery_kicker`, `gallery_title` | fade |
| 12 | Video | — | — | **not shipped**: no-photo means no film; the editor/ops never show the video section (`sections.video: false`) | — | — |
| 13 | Gift | `gift_accounts[]`, `gift_address` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / both ⇒ tabs; none ⇒ omitted | `gift_intro_title`, `gift_intro_description`, `gift_button`, `gift_send_label`, `gift_transfer_note`, `gift_address_note` | up |
| 14 | Dress code | `dresscode.colors[]`, title/description | `dresscode_visible !== false` | no colours ⇒ prose only | `dresscode_kicker`, `dresscode_intro` | fade/zoom |
| 15 | Wishes | `/api/wishes` + guest identity | always | demo feed; 0 approved ⇒ empty state; 4 per page | `wishes_title`, `wishes_intro` + form keys | up |
| 16 | Closing | `closing_message`, names, `display_name`, fixed closing art | always | no bride ⇒ one name; empty hashtag ⇒ hidden | `closing_message` | fade/up |

Order shipped: cover → welcome/opening → mempelai → events + countdown →
inviting → rundown → story → gallery (static illustrations) → gift → dress
code → wishes → closing.

Reference order was cover → welcome → couple → date & venue → schedule → story
→ gallery → RSVP → wishes → gift → closing. The contract moves inviting before
the rundown, keeps the schedule before the story (so the event/countdown pair
stays together), and drops the RSVP form to the shared dock.

---

## 7. Deviations

| Reference block | Decision |
|---|---|
| "Confirm" RSVP form | **Dropped.** RSVP is the shared `InvitationOverlay` dock only (playbook §6). The confirm line-up art is reused for **Turut Mengundang**. |
| Opening film / wedding film | **Not shipped.** The template is no-photo, so it is also no-video; the editor and ops hide the entire VIDEO section. |
| Countdown | **ADDED** below the date and venue in the reference's data language (Montserrat values, thin rules, Caveat label). |
| Turut Mengundang | **ADDED** in the reference's own visual language using the line-up illustration. |
| Gallery | The reference's illustration gallery is kept as a **static decorative band**; the couple's gallery section is disabled because the template is no-photo. |
| Mempelai photos | Fixed groom/bride illustrations, never uploads (no-photo). |
| Reference couple data/photos | Not copied; demo uses Aksaraa's sample couple (Albarn & Faye) and live profile fields. |
| Platform chrome | Demo banner, theme painter and login links are not ported. |
