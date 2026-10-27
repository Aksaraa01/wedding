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
The VPS has 2GB RAM and CANNOT run `next build`. Build locally, rsync the standalone output, then restart PM2 on the server.

> **CRITICAL — never deploy from a stale tree.** A tree that is behind
> `origin/main` produces a bundle *without* templates added by the other agent,
> and `rsync --delete` replaces the live build with it. This happened on
> 2026-10-25: a deploy from a stale tree wiped `adat-jawa-2`, so its preview and
> every CSS chunk 404'd for users until redeployed. Because two agents share this
> repo and both deploy to the same VPS, ALWAYS:
> 1. `git fetch && git status -sb` — HEAD must be **exactly** `origin/main`
>    (not behind, not ahead). Push your commit first; otherwise another agent can
>    build from a tree without your work and deploy it after you.
> 2. Use the guarded deploy instead of hand-rolled rsync:
>    ```bash
>    set -a; source .env.local.prod; set +a; npm run build
>    npm run deploy          # lock → guard → snapshot → rsync → pm2 → smoke → BUILD_ID check
>    ```
>    `npm run deploy:guard` refuses stale trees, **unpushed HEADs**, **dirty
>    working trees**, wrong baked env, or a registered template missing from the
>    bundle. The deploy script also takes a server-side `.deploy.lock` (20 min
>    stale TTL) so two agents cannot rsync simultaneously, re-verifies
>    `origin/main` after the sync (rolling back if a push landed mid-deploy),
>    and asserts the live BUILD_ID still matches after the smoke test.
>
>    **Build from a clean worktree.** The guard refuses a tree with uncommitted
>    changes, because those are usually another agent's WIP sharing this checkout
>    and would be compiled into the bundle:
>    ```bash
>    git fetch origin && git worktree add --detach /tmp/build origin/main
>    cd /tmp/build && cp -Rc "$OLDPWD/node_modules" ./node_modules
>    set -a; source /path/to/repo/.env.local.prod; set +a
>    npm run build && npm run deploy
>    ```
>    rsync runs with `--checksum`, so only real content deltas are transferred
>    (a fresh worktree's checkout timestamps would otherwise re-push the whole
>    ~160 MB of `public/` template media and stretch the outage window to ~13 min).
> 3. Never bypass the guard/lock (`--allow-stale`, `--skip-build-check`) unless
>    the other agent is confirmed stopped. If the lock is held, wait — do not
>    delete it manually.
> 4. After deploying, a browser tab opened before the deploy can keep requesting a
>    dead RSC/chunk and show a 404 until hard-reloaded (⌘⇧R) — check with a fresh
>    tab before assuming the server is broken.

> **CRITICAL — verify baked env BEFORE deploying.** `NEXT_PUBLIC_*` values are
> baked into the bundle at build time. If the wrong env file is sourced (or none
> is), the build silently points at the wrong Supabase project and every DB read
> on prod fails with `TypeError: fetch failed` (login *masks* this — its "user
> not found" 401 is the `!user` branch when the query errors). This happened on
> 2026-08-14: the deployed bundle baked `127.0.0.1:54321` + the local `supabase-demo`
> anon key. After every `npm run build`, BEFORE rsyncing, assert the correct URL:
> ```bash
> grep -o "127.0.0.1:54321\|<PROJECT_REF>.supabase.co\|supabase-demo" \
>   .next/standalone/.next/server/chunks/src_lib_supabase_ts_0_m2_rm._.js | sort | uniq -c
> ```
> Only `<PROJECT_REF>.supabase.co` should appear. If it also shows the local URL/key,
> rebuild with the correct env sourced (`set -a; source .env.local.prod; set +a; npm run build`).

1. Build locally (env MUST be sourced, see critical note above):
   ```bash
   set -a; source .env.local.prod; set +a; npm run build
   ```
2. Rsync standalone output to server (always run sequentially, or chunks/static/public will 404):
   ```bash
   rsync -avz -e "ssh -i $HOME/.ssh/aksaraa_deploy" --delete .next/standalone/ askaraa@103.93.135.176:/var/www/aksara-wedding/.next/standalone/
   rsync -avz -e "ssh -i $HOME/.ssh/aksaraa_deploy" --delete .next/static/ askaraa@103.93.135.176:/var/www/aksara-wedding/.next/static/
   rsync -avz -e "ssh -i $HOME/.ssh/aksaraa_deploy" --delete .next/static/ askaraa@103.93.135.176:/var/www/aksara-wedding/.next/standalone/.next/static/
   rsync -avz -e "ssh -i $HOME/.ssh/aksaraa_deploy" --delete public/ askaraa@103.93.135.176:/var/www/aksara-wedding/.next/standalone/public/
   ```
   **CRITICAL: `public/` rsync MUST run AFTER `standalone/` rsync** — the `--delete` on standalone wipes remote `public/` (it doesn't exist locally in `.next/standalone/`). Running them in parallel causes a race where public gets deleted after being synced. Run all four sequentially.
   Note: Next 16 standalone output does NOT copy `public/`; the standalone server serves public from `.next/standalone/public/` (next to `server.js`). Syncing to `/var/www/aksara-wedding/public/` is NOT served — do not use it.
3. Reload PM2 on the server (reload is REQUIRED — the standalone server indexes the static folder at boot, so static synced after startup returns 404 until reload):
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
4. Smoke-test the AFFECTED prod API endpoints directly (MANDATORY — not just `/login`):
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" --max-time 25 "https://wedding.aksaraa.com/api/dashboard/<id>/web-invitation"
   ```
   Hit every API route touched by the change (GET and, on staging/test data only, the mutating verbs). Local staging smoke runs on macOS and CANNOT catch platform-specific failures: on 2026-09-25 a top-level `import sharp` crashed the whole web-invitation route on the Linux VPS (GET+PUT 500 → every editor empty) while local smoke passed green.
   - NEVER top-level-import a platform-native module in a route file. Lazy-import it inside the function that needs it (`const { default: sharp } = await import("sharp")`) with try/catch fallback, so reads keep working even if the binding is missing.
   - If a native module is required in prod, ensure its linux-x64 binding is an explicit dependency (e.g. `@img/sharp-linux-x64`, `@img/sharp-libvips-linux-x64`) so it gets traced into `.next/standalone/node_modules`, and verify post-deploy with a real mutating call on test data.
5. After the VPS deploy is verified, commit and push the work:
   ```bash
   git add -A
   git commit -m "feat: describe_change"
   git push origin main
   ```
   Note: `tsconfig.tsbuildinfo` is local build noise — leave it uncommitted.

### Start local development

```bash
npx supabase start
npm run dev
```

Requires Docker Desktop running. Local Supabase Studio at `http://127.0.0.1:54323`.
