# Critical Review — Performance / Reliability / Speed / Security / Cost

**Date:** 2026-08-24
**Scope:** Whole project — VPS 103.93.135.176 (2 vCPU / 1.9 GB RAM), Next.js 16 standalone, Supabase (ylmfgorryxzpdckkebnr prod), Caddy, WordPress `wp.aksaraa.com` (PHP-FPM 5 workers), 5 PM2 processes.
**Docs context:** `capacity-planning.md`, `stress-test-report.md`, `wordpress-inhouse-migration.md`

> Principle: **Best architecture = additive, non-breaking.** No DB rewrites, no WP removal in this phase. Fixes are layered (middleware, views, caches, transforms) so existing `wedding_profiles / guests / wishes / wp_sync_jobs` flows keep working.

---

## Executive Summary

| Dimension | Current ceiling | Required | Gap |
|-----------|-----------------|----------|-----|
| **Perf / Speed** | `w/[slug]` p50 799ms p95 9s at 500 VU, 62% fail at 1000 VU (Node 788 MB) | Spike 1000 concurrent (Fri-Sun 18-21) | Node + WP HEAD + no image optimizer |
| **Reliability** | WP sync 27s avg 72×502 at 60 VU; async queue 271ms 0% | 60 concurrent edits safe | Must keep async queue |
| **Security** | 0 RLS, IDOR on all `api/*`, open uploads | Pro $25 + RLS | Exploit-ready |
| **Cost** | 20/mo ×3mo =45 GB storage +30 GB egress → fits Pro 100/250, breach 5-6mo | Retention 3mo SKIP | Needs archive + transform |

**Verdict from docs:** Supabase **Pro mandatory** (`capacity-planning:114`), read path sustains **≈140 req/s** (`stress-test:226`), WP edit sustains **5-6 concurrent sync** → **async queue P1 done must stay**.

---

## Best Architecture (Non-Breaking)

### 1. Security — Add, Don't Migrate

```
[Browser] --anon(sb_publishable)--> [middleware.ts] --session check--> [api/*]
                                   | 401 if missing
[Supabase] RLS enabled, policies: anon = SELECT own wedding_profiles where auth.uid = user_id
           service_role = bypass (existing code still works via supabaseAdmin)
[WP] secret: hash_equals + rateLimit, keep X-Aksaraa-Secret value
[Uploads] requireAuth + upsert:false + SSRF allowlist + size cap
```

* **Why non-breaking:** `supabaseAdmin` (service_role) bypasses RLS, so all existing `src/app/api/**` (≈70 routes) continue without rewrite. Add `src/lib/requireAuth.ts` wrapper that checks `supabase.auth.getUser()` or signed `profile_id` cookie; return 401 early. No schema change.
* **RLS policy example:** `CREATE POLICY "anon own wedding" ON wedding_profiles FOR SELECT USING (auth.uid() = user_id OR is_published = true);` Guest reads stay public via `w/[slug]` SSR (service_role), direct PostgREST anon blocked.
* **Ops:** `src/lib/ops-auth.ts:7` → require `x-ops-pin` hashed vs `wp_bcrypt`, keep `x-ops-phone` as identifier only.
* **XSS:** `wp-mu-plugin/aksaraa-plugin.php:1010` → `wp_kses_post($value)` before `set_element_settings`; keep manifesto mapping.
* **RateLimit:** extend `src/lib/rateLimit.ts:7` from 3 to 9 routes, use `Lru(10000)` + `x-forwarded-for` real IP via Caddy `trusted_proxies`.

### 2. Performance — Views + Transforms + Caches (Additive)

```
[DB] materialized view dashboard_counts (single RPC) → replaces 6 serial guests queries
[Next] next.config images.remotePatterns *.supabase.co + formats avif/webp + compress + optimizePackageImports
[Storage] getPublicUrl(path, {transform:{width:640,quality:75}}) + next/image lazy
[Cache] refCache LRU 500 + wpPostCache 5m/30s + w/[slug] revalidate 60
[Poll] pollWpJob backoff 1.5s→3s jitter + visibility pause + AbortSignal
```

