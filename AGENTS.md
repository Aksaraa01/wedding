# Aksaraa Wedding — Agent Guide

## Stack
- **Framework:** Next.js 16.2.11 (Turbopack, standalone output)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS (custom design tokens)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase (anon key + service role key)
- **Fonts:** Playfair Display (headlines), Inter (body), Cormorant Garamond (accent)
- **Supabase CLI:** v2.110.0 (local dev, migrations)

## Supabase Environments

| Environment | Project Ref | URL | How to Start |
|---|---|---|---|
| **Local** | — | `http://127.0.0.1:54321` | `npx supabase start` |
| **Staging** | `jclolnjkjhyjilvymagr` | `https://jclolnjkjhyjilvymagr.supabase.co` | `supabase link --project-ref jclolnjkjhyjilvymagr` |
| **Production** | `ylmfgorryxzpdckkebnr` | `https://ylmfgorryxzpdckkebnr.supabase.co` | `supabase link --project-ref ylmfgorryxzpdckkebnr` |

## Key Conventions

### TypeScript & React
- Use `"use client"` for interactive client components; default to server components
- Prefer `function ComponentName()` over arrow functions
- Props typed with `interface ComponentNameProps`
- No JSDoc comments unless behavior is opaque
- **Client components must NEVER import server-only modules** (`@/lib/supabase`, `@/lib/guest-link`, `@/lib/qr`, `@/lib/featureGates`, etc.). `@/lib/supabase` calls `createClient()` at module-eval with the service-role key, which is empty in the browser → `supabaseKey is required` → the whole page hits the error boundary. Pure, client-safe helpers live in dedicated modules (e.g. `@/lib/guest-slug` for slug constants/helpers); `@/lib/guest-link` re-exports them for server code but must not be imported client-side.

### Tailwind
- Custom tokens: `margin-mobile` (20px), `margin-desktop` (64px), `edge-margin-mobile` (24px), `edge-margin-desktop` (80px)
- Font size tokens: `label-caps`, `label-sm`, `headline-lg-mobile`, `font-headline-md`, `font-body-md`
- Brand colors: `brand-cream`, `brand-charcoal`, `brand-terracotta`, `brand-gold`, `brand-goldMuted`, `brand-slate`
- Material tokens: `background`, `on-surface`, `surface-variant`, `surface-container-highest`, `primary`, `on-primary`, etc.

### API Routes
- Location: `src/app/api/` with Next.js route handler convention
- Export `GET`, `POST`, `PUT`, `PATCH`, `DELETE` functions
- Use `supabaseAdmin` (service role) for server-side DB access; `supabase` (anon key) for client

### Database
- `web_templates.source_type` is `'wp'` (Elementor master + `wp_manifest`, duplicated per couple) vs `'inhouse'` (React component in `TEMPLATE_MAP`, rendered from `wedding_profiles`). In-house templates have `wp_master_slug`/`wp_manifest` null; their editor-driven content shape lives in `TemplateConfig.content` (`ContentSpec` in `src/types/template.ts`)
- `inviting_families` is `TEXT` type (not JSONB) — `JSON.parse` on read, return `[]` if empty
- `wa_blast_tier` is cumulative additional capacity on top of package base (Prestige: 100)
- `rekening_bank` and `gift_shipping_address` deprecated — do not reference
- All migrations in `supabase/migrations/` directory
- Full schema defined in `20260730000000_init.sql`
- Seed data (packages, templates, tracks, etc.) in `supabase/seed.sql`

### Deployment
- Server: `103.93.135.176` (Biznet VPS, Ubuntu 22.04)
- PM2 process: `aksara-wedding` on port 3002
- Caddy reverse proxy: `wedding.aksaraa.com` + `*.wedding.aksaraa.com`
- Subdomain pattern: `{slug}.wedding.aksaraa.com` → `/w/{slug}`
- Node.js 22 via nvm (`/home/askaraa/.nvm/versions/node/v22.23.2/bin/node`)
- Ecosystem config at `/var/www/aksara-wedding/ecosystem.config.js`
- Standalone output: `.next/standalone/server.js` + `.next/standalone/.next/static/` + `.next/standalone/public/`
- PM2 env vars must be injected via ecosystem config (`.env.local` not loaded in standalone mode)

### Supabase Storage
- Bucket: `media`, folder prefix: `seeded/`
- Central asset config: `src/lib/assets.ts`
- All external images seeded to Supabase (no Google/Unsplash/Drive URLs)
- Derivatives: `media/thumbs/{width}/{original-path-without-ext}.webp` (`src/lib/storageUrl.ts`); generated on upload, backfill with `scripts/backfill-thumbs.mjs`. Originals stay for download/share/print/lightbox; UI thumbnails fall back to the original on error.
- On the Linux standalone runtime, `supabase-js` rejects Node `Buffer` upload bodies with `ArrayBuffer: SharedArrayBuffer is not allowed`. Always wrap in-memory output as `new Blob([new Uint8Array(buf)], { type })` before `.storage.upload()` (see `src/lib/storage.ts`).

### Couple slug = invitation subdomain
`wedding_profiles.slug` is generated **once at registration** by `slugifyCouple()` (`src/lib/slug.ts`: full names, words glued, case preserved, joined with `-`) and never rewritten by an edit — changing `groom_name`/`bride_name` later does not move the link. Because the slug *is* the DNS label, it cannot exceed **63 characters** (a longer label is not a legal name: the browser answers `DNS_PROBE_FINISHED_NXDOMAIN` before any request is made). Registration therefore asks for **nama panggilan** (`CoupleSlugHint` shows the live address + `n/63`), and both `submit-registration` and `check-couple` reject/flag `>63`; full names are entered later in the editor. Any link builder must use `coupleUrl()` (`src/lib/coupleUrl.ts`) rather than interpolating the slug: it returns `https://{slug}.wedding.aksaraa.com{path}` when the label is legal and the path form otherwise (`/w/{slug}`, `/led/{slug}`, `/scanner/{slug}`, token-resolved `/qr` and `/welcome`). Renaming an existing slug is not supported — `/w/[slug]` resolves `ilike("slug")` with no alias history, so old links would 404.

