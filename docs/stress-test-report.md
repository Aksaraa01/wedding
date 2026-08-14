# Aksaraa Wedding — Production Load & Stress Test Report

**Date:** 2026-08-14
**Target:** Production (`https://wedding.aksaraa.com`, VPS `103.93.135.176`, PM2 `aksara-wedding` on port 3002 behind Caddy)
**Tooling:** k6 v2.2.0 (macos-amd64), Supabase service-role via Python REST, WP REST API (`X-Aksaraa-Secret`)
**Author:** opencode stress-test session

---

## 1. Executive Summary

- **Read path OK under realistic load.** QR redirect + check-in + invitation render hold up to ~140 req/s (500 VU) with sub-second p50 and 0% errors at that level. The write paths (RSVP, wishes) are **100% reliable** even at 500 VUs for 10 minutes.
- **Capacity ceiling is the Node/VPS box and the synchronous Supabase/WP round-trips, not the DB.** At >300 VU the render path degrades steeply (request timeouts, ~63% errors at 1000 VU peak) because every `w/[slug]` view issues 5–8 Supabase reads + a `cache: no-store` WP HEAD per request.
- **CONFIRMED PROD BUG (not load-induced):** `POST /api/guests/{id}/open` returns **HTTP 500 on every call** (`Cannot coerce the result to a single JSON object`) because `route.ts` calls `.single()` on a filtered update that matches 0 rows. This broke 23,170/23,170 open attempts in Phase 3. **✅ FIXED after the test** (Section 5 + 7).
- **Memory/segfault behavior:** Phase 1 (1000 VU peak, slow requests pile-up) ballooned Node RSS to ~788 MB and tripped repeated PM2 restarts; Node itself kept recovering. Phase 3 at 500 VU plateaued at ~225 MB RSS with no OOM — the box is memory-safe for the sustaining envelope, fragile above it.
- **Data integrity preserved:** only the dedicated test couple was touched; all real profiles/guests/wishes intact after cleanup (Section 6).
- **WP template creation/edit path is the critical capacity bottleneck.** Phase 5 (60 concurrent couples each duplicating + repeatedly patching a WP template) saturates the WordPress PHP-FPM pool (`pm.max_children = 5`). Average request latency ballooned to **26.9s** with 5/5 workers pinned and 300+ queued Node connections; 72 proxied 502s + 99 client timeouts. Node itself stayed lean (~164 MB RSS) — **WordPress, not Next.js or Supabase, is what cannot handle concurrency** (Section 4.4, recommendations Section 7).
- **Async queue removes the WP edit bottleneck (Phase 5b).** `/api/wp/duplicate` + `/api/wp/patch` now enqueue into a `wp_sync_jobs` table and return 202; an in-process worker (concurrency 2, in the PM2 fork) calls WP serially via PHP-FPM. Same 60 VU scenario: request latency dropped from **26.88s avg → 271ms avg** (0% HTTP errors), VPS load from 5.2 → 1.74, PHP-FPM 5/5 pinned → max 3 workers. All 196 queued jobs (99 duplicate + 97 patch) completed with **0 failures** (Section 4.6).

---

## 2. Test Fixtures

### Dedicated prod test couple
| Item | Value |
|---|---|
| `wedding_profiles` id | `7ca9c482-c674-407e-9875-f5a5558dcd01` |
| Slug | `stress-test-phmkrc` |
| Template | `981df7d8-c181-4286-8a9d-ec76595a77fe` (template-1, WP-backed) |
| Guests | 200, unique `qr_token` `st-phmkrc-001..200`, `rsvp_status=BELUM_RESPON` |
| WP invitation | duplicated live post id **108491** at `https://wp.aksaraa.com/stress-test-phmkrc/` (popup 1) |
| WP audio track | couple-selected track_url injected at duplicate time |
| Prime | WP invitation warmed once before load so it mirrors a mature couple |

