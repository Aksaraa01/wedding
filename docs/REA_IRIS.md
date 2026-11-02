# REA — Iris (`iris`)

Reference: `https://studio.goodchoice.id/iris/?to=Nama+Tamu` (Goodchoice
Invitation, WordPress + Elementor). Intake 2026-11-02.

> Port contract: the table in §6 is filled before review (playbook §0.6).
> **ADDED** marks a section that is not in the reference and was rebuilt in its
> own visual language because the 16-section contract requires it.

---

## 1. Reference facts

| | |
|---|---|
| Stack | WordPress + Elementor (`e-con`, widgets), page `#cover`, `#ayatsuci`, `#profil`, `#event`, `#rsvp`, `#wishes` |
| Canvas | phone-first 390; desktop keeps a 432 px column |
| Fonts | **Brygada 1918** (body/labels), **Braven Regular** (names, SAVE DATE, RSVP), **Garlicha** (script section titles and event names) |
| Palette | cream `#fffdf7`, gold `#a17824`, deep garden green `#41552f`, white |
| Motion | Elementor `fadeIn` / `fadeInUp` / `zoomIn` + `elementor-invisible` scroll reveal; cover plays on load |
| Sections | cover, verse, profil, save-date/countdown, event + dresscode, RSVP (dropped), live streaming (dropped), gallery, story, gift, wishes, closing |

---

## 2. Measured geometry (390 canvas)

| Section | Measure |
|---|---|
| Cover | 390×844 full-bleed `Iris-cover.jpg`; gold frame `Bitmap.png` 390×522 at y43 (background, contain); "The Wedding of" Brygada 13/0.9; names Braven 43/38.7; "Kepada Yth…" Brygada 15; guest 21; gold pill button 15 |
| Verse | 390×649, floral top `iris-55-1.webp`; green oval frame `ASSET-IRIS-2` 392×476 around a couple photo; quote Brygada 15/22.5, source 26 |
| Profil | 390×1495, draped floral `penutup-2-iris.webp` at the top; "With Love" 24; intro 15; oval portraits 200×300; names 26; parents 13; gold Instagram pill |
| Save date | 935 tall; envelope `ASSET-IRIS-14`, mirror `ASSET-IRIS-10`, heart lace `ASSET-IRIS-9`, umbrellas `ASSET-IRIS-18`; "SAVE the DATE" Braven 40 + 40; four green boxes 58/08/19/50 (24 white, label 13) |
| Event | 390×1239, floral arch `save-thedate-iris.webp` top; names Garlicha 47; date 18; time 18; venue/address; gold `LIHAT LOKASI` pill |
| Dresscode | Garlicha 47; intro 15; four 46 px swatches, gold labels |
| Gallery | Garlicha 79; two-column justified masonry, 8 photos, 8 px gaps, rounded 18 |
| Story | Garlicha 55; items 14/21 justified, 22 titles; photo 150×220 rounded 24, alternating side |
| Gift | Garlicha 41; intro 15; gold `KIRIM HADIAH`; four account cards + address on click; `floo.png` corner |
| Wishes | Garlicha ~65; intro 15; cream inputs with gold borders, gold submit |
| Closing | draped floral + oval photo; message 15; "See you on our wedding day!" 15/700; names Garlicha 42; `penutup-iris.webp` garden; gold Aksaraa footer |

---

## 3. Asset audit

Vendored to `public/templates/iris/` (decorative art only; reference couple
photos are not copied).

| File | Source | Use |
|---|---|---|
| `iris-cover.webp` | `Iris-cover.jpg` | cover + welcome garden scene |
| `iris-frame.webp` | `Bitmap.png` | gold inner frame on the cover |
| `green-oval.webp` | `ASSET-IRIS-2.png` | green ornate oval around the verse photo |
| `cream-arch.webp` | `ASSET-IRIS-3.png` | cream arch card (gift/story fallback) |
| `heart-lace.webp` | `ASSET-IRIS-9.png` | lace heart with the couple monogram |
| `mirror.webp` | `ASSET-IRIS-10.png` | silver hand mirror carrying the date |
| `envelope.webp` | `ASSET-IRIS-14.png` | wax-sealed envelope behind the save-date collage |
| `umbrellas.webp` | `ASSET-IRIS-18.png` | paper umbrellas |
| `dove.webp` | `ASSET-IRIS-24.png` | dove with envelope |
| `floral-corner-a/b.webp` | `Group-of-2/4-Objects` | inviting / wishes corners |
| `flower.webp` | `floo.png` | gift flower |
| `floral-top.webp` | `iris-55-1.webp` | verse / profile top drape |
| `floral-arch.webp` | `save-thedate-iris.webp` | event arch |
| `closing-drape.webp` | `penutup-2-iris.webp` | profile + closing drape |
| `closing-garden.webp` | `penutup-iris.webp` | closing garden |
| `paper-texture.webp` | `bg-iris-1.jpg` | welcome paper texture |
| `curve-divider.webp` | `PowerClip-Curve` | wishes/closing curve |

Fonts: `public/fonts/brygada1918-{400,500,700}.woff2`,
`public/fonts/iris-braven.woff2`, `public/fonts/iris-garlicha.woff2`.

---

## 4. Motion