### Guest links / `?to=`
- `?to=` may be our generated slug **or** a hand-typed display name (`Budi & Ani`, `Budi / Ani`, `Bapak/Ibu`). Always resolve it with `findGuestForTo()` (`src/lib/guest-link.ts`), which tries raw exact → raw case-insensitive (slug-shaped only) → `normalizeGuestSlug(to)` → the pre-`-&-` legacy candidate. Never feed a raw `?to=` into `.ilike()` — `%`/`_` are LIKE wildcards and will match another guest (`?to=%` used to hijack/overwrite a random guest).
- Raw-first is mandatory: stored slugs are *not* all slugify fixed points (`Ibu--Grace-…`, slugs over 80 chars). Normalization is only a fallback, so no existing link can break. `scripts/guest-slug-check.mjs` asserts this against the configured Supabase (`node --experimental-strip-types scripts/guest-slug-check.mjs`).
- `&`, `/` and `+` are all "and" and collapse to ONE canonical join `-&-`: `Budi & Ani`, `Budi/Ani`, `Budi + Ani` → `Budi-&-Ani` (fixed point, 80-char cap, `prettifyGuestSlug` renders it back as `Budi & Ani`). Only `A-Z a-z 0-9 . - &` ever reach a stored slug — never `/`, `%`, `?`, `=`, `$`. Slugs produced by the pre-`-&-` rule (`Budi-Ani`) stay reachable through `findGuestForTo`'s legacy candidate.
- A guest name keeps `[A-Za-z0-9 .,()&]` (`sanitizeGuestName`); everything else is stripped there, so name → slug never disagrees. Link builders must still use `guest.slug || slugifyName(guest.name)` **and always `encodeURIComponent`** — a slug containing `&` is truncated by the query parser if pasted raw.
- Raw `&` inside a pasted `?to=` is repaired in `guestToFromParams()` (`src/lib/guest-slug.ts`), called by `/w/[slug]`: the query parser splits "?to=Sindy Sihombing&/Partner" into `to` plus an empty-valued fake param, and those fragments are rejoined with `&` before resolution. `src/proxy.ts` cannot do it — Caddy rewrites subdomains to `/w/{slug}` before Next sees them, so the proxy's host branch never runs in production.
- WP guestbook/RSVP (WeddingPress comment-kit/kit2) validates the author with `/^[^?%$=\/]{1,30}$/` and answers “Mohon maaf! Khusus untuk tamu undangan”. The mu-plugin's `wp_footer` script fills the field with `aksaraa_clean_guest_name()` (`/` → ` & `, drops `? % $ =`); keep the PHP and JS rules in sync (`&` is allowed by WP, so it is left alone).

### Git
- Commit directly to `origin main`
- No PR workflow
- Remote is HTTPS: `https://github.com/askaraamini/wedding.git`. Authentication
  comes from macOS Keychain (`credential.helper=osxkeychain`); there is no token
  in this repo, `AGENTS.md`, or `~/.git-credentials`. Never paste a PAT into chat,
  code, or markdown — if one is exposed, revoke it in GitHub and let Keychain
  hold the replacement.
- On this machine `git` is blocked by an unaccepted Xcode license. Prefix every
  git command with `DEVELOPER_DIR=/Library/Developer/CommandLineTools`
  (e.g. `DEVELOPER_DIR=/Library/Developer/CommandLineTools git status`).

### WordPress Integration (Live WP as Source of Truth)
WP hosts the Elementor template masters. Each couple gets a **duplicate** of the master (post + linked popups) that is patched with their data via the mu-plugin REST API.

- **WP instance:** `https://wp.aksaraa.com` (VPS `103.93.135.176`, path `/var/www/wp/`, PHP 8.1-FPM + MariaDB, Caddy block `wp.aksaraa.com` → PHP-FPM). WP-CLI: `sudo -u www-data wp --path=/var/www/wp ...`.
- **mu-plugin:** `wp-mu-plugin/aksaraa-plugin.php` (deployed to `/var/www/wp/wp-content/mu-plugins/`). REST routes under `/wp-json/aksaraa/v1/`:
  - `GET  /post/{slug}` — post lookup
  - `GET  /post/{slug}/elements` — element tree (post + popups) with `_preview` content hints
  - `POST /templates/{slug}/duplicate` — duplicate post + popups, inject `track_url` audio, sequential slug (`-01`, `-02`)
  - `PATCH /posts/{id}/elements` — apply manifest field values into `_elementor_data` + regen CSS
  - `DELETE /posts/{id}?force=1` — delete post + linked popups
- **Auth:** all routes require header `X-Aksaraa-Secret` = `WP_INTERNAL_SECRET` (set in `.env.staging`, must match the constant in the mu-plugin).
- **DB columns:** `web_templates.wp_master_slug`, `wp_manifest`, `package_eligibility`, `demo_url`; `wedding_profiles.active_wp_post_id` + `active_wp_post_url`.
- **Mapping manifest:** `wp_manifest` maps Aksaraa fields → `[{elementId, settings[]}]` (array — one field can map to multiple WP elements). Fields + Bahasa labels in `src/lib/fieldLabels.ts`.
- **Guest name:** popup heading uses Elementor `request-arg` dynamic tag reading `?to=`; `w/[slug]` redirects to `active_wp_post_url?to={guestName}`. Do NOT patch guest name into the manifest — it stays dynamic.

