# In-House Template Playbook (REA → Aksaraa)

How to port a reference invitation (REA/Momentus/Tibra-style) into an in-house
Aksaraa template, make every section dynamic from the editor **and** ops, and
ship it without repeating the mistakes in this session. Follow the phases in
order. Each phase ends with a verification gate — do not skip ahead.

---

## 0. Mental model (read first)

An in-house template is **not** a standalone website. It is a component that is
driven by data assembled in `src/app/w/[slug]/page.tsx` and edited by two
consoles:

| Surface | File | Responsibility |
|---|---|---|
| Template component | `src/components/templates/<code>/` | Render only; no DB access |
| Registry / content spec | `src/components/templates/index.ts` | `TEMPLATE_MAP`, `TEMPLATE_CONFIGS`, `getTemplateContentSpec` |
| Public renderer | `src/app/w/[slug]/page.tsx` | Loads profile + gates, passes props |
| Editor | `src/app/dashboard/[id]/web-invitation/editor/page.tsx` | Couple-facing fields/toggles |
| Editor API | `src/app/api/dashboard/[id]/web-invitation/route.ts` | GET select + PUT allowlist |
| Ops console | `src/components/ops/AntrianDetail.tsx` | Staff-facing parity with editor |
| Completeness / publish | `src/lib/invitationCompleteness.ts`, `src/lib/publishBlockers.ts` | Publish gating |
| Template quirks | `src/lib/templateSections.ts` | Per-template capabilities (`hidesOpeningSection`, etc.) |
| Demo props | `src/components/templates/demoProps.ts` | `/templates/<code>/preview` |

**Rule:** every user-visible section must be controllable from BOTH the editor
and ops, and the public template must honor BOTH:

- package gate: `profile.feature_gates.<key>` (server-computed), and
- editor toggle: `profile.<section>_visible` (user choice).

A section renders only when both allow it (plus non-empty data).

---

## 0.5 The minimum-section contract (read before porting)

A reference is a *design*, not a feature list. Some references ship fewer
sections than a paying couple expects (a Netflix-style poster with no dress
code), some ship more (a "Where to Stay" block we have no data for). Both are
resolved here, and the resolution is **not** left to taste.

### The 16 sections every in-house template ships

In this order. "Gate" means the section also requires the package gate **and**
the editor toggle (playbook §0) — a section renders only when gate, toggle and
data all allow it.

| # | Section | Content source | Gate / condition |
|---|---|---|---|
| 1 | **Cover** | couple names, date, `guest_name`, open button | always |
| 2 | **Opening video** (only when the couple has one) | `video_url` — direct upload → `<video autoPlay muted loop playsInline>`, YouTube → iframe | `feature_gates.video` **and** `video_section_visible` |
| 3 | **Welcome** | greeting card that opens the invitation (names, date, "the wedding of") | always; hide when it would be empty |
| 4 | **Kalimat pembuka** | `opening_title` + `opening_description` | `!hidesOpeningSection(code)` |
| 5 | **Mempelai** | `groom_full_name` / `bride_full_name`, photos, parents, Instagram | `person_photos !== false` for the portraits |
| 6 | **Love story** | `stories[]` (title, description, image_url) | `feature_gates.story` **and** `story_visible !== false`; photos per `story_photo` |
| 7 | **Event** | `sessions[]` (name, date, time, venue, address, maps_url) | always — completeness blocks publish without it |
| 8 | **Countdown** | `estimated_wedding_date` | always when a date exists |
| 9 | **Turut mengundang** | `inviting_families[]` | `feature_gates.inviting_families` **and** `inviting_families_visible !== false` |
| 10 | **Rundown** | `rundown[]` (`{time, description}`) | `rundown_visible !== false` |
| 11 | **Gallery** | `gallery_photos[]` | `no_photo` template ⇒ skipped; otherwise needs data |
| 12 | **Video** | `video_url` | `feature_gates.video` **and** `video_section_visible` |
| 13 | **Wedding gift** | `gift_accounts[]` + `gift_address_name` + `gift_address` | `gift_section_visible !== false`; the address additionally needs `feature_gates.gift_address` |
| 14 | **Dress code** | `dresscode` `{title, description, colors[]}` | `dresscode_visible !== false` |
| 15 | **Wishes** | name field + message field + approved feed (`/api/wishes`) | always |
| 16 | **Closing** | `template_content.closing_message` + couple names | always |

Sections 3 and 4 may share one surface when the design only has room for one
block (Lace does exactly this: the welcome band carries `opening_title` as its
heading and `opening_description` as its body). They may never be *dropped* —
a template with no surface for the couple's own words is not shippable.

### The five rules

1. **A missing minimum section is ADDED, never skipped.** Rebuild it in the
   reference's own visual language — same palette, same type scale, same
   ornament vocabulary, same section rhythm. Never bolt a generic section onto
   a designed one: a plain white dress-code card inside a black poster template
   is a bug, not a port. Ask "how would this designer have drawn this?" and
   answer it with the reference's own primitives (its rules, its label style,
   its button shape, its photo treatment).
2. **A reference section OUTSIDE the list needs approval before it ships.**
   Report it to the owner with three things: what it is, which `wedding_profiles`
   column would feed it (or that none exists), and what the invitation loses if
   it is dropped. Then wait. Do not ship it silently, and do not quietly drop it
   either — `docs/REA_*.md` is where that report lives.
3. **Mempelai carries no "The Groom" / "The Bride" copy** unless the brief
   explicitly asks for it. Two portraits side by side with their own names,
   parents and Instagram is the default. Do not duplicate the whole block per
   person, and do not add gendered labels as filler.
4. **RSVP is not a section.** It is the shared floating dock — see §6.
5. **"Package-gated" is not "optional".** Love story, the cinematic video and
   Turut Mengundang are gated per package, but the template must still
   *implement* them — the gate decides whether a given couple sees the section,
   never whether the design supports it. Opting a section out in the content
   spec is a **deviation** that has to be justified in the template's
   `docs/REA_*.md`, not a design preference. `story: false` in a new template is
   almost always wrong: love story ships in every registered in-house template
   and `feature_gates.story` is included in every package. Lace used to be the
   one documented exception; its love story shipped in the "With Honor → gallery"
   slot (see `docs/REA_LACE.md`), so there are no exceptions left. Also make the
   component itself test `gates.story` **and** `story_visible` — an ungated
   `stories` array renders for couples whose package or toggle says no.

### Section order

Ship the order above. When the reference's order differs (most do), keep the
reference's *pairing* of adjacent blocks and move only what the contract
requires. Record the final order in the template's `docs/REA_*.md`; the next
agent diffing the reference needs to know the reorder was deliberate.

---

## 0.6 The per-section contract table (fill before the first review)