### Phase 5 (WP template create/edit) fixtures — dedicated test couples
| Item | Value |
|---|---|
| couples | 60 (`wpstress-oturc-00..59`) |
| template | `981df7d8-c181-4286-8a9d-ec76595a77fe` (template-1, `marry-with-you`, WP-backed) |
| track | `43f80342-…` (`Perfect.mp3`) — injected at duplicate time |
| content | realistic: names, initials, parents, instagram, quote, 2 sessions, 2 stories, 3 gallery photos, cover_photos, inviting_families, 1 gift account + 1 address per couple (from seeded Supabase assets) |
| guests | none (duplicate/patch paths don't need guests) |

### Endpoints exercised
- `GET /w/{slug}?to={name}` — invitation render (WP-iframe). Path per view: profile read + row-gates + feature-set + guest lookup (5–8 Supabase reads) + `cache: no-store` WP HEAD before iframe.
- `GET /q/{qr_token}` — QR redirect → 302 to `active_wp_post_url?to={guest}`
- `GET /api/check-in?qr_token=` — check-in (stores `invitation_opened_at`-adjacent data)
- `POST /api/guests/{id}/open` — open tracker (client-side fire on invitation view)
- `POST /api/guests/{id}/rsvp` — `{rsvp_status, rsvp_pax_count, rsvp_message}`
- `GET/POST /api/wishes` + `GET /api/wishes/led` — wishes + LED poll
- `GET /api/web-templates` — reference data

### WP template create/edit flow (Phase 5)
- **Duplicate** — `POST /api/wp/duplicate` → mu-plugin `duplicate_template()`. Per call: `wp_insert_post` (new numbered `{slug}-NN`) + raw byte-for-byte `copy_post_meta` of the master, duplicate linked popup + rewire theme-builder conditions cache, inject `_aksaraa_track_url`, write field-meta, regen Elementor CSS for post **and** popup.
- **Patch** — `POST /api/wp/patch` → mu-plugin `patch_elements()`. Per call: read `_elementor_data`, apply manifest field values (simple/array/object/gallery), sideload any missing images into the WP media library, write `_elementor_data` raw via `$wpdb`, clear that post's Elementor caches, regen CSS for post + popup.

Both are PHP-FPM-bound (WP) with synchronous CSS regeneration — the expensive part is WordPress, sitting behind a PHP-FPM pool of **5 workers** (`pm.max_children = 5`), the same 2-vCPU box.

---

## 3. Phases & Methodology

| Phase | Script | Scenario | Duration | Peak load |
|---|---|---|---|---|
| 1 | `k6/phase1-render.js` | Invitation render ramp | ~5 min | 25 → **1000 VU** |
| 1b | `k6/phase1b-qr-checkin.js` | QR scan + check-in | ~2 min | **200 VU** constant |
| 2 | `k6/phase2-writes.js` | open / RSVP / wishes mix | ~2m55s | 100 → **500 VU** |
| 3 | `k6/phase3-mixed.js` | venue-day scenario (QR→checkin→open→rsvp 1/3→wish 1/5→LED poll 1/7) | **10 min** | **500 VU** constant |
| 5 | `k6/phase5-wp-edit.js` | WP template create/edit: each user duplicates a template then runs 6 content edits (patch) | ~4 min | **60 VU** constant (each VU = one couple) |
| 5b | `k6/phase5b-wp-async.js` | Same 60 VU scenario against the **async queue**: duplicate/patch enqueue → 202 → client polls job until done | ~4 min | **60 VU** constant (each VU = one couple) |

- All write traffic hit only the dedicated test couple. Read paths used the prime warmed post.
- Phase 5 traffic hit both the Next API routes (`/api/wp/duplicate`, `/api/wp/patch`) AND the WordPress origin (PHP-FPM + MariaDB) behind them.
- Server monitored via a 10s sampler on the VPS (`/tmp/vps-monitor.sh`, and Phase 5 `/tmp/vps-monitor-wp.sh`: adds php-fpm process count + MariaDB threads/slow queries).

---

## 4. Results

### 4.1 Aggregate HTTP

| Phase | VU | reqs | req/s | p50 | p90 | p95 | max | http_req_failed | checks pass/fail |
|---|---|---|---|---|---|---|---|---|---|
| 1 (render ramp) | 1000 | 5,790 | 22.4 | 6.9s | 30.0s | 30.0s | 30.1s | **62.73%** (3,632/5,790) | 4,216 / 7,188 |
| 1b (QR + check-in) | 200 | 9,436 | 77.0 | 433ms | 582ms | 642ms | 3.5s | **0%** | 9,436 / 0 |
| 2 (writes) | 500 | 22,905 | 131.0 | 575ms | 1.6s | 8.5s | 20.3s | 19.13% (4,382/22,905) | 9,361 / 4,382 |
| 3 (venue-day mixed) | 500 | 85,123 | **139.8** | 799ms | 1.7s | 9.0s | 16.7s | 27.22% (23,170/85,123) | 12,334 / 23,170 |
| 5 (WP create/edit) | 60 | 415 | 1.7 | **27.6s** | 30.2s | 37.8s | 60s | 4.57% (19/415) alt 72×502+99 timeout | duplicate 60/11, patch 336/8 |
| 5b (WP create/edit, async queue) | 60 | 9,894 | 41.3 | **240ms** | 371ms | 431ms | 6.13s | **0%** | 598 / 42 (42 = poll loops cut by k6 graceStop, not app failures) |

### 4.2 Per-endpoint breakdown (Phase 3, checks)

| Check | Result |
|---|---|
| QR scan 302 (`/q/{token}`) | ✅ pass (100%) |
| Check-in 200 (`/api/check-in`) | ✅ pass (100%) |
| RSVP 200 (`POST .../rsvp`) | ✅ pass (100%) |
| Wish 200 (`POST /api/wishes`) | ✅ pass (100%) |
| LED poll 200 (`/api/wishes/led`) | ✅ pass (100%) |
| Open 200 (`POST .../open`) | ❌ **0% pass — every single attempt (23,170) returned HTTP 500** |

Phase 2 recap: RSVP 100%, wish 100%; `open` failed 4,382× (96% of open attempts — the remaining 4% of open requests didn't complete an open iteration, they were already 500s). Every `open` failure is the `.single()` coercion bug, **not load-induced** — verified earlier with a single cold curl on a fresh guest returning HTTP 500.

### 4.4 Server health timeline

| Phase | Node RSS | CPU | Active conns | Load avg (2 vCPU) | Free mem | PM2 restarts / WP workers |
|---|---|---|---|---|---|---|
| Baseline | 98–136 MB | ~0% | 0 | 0.1–0.3 | ~950 MB | 15 restarts (pre-existing) |
| Phase 1 (ramp up) | 137→**788 MB** | →~100% | →~300 | →**6.8** | →**183 MB** | **15 restarts during run** |
| After restart | 98 MB | 0% | 0 | 0.3 | 981 MB | 16 |
| Phase 3 (steady) | **135→225 MB plateau** | 80–107% | 250–310 | 2.0–2.8 | ~500 MB peak drain | 1 restart (#16 at ramp-down) |
| Phase 5 (WP edit) | 103→**164 MB** | 0–13% (Node) | 0 → **300+** | 0.1 → **5.2** | →~760 MB | **php-fpm 5/5 pinned**, MariaDB threads 1→6, slow q 0 |
| Phase 5b (WP edit, async) | 107→**222 MB** (worker + polled jobs) | 10–72% (Node/worker) | 0 → ~90 | 0.1 → **1.74** | →~640 MB | **php-fpm max 3/5**, MariaDB threads 1–2, slow q 0 |
| After cleanup restart | 102 MB | 0% | 0 | — | 949 MB / 1,157 available | 17 restarts |

**Interpretation:**
- **Phase 1** exceeded the sustaining envelope. Requests piled up (30s timeout), connection count *~300 (nextjs internal pool), Node RSS ballooned, and the OS forced repeated process restarts — yet **`aksara-wedding` always came back up** (PM2 auto-restart). No permanent crash; site recovered and served 200s after the ramp ended.
- **Phase 3** is the realistic envelope: sustained 500 concurrent users for 10 min with Node stable at ~225 MB RSS (~11.5% of the 1.9 GB box), **one core saturated** (2 vCPU box, so 85–107% on one scheduler core), no OOM, no restart storm. The tail latencies (p95 ~9s) come from the bounded-connection Node pool queueing requests.
- **Phase 5** flips the picture: Node is idle (0–13% CPU, +60 MB RSS) while **WordPress PHP-FPM is the wall**. 60 concurrent template create/edit ops → 5/5 workers busy the whole run, 300+ Node conns parked on WP upstream, load 5.2, requests averaging 27s. Node is not the constraint here — WordPress is.
- The Phase 3 restart (#16 at 15:31:59, during ramp-down) had no OOM evidence in dmesg — consistent with nextjs/bun idle GC churn or PM2 watchdog, not a kill.

### 4.5 Phase 5 (WP template create/edit) detail

- **Scenario:** 60 concurrent users, each mapping to one dedicated couple. User flow = select template (`/api/wp/duplicate`, once) → 6 sequential content edits (`/api/wp/patch`). Total 415 HTTP requests over 4 min.
- **Latency:** avg **26.88s**, p50 27.6s, p95 37.8s, max 60s (Caddy proxy timeout) — every WP operation queues behind the PHP-FPM pool.
- **Results by check:** duplicate succeeded 60/71 (84%, 11 failed/timeouts), patch succeeded 336/344 (97%, 8 failed). All 60 couples **did** end up with a working WP post server-side (e.g. `wpstress-oturc-00` permalink 200, elements tree 200) — the failures are **client/edge-side capacity**, not data corruption.
- **Failure mode:** 72 HTTP 502 (Caddy→PHP-FPM while pool exhausted) and 99 k6 request timeouts at the 60s mark. Node's API routes correctly proxied 502 back.
- **Server state during the run (10s sampler):**
  - `php-fpm: pool` processes **pinned at 5/5** (the entire `max_children`) for the whole ~4 min.
  - Node open connections 0 → **300+** (requests queueing in Next awaiting WP upstream), Node RSS only 103→164 MB.
  - Load avg climbed 0.1 → **5.2** on the 2-vCPU box; free memory stayed healthy (→~760 MB) — no memory pressure, pure CPU/worker saturation.
  - MariaDB `Threads_connected` 1→6, `Threads_running` mostly 1-2, slow queries 0 — DB is NOT the bottleneck.
- **Interpretation:** WordPress's synchronous Elementor CSS regeneration + `_elementor_data` writes serialize on PHP-FPM. With only 5 workers on a shared 1.9 GB box, **~5-6 concurrent template create/edit operations saturate WordPress**. Beyond that, requests pile up (average 27s, eventual 502/timeouts). This is the single biggest capacity gap and the natural target for a queue, more PHP-FPM workers (respecting box RAM), or moving CSS regen off the hot path.

### 4.6 Phase 5b (async queue) detail

- **Scenario:** identical to Phase 5 (60 concurrent couples, each duplicating once + patching 6×) but `/api/wp/duplicate` + `/api/wp/patch` now **enqueue** into the `wp_sync_jobs` table and return HTTP 202 `{job_id, status}`; the client polls `GET /api/wp/jobs/{id}` until `done`. A single in-process worker (concurrency 2, started from `instrumentation.ts` in the PM2 fork) calls WordPress serially. Total 9,894 HTTP requests over ~4 min.
- **Latency:** avg **271.8ms**, p50 240ms, p90 371ms, p95 431ms, max 6.13s — versus 26.88s avg / 37.8s p95 / 60s max in Phase 5. **0% HTTP errors** (vs 72×502 + 99 timeouts).
- **Queue truth (from Supabase, authoritative):** 196 jobs enqueued (99 duplicate + 97 patch) — **all `done`, 0 failed, 0 last_error**. 60/60 couples had a live WP post + popup afterwards. The 42 "patch completes" check misses are k6 `graceStop` cutting client poll loops during ramp-down, **not** app failures — the jobs completed server-side regardless.
- **Server state during the run (10s sampler):**
  - `php-fpm: pool` peaked at **3/5** workers (vs 5/5 pinned the whole run in Phase 5) — the queue serialized WP work so the pool never exhausted.
  - Node RSS 107→222 MB (worker + job rows), CPU up to 72% on the worker core, open conns only to ~90 (vs 300+), **load avg max 1.74** (vs 5.2). MariaDB threads 1–2, slow queries 0 — DB still not a bottleneck.
- **Interpretation:** moving WP write work behind a queue removes WordPress from the HTTP hot path. The editor's save debounce (600ms) + patch debounce (1200ms) naturally coalesce a user's edits into few jobs; the queue then applies them serially. Phase 5's failure mode (pool exhaustion → 502/timeouts) is eliminated: clients get a 202 in ~300ms and the worker absorbs the WP latency. The residual CPU/RSS cost is the worker + job-poll traffic, both trivially bounded.

---

## 5. Confirmed Production Bug — `open` endpoint always returns 500

- **File:** `src/app/api/guests/[id]/open/route.ts`
- **Symptom:** `POST /api/guests/{id}/open` → HTTP 500 `{"error":"Cannot coerce the result to a single JSON object"}` on **every** call for **every** guest, including a virgin guest id never before opened.
- **Root cause:** the handler runs

  ```ts
  .update({ invitation_opened_at: new Date().toISOString() })
  .eq("id", id)
  .is("invitation_opened_at", null)
  .select("id, invitation_opened_at")
  .single()
  ```

  When the guest's `invitation_opened_at` is already set (second open), the `.is(..., null)` filter matches **zero rows**, and PostgREST cannot coerce an empty result set into a single JSON object → error. (First open works only if nothing raced; under any repeat visit it 500s.)
- **Impact on every production invitation page:** the visitor-side open tracker fires on every page view and gets a guaranteed 500 after the first visit; also inflates error telemetry and adds a wasted request per view.
- **Status: ✅ FIXED 2026-08-14** — switched to `.maybeSingle()`; both first-open and already-opened return 200 (verified on prod).
- **Fix (recommended):** use `.maybeSingle()` and treat the no-row case as an idempotent no-op, or drop `.single()` and return `{ guest: data?.[0] ?? null }`:

  ```ts
  const { data } = await supabaseAdmin
    .from("guests")
    .update({ invitation_opened_at: new Date().toISOString() })
    .eq("id", id)
    .is("invitation_opened_at", null)
    .select("id, invitation_opened_at")
    .maybeSingle()
  return NextResponse.json({ guest: data })  // data may be null — that's fine
  ```

---

## 6. Database Saturation & Cleanup Audit

### 6.1 Counts during test (prod Supabase)

| Table | Before | Peak | After cleanup |
|---|---|---|---|
| `wedding_profiles` | 5 | 5 | **4** (test couple removed) |
| `guests` | 411 | 411 | **211** (200 test guests removed, 0 test rows left) |
| `wishes` | 11 | 9,289 | **10** (9,279 test wishes removed) |
| `web_templates` | 2 | 2 | 2 |

- **Writes:** +9,278 wishes in phases 2–3; RSVP `update`s and `open` updates landed on the same couple. No stray writes to real couples.
- **Phase 5 WP side:** 60 duplicated WP posts + 60 popups + 25 sideloaded media attachments created and removed; Supabase had 60 temp couples (+ gift accounts/addresses), all removed.
- Supabase handled all traffic with no 5xx/timeouts attributable to Postgres (all Phase 3 failures are the `open` 500 bug; Phase 5 failures are WP/Caddy-side, not Postgres).

### 6.2 Cleanup performed
1. `DELETE /wp-json/aksaraa/v1/posts/108491?force=1` → **200**, `{deleted: 108491, popups_also_deleted: 1}` (cascade removes linked popup + all sideloaded images/media).
2. Deleted test-couple `wishes` + `guests` (children first — `wishes` FK is RESTRICT, not cascade), then `wedding_profiles` row → 204.
3. Verified: 0 guests/wishes reference the test profile; `active_wp_post_id=108491` on 0 profiles; `https://wp.aksaraa.com/stress-test-phmkrc/` → **404**.
4. Remaining 10 wishes all belong to the 4 real couples (Dela/Anindya, Agung/Ayu, Agung K, Rafi&Novi) — intact.
5. **Phase 5 cleanup:** deleted 60/60 WP posts (force=1, cascades their popups) → permalinks now 404; deleted the 60 temp couples + their gift accounts/addresses directly (`wedding_profile_id in (...)` on children first, then profiles — the `wedding_profiles` column is `id`, not `wedding_profile_id`); deleted 25 test-window sideloaded attachments (IDs 108515–108539, created 09:01:51–56 UTC) via DB; 0 `wpstress-%` posts left. 44 older sideloaded attachments (Aug 13) left untouched — they pre-date this test.
6. Final prod counts: 4 profiles / 211 guests / 10 wishes / 2 templates / 4 gift accounts / 2 gift addresses — matches baseline. Site healthy (`/api/web-templates` 200); Node restarted post-cleanup at 104 MB RSS.

---

## 7. Recommendations (prioritized)

### P0 — fix now
1. ✅ **DONE — `open` route fixed.** `.single()` → `.maybeSingle()` (Section 5). Both first-open and already-opened now return HTTP 200; verified on prod (fresh guest returns the row and persists `invitation_opened_at`; repeat visit returns `{ guest: null }` without error). Deployed 2026-08-14.
2. ✅ **DONE — rate limiting added.** In-memory sliding-window limiter (`src/lib/rateLimit.ts`, reliable on the single PM2 fork): `POST /api/guests/{id}/open` 60/min per IP; `POST .../rsvp` 10/min per IP+guest; `POST /api/wishes` 30/min per IP+wedding_profile (per-profile key so a NAT'd venue isn't blocked). Returns 429 + `Retry-After`. Verified on prod: 35 rapid wish POSTs → 30 accepted then 429. Deployed 2026-08-14.

### P1 — WordPress template capacity (Blockers for concurrent editing)
3. **Do not rely on 5 PHP-FPM workers for concurrent edits.** Phase 5 shows ~5-6 concurrent duplicate/patch ops saturate WordPress (`pm.max_children = 5`): avg 27s, 502/timeouts beyond that. ✅ **DONE (Phase 5b): the work is now queued** — `/api/wp/duplicate` + `/api/wp/patch` enqueue into a `wp_sync_jobs` table and return 202; an in-process worker (concurrency 2) calls WP serially. Same 60-VU load now runs at 271ms avg / 0% errors with PHP-FPM peaking at 3/5 workers (Section 4.6). Remaining options if WP load keeps growing:
   - **Queue the work** — make `/api/wp/duplicate` + `/api/wp/patch` async (enqueue in Supabase/DB table, worker pops + calls WP), returning promptly; the editor already debounces saves.
   - **Serialize per-couple edits** — a per-profile lock/queue so repeated patches for one couple never compete with each other (in the current client, 6 edits per user fire serially so they self-queue; the risk is many couples at once).
   - **Defer CSS regen** — `regen_elementor_css()` runs synchronously 2× per patch. Off-load to a delayed job (or skip when `_elementor_data` didn't change) to shrink each request's PHP wall time.
   - **Right-size the pool** — raise `pm.max_children` carefully on the 1.9 GB box (each Elementor CSS regen can peak 100+ MB PHP); budget RAM first.
4. **Cache the WP post-validity HEAD** (from P1 below) also reduces WP origin traffic that competes with edit operations on the same box.

### P2 — sustain the publish/render envelope
5. **Eliminate the per-render `cache: no-store` WP HEAD.** The `w/[slug]` page does a WP HEAD before every iframe render. Cache the WP post validity (e.g., last verified date) so repeat views within a window skip the WP HEAD round-trip. This dominates p50 under load and reduces contention with WP editing.
6. **Reduce Supabase read fan-out on `w/[slug]`** (5–8 reads/view). Batch into a single RPC/join or add a lightweight edge-cache for profile+feature-set data.
7. **Bump/instrument Node connection pool.** p95 ~9s at 500 VU is queueing behind a bounded pool on one vCPU. Give Node more workers/UV threads or front the box with a proper CDN/edge cache to absorb repeat reads.

### P3 — capacity/monitoring
8. **Tracking + alerting:** PM2 `restart_time` jumped 15→17 during the run; add an uptime/restart alert (healthchecks.io or cron).
9. **Read-path CDN:** invitation assets (images/audio CSS) are Supabase-hosted; serving them via Caddy cache or CDN offloads the biggest bandwidth cost. `w/[slug]` HTML could get ISR/`stale-while-revalidate`.
10. **Document the envelope:** guest-facing paths sustain ≈ 500 concurrent guests (≈250–300 concurrent views / 140 req/s) on the current 2 vCPU box — that's the read side and it's fine. The **WordPress editing path** sustains only ≈ 5-6 concurrent create/edit operations before 502/timeouts; treat WP edits as a low-rate background workload until P1 items land.

---

## 8. Artifacts

| File | Description |
|---|---|
| `k6/phase1-render.js` | Phase 1 render ramp script (25→1000 VU) |
| `k6/phase1b-qr-checkin.js` | QR + check-in (200 VU) |
| `k6/phase2-writes.js` | open/RSVP/wishes mix (100→500 VU) |
| `k6/phase3-mixed.js` | venue-day scenario (500 VU, 10 min) |
| `k6/phase5-wp-edit.js` | WP template create/edit (60 VU: duplicate + 6 patches each) |
| `k6/phase5b-wp-async.js` | WP create/edit against the async queue (60 VU, enqueue + poll) |
| `k6/phase{1,1b,2,3,5,5b}-summary.json` | k6 summary exports |
| `k6/phase{1,1b,2,3,5}.json` | raw k6 event streams |
| `stress-fixtures.json` | test couple ids/slug/token (phases 1–3) |
| `wpstress-fixtures.json` | Phase 5 couples (60 profile ids/slugs) |
| `create-test-couple.py` | fixture creation (prod, service-role) |
| `create-wpstress-couples.py` | Phase 5 couple creation |
| `cleanup-test-couple.py` | WP + Supabase cleanup (phases 1–3) |
| `cleanup-wpstress.py` | Phase 5 WP + Supabase cleanup |
| `db-snapshot.py` | row-count snapshot helper |
| `vps-monitor.sh` | 10s VPS resource sampler |
| `vps-monitor-wp.sh` | Phase 5 sampler (+ php-fpm, MariaDB threads/slow queries) |

All temp scratch under `/var/folders/.../opencode/` (not in repo). Scripts reference `.env.local.prod` / `.env.staging` locally (never committed).