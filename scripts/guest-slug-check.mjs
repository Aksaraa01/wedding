#!/usr/bin/env node
// Guest ?to= resolution regression check.
//
//   node --experimental-strip-types scripts/guest-slug-check.mjs
//
// Two parts:
//   1. pure assertions for normalizeGuestSlug / isValidGuestSlug /
//      isFallbackGuestSlug (no network);
//   2. when a Supabase env is sourced (prod or staging), a read-only sweep
//      proving that every stored slug still resolves through the RAW-first
//      lookup — i.e. no existing Terbatas link is shadowed by normalization.
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (any env file).

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  isValidGuestSlug,
  isFallbackGuestSlug,
  normalizeGuestSlug,
  slugifyName,
} from "../src/lib/guest-slug.ts"

let failures = 0
function eq(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? "✓" : "✗"} ${label}${ok ? "" : ` — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`)
}

console.log("\nPure slug rules")
eq("generated slug is a normalization fixed point", normalizeGuestSlug("Budi-Santoso"), "Budi-Santoso")
eq("slash becomes a dash", normalizeGuestSlug("Budi / Ani"), "Budi-Ani")
eq("double space collapses", normalizeGuestSlug("Budi  Ani"), "Budi-Ani")
eq("already-slug form unchanged", normalizeGuestSlug("Budi-Ani"), "Budi-Ani")
eq("lowercase preserved", normalizeGuestSlug("budi ani"), "budi-ani")
eq("ampersand dropped", normalizeGuestSlug("Teman & Partner"), "Teman-Partner")
eq("percent/query symbols dropped", normalizeGuestSlug("Budi % ? Ani"), "Budi-Ani")
eq("symbols only -> empty", normalizeGuestSlug(" / % "), "")
eq("legacy double dash kept by slugify", normalizeGuestSlug("Ibu--Grace-Simatupang"), "Ibu-Grace-Simatupang")
eq("80-char cap", normalizeGuestSlug("a".repeat(120)).length, 80)
eq("wildcard is not a valid slug", isValidGuestSlug("%"), false)
eq("normalized name is a valid slug", isValidGuestSlug(normalizeGuestSlug("Budi / Ani")), true)
eq("generic link slug is rejected by flexible RSVP", isFallbackGuestSlug("Teman-Partner"), true)
eq("generic link name is rejected by flexible RSVP", isFallbackGuestSlug("Teman & Partner"), true)
eq("a normal guest is not the fallback", isFallbackGuestSlug("Budi-Ani"), false)
eq("slugify input → slug invariant", slugifyName("Budi / Ani"), "Budi-Ani")

// Every stored slug must be matched by step 1 (raw equality); normalization is
// only a fallback, so legacy non-canonical slugs stay reachable.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
function loadEnv() {
  for (const file of [".env.local.prod", ".env.staging", ".env.local"]) {
    try {
      const text = readFileSync(join(repoRoot, file), "utf8")
      const env = {}
      for (const line of text.split("\n")) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue
        const i = line.indexOf("=")
        env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
      if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        return { env, file }
      }
    } catch {
      // missing file — try the next one
    }
  }
  return null
}

const loaded = loadEnv()
if (!loaded) {
  console.log("\n⚠ No Supabase env found (.env.local.prod / .env.staging / .env.local) — skipping live slug sweep")
} else {
  const url = loaded.env.NEXT_PUBLIC_SUPABASE_URL
  const key = loaded.env.SUPABASE_SERVICE_ROLE_KEY
  const headers = { apikey: key, Authorization: `Bearer ${key}` }
  console.log(`\nLive sweep against ${url} (${loaded.file})`)

  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(
      `${url}/rest/v1/guests?select=id,slug,wedding_profile_id&slug=not.is.null&limit=1000&offset=${offset}`,
      { headers }
    )
    if (!res.ok) {
      console.log(`✗ guest read failed: HTTP ${res.status}`)
      failures += 1
      break
    }
    const page = await res.json()
    rows.push(...page)
    if (page.length < 1000) break
  }

  const nonCanonical = rows.filter((r) => r.slug !== normalizeGuestSlug(r.slug))
  const overlong = rows.filter((r) => r.slug.length > 80)
  eq("stored slugs >= 1", rows.length > 0, true)
  console.log(`  ${rows.length} stored slugs, ${nonCanonical.length} non-canonical (raw-first keeps them reachable), ${overlong.length} over 80 chars`)

  // Sample rows through the same candidates the resolver uses, in order.
  const sample = [...nonCanonical, ...overlong].slice(0, 25)
  for (const row of sample) {
    const step1 = await fetch(
      `${url}/rest/v1/guests?select=id&wedding_profile_id=eq.${row.wedding_profile_id}&slug=eq.${encodeURIComponent(row.slug)}&limit=1`,
      { headers }
    ).then((r) => r.json())
    if (!Array.isArray(step1) || step1[0]?.id !== row.id) {
      console.log(`✗ legacy slug no longer resolves on raw match: ${row.slug}`)
      failures += 1
    }
  }
  if (sample.length > 0 && failures === 0) {
    console.log(`  ✓ ${sample.length} legacy slugs still resolve on the raw-first step`)
  }

  // A display name typed with slashes must normalize back to the same slug —
  // excluding over-80 slugs, which are intentionally only reachable raw-first.
  const canonical = rows.filter((r) => r.slug.length <= 80 && r.slug === normalizeGuestSlug(r.slug))
  const roundTrip = []
  for (const row of canonical.slice(0, 50)) {
    const typed = row.slug.replace(/-/g, " / ")
    if (normalizeGuestSlug(typed) !== row.slug) roundTrip.push({ typed, got: normalizeGuestSlug(typed), want: row.slug })
  }
  eq("typed name variants normalize back to their stored slug", roundTrip.length, 0)
  if (roundTrip.length > 0) console.log(`  e.g. ${JSON.stringify(roundTrip[0])}`)
}

console.log(failures === 0 ? "\nAll guest-slug checks passed" : `\n${failures} guest-slug check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