Looking like the reference is the easy half. The expensive bugs on
`boarding-pass` were not visual — 5 of 7 feedback rounds were a section
ignoring its gate, a container sized for the demo's data, or copy the editor
could not reach. Fill this table in `docs/REA_<CODE>.md` **before** asking for
a review. One row per rendered section, plus one row per repeating block
(events, portraits, stories, gallery, accounts).

```md
| # | Section | Renders from | Gate + toggle | Count / variant branch | Copy source | Motion |
|---|---|---|---|---|---|---|
| 6 | Mempelai | `groom_name`, `bride_name`, portraits | `person_photos !== false` | 2 portraits; 1 photo ⇒ shared fallback | names: profile; heading: `template_content.mempelai_title` | `fadeInUp` on 2 cards, 0.08s step |
```

Rules for filling it:

1. **Copy source is a field, never a vibe.** It must name a profile column or a
   `template_content.<key>` registered in `src/lib/templateExtras.ts`. A
   literal is only allowed for a structural label, and that label must be in
   the `allow` block of `scripts/template-copy-allowlist.json` with the reason
   it must stay fixed (brand badge, WCAG name, countdown unit).
2. **Count / variant branch names the edge, not the demo.** Write what happens
   at 0, 1 and many. If a card is tuned for two events, two portraits or three
   stories, the one-item branch is a bug until it is written down and tested.
3. **Gate + toggle is both.** `feature_gates.<key>` **and**
   `<section>_visible !== false`. "Omit" means "always". Never test one.
4. **Motion names the mechanism**: keyframe, trigger, delay range — not
   "elegant fade".
5. **The section is not done until the row is true in code**, not just in the
   doc.

### The copy audit (run before every review)

```bash
npm run audit:copy -- <code>     # one template
npm run audit:copy               # every template
```

`scripts/template-copy-audit.mjs` parses the component TSX and fails on any
user-visible literal that is neither data-driven nor in the ledger:

- JSX text nodes (`<h2>Kedua Mempelai</h2>`),
- visible attributes (`alt`, `title`, `placeholder`, `aria-label`, …),
- literal JSX children (`{"Kirim"}`), ternary copy (`{sending ? … : …}`),
- copy-named object properties (`{ label: "Days" }`).

The ledger (`scripts/template-copy-allowlist.json`) has two halves:

- `legacy` — frozen literals from templates built before the audit. **Debt,
  not precedent.** Do not add to it.
- `allow` — named structural exceptions with a reason.

A new template starts with **neither** entry. If the audit fails, the fix is
to wire the string to a field, not to add a `legacy` row.

### The state matrix (test the branch that broke)

Render the template in all of these before review — the demo default is one
row, never the whole table:

| State | Expected |
|---|---|
| Every gate `false` | only ungated sections render; no empty shells |
| Every gate `true`, every toggle on | full 16-section order |
| `sessions.length === 1` | one event, no stretched/blank second card |
| `stories = []` / `story_visible = false` | no story block, no heading left behind |
| `gallery_photos.length === 1` | no marquee gap, no `NaN` transform |
| gift: accounts only / address only / none | tabs hide when they cannot switch; section hides when empty |
| video hidden but `video_url` set | no `<video>` autoplay, closing falls back to a photo |
| `prefers-reduced-motion: reduce` | all copy visible, no transforms |
| JS disabled (`scripting: none`) | reveal targets stay visible |
| 390×844 and 1440×900 | `scrollWidth === innerWidth`; no crushed percentage children |

---

## 0.7 Motion is code, not a screenshot

Copy the reference's **mechanism** before copying its look. If the reference
uses animate.css + WOW.js (boarding-pass did: 159 targets, `fadeIn` /
`fadeInUp` / `zoomIn`, 0.06–0.52 s delays), port exactly that: the same
keyframe names, the same per-element delay, one `IntersectionObserver` that
adds a class once.

Hard rules:

- **Never keyframe `transform` on an element that carries its own tilt.** The
  animate.css `transform` keyframes overwrite `rotate()`/`translate()` set for
  the design. Drive the individual properties instead:
  ```css
  @keyframes tpl-fade-up { from { translate: 0 24px; scale: .98 } to { translate: 0 0; scale: 1 } }
  ```
- **Reveal states degrade safely.** `prefers-reduced-motion: reduce` and
  `@media (scripting: none)` must leave every reveal target at `opacity: 1;
  translate: none; scale: 1` — never `opacity: 0` waiting for JS.
- **One observer, one class.** Don't build per-section scroll listeners.
- Verify by sampling `getComputedStyle` over time (opacity/translate/scale at
  open, at 150 ms, and after a full scroll), not by eyeballing a screenshot.

### Variable-size containers

- A child must not size itself as a percentage of a container whose height is
  derived from its children. Percentage heights resolve against the parent's
  *computed* height, so a two-item grid and a one-item grid crush differently.
- Use container units (`cqw`) for width-relative geometry and `aspect-ratio`
  when a block must stay proportional. **`min-height` in `cqw` resolves against
  the viewport, not the container** — it is not a substitute for
  `aspect-ratio`.
- Declare the container (`container-type: inline-size`) on the block that owns
  the geometry, then express inner sizes as `cqw`. Test the one-item branch.

---

## 1. Phase 1 — Port the component

1. Create `src/components/templates/<code>/`:
   - `index.tsx` (`"use client"`, default export, `TemplateProps`)
   - `<code>.css` scoped under `.<code>` (no global selectors)
   - optional `Wishes.tsx`, `sections/…`
2. Reuse `../shared/lib` helpers (`coverPhoto`, `photoList`, `timeAgo`,
   `resolveCoupleName`) instead of re-implementing.
3. Register in `src/components/templates/index.ts`:
   - import component
   - add to `TEMPLATE_MAP`
   - add `TEMPLATE_CONFIGS` entry with `content.sections` and `cover_slots`
   - `getTemplateComponent` + `getTemplateContentSpec` must resolve it
4. Add template-scoped extra copy fields in `src/lib/templateExtras.ts`
   (`cover_apology`, `gallery_intro`, `gallery_quote`, `gift_intro_title`,
   `gift_intro_description`, `wishes_intro`, `closing_message`, …). Each entry
   needs `templates: [..., "<code>"]` **and** a `placeholders["<code>"]` value;
   the component must actually read `profile.template_content?.<key>`. Fields
   that exist in the editor but are never read are dead controls.
   **Keep `placeholders["<code>"]` in the same language and copy as the
   component defaults and `demoProps`.** When you switch a template's sample
   content (e.g. to Sandhya English), update the extras placeholders too — else
   the editor hints stay in the old language (e.g. Indonesian) and contradict
   the English invitation.
5. Allow mock IDs in the preview route (`src/app/templates/[code]/preview/page.tsx`):
   `keepDemoIds = code === "<code>" || …` so server-backed sections (wishes,
   guest dock) get `wedding_profile_id` / `guest_id` in preview.