### WordPress duplicate — corruption pitfalls (HARD LESSONS)
When duplicating Elementor posts/popups, the following will silently corrupt data. The mu-plugin already handles these; do NOT reintroduce them.

1. **Copy post meta RAW, not via `get_post_meta`/`update_post_meta`.** The WP slashing round-trip strips backslashes from `_elementor_data` (`\n` → `n`), corrupting JSON by ~13KB. Use `$wpdb->get_results` + `$wpdb->insert` to copy `meta_value` byte-for-byte.
2. **Pass `_elementor_conditions` as an array, never `serialize()` it.** `maybe_serialize` re-serializes already-serialized strings, producing `s:45:"a:1:{...}"` double-encoding. `update_post_meta($id, '_elementor_conditions', ['include/singular/{type}/{post_id}'])`.
3. **Copy the `elementor_library_type` taxonomy term** (`wp_set_object_terms($id, ['popup'], 'elementor_library_type')`) — without it the popup won't appear in the Elementor admin list nor render on the frontend.
4. **Register the popup in the theme-builder conditions cache** (`elementor_pro_theme_builder_conditions` option) after duplicate, or `elementor_theme_do_location('popup')` finds nothing. Directly add `$option['popup'][$popup_id] = [...]`; `Conditions_Cache::regenerate()` is unreliable inside a REST request (cold document cache).
5. **Never run `\Elementor\Plugin::$instance->files_manager->clear_cache()` casually.** It deletes `_elementor_element_cache`, `_elementor_page_assets`, all post CSS files, AND the `elementor_pro_theme_builder_conditions` option — breaking popup rendering site-wide until the conditions cache is rebuilt.
6. **Never mutate the master template directly** (no SQL `REPLACE`/`UPDATE` on the master's `_elementor_data` for one-off fixes). All per-couple changes must go through the duplicate + PATCH flow.
7. **Always generate Elementor CSS explicitly after duplicate/PATCH.** Use `\Elementor\Core\Files\CSS\Post::create($post_id)->update()` (the same safe method `files_manager->generate_css()` uses internally) for the new/patched post + its popups. Do NOT rely on Elementor's "lazy" frontend regen — it does not fire reliably for programmatically-created posts, leaving them unstyled ("messy" raw render). Batch regenerate everything with `files_manager->generate_css()` after a `clear_cache()`-induced wipe.
8. **After PATCHing `_elementor_data`, clear `_elementor_element_cache` + `_elementor_page_assets` for THAT post.** Otherwise the frontend serves the stale cached HTML (old names/dates) even though `_elementor_data` is correct. Delete these three meta keys per-post (not site-wide): `_elementor_css`, `_elementor_element_cache`, `_elementor_page_assets`.
9. **Images MUST be sideloaded into the WP media library.** Elementor resolves image/background/gallery sources by attachment `id` (via `wp_get_attachment_image_src` / `Group_Control_Image_Size`), NOT by `url`. A bare external URL (Supabase) with `id: 0` renders nothing. `AksaraaPlugin::sideload_image()` downloads the Aksaraa URL and `media_handle_sideload()`s it to get a real attachment id + `wp.aksaraa.com` URL (cached in a transient to avoid duplicates). Apply this for every image field (cover `background_image.url`, photos `image.url`, gallery `settings.gallery[]`).
10. **After writing `_elementor_data` with `$wpdb`, call `wp_cache_delete($post_id, 'post_meta')`.** WordPress caches post meta per-request; the CSS regen in the same request otherwise reads the stale pre-write `_elementor_data` and regenerates old CSS.
11. **Elementor does NOT apply the `_css_classes` setting to a section/container's rendered `class`** in this setup (Elementor 4.2.2 + Pro). Setting `_css_classes` on a container in `_elementor_data` is ignored on the frontend, even after purging caches. To hide a container (e.g. empty `gift_address`) programmatically, set a marker class in `_css_classes` (for round-trip/reversibility) AND emit a `wp_head` `<style>`. The plugin's `wp_head` hook scans the current post's `_elementor_data` for the `aksaraa-addr-hidden` marker and outputs `.elementor-element-{id}{display:none!important}` — reliable regardless of class-application. Purge cache not needed for hiding (CSS is emitted fresh each request).
12. **`web_templates.wp_manifest` is a `jsonb` column — always write an OBJECT, never `JSON.stringify()`.** PostgREST stores a passed string as a jsonb *string scalar* (double-encoded), which the /ops mapping UI (`normalizeManifest` returns `{}` for non-objects) and the WP sync worker both fail to read — the mapping appears blank and the mu-plugin receives a string. When writing via one-off scripts, pass the parsed object directly (`.update({ wp_manifest: obj })`). `normalizeManifest` and `wpSyncWorker` now defensively `JSON.parse` strings, but don't rely on that — write objects.
13. **Template-change chain order is duplicate → patch → cleanup (never delete-then-patch).** `runDuplicate` creates the post but does NOT switch `active_wp_post_id`; the worker auto-chains a finalize patch (`payload.finalize`) that switches the profile and only then enqueues cleanup of the old post. On finalize failure the profile stays on the old (complete) post and the orphaned duplicate is cleaned instead. A second template pick while any chain job is queued/processing gets HTTP 409 (`hasOpenWpChain`) — template-select and `/api/wp/duplicate` enforce this; manual Perbarui patches stay usable. `wp_sync_jobs.source` records the caller (`dashboard`|`ops`) for forensics.
14. **PATCH must prove gallery writes (read-after-write).** `verify_gallery_counts()` in `patch_elements` fails the job loudly when a mapped gallery slot's item count ≠ submitted photo count or any item has `id: 0` (unsideloaded). Slots absent from the tree are skipped (manifest is shared with popups). Render-HTML caches (`_elementor_element_cache`, `_elementor_page_assets`) are deleted on EVERY patch, even when nothing changed — a lazy rebuild beats stale tiles.

### Template gallery (public site + couple dashboard)
`src/components/template-gallery/` renders every user-facing template list:
`/templates`, `/templates/kategori/*`, `/premium-web-invitation` and
`/dashboard/[id]/web-invitation/templates`. The ops console (/ops/templates) keeps
its own management grid on purpose. Never re-add a fifth copy of the old grid.

- Layout: "Top 10 Populer" (big outlined rank numbers behind each plate), then
  "Top 10 Terbaru", then one shelf per category with "Lihat semua". Chips
  (category + Foto: Semua/Dengan Foto/Tanpa Foto) collapse the shelves into one
  result grid instead of filtering the shelves in place.
- `TemplateTile` frames each 9:19 `preview_image_url` on a warm plate; the tier
  colour sits under the name, so do not reintroduce the tier pill on the image.
  Public tiles open `TemplatePreviewModal` (its header carries "Pilih Template"
  → `/register?template=CODE`); the dashboard passes `onPreview`/`onSelect` and
  keeps the package gate (`isLocked`) + Active badge.
- "Populer" is ops-owned, never computed: `web_templates.popular_rank` (1..10,
  unique partial index). It is NOT a field in the edit modal — ops uses the
  "Atur Top 10 Populer" button in /ops/templates, which opens a drag-and-drop
  lineup of 10 slots (up/down buttons for touch, a name-only dropdown to fill an
  empty slot) and saves the whole order through
  `POST /api/ops/templates/popular-rank`. Opening the panel prefills empty slots
  from `GET` on the same route, which reads `web_template_popularity` (the
  real-usage view: current selection ×3, WP pick, feedback); "Muat dari data"
  rebuilds the whole lineup from it. Manual order still wins after saving. That
  route nulls every rank before
  re-assigning, because the unique index makes in-place swaps collide. The
  migration seed uses real usage (a current selection weighs 3x, a
  `wp_sync_jobs` duplicate 1x) and pads the remaining slots from `sort_order`.
  "Terbaru" is `created_at desc` — no column, no maintenance.
- Ordering/padding/row-building math lives in `src/lib/templateGallery.ts`
  (pure, client-safe). Category bucketing still comes from
  `src/lib/templateCategory.ts`; `galleryRows()` guarantees no template falls
  off the page (unmatched rows land in "Lainnya").
- Cache: `/templates` is ISR (1 h) and `/api/web-templates` is cached for 1 h
  unless `fresh=1`. A re-ranked template therefore shows up within the hour on
  the public site and immediately in the dashboard picker.

## Common Tasks

### Add a new page route
1. Create `src/app/<route>/page.tsx`
2. Use shared layout in `src/app/layout.tsx`
3. Follow font/color tokens from tailwind.config.ts
4. Use `Navigation` component for header

### Add or port an in-house template
Read `docs/INHOUSE_TEMPLATE_PLAYBOOK.md` first. It covers the full
reference → component → migration → editor → ops → wishes/floating dock →
deploy flow, plus the do/don'ts and the failure catalogue from past sessions.

### Add an API route
1. Create `src/app/api/<name>/route.ts`
2. Export HTTP method functions
3. Use `supabaseAdmin` for DB access

### Scanner kiosk (PIN + JWT)
`src/lib/scannerJwt.ts` issues two HMAC-SHA256 tokens to the `/scanner/[slug]`
kiosk after the PIN check:
- **access token** — 6 h, `scope: "scanner"`, sent as `Authorization: Bearer`.
- **refresh token** — 30 d, `scope: "scanner_refresh"`, kept in `localStorage`;
  `POST /api/scanner/{slug}/refresh` trades either one for a new pair.

Signing key = `sha256(SCANNER_JWT_SECRET || SUPABASE_SERVICE_ROLE_KEY)`. The
payload carries `pin_hash` (`sha256(PIN)` prefix), so rotating
`wedding_profiles.scanner_pin` revokes every kiosk token — the only case that is
allowed to push the operator back to the PIN screen. The page refreshes silently
when <2 h remain and on `visibilitychange`, because a phone asleep for hours
misses any interval timer.

Failure signature: `/api/check-in/search` and `/api/guest-photos?selfies=1`
answer **401** while QR check-in keeps working (`POST /api/check-in` falls back
to the body's `wedding_profile_id`). Search therefore *degrades* — an
unverifiable token is ignored and the `wedding_profile_id` param is used — so a
stale token can never block the concierge mid-event. `/refresh` tries the bearer
**and** the body's `refresh_token` independently (the kiosk always sends its old
bearer, so a stale one must not shadow a good refresh token), and when both are
dead the page drops the tokens and keeps running instead of showing the PIN
screen. Verify any change here with the round-trip script:
`node --experimental-strip-types scripts/scanner-jwt-check.mjs`.

### Add a database schema change

1. Make changes in local Supabase Studio (`http://127.0.0.1:54323`) or via SQL
2. Generate migration:
   ```bash
   npx supabase db diff -f describe_change
   ```
3. Test locally:
   ```bash
   npx supabase db reset
   ```
4. Push to staging first:
   ```bash
   npx supabase link --project-ref jclolnjkjhyjilvymagr
   npx supabase db push
   ```
5. Verify on staging, then push to production:
   ```bash
   npx supabase link --project-ref ylmfgorryxzpdckkebnr
   npx supabase db push
   ```
6. Commit migration file:
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add feature_x"
   git push
   ```

#### Migration versions must be unique — `db push` replays anything unrecorded

`supabase db push` decides what to run from `supabase_migrations.schema_migrations`,
not from the data. Template registrations (`web_templates` inserts) are
`ON CONFLICT (code) DO UPDATE` and include **ops-edited** columns
(`preview_image_url`, `demo_url`, `sort_order`, `category`,
`package_eligibility`, `tier`, `is_active`), so replaying one silently replaces
the uploaded screenshot and ordering that environment already has.

- Never let two files share a version — the second can never be recorded, so it
  re-applies on every later push. Check before pushing:
  `ls supabase/migrations/*.sql | sed 's|.*/||' | cut -d_ -f1 | sort | uniq -d`
  (must print nothing). Rename the newer file to the next free version
  (`…27000000` → `…27000001`), never delete it — a fresh `db reset` needs it.
- When a migration's effect already exists in a database but its version is
  missing from that history table, record it **without executing**:
  ```bash
  npx supabase migration repair --status applied <version> [<version>…] --linked
  ```
- Do that before `db push` on staging/prod. Production was found missing 8
  versions whose rows already existed (`evermore`, `piano_garden`,
  `altar_garden`, `imagine`, `lace`, `20261027000001`, `20261030000001`,
  `20261034000001`); pushing them unchecked would overwrite those templates'
  uploaded thumbnails. Rows in either environment can be read directly with
  `psql -h aws-0-ap-northeast-1.pooler.supabase.com -U postgres.<ref>` and
  `SUPABASE_DB_PASSWORD` (prod has no IPv4 on `db.<ref>.supabase.co`).
- `npx supabase db reset` wipes local dev data; prefer `npx supabase migration
  up --local` (it refuses `--include-all` while duplicate versions exist).

### Staging smoke test (BEFORE deploying to VPS)
Run a local standalone build pointed at the **staging** Supabase and smoke test it before resyncing to the VPS. Staging data is duplicated from production (script: `/var/folders/h9/00699n8j5_72btn55c8dfg400000gn/T/opencode/musictest/copy-to-staging.mjs` — copies reference tables + profiles + guests + wishes + ops data; `wedding_profiles.user_id` is nulled since `auth.users` isn't in staging).

1. Apply migrations to staging (and local) first:
   ```bash
   npx supabase db reset   # local
   export SUPABASE_ACCESS_TOKEN=...
   npx supabase link --project-ref jclolnjkjhyjilvymagr && npx supabase db push
   ```
2. Build with the staging env:
   ```bash
   set -a; source .env.staging; set +a; npm run build
   cp -r .next/static .next/standalone/.next/static
   cp -r public .next/standalone/public
   ```
3. Run the standalone server locally (server secrets are read from the process env at runtime, so the env must be sourced):
   ```bash
   set -a; source .env.staging; set +a; PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js
   ```
4. Smoke test against `http://127.0.0.1:3100` (APIs + key pages). If anything fails, fix and re-run.
5. After smoke passes, rebuild with the prod env and deploy (see Deploy below):
   ```bash
   set -a; source .env.local.prod; set +a; npm run build
   ```

### Production testing policy
- Testing on **production** must ONLY touch the rafi-novi couple (profile `wedding_profiles.id` `6a7ad151-c3b4-43e8-8429-0b58b4d0736b`, queue `ops_queue.id` `39936c3e-a136-405f-a39b-e469b3e7997c`, WA `+62823`, slug `rafi-novi`). Do NOT modify data of any other user/couple on prod.
- Prod testing sometimes requires DB changes (status flips, feedback_submissions updates, payment flags, etc.). Apply them to the rafi-novi profile only, ideally via one-off scripts using `SUPABASE_SERVICE_ROLE_KEY` from `.env.local.prod`, and revert afterwards when the test is for a one-way action (e.g. status transitions with audit-log side-effects).

### Deploy
The VPS has 2GB RAM and CANNOT run `next build`. Build locally, ship the build
output, then restart PM2 — all handled by `npm run deploy`.

**Order is commit → push → build → deploy.** The guard refuses an unpushed HEAD,
so pushing first is mandatory, not optional:

```bash
git add -A && git commit -m "feat: describe_change"
git push origin main
git fetch origin && git status -sb        # HEAD must be exactly origin/main
set -a; source .env.local.prod; set +a
npm run build
npm run deploy
```

`npm run deploy` runs, in order:

```
lock → guard → snapshot → sync → prune → re-verify origin/main → pm2 → smoke → BUILD_ID check
```

A typical deploy takes ~3 minutes and **does not take the site down** — the sync
is additive, so whatever version is live keeps serving until the PM2 reload.

> **CRITICAL — never deploy from a stale or dirty tree.** Another agent shares
> this repo and this VPS. A tree behind `origin/main` builds a bundle *without*
> their work; a tree with uncommitted changes builds *their unfinished work in*.
> Both have happened (2026-10-25: a stale deploy wiped `adat-jawa-2`). BEFORE
> deploying, all three of these must hold:
> 1. `git fetch && git status -sb` — HEAD is **exactly** `origin/main` (not
>    behind, not ahead). Push your commit first.
> 2. The working tree is **clean** (`npm run deploy:guard` enforces this;
>    `tsconfig.tsbuildinfo`, `*.log`, `docs/**` and `.DS_Store` are allowed).
> 3. The build was made from that same commit — **rebuild after any rebase or
>    pull**. The guard compares the tree to `origin/main`, not the bundle to the
>    commit, so a build made *before* a rebase still passes the guard and will
>    silently revert whatever landed in between.
>
> Build from a clean worktree when the shared checkout is busy:
> ```bash
> git fetch origin && git worktree add --detach /tmp/build origin/main
> cd /tmp/build && cp -Rc "$OLDPWD/node_modules" ./node_modules
> set -a; source /path/to/repo/.env.local.prod; set +a
> npm run build && npm run deploy
> ```
> Never bypass the guard or the lock (`--allow-stale`, `--allow-dirty`,
> `--skip-build-check`) unless the other agent is confirmed stopped. If the lock
> is held, wait — do not delete it manually.

`npm run deploy:guard` checks: git sync (behind/ahead), clean tree, baked
`NEXT_PUBLIC_*` env, and that every registered template is in the bundle. Flags:
`--allow-stale`, `--allow-dirty`, `--ref <project>` (staging), `--sync-only`
(the post-sync re-check). The deploy script also takes a server-side
`.deploy.lock` (20 min stale TTL) so two agents cannot sync simultaneously,
re-verifies `origin/main` after the sync (rolling back if a push landed
mid-deploy), and asserts the live BUILD_ID still matches after the smoke test.

#### What the sync does (and why it is additive)
`scripts/deploy.sh` syncs in four moves — **none of them delete**:
```bash
# node_modules: skipped entirely when its file-list stamp is unchanged
# build output + static: one gzipped tar stream per tree (rsync's per-file
#   negotiation is unusable at this link's ~1.2 s RTT)
# public/: rsync --checksum, so only genuinely changed media crosses the wire
# old chunks: pruned by `find -mtime +7` after every deploy
```
**Additive is deliberate.** `rsync --delete` used to remove the *running*
process's chunks before PM2 switched over, so every page load returned 500 for
the entire transfer (a chunk route matched the old manifest, but the file was
gone → 500, not 404). Nothing is deleted during a deploy now, so a slow link no
longer produces an outage, and **a failed deploy is a no-op — just re-run it.**
A pre-deploy browser tab keeps its JS chunks (they survive 7 days), but a
client-side navigation may still fetch a stale RSC payload — hard-reload
(⌘⇧R) if a tab behaves oddly after a deploy.

The deploy also deletes `.next/standalone/.next/server/route-cache` right before
the PM2 reload. That cache outlives a deploy and is keyed by route, not by build,
so a page rendered before a data change (e.g. a newly registered template row)
keeps serving its old HTML with `x-nextjs-cache: HIT` even though the deployed
bundle and `BUILD_ID` are correct. If a page still looks stale by hand:
`rm -rf /var/www/aksara-wedding/.next/standalone/.next/server/route-cache` then
`pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env`.

Notes:
- Next 16 standalone output does NOT copy `public/`; the standalone server serves
  public from `.next/standalone/public/` (next to `server.js`). Syncing to
  `/var/www/aksara-wedding/public/` is NOT served — do not use it.
- `COPYFILE_DISABLE=1` **and** `--no-xattrs` must be set for macOS `tar`,
  otherwise it emits AppleDouble `._*` entries (doubles the file count) and
  per-file `LIBARCHIVE.xattr` pax headers that make GNU tar on the VPS warn
  ~2600 times per deploy.
- Every network step is wrapped in `retry 3` with SSH keepalive
  (`ServerAliveInterval=15`, `CountMax=6`) because this link drops connections
  mid-transfer; `public/` additionally uses `rsync --partial --timeout=180`.

> **CRITICAL — verify baked env BEFORE deploying.** `NEXT_PUBLIC_*` values are
> baked into the bundle at build time. If the wrong env file is sourced (or none
> is), the build silently points at the wrong Supabase project and every DB read
> on prod fails with `TypeError: fetch failed` (login *masks* this — its "user
> not found" 401 is the `!user` branch when the query errors). This happened on
> 2026-08-14: the deployed bundle baked `127.0.0.1:54321` + the local
> `supabase-demo` anon key. The guard checks this automatically; to check by hand
> before deploying:
> ```bash
> grep -rho "127\.0\.0\.1:54321\|ylmfgorryxzpdckkebnr\.supabase\.co\|jclolnjkjhyjilvymagr\.supabase\.co\|supabase-demo" \
>   .next/standalone/.next/server/chunks | sort | uniq -c
> ```
> Only `ylmfgorryxzpdckkebnr.supabase.co` should appear. If it also shows the
> local or staging URL, rebuild with the right env sourced.

#### Manual recovery only
`npm run deploy` already reloads PM2. Use these by hand only when recovering:
```bash
ssh askaraa@103.93.135.176
cd /var/www/aksara-wedding && pm2 startOrRestart ecosystem.config.js --only aksara-wedding --update-env
pm2 save
```
**CRITICAL: use `startOrRestart` with the ecosystem file, NOT bare `pm2 restart`.**
`pm2 restart` preserves the process's original launch-time env and never re-reads
`ecosystem.config.js`, so any env var added to the file later (e.g.
`WA_TARGET_GROUP_JID`, `WP_POLL_MS`) silently never reaches the process (this
broke WA group notifications). `startOrRestart` re-reads the file. After reload,
verify new vars landed (names only, never print values):
```bash
ssh -i $HOME/.ssh/aksaraa_deploy askaraa@103.93.135.176 "pm2 env \$(pm2 id aksara-wedding 2>/dev/null | grep -o '[0-9]*') 2>/dev/null | grep -o '^[A-Za-z_][A-Za-z0-9_]*' | sort -u"
```

#### Smoke-test the AFFECTED prod API endpoints directly (MANDATORY)
`npm run deploy` smoke-tests all 24 template previews plus the critical APIs and
rolls back automatically on failure, but it cannot know which routes *your*
change touched — hit those yourself:

```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-time 25 "https://wedding.aksaraa.com/api/dashboard/<id>/web-invitation"
```
Hit every API route touched by the change (GET and, on staging/test data only,
the mutating verbs). Local staging smoke runs on macOS and CANNOT catch
platform-specific failures: on 2026-09-25 a top-level `import sharp` crashed the
whole web-invitation route on the Linux VPS (GET+PUT 500 → every editor empty)
while local smoke passed green.
- NEVER top-level-import a platform-native module in a route file. Lazy-import it
  inside the function that needs it (`const { default: sharp } = await import("sharp")`)
  with try/catch fallback, so reads keep working even if the binding is missing.
- If a native module is required in prod, ensure its linux-x64 binding is an
  explicit dependency (e.g. `@img/sharp-linux-x64`, `@img/sharp-libvips-linux-x64`)
  so it gets traced into `.next/standalone/node_modules`, and verify post-deploy
  with a real mutating call on test data.

Note: `tsconfig.tsbuildinfo` is local build noise — leave it uncommitted.

### Cloudflare (DNS, CDN, edge certificates)
- **DNS `aksaraa.com` lives at Cloudflare** (NS `elinore`/`martin.ns.cloudflare.com`, zone id `d5a2cc0c9e27fe48db14f1c5c6930e46`). Hostinger is only the registrar now; its DNS API is no longer authoritative.
- **Proxied (orange cloud):** `aksaraa.com`, `www`, `wedding.aksaraa.com`, `cdn.aksaraa.com`, `wp.aksaraa.com`, `education.aksaraa.com`, `staging.aksaraa.com`.
- **DNS-only (grey cloud) BY DESIGN:** `*.wedding.aksaraa.com` (couple invitations) and `stg.education.aksaraa.com`. Cloudflare Universal SSL covers **one** level (`aksaraa.com` + `*.aksaraa.com`); a two-level host (`slug.wedding.aksaraa.com`) fails the TLS handshake at the edge. Proxying it requires Advanced Certificate Manager ($10/mo, Total TLS / advanced cert) — that is a product decision, not a config tweak. Invitations render straight from the origin.
- **Never cache preview HTML at the edge.** Next answers RSC requests with a `307 ...?_rsc`; Cloudflare stores that redirect under the plain URL and serves it to normal navigation (this broke 4 previews on 2026-11-02). Cache rules: (1) bypass `/api|scanner|qr|led/`, `/w/`, any `?to=`; (2) bypass `wp` `/wp-json|/wp-admin|/wp-login`; (3) `/templates/*` **except** paths containing `/preview` → edge 30 d; (4) `/_next/static|/fonts|/images|/media|/defaults` → 1 y; (5) `wp` `/wp-content/*` → 30 d. Rule order matters (first match wins).
- **`cdn.aksaraa.com`** is a static-only host: Caddy `file_server` over `.next/standalone/public` (no Node), `Access-Control-Allow-Origin: *` (fonts need it), 7-day `Cache-Control`. The couple-host blocks `redir /templates/*`, `/fonts/*`, `/images/*` → `https://cdn.aksaraa.com{uri}` (**302**, so rollback is instant: delete the three lines). This is how guest art reaches the edge without proxying the invitation host.
- **`cdn.aksaraa.com` is OWNED by this project — never bind an R2 custom domain (or any other origin) to it.** On 2026-11-03 the Aksaraa (atlas/academy) art bucket `aksaraa-art` was attached as a custom domain to this hostname; R2 auto-created the DNS record and every font/template/image 404'd with R2's HTML page and no CORS header. It stayed invisible for 3 days because browsers keep woff2 7 days and the edge 1 year, then the R2 404s were themselves cached for 1 year by the `/fonts` rule. Recovery = detach the custom domain, restore the proxied `A 103.93.135.176`, `purge_cache` (`purge_everything`).
- **`art.aksaraa.com`** is the R2 custom domain for bucket `aksaraa-art` (Aksaraa project: `atlas/`, `academy/`, `og/`), with bucket CORS `AllowedOrigins *`. That project's DB stores **absolute** `https://cdn.aksaraa.com/atlas|academy|og/...` URLs, so the wedding CDN host keeps `redir @art https://art.aksaraa.com{uri} 302` for those three prefixes — do not remove it without rewriting that project's stored URLs.
- Two guards watch this: `scripts/postdeploy-smoke.mjs` probes the CDN origin path on every deploy (cache-busted, requires 200 + font/image type + `ACAO: *`), and `cdn-health-check.timer` on the VPS runs `scripts/ops/cdn-health-check.sh` every 15 min (WhatsApp to ops on failure). The probe must stay cache-busted — a warm edge copy hides a broken origin for a year.
- **Cache rule / CDN changes are made through the API** (`/zones/:id/rulesets/phases/http_request_cache_settings/entrypoint`). `matches` (regex) is **not** available on the Free plan — use `starts_with`/`contains`.
- **Preflight is mandatory** before changing proxy status: `scripts/ops/cloudflare-preflight.sh` resolves every hostname pattern via DoH, verifies the certificate with curl against the edge IP, and requires `cf-ray` for proxied hosts. It exists because proxying `*.wedding.aksaraa.com` without ACM took couple invitations down on 2026-11-02.
- **Server config is snapshotted** at `scripts/ops/Caddyfile.prod`; `npm run deploy` does not manage `/etc/caddy/Caddyfile`, so edit the server and update the snapshot in the same change.

### TLS certificates & Caddy (VPS)
- `/usr/bin/caddy` is a **custom `xcaddy` build**, not the apt package: the official deb ships zero `dns.providers` modules. Since the DNS move it is built with **both** `caddy-dns/cloudflare` (**v0.2.4 or newer — v0.2.2 rejects the `cfat_` token format**) and the legacy `caddy-dns-hostinger`, plus the `libdns-hostinger` TTL patch, so the Caddyfile can still be reverted during a migration window. The package is `apt-mark hold`-ed. Rebuild with `scripts/ops/build-caddy-linux.sh`, deploy per `scripts/ops/deploy-caddy.md`.
- ACME is DNS-01 via **`tls { dns cloudflare {env.CLOUDFLARE_API_TOKEN} }`** for `wp.aksaraa.com`, `*.aksaraa.com` and `wedding.aksaraa.com, *.wedding.aksaraa.com`; `aksaraa.com` uses HTTP-01 (verified to pass through the proxy). The token lives in `/etc/systemd/system/caddy.service.d/override.conf` (chmod 600), not in the repo.
- DNS-01 issuance was verified end-to-end against Let's Encrypt **staging** on 2026-11-02 (cert issued in ~12 s, TXT cleaned up). Caddy's propagation check uses the VPS resolver, which can lag a nameserver change by the delegation TTL (86400) — retry a day later instead of "fixing" the token.
- Guard: `cert-expiry-check.timer` (daily 06:00 WIB) runs `scripts/ops/cert-expiry-check.sh` on the VPS and WhatsApps the ops group when a host stops verifying, expires in <14 days, or Caddy logged a renewal failure in the last 6 h. `--dry-run` prints instead of sending.
- `npm run deploy`'s smoke test treats TLS/DNS curl failures as fatal; do not weaken that back to "ERR is fine".

### Client IP & rate limits
- Caddy runs with `trusted_proxies` limited to **Cloudflare's published ranges** plus `trusted_proxies_strict`, and overwrites `X-Real-IP` on every proxied request (`header_up X-Real-IP {client_ip}`). `src/lib/rateLimit.ts` reads `X-Real-IP` first, so a direct request to a DNS-only host (couple subdomains) cannot spoof a bucket by sending its own `X-Forwarded-For`/`CF-Connecting-IP`.

### Invitation page performance invariants
Guest invitations run on DNS-only couple subdomains (no CDN for HTML/JS), so
their first screen is paid for at the origin's ~4 Mbps. Four rules keep that
from regressing — break one and the page gets measurably slower:

1. **Music must not download before the guest opens the invitation.** Audio
   elements use `preload="metadata"` and `data-warm-audio`; `AudioWarmup`
   (root layout) upgrades them to `preload="auto"` on the first
   pointerdown/touchstart/keydown. `preload="auto"` on `<audio>` was costing
   0.9–3.2 MB per visit (manjari: 3.1 MB, Lighthouse-verified).
2. **Material Symbols is subset in `src/app/layout.tsx`** (`&icon_names=…`, 212
   icons, 225 KB instead of 1.1 MB). `scripts/check-material-icons.mjs` runs in
   the deploy guard. It resolves all four ways an icon name reaches the DOM —
   a literal `>name<` child, a ternary branch inside a `.material-symbols-outlined`
   span, an `icon=`/`icon:` prop or object key, and a positional icon argument of
   a local helper (`renderSection(k, icon, …)`) — so an icon passed through a
   variable (`{col.icon}`, `{s.icon}`) is also caught. Only the *definitions* need
   to be literals; that is where the guard looks. A name that is missing renders
   as a blank glyph; a name that is not a real Material Symbols icon (e.g. the old
   `chat_bubble_outline`, `collections`, `unique_link_generator`) never renders at
   all, so use `https://fonts.google.com/icons` spellings.
3. **YouTube players mount late, not on load.** `AutoplayYouTube` creates the
   player when its host is within 200% of the viewport and shows the YouTube
   poster until then (`autoplay=1&mute=1` unchanged). Mounting on load pulled
   ~1.5 MB on every invitation, including guests who never reach the film.
4. **Cloudflare Web Analytics is gated to `wedding.aksaraa.com`**
   (`CloudflareBeacon`). Cloudflare RUM rejects beacons from unregistered
   hostnames with a CORS error and does not accept wildcards, so injecting it on
   couple subdomains logged a failed request on every guest page. Guest-side
   measurement needs its own endpoint; it does not exist yet.

5. **Couple media renders from the pre-generated thumbs, never the originals.**
   `thumbUrl()`/`thumbStoryImages()` (`src/lib/storageUrl.ts`) are applied in the
   two render paths — `src/app/w/[slug]/page.tsx` (guest) and
   `src/app/preview/[id]/page.tsx` (editor) — at 1200w for covers and 800w for
   gallery/portraits/stories. Coverage was verified at 100% (938 media paths,
   plus 51/51 on the published invitations). **Do not apply this in
   `buildProfileFields`**: the WP manifest must sideload the originals into the
   media library, and OG already uses the 1200w variant via `toOgImageUrl`.
   New media always gets thumbs at upload (`storage.ts`, `IMAGE_PREFIXES`); for
   legacy objects run `scripts/backfill-thumbs.mjs`.

### Start local development

```bash
npx supabase start
npm run dev
```

Requires Docker Desktop running. Local Supabase Studio at `http://127.0.0.1:54323`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