* **Why non-breaking:** View is `SELECT` only, fallback to old queries if missing. `next/image` is opt-in per component (`HeritageJawa.tsx:647` replace `backgroundImage` with `Image`). `revalidate 60` adds `CDN-Cache-Control` without changing SSR logic; Caddy adds `header Cache-Control` for `/_next/static/*` immutable.

### 3. Reliability — Queue Stays, Atomic Claim

```
[api/wp/duplicate|patch] --202--> [wp_sync_jobs] --claimNext FOR UPDATE SKIP LOCKED--> [worker CONC 2] --120s timeout--> [WP php-fpm 5]
                                    |__ nightly reaper distributed lock (pg_advisory_lock) __|
```

* **Fix non-breaking:** Change `src/lib/wpSyncWorker.ts:265` `claimNext` to `SELECT ... FOR UPDATE SKIP LOCKED` + `UPDATE status=processing` in single tx (existing `status=queued` logic preserved). Add `pg_advisory_lock( hash('reaper') )` so multi-PM2 doesn't dup. Keep `instrumentation.ts` worker CONC 2 (`stress-test 5b` proved 0% vs 72×502).

### 4. Cost — Transform + Archive (No Retention Change)

* Keep 3-mo SKIP (`capacity-planning:174`), add manual archive job `storage → S3 Glacier` after 90d, meter `storage.buckets` weekly. Image transform cuts egress ~70% (`capacity-planning:77` 0.75-1.25 GB/couple → 0.25 GB). No delete cron yet.

---

## Critical Findings (16) — Impact & Best Fix

### Security P0 — Must fix before scale

| # | Bug | Location | Impact | Best Fix (non-breaking) |
|---|-----|----------|--------|-------------------------|
| 1 | **0 RLS** all tables | `supabase/migrations/20260730000000_init.sql:11-367` | Anon can read/write all weddings | Enable RLS, add `auth.uid()=user_id` policies, keep service_role bypass |
| 2 | **IDOR** all `api/*` trust `id` | `api/dashboard/[id]/route.ts:13`, `guests/route.ts:5`, `gift-accounts:14` | UUID enum → overwrite/delete | Add `requireAuth` middleware, check `wedding_profiles.user_id` |
| 3 | **Ops spoof** `x-ops-phone` only | `lib/ops-auth.ts:7-14` | Header spoof → admin | Require `x-ops-pin` hash, `hash_equals` |
| 4 | **WP secret plain `===`** | `wp-mu-plugin/aksaraa-plugin.php:52,60` | Repo leak + timing | `hash_equals` + rateLimit 10/min |
| 5 | **Stored XSS** `_elementor_data` | `aksaraa-plugin.php:1010`, `buildProfileFields.ts:60` | Script on `{slug}.wedding.aksaraa.com` | `wp_kses_post` / DOMPurify |
| 6 | **Open uploads** | `api/media/upload:4`, `storage.ts:22` public 20MB `upsert:true` | Cost flood/SSRF | Auth + `upsert:false` + allowlist + 5MB cap |
| 7 | **No rate limit** login/phone/scanner | `api/login:5`, `rateLimit.ts:7` | Brute force | Extend to 9 routes, real IP |

### Reliability P1

| 8 | **Worker race** `claimNext` | `lib/wpSyncWorker.ts:265-293` | Dup jobs, load 5.2 | `FOR UPDATE SKIP LOCKED` tx |
| 9 | **Status flip** any → `sudah_bayar` | `api/ops/queue/[id]/status/route.ts:77`, `lib/opsStatus.ts:49` | Payment audit broken | Tx + allowedNext strict + idempotent QR gen |
| 10 | **Error leak + reaper flood** | `dashboard/[id]/route.ts:106`, `api/cron/reaper:6`, `reaper:334` | Stack leak, 19× concurrent fetch 502 | Sanitize errors, `CRON_SECRET` only, advisory lock |