6. Declare the **content spec** deliberately:
   ```ts
   content: {
     sections: { opening_description: true, dresscode: true, livestream: true },
     cover_slots: 5,
     // labels for cover slots if the template names them differently
   }
   ```
   Anything `false` here must be hidden in editor **and** ops, and must be
   justified against the minimum-section contract (§0.5). "The reference does
   not have it" is **not** a justification — it is work to do.
   Per-section photo capability: set `story_photo: false` when the love-story
   layout is text-only (piano-garden). Editor and ops then hide the milestone
   photo field and exclude it from completeness, while stored `image_url` data
   is kept (hide ≠ delete).
7. Add demo props for `<code>` in `demoProps.ts` (photos, names, dates,
   `wedding_profile_id: "demo-wedding-profile-id"`,
   `guest_id: "demo-guest-id"` so server-backed sections have sample data).
8. If the template has a non-standard opening ("Kalimat Pembuka"), register it
   in `src/lib/templateSections.ts`:
   ```ts
   TEMPLATES_WITHOUT_OPENING = new Set(["<code>"])
   ```
   and set `opening_description: false` in its content spec. Editor, ops,
   completeness and publish blockers all consume this helper — never duplicate
   the template list.

**Gate:** `npx tsc --noEmit` + staging build + `/templates/<code>/preview` 200.

### Do / Don't

- **Do** keep all CSS scoped under the template root class.
- **Do** drive visibility from props; never hardcode a section on.
- **Don't** import server modules in a client component
  (`@/lib/supabase`, `@/lib/guest-link`, `@/lib/qr`, …). Use client-safe
  helpers (`@/lib/guest-slug`, `@/components/templates/shared/lib`).
- **Don't** copy WordPress/Elementor assumptions into an in-house template.

### Reference teardown (do this before porting)

1. `curl -L https://momentus.id/preview/<code>` — the preview is a shell; read
   its `<iframe src>` and fetch that invitation URL with a mobile UA.
2. Extract the rendered structure, not just the screenshot:
   - every `<section class="…">` and its `<h2>` (the section order),
   - `<audio>`/`<video>` tags **including `preload`**, and `<source>` URLs,
   - every `/templates/<code>/…` asset and its `content-length` (`curl -I`),
   - the palette (`--sage`, `--sage-deep`, `--cream`, `--dark`) and font vars,
   - the root class (`.<code>-root`) and the inner classes each section uses.
3. Diff against the closest in-house template (usually `sandhya`); list only the
   new/different sections, assets, palette, and fonts. Most Momentus themes are
   the same component re-skinned — do not re-port what already exists.
4. For every new section, write down its data shape and check whether
   `wedding_profiles` has it. If not, decide explicitly: **omit** it, or add a
   schema field + editor/ops + feature gate. Never ship reference data.
5. Classify reference chrome (theme switcher, vinyl/tonearm internals, platform
   footer/logo, demo social links) and leave it out.
6. Copy the compiled CSS only for the classes the JSX renders, and only the
   fonts actually used. Reference pages routinely load 40+ stylesheets and ~20
   woff2 files; porting the whole graph is a performance regression.

#### REA: `adat-melayu` (2026-10)

- **Structure:** same component family as `sandhya` (`cover`, `cover-gate`,
  `video-intro`, `verse-section`, `groom-bride-section`, `events-section`,
  `live-streams-section`, `dress-code-section`, `our-gallery-section`,
  `love-story-section`, `gift-section`, `rsvp-wishes-section`,
  `thank-you-section`) plus two sections we do not have:
  - `tpl-rundown` — "Rundown Acara": `time` + `description` items.
  - `tpl-contact` — "Hubungi Kami": `name` + `description` (family side) +
    WhatsApp link per person.
  Neither has a `wedding_profiles` field. Omit or add a JSON field; never
  hardcode the reference's contacts.
- **Palette:** `--sage #B1270D` (red), `--sage-deep #7A6332` (gold/brown),
  `--cream`/`--paper #FBF5E8`, `--dark`/`--ink #2E2818`, `--warm-fg #fff`.
  The theme only overrides CSS variables; the layout is shared.
- **Media:** music `saloma-p-ramlee-selamat-pengantin-baru.mp3` = **2.05 MB**
  with `<audio preload="auto">`; opening `opening-garden.mp4` = **10.1 MB**
  with `<video preload="metadata">`. Both are `cf-cache-status: HIT`. The video
  filename is reused across themes — measure the actual bytes, don't infer.
- **Open behavior:** tapping Open starts the track immediately (same
  `openInvitation` → `audio.play()` pattern as `altar-garden`/`piano-garden`);
  there is no separate "tap the music button" step to port.
- **Assets:** 16 gallery `webp` (~38 KB each), `cover-garden.webp` 45 KB,
  `fallback.webp` 433 KB, bride/groom/couple/bouquet/parallax/thumbnail.
- **Do not vendor:** theme switcher, vinyl/tonearm chrome, momentus footer/
  logo/socials, Instagram live-stream demo link, reference couple data.

### Reference assets and CSS (hard lessons)

- Audit every reference asset first (URL, size, format). Vendor only assets the
  template actually uses into `public/templates/<code>/`; keep large video as a
  normal static file, and always ship a poster/fallback image.
- **Never vendor licensed media** (third-party music, stock art) or third-party
  branding (platform logo, theme switcher, fullscreen chrome). Music comes from
  `profile.track_url`; demo falls back to `ASSETS.defaultMusic`.
- Bank logos are not part of `TemplateProps.gift_accounts`
  (`provider_name`, `account_number`, `account_name`, `type` only). Render the
  provider name instead of borrowing reference bank PNGs.
- **Demo data/text/photos must come from Aksaraa's own sample content (e.g. the
  `sandhya` demo entry / `DE` photos), never from the reference couple.** Do not
  ship the reference's names, dates, quotes, stories, gallery photos, or copy in
  `demoProps.ts` or in component fallback constants. Structural design labels
  that belong to the layout (e.g. "The Beginning") are fine, but every
  data-driven string and photo should mirror an existing Aksaraa template
  (`sandhya` is the default source for English content).
- Capture the rendered DOM **and** the full compiled CSS before touching code.
  Then extract whole rule blocks with brace matching, preserving `@media` /
  `@supports` / `@keyframes` wrappers. **Do not** pull lines that merely contain
  the root class — that silently drops media headers and the mobile layout
  breaks (desktop grid stays applied at 390px).
- Prefix all global reference blocks (`.tpl-rsvp`, `.tpl-gift`, `.tpl-footer`,
  `.tpl-music-btn`, vinyl/tonearm) under the template root class
  when copying. Unscoped utility/base rules leak into every other template.
- **Port the CSS for every class the component renders — not just the section
  wrapper.** The reference often defines inner classes (`.dress-code-card`,
  `.dress-code-intro`, `.dress-code-swatches`, `.dress-code-swatch`,
  `.dress-code-swatch-dot`, …) in a different part of the stylesheet than the
  `.<section>-section` rule. If any are missed the section renders as raw text
  (e.g. "Dress CodeElegant Attire in …" with no card/swatches). Diff the class
  list in the JSX against the CSS and assert every one has a rule.
