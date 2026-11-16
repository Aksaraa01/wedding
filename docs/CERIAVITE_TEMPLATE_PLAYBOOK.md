# Ceriavite in-house template playbook

For an agent adding a **Ceriavite** (khitanan / aqiqah / ulang tahun) template.
Read `docs/INHOUSE_TEMPLATE_PLAYBOOK.md` first — this file only covers what is
*different* for Ceriavite, plus the failure catalogue from building the first one.

---

## 0. What a Ceriavite template is

| | Wedding | Ceriavite |
|---|---|---|
| Event family | `wedding` | `kids` (`khitanan`, `aqiqah`, `birthday`) |
| People | two (`groom_*` + `bride_*`) | **one** (`groom_*` only) |
| Package | essential / signature / … | **`ceriavite`** (Rp 199.000, flat) |
| Sections | 16-section contract | 11-section light contract (below) |
| Hashtag, initials, love story, video | yes | **no** |
| Sign-off | couple names | **parents** (`groom_parents`) |

Everything else — wizard, ops, QR, RSVP dock, wish wall, gift — is shared.

### The one-person mapping (memorise this)

The child lives in the **first person slot**. Never branch on gender for storage.

| Field | Column |
|---|---|
| Nickname (cover headline **and** the slug) | `groom_name` |
| Full name ("Putra/Putri Kami") | `groom_full_name` |
| Photo | `groom_photo_url`, `cover_photos[0]` |
| "Putra dari …" | `groom_parents` (one text line, e.g. "Bapak X & Ibu Y") |
| Instagram | `groom_instagram` |
| `subject_gender` | copy only: "Putra Kami" vs "Putri Kami" |
| `bride_*` | **empty** — `resolveCoupleName()` collapses to one name |

`src/lib/profileView.ts` implements this. Read from it, never from raw columns.

---

## 1. Read the reference properly (this is where the time goes)

`invtlink.id` designs are **data, not just pixels**. Fetch the sub-preset and read
it — guessing from a screenshot costs far more rounds than parsing it:

```bash
# palette + fonts + every element's position/size/z-order
curl -s "https://api.owlink.id/subpreset/<SUB_ID>" > sub.json

# the compiled CSS: masks, letter-spacing, class recipes
jq -r '.data.css' sub.json > ref.css
```

What each field gives you:

| Field | Use |
|---|---|
| `layout_schema.theme` | exact palette (`background_color`, `secondary_color`, `title_color`, `text_color`) |
| `layout_schema.master.font_*` | the three type voices (`font_title`, `font_content`, `font_additional`) |
| `layout_schema.content.<section>` | per-canvas element list with `style.top/left/width/height/zIndex/rotate` — **absolute**, relative to a **390 × 844** canvas |
| `style.bg` per canvas | which sections are cream vs maroon — the single biggest visual difference |
| `node.anim` per element | the reveal spec: `{trigger:"scroll", type:"fadeInUp"/"fadeIn"/"zoomIn", delay: 0.02…0.14}` |
| `ref.css` + `class` on a node | the real artwork. **`cs-tepi` is a gold band masked by a 16.83 × 40 px PNG** — that's the section divider, not a triangle motif you invent |

Download the design assets (frames, flowers, folded songket, the divider tile):
`https://cdn-uploads.owlink.id/<uuid>` — convert to webp, 2× display size.

**Never vendor the reference couple's photos into a live path.** They are fine in
`demoProps` (preview only); a real couple always sees their own uploads.

---

## 2. Files to create / touch

```
src/components/templates/<code>/
  index.tsx          "use client", default export, TemplateProps
  <code>.css         every selector scoped under .<code>-root  (or .skm-/etc.)
public/templates/<code>/
  ornaments…webp     vendored, 2× display size
  demo/…             reference demo photos (preview only)
  thumbnail.webp     450 × 950 plate for the gallery tile
supabase/migrations/
  <version>_<code>.sql           register the row (see §3)
src/components/templates/index.ts   TEMPLATE_MAP + TEMPLATE_CONFIGS entry
src/components/templates/demoProps.ts   DEMO_PROPS_BY_CODE[<code>]
src/lib/templateExtras.ts        per-template copy fields (section + order + placeholder)
docs/REA_<CODE>.md               teardown + deviations + verification
```