### Performance P1

| 11 | **No image optimizer** | `next.config.ts:1-6` | LCP >4s, egress $$ | `remotePatterns` + `avif/webp` + `compress` |
| 12 | **N+1 fan-out** 6× guests + 8 APIs | `dashboard/[id]/route.ts:32-89`, `page.tsx:152` | 30 SB hits/view | RPC `dashboard_counts` view |
| 13 | **Poll DoS** 1.5s×120 + 20s ops | `lib/wpJobPoll.ts:13`, `ops/page.tsx:107` | DB flood | Backoff + jitter + `visibilitychange` + LRU 500 |
| 14 | **No revalidate** | `app/w/[slug]/page.tsx`, `web-invitation/route.ts:5` | SSR every hit | `revalidate 60` + Caddy cache |

### Cost P1

| 15 | **Raw `getPublicUrl`** | `lib/storage.ts:22`, `lib/assets.ts:109` | 1 GB/event egress | Transform `?width=640&quality=75` + lazy |
| 16 | **No archive** | `capacity-planning.md:174` | breach 5-6mo | Manual Glacier after 90d + weekly meter |

---

## Tests Required (per docs)

**Keep existing (regression):**
* `k6/phase1-render` 25→1000 VU, `1b QR 200 VU`, `2 writes 100→500 VU`, `3 mixed 500 VU 10m`, `5 sync 60 VU`, `5b async 60 VU` + `vps-monitor.sh` (`stress-test-report:65-89`)
* Puppeteer per-template desktop+mobile + no-redirect 307 + edit live (`wordpress-inhouse-migration:101`)
* Spike 1000 concurrent Fri-Sun (`capacity-planning:124`)

**Add now (gaps):**
* **Security:** RLS negative (anon 403), IDOR 401, ops spoof 401, XSS payload assert escaped, upload 401/413, rate-limit 429 `Retry-After`, `hash_equals` timing
* **Tour E2E:** 9 steps (1 dashboard `premium-web` →2 `ganti-tema` mobile/desktop →3 `template-preview` →4 `pilih-koleksi` →5 `konten` →6 `perbarui` →7 `konfirmasi` →8 `feedback` →9 `cara-memulai` `menu_book`), nav removed `DashboardShell:9` verify
* **Perf:** `next/image` srcset exists, RPC single query, `revalidate` header `CDN-Cache-Control`, poll backoff visible
* **Cost:** per-couple storage <1.25 GB, egress <0.2 GB/100 views, transform URL contains `width`

---

## Implementation Phases (Effort)

| Phase | Scope | Files | Effort | Risk if skipped |
|-------|-------|-------|--------|-----------------|
| **0 Guardrails** | `middleware.ts` headers + harness `vitest`+`playwright`+`k6` | 1d | Low | No baseline |
| **1 P0 Security** | RLS policies + `requireAuth` wrapper + `hash_equals` + XSS + upload lock | `migrations/`, `lib/ops-auth`, `aksaraa-plugin.php:1010`, `storage.ts` | 3-4d | Exploit, cost flood |
| **2 P1 Perf/Reliability** | `next.config` + RPC view + LRU + `SKIP LOCKED` + `revalidate` | `next.config.ts`, `refCache.ts:10`, `wpSyncWorker.ts:265`, `w/[slug]` | 4-5d | 62% fail returns |
| **3 Cost/Monitor** | Transform + archive meter + Grafana external | `assets.ts:109`, cron | 2d | Breach 5mo |
| **4 In-house QA** | Shared `TemplateSection/*` + Puppeteer | `TEMPLATE_MAP` | 5d+ | 100 templates unmanageable |

**Total:** ~10-12d engineering + 2d QA.

---