- **Every in-house footer must carry the Aksaraa brand badge** — a link with a
  round white badge containing `ASSETS.galeriEnvelope.aksaraaLogo` plus the
  "Wedding by Aksaraa" CTA, exactly like Sandhya (`.tpl-footer__link` /
  `.tpl-footer__badge` / `.tpl-footer__cta`). Do not ship a bare logo or drop
  the logo. Copy the Sandhya footer CSS and keep the socials.
- Reference sites often rely on libraries the repo does not have (AOS, GSAP).
  Re-implement the minimal behavior with `IntersectionObserver` and the
  template's own classes (`data-aos` → `is-aos-visible`), not a new dependency.
- Decide explicitly whether to keep reference-only chrome (lightbox, fullscreen,
  rundown). If the reference has no lightbox but users will expect zoom, add one
  scoped to the template; if a section has no schema fields, omit it and say so.
- Body scroll lock must work without relying on an effect alone (route-change
  effects can reset `body.style.overflow`). Add a CSS fallback scoped by state:
  ```css
  html:has(.piano-garden-root.is-locked),
  body:has(.piano-garden-root.is-locked) { overflow: hidden; }
  ```
- Gate/splash layering: if the reference leaves the gate in flow after opening,
  hide it (`.root.is-open .cover-gate { display: none }`) and scroll to top;
  otherwise users see an empty 100svh section first.

---

## 2. Phase 2 — Database

Additive migrations only. One responsibility per file.

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_<feature>.sql
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS dresscode_visible boolean DEFAULT true;