### Content spec for Ceriavite

```ts
content: {
  cover_slots: 3,
  cover_slot_labels: ["Foto Sampul", "Foto Tempat Acara", "Foto Penutup"],
  cover_slot_sections: [null, "events", null],
  person_photos: true,
  story_photo: false,
  initials: false,
  sections: {
    opening_description: true,
    quote: true,
    countdown: true,
    inviting: true,      // Turut Mengundang IS included in ceriavite
    video: false,        // no cinematic video
    story: false,        // no love story
    gallery: true,
    gift: true,
    dresscode: false,
    livestream: false,
    rundown: false,
    contacts: false,
  },
}
```

### The 11-section light contract

1. Cover — nickname, photo, guest line, date, "Buka Undangan" (gold pill)
2. Pembuka — basmalah + salam + welcome text
3. Putra/Putri Kami — framed portrait, full name, "putra dari", parents, Instagram
4. Doa untuk Ananda — Arabic ayah → translation → source → ribbon → blessing
5. Save the Date — countdown → kicker → title → weekday → big day → month year → calendar pill
6. Acara — venue photo (arch) + one ruled block per session, no cards
7. Galeri — natural aspect ratios, never crop
8. Tanda Kasih — folded-songket ornament + accounts + address
9. Doa & Ucapan — form + approved feed
10. Turut Mengundang — names with hairline separators
11. Penutup — framed closing photo, "Terima Kasih", closing words, parents

RSVP is **never a section** — it is the shared floating dock.

---

## 3. Registration + gating

`web_templates` row:

```sql
INSERT INTO web_templates (code, name, description, preview_image_url, demo_url,
  sort_order, category, source_type, package_eligibility, tier, is_active, no_photo, event_type)
VALUES ('<code>', '<Name>', '<description>', '/templates/<code>/thumbnail.webp',
  'https://ceriavite.aksaraa.com/templates/<code>/preview',
  10, 'Ceriavite', 'inhouse', '["ceriavite"]'::jsonb, 'Baru', true, false, 'kids');
```

- `event_type = 'kids'` — the **family**, not the rite. `web_templates` filters by
  family; `wedding_profiles` stores the rite.
- `package_eligibility = ["ceriavite"]` — anything else and the dashboard picker
  filters the template out (see §6, failure 1).
- `demo_url` is **absolute on the Ceriavite host** so every surface (dashboard,
  ops, marketing) links to the kids preview.

Do **not** add a matrix column for a new kids template: the `ceriavite` package is
gated in `getRowGates()` and `package_features`, which is enough.

---

## 4. Editor + ops parity (non-negotiable)

A template ships with its **editor** and **ops** surfaces. For Ceriavite the rules
come from `profileView()` — never from a fresh `event_type` check:

```ts
const view = profileView(profile)
if (view.sections.story) { … }        // package/toggle aware
if (view.chrome.hashtagField) { … }   // family aware
```

Sections the package excludes must be **omitted**, not shown locked:
`InvAccordion` in ops takes `omit`, and the editor gates `renderSection` on
`gates.*.included`.

---

## 5. Verification loop (do not skip; do not eyeball)

Chromium ships in the Playwright cache and runs headless even when the npm package
cannot install on arm64:

```bash
CHROME="$HOME/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROME" --headless=new --no-sandbox --window-size=390,900 \
  --screenshot=/tmp/cover.png \
  "https://wedding.aksaraa.com/templates/<code>/preview"
```

For sections below the fold, drive Chrome over the DevTools protocol (Node 22 has
a global `WebSocket`): set a 390 × 844 viewport, `Page.navigate`, scroll, then
`Page.captureScreenshot` per screen. The template accepts `?opened=1` to start
the invitation open, so every section can be captured without a tap.

Then compare against the reference **and fix from data, not taste**:
positions in `layout_schema`, colours in `theme`, type sizes in `ref.css`.