## Why This Architecture Is Best (Non-Breaking Guarantees)

1. **Additive RLS:** No FK change, existing `wedding_profiles` 40-120k rows untouched. Service_role bypass keeps `proxy.ts:64` + `w/[slug]:20` + `ops/queue:53` working.
2. **View fallback:** If `dashboard_counts` missing, code falls back to old 6 queries (try/catch).
3. **Image:** `next/image` is progressive; old `img` stays until replaced.
4. **Queue:** Keep `instrumentation.ts` CONC 2 proven 0% (vs sync 72×502) — no PHP-FPM resize needed yet.
5. **Cache:** `revalidate 60` is `stale-while-revalidate` — first hit SSR, next cached, no invalidation needed.

---

## References

* Capacity numbers: `docs/capacity-planning.md:64-114,199-214`
* Stress envelope: `docs/stress-test-report.md:108-143,226`
* In-house plan: `docs/wordpress-inhouse-migration.md:57-104`
* Bake trap: `AGENTS.md:64-78` (verify `ylmfgorry` only, never `127.0.0.1`)

> Next action: Phase 1 full RLS/IDOR strict on staging `jclolnjk...` before next prod bake.

---

## Status Update — 2026-08-24 (Deployed)

**Commit pending:** `d1c8b05` is last push; current changes staged but not yet pushed (13 files). Prod VPS already runs built standalone `ylmfgorry` (pm2 835192, `x-frame-options` ✔️, `pt-8` ✔️) via rsync — git commit will make it reproducible.

| Phase | Item | Status | Location | Prod Impact |
|-------|------|--------|----------|-------------|
| **0 Guardrails** | `proxy.ts:withSecurityHeaders` (SAMEORIGIN/nosniff) | **Deployed** (shadow, no block) | `src/proxy.ts` | Headers only |
| | `lib/requireAuth.ts` shadow `STRICT_AUTH=0` + pilot `api/dashboard/[id]:13` | **Deployed** (shadow, always `null`) | `src/lib/requireAuth.ts`, `src/app/api/dashboard/[id]/route.ts:8` | 0 break, ready for strict flip |
| **P0 partial** | Tour 9 steps `cara-memulai` + copy update 08→09 | **Deployed** | `src/lib/tourContent.ts`, `src/app/dashboard/[id]/page.tsx`, `src/components/onboarding/ProductJourney.tsx` | Verified in chunk `ssr_0b4t43r` |
| | Bank logo normalize removed (template-faithful) | **Deployed** WP `110067 rafi-novi-2` OK | `wp-mu-plugin/aksaraa-plugin.php:1372` | New duplicates use master size |
| | DashboardShell templates nav removed + customize add-on block (package+WA tier+express+fisik) | **Deployed** | `src/components/dashboard/DashboardShell.tsx:9`, `src/app/customize/page.tsx:228`, `src/app/api/customize/[profile_id]/route.ts:18` | Paid `FULLY_PAID` now 403 → consult modal |
| **P0 remaining** | RLS enable + policies, IDOR strict (`STRICT_AUTH=1`), ops `x-ops-pin` + `hash_equals`, XSS `wp_kses`, upload `upsert:false` + allowlist, rateLimit 9 routes | **Pending** (staged `jclolnjk` next) | `migrations/`, `lib/ops-auth.ts:7`, `aksaraa-plugin.php:60,1010`, `storage.ts:22`, `rateLimit.ts:7` | Not yet — staging only |
| **P1/P2** | `next.config` images, RPC `dashboard_counts`, `SKIP LOCKED`, `revalidate 60`, transform `?width=640`, archive | **Pending** | See phases above | Not yet |

**Smoke 2026-08-24 prod `rafi-novi` (6a7ad151):** `api/dashboard` 200 FULLY_PAID, `w/rafi-novi` 200, `login` 200, `templates` `pt-8` only, WP `post/rafi-novi-2/elements` 200 — WP gift OK.
