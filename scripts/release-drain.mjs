#!/usr/bin/env node
/**
 * Explicitly drain the WP sync queue. NOT part of a normal deploy.
 *
 *   set -a; source .env.build.prod; source .env.runtime.prod; set +a
 *   npm run release:drain -- --env prod --dry-run
 *   npm run release:drain -- --env prod --profile <wedding_profile_id>
 *
 * A deploy never deletes queue rows: `queued` work is somebody's template change
 * and `processing` rows are reclaimed by the worker on boot. This script exists
 * for the deliberate case — a poisoned job that would fail forever, or a
 * rehearsal that must start from an empty queue.
 *
 * Safety:
 *   - refuses when NEXT_PUBLIC_SUPABASE_URL is not the requested environment
 *     (draining the wrong project is unrecoverable);
 *   - prints counts first, and does nothing without --apply;
 *   - marks rows `failed` with an explanatory error instead of deleting them,
 *     so the dashboard can tell the couple why;
 *   - on prod, requires --all or --profile (never drains every couple by
 *     accident).
 */
import { createClient } from "@supabase/supabase-js"
import { CONTRACT, ENV_NAMES } from "../env/contract.mjs"

const args = process.argv.slice(2)
const envIdx = args.indexOf("--env")
const env = envIdx >= 0 ? args[envIdx + 1] : ""
const profileIdx = args.indexOf("--profile")
const profile = profileIdx >= 0 ? args[profileIdx + 1] : ""
const apply = args.includes("--apply")
const all = args.includes("--all")

const fail = (msg) => {
  console.error(`\n✗ DRAIN REFUSED\n  ${msg}\n`)
  process.exit(1)
}

if (!CONTRACT[env]) fail(`--env must be one of: ${ENV_NAMES.join(", ")}`)
if (!apply) console.log("(dry run — pass --apply to change anything)\n")

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
if (!url.includes(`${CONTRACT[env].ref}.supabase.co`)) {
  fail(
    `NEXT_PUBLIC_SUPABASE_URL is "${url || "(unset)"}", which is not the ${env} project ` +
      `(${CONTRACT[env].ref}). Source .env.build.${env} first.`,
  )
}
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
if (!key) fail("SUPABASE_SERVICE_ROLE_KEY is not set (source .env.runtime.<env>)")

if (env === "prod" && !profile && !all) {
  fail(
    "refusing to drain the whole prod queue.\n" +
      "  Pass --profile <wedding_profile_id> (test couple) or --all if that is really intended.",
  )
}

const db = createClient(url, key, { auth: { persistSession: false } })

let q = db.from("wp_sync_jobs").select("id, status, kind, wedding_profile_id", { count: "exact" })
if (profile) q = q.eq("wedding_profile_id", profile)
const { data: rows, error } = await q
if (error) fail(`could not read wp_sync_jobs: ${error.message}`)

const byStatus = {}
for (const r of rows || []) byStatus[r.status] = (byStatus[r.status] || 0) + 1
const byKind = {}
for (const r of rows || []) byKind[r.kind] = (byKind[r.kind] || 0) + 1

console.log(`env        ${env} (${CONTRACT[env].ref})`)
console.log(`scope      ${profile ? `profile ${profile}` : "ALL profiles"}`)
console.log(`rows       ${rows?.length ?? 0}`)
console.log(`status     ${JSON.stringify(byStatus)}`)
console.log(`kind       ${JSON.stringify(byKind)}`)

const pending = (rows || []).filter((r) => r.status === "queued")
if (pending.length === 0) {
  console.log("\nnothing queued — nothing to drain.")
  process.exit(0)
}
if (!apply) {
  console.log(`\nwould mark ${pending.length} queued job(s) as failed. Re-run with --apply.`)
  process.exit(0)
}

const reason = `drained manually at ${new Date().toISOString()} (${env})`
let del = db
  .from("wp_sync_jobs")
  .update({ status: "failed", error: reason, updated_at: new Date().toISOString() })
  .eq("status", "queued")
if (profile) del = del.eq("wedding_profile_id", profile)

const { data: updated, error: upErr } = await del.select("id")
if (upErr) fail(`update failed: ${upErr.message}`)
console.log(`\n✓ marked ${updated?.length ?? 0} queued job(s) as failed: "${reason}"`)