Same mechanism as the reference: one `IntersectionObserver` adds `.is-in` to
`[data-ir-reveal]`; keyframes animate `opacity` + `translate` (individual
properties, never `transform`). Cover elements use `data-ir-load` and play on
mount. `prefers-reduced-motion` and `scripting: none` leave everything visible.

| Element | Animation | Delay |
|---|---|---|
| Cover kicker / names / guest / button | fade / up | 0 → 0.4 s |
| Section script titles | up | 0 |
| Body copy | fade | 0.08 |
| Oval frames | zoom | 0 |
| Portraits / story photos | fade | 0 |
| Event cards | up | 0.08 step |
| Gallery | fade | 0 |
| Gift / wishes | up | 0.1 |

---

## 5. Responsive decision

The reference is a 390 phone canvas; desktop renders the same column at 432.
We ship a max-width **480 px** column centred on cream, with `cqw` units for the
390 geometry. All variable blocks (portraits, events, story items, gallery) are
flow/`aspect-ratio` based, never percentage heights of count-derived parents.

---

## 6. Section contract table

| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 1 | Cover | `cover_photos[0]`, names, `guest_name` | always | no photo ⇒ cream fallback; no guest ⇒ "Tamu Undangan" | `cover_kicker`, `open_button`, `cover_apology` | load |
| 2 | Opening film | `video_url` | `feature_gates.video` && `video_section_visible` | full-bleed video; no video ⇒ cover photo; autoplay muted with a play control fallback | none | fade |
| 3 | Welcome | cover art, names, date | always | short welcome block, no gate | `welcome_message` | up |
| 4 | Kalimat pembuka | `opening_title/description`, `quote_text/source` | always | no quote ⇒ opening copy only | profile + `opening_kicker` | up |
| 5 | Mempelai | `groom_*`/`bride_*`, parents, IG, photos | `person_photos !== false` | missing parent/IG row omitted; 1 name ⇒ no `&` | profile + `mempelai_kicker`, `parents_label` | fade/up |
| 6 | Love story | `stories[]` | `feature_gates.story` && `story_visible !== false` | 0 ⇒ omitted; 1 ⇒ one item | `love_story_title`, `story_intro` | up |
| 7 | Event | `sessions[]` | always | 1 event ⇒ no divider; 0 ⇒ omitted | `maps_label` | up |
| 8 | Countdown | `estimated_wedding_date` | always with a date | no date ⇒ save-date art without boxes | `save_date_label`, `days/hours/minutes/seconds` | up |
| 9 | Turut mengundang | `inviting_families[]` | `feature_gates.inviting_families` && `inviting_families_visible !== false` | 0 ⇒ omitted | `inviting_kicker`, `inviting_title`, `inviting_intro` | up |
| 10 | Rundown | `rundown[]` | `rundown_visible !== false` | 0 ⇒ omitted; no time ⇒ description only | `rundown_kicker`, `rundown_title`, `rundown_intro` | up |
| 11 | Gallery | `gallery_photos[]` | always with data | 1 photo ⇒ single column; 2-col masonry | `gallery_title`, `gallery_intro` | fade |
| 12 | Video | `video_url` | `feature_gates.video` && `video_section_visible` | inline muted autoplay (file/embed); hidden ⇒ omitted | `video_title`, `video_intro` | up |
| 13 | Gift | `gift_accounts[]`, `gift_address` | `gift_section_visible !== false`; address also `feature_gates.gift_address` | accounts only / address only / none; button discloses details | `gift_intro_title`, `gift_intro_description`, `gift_button` | up |
| 14 | Dress code | `dresscode.colors[]`, title/description | `dresscode_visible !== false` | no colours ⇒ prose only | `dresscode_kicker`, `dresscode_intro` | up |
| 15 | Wishes | `/api/wishes` + guest identity | always | demo feed; 0 approved ⇒ empty state | `wishes_kicker/title/intro` + form keys | up |
| 16 | Closing | `cover_photos[2]`, `closing_message`, names | always | no slot 2 ⇒ cover photo | `closing_kicker`, `closing_message` | fade/up |

Order shipped: cover → opening film → welcome → pembuka → mempelai → story →
event → countdown (inside the save-date block, reference position) → inviting →
rundown → gallery → video → gift → dresscode → wishes → closing.

Reference order was cover → verse → profil → save-date → event → dresscode →
RSVP → live streaming → gallery → story → gift → wishes → closing. Event moved
before story/gallery to keep the reference's save-date → event pairing; RSVP is
the dock; live streaming is not part of the contract.

---

## 7. Deviations

| Reference block | Decision |
|---|---|
| RSVP form | **Dropped**, the shared `InvitationOverlay` dock owns RSVP. |
| Live streaming band | **Not shipped** — no editor field/list in the contract. The gold band language is reused for the wedding film. |
| "Putri dari" / "Putra dari" | Neutral `parents_label` (default "Anak dari"). |
| Opening video / welcome / inviting / rundown | **ADDED** in the reference's cream + gold + script language. |
| Dress code | Moved after gift to follow the contract; same script heading and swatches. |
| Reference couple data/photos | Not copied; demo uses Aksaraa photos and live profile fields. |
| Desktop | Same 480 px column (reference has no desktop composition). |