Definition of done:

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] `/templates/<code>/preview` 200 in the deploy smoke
- [ ] every section screenshotted at 390 × 844 and compared
- [ ] `docs/REA_<CODE>.md` records deviations
- [ ] registered in staging **and** production, migration recorded in both

---

## 6. Failure catalogue — every one of these happened

1. **Empty dashboard picker.** `eventFamily("kids")` returned `"wedding"` because
   the helper only understood rites. Templates store the family. Fixed in
   `eventType.ts`; the picker also falls back to the full catalogue if a family
   filter matches nothing.
2. **Payload whitelists.** `/api/dashboard/[id]/web-invitation`,
   `/api/ops/queue` and `/api/ops/queue/[id]` each build their response object
   field by field. A new column (`event_type`) is dropped until it is added to
   all three. Symptom: the UI silently behaved like a wedding.
3. **A shared list changed for one product.** Removing `{Nama Pasangan}` from
   `MSG_VARS` also removed it from weddings. Filter at render time, not by editing
   the shared constant.
4. **The same rule in three places.** Editor form, ops form, dashboard chrome.
   Fix in one, it stays broken in the others. That is why `profileView()` exists.
5. **Stale initial state.** The guest hub started at `msgCategory = "nasional"`;
   when `message_category` was empty the wedding copy stayed. Resolve from the
   loaded profile, not from a default + effect.
6. **Completeness blocked publishing.** The editor's completeness input lacked
   `event_type`, so it demanded a second full name that can never exist.
7. **`min-height: 100dvh` in a tall screenshot.** A 390 × 6400 window makes `dvh`
   6400 — the "full page" capture came back blank. Use a real 390 × 844 viewport
   and scroll.
8. **Divider invented from taste.** I shipped triangle motifs twice before reading
   `ref.css` and finding the real `cs-tepi` mask. **Read the CSS before drawing an
   ornament.**
9. **Copying fonts.** The reference's display faces are retail licences
   (Canela/Aviano Didone/Symphony Pro). Use our vendored library: Alex Brush,
   Bodoni Moda, Cinzel, Cormorant Garamond, Marcellus, Parisienne, Mr Dafoe.
10. **Crops.** A fixed `aspect-ratio` + `object-fit: cover` truncated guests'
    photos. Gallery uses natural ratios (`height: auto`).
11. **Deploy races.** Several backgrounded `npm run deploy` runs fight over
    `.deploy.lock` and replace each other's builds ("Another deploy replaced this
    build"). Run one at a time and verify `local BUILD_ID == remote BUILD_ID`
    afterwards.
12. **`tsc` before build.** Twice a patch type-checked only after the build had
    already failed (`Property 'groom_parents' does not exist`, duplicate keys).
    Run `npx tsc --noEmit` first; it is seconds.
13. **The cover is a FIXED 844 px canvas, and the body is locked.** A cover laid
    out against the design canvas (absolute CTA, 844 px poster) silently breaks
    on a real phone: the small viewport height (browser chrome visible) is
    640–740, so an absolutely positioned `Buka Undangan` renders *on top of* the
    guest name, and a fixed-height poster pushes it below the fold where it can
    never be tapped. Both styles shipped. Verify every cover at 390 × 844 **and**
    390 × 667 / 360 × 640 **with a `?to=` guest name**, and make the cover fit:
    either keep the CTA in flow (`margin-top: auto`) and shrink the photo/scale
    the poster, or scale the poster with the viewport (`--uc: min(100vw / 390,
    100svh / 844, 1.103px)`). Never leave the CTA in `position: absolute`.

---

## 7. Copy rules for this product

- Indonesian, plain, short. No em dashes, no "—", no AI-ish flourish.
- "Ananda", not "Mempelai". "Tanda Kasih", not "Wedding Gift".
- The sign-off is the parents: "Kami yang berbahagia, Bapak X & Ibu Y".
- No black buttons. Use the brand terracotta (`#8D4D39`) or the template's gold.
- Never mention "pernikahan" in a kids surface.
