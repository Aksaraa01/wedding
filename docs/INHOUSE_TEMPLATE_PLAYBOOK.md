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
   Anything `false` here must be hidden in editor **and** ops.
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

Place it where the reference does it (usually before the closing section).

### Floating RSVP / QR check-in

`InvitationOverlay` is the dock (RSVP modal + guest QR). It must be rendered
**inside the template**; the in-house branch of `src/app/w/[slug]/page.tsx`
does not render it.

```ts
const showGuestDock =
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

- Only after `opened` (cover/splash stays clean).
- Only for identified guests, or flexible links with a slug.
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
2. Staging build with `.env.staging`:
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
7. Production: see Deploy below. Test **only** the rafi-novi couple
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

- **Cover slots are semantic.** Adat templates expose **3** slots:
  `["Sampul", "Kutipan", "Closing"]`. The component must use
  `cover_photos[0]` for the cover, `[1]` for the verse/quote photo, and `[2]`
  for the closing photo, with gallery fallbacks when a slot is empty. Merely
  setting `cover_slots: 3` in the config without consuming slots 1/2 leaves the
  Kutipan/Closing uploads unused.
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
- **Never silently rewrite saved `template_content`.** A real profile may hold
  test copy (e.g. `closing_message: "helllloooo"`). Expose the field so the user
  can change it; do not clear it without explicit approval.
- **Deploy verification is mandatory.** Compare local/remote `BUILD_ID`, grep a
  unique string from the change in the remote chunks, and verify the public
  assets return 200. Multiple agents share the same VPS; a later deploy can
  overwrite yours. Re-sync `standalone`, `.next/static` (both paths), and
  `public`, then restart PM2.

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

| Adat cover slots still show only one / Kutipan-Closing empty | config still `cover_slots:1`, or component only reads slot 0 | set 3 labels and consume `cover_photos[0/1/2]` with gallery fallbacks |
| Editor “EKSTRA ADAT …” is empty | template code missing from `templateExtras.ts` | add the code + placeholder for every `template_content` key the component reads |
| Turut Mengundang is plain / motif overwhelms the card | no ornament, or full-aspect motif reused on a short card | add 72px motif bands + 92/84px padding |
| Desktop leaves 1420px margins or a strip between columns | shell capped at 1420px, parallax still centered | `page-shell` 100%; `right-column::before` and `.right-parallax-background` `right:0` |
| Editor/ops still show old code after deploy | another build is running / stale client chunks | compare `BUILD_ID`, grep remote chunks, re-sync all three trees, restart PM2, hard refresh |
| Invitation shows test copy like “helllloooo” | saved `template_content` value | expose the extras field; do not clear user data silently |

---

## 10. Definition of done

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
