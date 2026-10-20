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
4. Declare the **content spec** deliberately:
   ```ts
   content: {
     sections: { opening_description: true, dresscode: true, livestream: true },
     cover_slots: 5,
     // labels for cover slots if the template names them differently
   }
   ```
   Anything `false` here must be hidden in editor **and** ops.
5. Add demo props for `<code>` in `demoProps.ts` (photos, names, dates,
   `wedding_profile_id: "demo-wedding-profile-id"`,
   `guest_id: "demo-guest-id"` so server-backed sections have sample data).
6. If the template has a non-standard opening ("Kalimat Pembuka"), register it
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

---

## 2. Phase 2 — Database

Additive migrations only. One responsibility per file.

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_<feature>.sql
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS dresscode_visible boolean DEFAULT true;

INSERT INTO web_templates (code, name, …)
VALUES ('<code>', …)
ON CONFLICT (code) DO NOTHING;
```

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
6. Production: see Deploy below. Test **only** the rafi-novi couple
   (`6a7ad151-c3b4-43e8-8429-0b58b4d0736b`, slug `rafi-novi`).

---

## 8. Phase 8 — Deploy

```bash
set -a; source .env.local.prod; set +a; npm run build
grep -o "127.0.0.1:54321\|<PROJECT_REF>.supabase.co\|supabase-demo" \
  .next/standalone/.next/server/chunks/src_lib_supabase_ts_*.js | sort | uniq -c
```

Only `<PROJECT_REF>.supabase.co` may appear. Then rsync **sequentially**:

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

---

## 10. Definition of done

- [ ] Template registered + content spec + demo props
- [ ] Migration(s) applied local → staging → prod, history in sync
- [ ] Editor GET/PUT + UI + completeness + publish blockers
- [ ] Ops accordion + summary + read-only branch + content-spec gates
- [ ] Public render honors `feature_gates` **and** `*_visible`
- [ ] Wishes section + floating RSVP/QR dock (if the reference has them)
- [ ] `tsc`, staging build, preview curl, affected APIs, prod smoke
- [ ] Committed and pushed to `origin main`