INSERT INTO web_templates (code, name, …)
VALUES ('<code>', …)
ON CONFLICT (code) DO UPDATE SET …;
```

For an in-house template the row must include:

| Column | Value |
|---|---|
| `source_type` | `'inhouse'` (leaves `wp_master_slug` / `wp_manifest` null) |
| `preview_image_url` | `/templates/<code>/thumbnail.webp` |
| `demo_url` | `/templates/<code>/preview` |
| `tier` | match the sibling reference (e.g. `'Baru'`) |
| `sort_order` | next free slot; keep it stable after release |
| `package_eligibility` | copy the sibling template array, don't invent packages |
| `category` | string used by the public filter (`Floral`, `Modern Minimalis`, …) |
| `is_active` | `true` |

Use `ON CONFLICT (code) DO UPDATE` (not `DO NOTHING`) so re-running the file
also refreshes copy, thumbnail, tier and eligibility for an existing row.

Order of environments:

1. Local: apply with `npx supabase db reset` (or SQL in Studio) — must be
   replayable from scratch.
2. Staging: `npx supabase link --project-ref <staging>` → `npx supabase db push`.
3. Production: only after staging smoke passes.
4. Commit the migration file.

### Migration divergence (hard lesson)

`supabase db push` refuses to run when the remote history has versions that are
missing locally. This repo has had that happen (features applied from another
checkout). Recovery, verified:

1. Get the pooler connection string (direct `db.<ref>.supabase.co` is IPv6-only
   and often unreachable). It is cached in `supabase/.temp/pooler-url` /
   `supabase/.temp/*`; the shape is
   `postgresql://postgres.<ref>@aws-0-<region>.pooler.supabase.com:5432/postgres`.
2. URL-encode `SUPABASE_DB_PASSWORD` from `.env.local.prod` and connect with the
   `pg` package (already in `node_modules`; `psql` is not installed).
3. Read `supabase_migrations.schema_migrations` (`version`, `name`,
   `statements`) for the remote-only versions.
4. Reconstruct the missing files from `statements.join(";\n")`, then verify:
   - execute both files inside `BEGIN … ROLLBACK` against local Postgres, and
   - `npx supabase migration list --db-url "$DBURL"` → zero mismatches, and
   - `npx supabase db push --dry-run --db-url "$DBURL"` → `upToDate: true`.

**Do:** backfill missing files from the recorded statements.
**Don't:** run `migration repair --status reverted` (it hides applied schema
changes), and don't run ad-hoc SQL on prod without recording it in
`schema_migrations`.

---

## 3. Phase 3 — Editor + API

For every new field:

1. **GET select** in `src/app/api/dashboard/[id]/web-invitation/route.ts` must
   include the column (otherwise the editor silently sees `undefined`).
2. **PUT allowlist** must include it (otherwise saves silently no-op).
3. Editor UI:
   - toggle: `renderSection(...)` gated by the template content spec;
   - text/url/number inputs wired to profile state;
   - for JSONB (dresscode, livestream) edit the object, keep defaults stable.
4. Completeness (`invitationCompleteness.ts`): add the section only if it is
   required for this template. Never require an unsupported section.
5. Publish blockers (`publishBlockers.ts`): select the columns you need
   (`no_photo`, `code`, new flags) and pass the derived booleans
   (`no_opening_section`, …).

### Do / Don't

- **Do** gate editor sections with `getTemplateContentSpec(template.code)`.
- **Do** keep "no photo" templates consistent: hide photo/profile/gallery/video
  sections and pass `no_photo` into completeness.
- **Don't** add a section unconditionally; a `dark-split-rail` couple must not
  see Nihara's dress code.
- **Don't** forget the `no_opening_section` branch — publish would block on a
  section the couple cannot see.

---

## 4. Phase 4 — Ops parity (`AntrianDetail.tsx`)

Ops mirrors the editor. Missing ops wiring is the most common regression.

Checklist for each new section:

1. Accordion rendered and **gated by the same template content spec**
   (`{invContentSpec?.sections?.dresscode && (…)}`).
2. `invAccProps` completeness/locked state (package gates are `investment`
   style; still pass the flag).
3. `invSectionState` case returns `empty`/`ok` correctly, including
   `noPhoto` short-circuits (`video` → `ok` when no photo).
4. `fetchInvCardSummary` defs exclude unsupported sections
   (`pembuka`, `dresscode`, `livestream`) and skip template-specific gaps.
5. Read-only branch reads `invitationData.profile.<field>` — **not** `data`,
   which does not exist in that scope.
6. Toggles/inputs bind to `invForm.*` in edit mode.
7. Cover slots use `invContentSpec.cover_slots` and the spec's slot labels;
   don't hardcode 5 or "Slideshow".

### Do / Don't

- **Do** reuse extracted handlers (`handleToggleVisibility`,
  `handleDresscodeColorAdd`, …). Long inline arrow handlers break `tsc`.
- **Don't** pass `disabled` to `InvSectionToggle` — its props are only
  `{ label, checked, onChange }`.
- **Don't** write `aria-label="x" + y` in JSX; use template literals.
- **Don't** leave a section's summary unconditional when the section is
  template-gated.

---

## 5. Phase 5 — Dynamic rendering rules

Apply these in the template itself:

```ts
const gates = profile.feature_gates || {}
const stories = gates.story !== false && profile.story_visible !== false ? … : []
const accounts = profile.gift_section_visible !== false ? … : []
const giftAddress = gates.gift_address !== false ? profile.gift_address || "" : ""
const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false ? … : []
const hasVideo = !!videoId && gates.video !== false && profile.video_section_visible !== false
```

- `hasVideo` must gate **every** video surface (background iframe, gallery
  frame, modal).
- Empty arrays/strings hide their section even when the toggle is on.
- Scene decks: build `scenes` from available data (dresscode only when
  `hasDresscode`, etc.) and keep `stepsOf` in sync.
- "Open Invitation" must enter the **first content scene**, not stay on the
  cover waiting for a swipe:
  ```ts
  const openInvitation = () => {
    setOpened(true)
    setStep(0)
    go(scenes[1] || "verse", true) // cover still plays its leave transition
  }
  ```
  Keep the hint visible after the transition (~2s), not before.

### Opening video — preload the **music**, stream the video

Do **not** try to preload the opening video by force-playing it muted behind the
cover. That approach fights the browser's media preload throttling and, more
importantly, it is not the real bottleneck. The stall comes from **bandwidth
contention at the moment of open**: the background music and the video both
start downloading at the same time, and the (larger) music track starves the
video, which fires `waiting` and shows the corner spinner. Momentus's proven
pattern (`piano-garden` / `altar-garden`) is to sequence the downloads instead:

- **Preload the music while the cover is up**: `<audio loop preload="auto">`
  (skip on `saveData`/2g–3g). By the time the guest taps Open the MP3 is already
  in cache, so it no longer competes with the video. Preload whenever a track
  exists — do **not** gate it on `auto_play`; these templates start the music on
  Open, so the guest never has to tap the music button.
- **Stream the video on open**: `<video muted playsInline preload="metadata">`.
  Do not force `preload="auto"`/`play()` while locked and do not gate the Open
  button. The video section stays mounted and out of flow behind the cover
  (`.video-intro.is-preloading { position:fixed; inset:0; opacity:0;
  pointer-events:none; z-index:0 }`) purely for layout — not for preloading.
- Keep the "Open Invitation" button enabled at all times (no `Preparing…`
  state). On tap, play the video **and** start the pre-cached music
  (`audio.play()` inside the click handler — that user gesture is what allows
  autoplay). The guest must never need a second tap on the music button.
- Show a small **corner** spinner only for a sustained stall (`waiting` lasting
  >1500ms). Never a centered overlay, and never before the first `playing` event
  — a transient `waiting` at the start of playback is normal and must not flash
  a loader.
- Keep the clip small (re-encode long/portrait files; ~4MB/20s at 608×1080
  CRF~24–28 is fine) and let `/templates/:path*` be cached
  (`max-age=604800`) so repeat opens are instant.
- Evidence from `adat-melayu` (2026-10): the reference streams a **10.1 MB**
  opening video smoothly because the **2.05 MB music is preloaded** on the cover
  and all media is Cloudflare-cached (`cf-cache-status: HIT`, `max-age=14400`).
  Our delivery is VPS-first (no CDN), so keep our clip small (≤ ~4–6 MB) and
  keep the music-first sequencing; a large clip only becomes safe behind a CDN.
- Supabase-hosted media currently returns `cache-control: private, no-cache`
  (`cf-cache-status: DYNAMIC`), so music/images are re-fetched from the origin
  on every visit. If first-visit cost matters, set a long `cacheControl` on the
  storage objects (or serve them from a CDN); see the failure catalogue.

---

## 6. Phase 6 — Wishes + floating RSVP/QR dock

### Wishes

In-house templates do **not** get wishes for free. `InvitationOverlay` only
posts the RSVP comment to the wish wall; it does not render a feed.

Embed a section (pattern: `dark-split-rail/sections/Wishes.tsx`,
`nihara-mist/Wishes.tsx`):

- `GET /api/wishes?wedding_profile_id=<id>&status=approved`
- `POST /api/wishes` with `{ wedding_profile_id, guest_id, name, message,
  source: "invitation" }`
- handle `409` as "already sent" (not an error), show moderation feedback
- counter max 500, disable submit while empty/sending
- feed: alternating alignment, `timeAgo`, client-side pagination (10/page)
- demo mode: if `wedding_profile_id === "demo-wedding-profile-id"`, render
  sample wishes and never POST
- **name field**: always render it (never `{!guestName && …}` — the page always
  passes a guest name, so that guard hides the field for everyone). Use
  `wishNameState(guestName, guestId, guestLinkStrict)` from
  `shared/wishName.ts`: terbatas links prefill the guest's name and lock it
  (`readOnly`), fleksibel links prefill from `?to=` but stay editable, and
  placeholder names ("Tamu Undangan", FALLBACK_GUEST_NAME, …) prefill empty.
  Keep the template's own field markup/classes for the input.

Place it where the reference does it (usually before the closing section).

### Floating RSVP / QR check-in — the only RSVP UI

**There is no RSVP section.** A template never builds its own RSVP form. RSVP
(attendance, pax, the guest's QR) belongs to the shared `InvitationOverlay`
dock, because that is the surface the check-in scanner, the wishes API and the
guest-link rules are all written against. A bespoke form inside a template
creates a second source of truth for attendance and silently breaks QR
check-in. If a reference shows an RSVP block, port the *wishes* half as a
section (§6 above) and drop the RSVP half.

`InvitationOverlay` is the dock (RSVP modal + guest QR). It must be rendered
**inside the template**; the in-house branch of `src/app/w/[slug]/page.tsx`
does not render it.

It renders **only on a real invitation link**. `preview_mode` (editor preview)
and `template_demo` (public `/templates/<code>/preview`) must both suppress it:
the dock has no guest to check in, and its RSVP call would post to the demo
profile. Missing these two guards is the single most common dock regression —
older templates still have it.

```ts
const showGuestDock =
  !profile.preview_mode &&
  !profile.template_demo &&
  opened &&
  lightbox === null &&
  !videoModal &&
  (!!profile.guest_id ||
    (profile.guest_link_strict === false && !!profile.guest_slug)) &&
  !!profile.wedding_profile_id
```

```tsx
{showGuestDock && (
  <InvitationOverlay
    guestId={profile.guest_id}
    guestSlug={profile.guest_slug}
    allowFlexibleRsvp={profile.guest_link_strict === false}
    guestName={profile.guest_name || "Tamu Undangan"}
    coupleName={coupleLabel}
    weddingProfileId={profile.wedding_profile_id!}
    guestQrUrl={profile.guest_qr_url}
    guestTableNumber={profile.guest_table_number}
    guestRsvpStatus={profile.guest_rsvp_status}
    guestRsvpMessage={profile.guest_rsvp_message || undefined}
    rsvpMaxPax={profile.rsvp_max_pax ?? 2}
    qrEnabled={profile.feature_gates?.qr_code_book === true}
    anchor="center"
  />
)}
```

- **Known deviations — do not copy these as a pattern.** Ten older templates still
omit the two guards: `sandhya`, `manjari`, `dark-split-rail`, `nihara-mist`,
`impasto-mosque`, `skyline-penthouse`, `pixel-paradise`, `pixel-quest`,
`pastel-dream-cathedral`, `pastel-coastal-cut`. Most are masked because they are
absent from `keepDemoIds` (so `wedding_profile_id` is undefined in preview);
`manjari` is in `keepDemoIds` and therefore does render the dock on
`/templates/manjari/preview`. New templates must carry the guards even when the
masking hides the bug.

Only after `opened` (cover/splash stays clean).- Only for identified guests, or flexible links with a slug.
- Hide while the template's own modals are open.
- `qrEnabled` comes from the package gate `qr_code_book`; the URL from
  `guest_qr_url`.
- Keep the music button clear of the dock (`anchor="center"` for
  bottom-right music controls; `anchor="bottom"` otherwise).

**Don't** add a second wishes UI/dock in the page shell, and don't duplicate
`InvitationOverlay` at both page and template level.

---

## 7. Phase 7 — Verification (mandatory)

1. `npx tsc --noEmit`
2. `npm run audit:copy -- <code>` (must be clean — §0.6)
3. Staging build with `.env.staging`:
   ```bash
   pkill -f "next-server"
   set -a; source .env.staging; set +a; npm run build
   cp -r .next/static .next/standalone/.next/static
   cp -r public .next/standalone/public
   PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js
   ```
3. Curl the preview and public pages; assert the new section text is present:
   ```bash
   curl -s http://127.0.0.1:3100/templates/<code>/preview | grep -o "Best Wishes\|Kirim Ucapan"
   ```
4. Hit the affected APIs (GET + mutating on staging/test data only).
5. A stale staging server serves old chunks → `ChunkLoadError`/404. Kill and
   rebuild; never debug the component first.
6. **Visual QA against the reference at both breakpoints** (CDP or manual):
   - `390×844` (true mobile via `Emulation.setDeviceMetricsOverride`, not a
     narrow desktop window) and `1440×900` (split/sticky layout).
   - Assert `document.documentElement.scrollWidth === innerWidth` (no horizontal
     overflow), the mobile media query actually applies
     (`getComputedStyle(pageShell).display === "block"`), and the gate locks body
     scroll before open and releases it after.
   - Walk every section: gate → open → video/fallback, AOS reveals, story
     timeline, gallery marquee + lightbox (Esc/←/→), gift reveal + copy toast,
     wishes form/list pagination, closing, guest dock in a real guest link.
   - Console must be free of `Runtime.exceptionThrown` and React hydration
     warnings.
7. Run the **state matrix** (§0.6) against the preview route, not only the
   demo data.
8. Production: see Deploy below. Test **only** the rafi-novi couple
   (`6a7ad151-c3b4-43e8-8429-0b58b4d0736b`, slug `rafi-novi`).

---

## 8. Phase 8 — Deploy

```bash
set -a; source .env.local.prod; set +a; npm run build
grep -o "127.0.0.1:54321\|<PROJECT_REF>.supabase.co\|supabase-demo" \
  .next/standalone/.next/server/chunks/src_lib_supabase_ts_*.js | sort | uniq -c
```

Only `<PROJECT_REF>.supabase.co` may appear.

**Deploy only the current task's changes.** If the working tree holds
unrelated edits from other sessions, do not build from it. Create a throwaway
worktree at `HEAD`, copy in only this task's files, clone `node_modules`
(`cp -cR node_modules <worktree>/node_modules` — Turbopack rejects a symlink
that points outside the project root), build there, and rsync from that
worktree. The main tree keeps the other sessions' edits untouched.

**Register the `web_templates` row BEFORE the final build.** `/templates` is
prerendered at build time (`revalidate = 3600`) and Next caches the Supabase
response in `.next/cache/fetch-cache`, so a row inserted after `next build` is
invisible on the public gallery — and a rebuild reuses the stale cached fetch
and still renders the old count. Order: migration → row → `rm -rf .next` →
build → deploy. Verify with
`grep -c 'class="template-card' .next/server/app/templates.html` (must equal the
active row count) and `grep -o '<code>' .next/server/app/templates.html`. The
throwaway worktree used for the deploy keeps its own `.next/cache`, so it needs
the `rm -rf .next` too.

Then rsync **sequentially**:

1. `.next/standalone/` → `/var/www/aksara-wedding/.next/standalone/`
2. `.next/static/` → `.next/static/`
3. `.next/static/` → `.next/standalone/.next/static/`
4. `public/` → `.next/standalone/public/` (must run last — step 1 wipes it)

Restart with the ecosystem file (never bare `pm2 restart`):

```bash
pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env
pm2 save
```

Smoke the affected endpoints directly (not just `/login`):
preview page, `/w/rafi-novi`, dashboard web-invitation API, wishes API.

### Git on this machine

`git` is blocked by an unaccepted Xcode license. Prefix every command:

```bash
DEVELOPER_DIR=/Library/Developer/CommandLineTools git status
```

Leave `tsconfig.tsbuildinfo` uncommitted.

---

## 8.5 Adat family checklist (hard lessons)

- **Cover slots are semantic.** Adat **and garden** templates expose **3** slots:
  `["Sampul", "Kutipan", "Closing"]`. The component must use
  `cover_photos[0]` for the cover, `[1]` for the verse/quote photo, and `[2]`
  for the closing photo, with gallery fallbacks when a slot is empty. Merely
  setting `cover_slots: 3` in the config without consuming slots 1/2 leaves the
  Kutipan/Closing uploads unused. Apply the same contract to piano/altar garden.
- **Every copy field needs an extras entry.** Any `template_content.<key>` read
  by the component must be added to `templateExtras.ts` for that template code,
  with a placeholder. Missing codes produce an empty “EKSTRA …” section even
  though the component renders the key.
- **Turut Mengundang ornament:** do not reuse the full `1000/652` motif band on
  a short card. Use a compact band (`height:72px`, `background-size:100% 100%`,
  `padding:92px 24px 84px`) so the title/list stay clear of the motif.
- **Desktop full-bleed:** the reference shell is capped at `1420px`. For
  Aksaraa, set `.page-shell { width:100%; max-width:none; }` and pin **both**
  `.right-column::before` and `.right-parallax-background` to `right:0`;
  otherwise the parallax image remains at the old centered offset and shows as
  a strip between the cover and the panel.
- **Demo content:** use the Sandhya demo couple/images + Adat Melayu copy. Do
  not copy the reference couple, parents, venues, stories, or gallery images.
- **Replacing an existing custom template:** the reference may use the same
  long-scroll family even when the current repo has a bespoke `layout.json`
  component. Replace the component/CSS/Wishes and config together, keep unused
  legacy assets, update the `web_templates` row + thumbnail, and re-test the
  editor/ops gates. Do not leave the old component registered.
- **Never silently rewrite saved `template_content`.** A real profile may hold
  test copy (e.g. `closing_message: "helllloooo"`). Expose the field so the user
  can change it; do not clear it without explicit approval.
- **Deploy verification is mandatory.** Compare local/remote `BUILD_ID`, grep a
  unique string from the change in the remote chunks, and verify the public
  assets return 200. Multiple agents share the same VPS; a later deploy can
  overwrite yours. Re-sync `standalone`, `.next/static` (both paths), and
  `public`, then restart PM2.

## 8.6 Envelope / dark-elegance templates (Manjari lessons)

- **Opening animations are delayed by design.** The envelope and polaroids start
  around 2.6–3.35s after `preloader-done`; screenshots taken earlier look empty.
  Wait at least 4s during QA, and ensure the root gets `preloader-done`.
- **Story carousels may be hidden by the extracted CSS.** Reference rules can
  leave `clip-path: inset(34% 24%); opacity:0` outside a media query. Add a
  mobile override (`clip-path: inset(0); opacity:1; transform:none`) and verify
  the cover-slot image is visible.
- **Gift logos must be local.** `ASSETS.galeriEnvelope.aksaraaLogo` resolves to a
  storage-relative path that 404s in local dev; download the Aksaraa logo into
  `public/templates/<code>/` and use that.
- **User video only.** Do not keep the reference parallax/local video. Render
  `profile.video_url` in the gallery video card and as the mempelai background
  **after opening**. Support both direct uploads (`mp4/webm/mov` → `<video
  autoPlay muted loop playsInline>`) and YouTube (iframe). Hide when empty.
- **Gift address must name the recipient.** Show `gift_address_name` above the
  address; an address alone is not enough.
- **Wishes submit copy:** use “Kirim Ucapan” (no RSVP wording) when the section
  is Wishes-only.
- **Mempelai copy vs section.** “Remove The Bride/The Groom” means remove those
  **labels**, not the whole mempelai section. Keep names/parents/Instagram and
  use the user’s `video_url` as the autoplay/muted/loop background (no controls,
  no caption). Only omit the section when the brief explicitly says so.
- **Desktop cover needs an explicit image.** The extracted CSS points at
  `/templates/sandhya/gallery-1.webp`, which is not shipped. Set an inline
  `backgroundImage` from `cover_photos[0]` on `.desktop-cover`.
- **Copy extras:** add every `template_content` key read by the component
  (`love_story_title`, `gallery_title`, `cover_apology`, `gallery_quote`,
  `gift_intro_title`, `gift_intro_description`, `wishes_intro`,
  `closing_message`) for the new code.

## 8.7 External (side-to-side) references

- **Asset hosts may 403 hotlinks.** Download with a browser `Referer` header
  (`-H "Referer: https://<reference-host>/<path>"`) and vendor every asset
  locally; never ship reference-host URLs or branding.
- **Scope `body.<template>` CSS.** Reference themes often key variables and
  fonts off `body.sintia`; replace it with the component root class and rewrite
  asset URLs to `/templates/<code>/`.
- **Keep the reference's section classes** (`top-cover`, `couple-wrap`,
  `save-date-wrap`, `agenda-wrap`, `rundown-container`, `photo-wrap`, …) but
  drive content from `TemplateProps`; do not copy reference couple data.

## 9. Failure catalogue (symptom → cause → fix)

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot read properties of null (reading 'dresscode')` in ops | read-only branch used `data` | use `invitationData.profile.dresscode` |
| Section shows in editor/ops for the wrong template | no content-spec gate | `getTemplateContentSpec(code)?.sections?.x` |
| Section still listed as missing in the ops summary | `fetchInvCardSummary` unfiltered | skip gated sections in `defs.filter` |
| Publish blocked on an invisible "Pembuka" | completeness unaware of template | `no_opening_section` from `hidesOpeningSection` |
| Editor sees empty fields after save | column missing from GET select | add to GET select |
| Save silently ignored | column missing from PUT allowlist | add to PUT allowlist |
| Preview wishes empty / form posts to real DB | missing demo ids | add `demo-wedding-profile-id` guard |
| No RSVP/QR button on in-house invite | `InvitationOverlay` only in WP branch | render it inside the template |
| RSVP/QR button appears on `/templates/<code>/preview` or in the editor preview | `showGuestDock` missing the `!preview_mode && !template_demo` guards | add both (§6) — the dock has no guest and would post to the demo profile |
| Two attendance sources / staff see RSVPs in two places | the template built its own RSVP form | delete it; RSVP is `InvitationOverlay` only (§0.5 rule 4) |
| Template ships without welcome / rundown / dress code / video | the reference lacked the section and was copied literally | add it in the reference's own visual language (§0.5 rule 1) |
| A stray reference block (Where to Stay, Transport, Rundown) shipped | ported without approval | report it in `docs/REA_*.md` and wait (§0.5 rule 2) |
| Mempelai block repeats per person with "The Groom"/"The Bride" | copied a reference that labels each person | two portraits + own names only (§0.5 rule 3) |
| "Open Invitation" requires a swipe | `openInvitation` stayed on cover | `go(scenes[1], true)` |
| Fonts 404 | font pipeline not run | `node scripts/fetch-fonts.js && node scripts/gen-font-css.js` |
| Local dev blocked from `127.0.0.1` | `allowedDevOrigins` | add `["127.0.0.1","localhost"]` |
| Prod `TypeError: fetch failed` after deploy | build baked local env | rebuild with `.env.local.prod`, verify grep |
| `db push` → "Remote migration versions not found" | missing local migration files | backfill from `schema_migrations`, then dry-run |
| `db push` → `ECONNREFUSED …:5432` | direct DB host is IPv6-only | use pooler host from `supabase/.temp` |
| `git` → Xcode license error | developer dir | `DEVELOPER_DIR=/Library/Developer/CommandLineTools` |
| Mobile still renders the two-column desktop grid | extracted CSS lost its `@media` wrappers | re-extract whole blocks with brace matching |
| Mobile shows a section at the wrong width / horizontal scroll | reference media header dropped or unscoped global rule | verify `max-width: 900px` rules exist; prefix all base blocks |
| Page scrolls behind the cover gate | route-change resets `body.style.overflow` | add `:has(.root.is-locked) { overflow:hidden }` fallback |
| Empty 100svh gap after "Buka Undangan" | gate left in flow but content scrolled | hide gate on `is-open` and `scrollTo(0,0)` |
| Gift cards have a blank logo slot | `gift_accounts` has no `provider_logo_url` | render `provider_name` (never borrow reference bank PNGs) |
| Template preview 500 / wishes query with undefined id | preview route did not opt into demo IDs | add code to `keepDemoIds` |
| Editor shows extra copy field that never renders | `templateExtras` entry added without component support | wire `template_content.<key>` in the component |
| Opening video stalls / loader appears mid-playback | music starts downloading at open and starves the video (music `preload="metadata"`) | preload the music on the cover (`preload="auto"`), stream the video (`preload="metadata"`), don't gate |
| Video never buffers while force-preloaded behind the cover | muted autoplay of a hidden/`opacity:0` video is paused/blocked, so only throttled `preload` runs | don't rely on hidden autoplay; preload the music and stream the video |
| Every visit re-downloads music/images | Supabase public objects return `private, no-cache` (`cf-cache-status: DYNAMIC`) | set a long `cacheControl` on the objects or serve media from a CDN |
| Reference video is unexpectedly huge | filename is reused across themes (`opening-garden.mp4`); sizes differ wildly | `curl -I`/`ffprobe` the actual file; never infer size from the name |
| New reference section has no schema (`Rundown Acara`, `Hubungi Kami`) | `wedding_profiles` has no field for it | omit it, or add a JSON field + editor/ops/gates — never hardcode reference data |
| Contact buttons open the reference's WhatsApp numbers | `tpl-contact` markup copied verbatim | require real contact data; hide the section when absent |
| Port drags in 40+ stylesheets / 20 fonts | whole asset graph copied instead of the template's rules | extract only classes the JSX renders + the fonts actually used |
| Loader flashes for a moment as the video starts | transient `waiting` at playback start | delay the corner spinner ~1500ms; only show on a sustained stall, never before the first `playing` |
| Editor cannot change a section heading ("Catatan Perjalanan", "Potret Kami") | heading is a JSX literal | move it to `template_content.<section>_title`, register the extra, read it; `npm run audit:copy -- <code>` must pass |
| One-event / one-passenger layout collapses or leaves a blank half | children sized as a % of a container whose height depends on item count | `container-type: inline-size` + `cqw`, `aspect-ratio` for proportional blocks |
| `min-height` in `cqw` looks right on the demo but wrong with one item | `cqw` resolves against the viewport, not the container | use `aspect-ratio` (or container height), not `min-height: …cqw` |
| Copy stays invisible after a reveal animation | animate.css still uses a `from { opacity: 0 }` state in the fallback path | `prefers-reduced-motion` + `@media (scripting: none)` set `opacity: 1; translate: none; scale: 1` |
| Tilted element snaps straight when it animates in | keyframes animate `transform`, overwriting the design's `rotate()` | animate individual `translate` / `scale` properties |
| Motion is "close enough" but feels wrong | ported from screenshots instead of the reference's DOM/CSS/JS | copy keyframe names, delays and the observer trigger; verify by sampling computed styles |

| Adat cover slots still show only one / Kutipan-Closing empty | config still `cover_slots:1`, or component only reads slot 0 | set 3 labels and consume `cover_photos[0/1/2]` with gallery fallbacks |
| Editor “EKSTRA ADAT …” is empty | template code missing from `templateExtras.ts` | add the code + placeholder for every `template_content` key the component reads |
| Turut Mengundang is plain / motif overwhelms the card | no ornament, or full-aspect motif reused on a short card | add 72px motif bands + 92/84px padding |
| Desktop leaves 1420px margins or a strip between columns | shell capped at 1420px, parallax still centered | `page-shell` 100%; `right-column::before` and `.right-parallax-background` `right:0` |
| Editor/ops still show old code after deploy | another build is running / stale client chunks | compare `BUILD_ID`, grep remote chunks, re-sync all three trees, restart PM2, hard refresh |
| New template missing from the live gallery after deploy | the persistent route cache (`server/route-cache/APP_PAGE/...`) served a `/templates` page rendered before the row existed — additive deploys never delete it | `npm run deploy` now drops `route-cache` before the PM2 reload; by hand, `rm -rf .next/standalone/.next/server/route-cache` then restart |
| Invitation shows test copy like “helllloooo” | saved `template_content` value | expose the extras field; do not clear user data silently |

| Envelope opening looks empty in screenshots | animations start 2.6–3.35s after `preloader-done` | wait 4s; don’t remove the animation |
| Love-story cover image invisible | extracted CSS keeps `clip-path`/`opacity:0` | add `clip-path:inset(0); opacity:1; transform:none` override |
| Gift logo broken locally | storage-relative `ASSETS…aksaraaLogo` | vendor `aksaraa-logo.jpg` locally |
| User video missing / reference video plays | local parallax video left in place | render `video_url` only; remove reference video |

---

## 10. Definition of done

- [ ] **All 16 minimum sections present** (§0.5), each rebuilt in the reference's
      own visual language, with the canonical order recorded in `docs/REA_*.md`
- [ ] **Section contract table filled** in `docs/REA_*.md` (§0.6) — every row's
      data, gate, count branch, copy source and motion verified in code
- [ ] **`npm run audit:copy -- <code>` passes with no new `legacy` entry**
- [ ] **State matrix tested** (§0.6): all gates off, all on, one event, no
      stories, one photo, gift variants, video hidden, reduced motion, no JS
- [ ] **No reference section outside the minimum shipped without approval**
- [ ] **RSVP is the `InvitationOverlay` dock only** — no bespoke RSVP form, and
      the dock is suppressed in `preview_mode` and `template_demo`
- [ ] Template registered + content spec + demo props + `templateExtras`
- [ ] Preview route `keepDemoIds` includes the code (server-backed sections)
- [ ] Reference assets audited/vendored, no licensed media or third-party logos
- [ ] Scoped CSS preserves media/supports/keyframes wrappers
- [ ] Migration(s) applied local → staging → prod, history in sync
- [ ] Editor GET/PUT + UI + completeness + publish blockers
- [ ] Ops accordion + summary + read-only branch + content-spec gates
- [ ] Public render honors `feature_gates` **and** `*_visible`
- [ ] Wishes section + floating RSVP/QR dock (if the reference has them)
- [ ] Scroll lock, gate removal, lightbox/modals verified
- [ ] **Every rendered section is actually styled** — dress code shows a card +
      swatch dots (not raw text); every JSX class has a matching CSS rule
- [ ] **Music control reveals after opening** (`.tpl-music-btn.visible` sets
      `opacity:1; pointer-events:all`) and the track plays
- [ ] **Music preloads on the cover and the video streams on open** (`preload="metadata"`,
      button always enabled; no `Preparing…` gate). No mid-playback stall; the
      corner spinner is only a sustained-stall safety net
- [ ] **Footer has the Aksaraa brand badge** (logo + "Wedding by Aksaraa") like Sandhya
- [ ] `tsc`, visual QA at 390×844 + 1440×900, staging build, preview curl,
      affected APIs, prod smoke
- [ ] Committed and pushed to `origin main`
