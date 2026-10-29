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
  guestToFromParams,
  isValidGuestSlug,
  isFallbackGuestSlug,
  normalizeGuestSlug,
  prettifyGuestSlug,
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
eq("slash becomes the and-join", normalizeGuestSlug("Budi / Ani"), "Budi-&-Ani")
eq("plus becomes the and-join", normalizeGuestSlug("Budi + Ani"), "Budi-&-Ani")
eq("ampersand is preserved", normalizeGuestSlug("Teman & Partner"), "Teman-&-Partner")
eq("tight ampersand is spaced", normalizeGuestSlug("Budi&Ani"), "Budi-&-Ani")
eq("and-symbol runs collapse", normalizeGuestSlug("Budi &//+& Ani"), "Budi-&-Ani")
eq("trailing ampersand trimmed", normalizeGuestSlug("Budi &"), "Budi")
eq("double space collapses", normalizeGuestSlug("Budi  Ani"), "Budi-Ani")
eq("already-slug form unchanged", normalizeGuestSlug("Budi-Ani"), "Budi-Ani")
eq("and-join is a fixed point", normalizeGuestSlug("Budi-&-Ani"), "Budi-&-Ani")
eq("lowercase preserved", normalizeGuestSlug("budi ani"), "budi-ani")
eq("percent/query symbols dropped", normalizeGuestSlug("Budi % ? Ani"), "Budi-Ani")
eq("symbols only -> empty", normalizeGuestSlug(" / % "), "")
eq("legacy double dash kept by slugify", normalizeGuestSlug("Ibu--Grace-Simatupang"), "Ibu-Grace-Simatupang")
eq("80-char cap", normalizeGuestSlug("a".repeat(120)).length, 80)
eq("80-char cap never ends on a separator", normalizeGuestSlug("a".repeat(79) + " & b"), "a".repeat(79))
eq("prettified and-join round-trips", prettifyGuestSlug(normalizeGuestSlug("Budi & Ani")), "Budi & Ani")
eq("encoded link keeps the and-join", encodeURIComponent(normalizeGuestSlug("Budi & Ani")), "Budi-%26-Ani")
eq("wildcard is not a valid slug", isValidGuestSlug("%"), false)
eq("bare ampersand is not a valid slug", isValidGuestSlug("&"), false)
eq("bare separators are not a valid slug", isValidGuestSlug("-"), false)
eq("and-join is a valid slug", isValidGuestSlug("Budi-&-Ani"), true)
eq("normalized name is a valid slug", isValidGuestSlug(normalizeGuestSlug("Budi / Ani")), true)
eq("generic link slug is rejected by flexible RSVP", isFallbackGuestSlug("Teman-Partner"), true)
eq("generic link name is rejected by flexible RSVP", isFallbackGuestSlug("Teman & Partner"), true)
eq("and-join generic link is rejected too", isFallbackGuestSlug("Teman-&-Partner"), true)
eq("a normal guest is not the fallback", isFallbackGuestSlug("Budi-Ani"), false)
eq("slugify input → slug invariant", slugifyName("Budi / Ani"), "Budi-&-Ani")
eq("pre-change slug stays reachable via the legacy candidate", normalizeGuestSlug("Budi & Ani".replace(/[\/+&]+/g, " ")), "Budi-Ani")

console.log("\n?to= fragment repair")
eq("raw & fragment is rejoined", guestToFromParams({ to: "Sindy Sihombing", "/Partner": "" }), "Sindy Sihombing&/Partner")
eq("rejoined name normalizes with the partner", normalizeGuestSlug(guestToFromParams({ to: "Sindy Sihombing", "/Partner": "" })), "Sindy-Sihombing-&-Partner")
eq("several fragments keep their order", guestToFromParams({ to: "Budi", " Ani": "", "/ Citra": "" }), "Budi& Ani&/ Citra")
eq("no fragment -> unchanged", guestToFromParams({ to: "Budi-Ani" }), "Budi-Ani")
eq("empty fragment dropped", guestToFromParams({ to: "Budi", "": "" }), "Budi")
eq("real params stay out of the name", guestToFromParams({ to: "Budi", qr_token: "abc" }), "Budi")
eq("empty known params stay out", guestToFromParams({ to: "Budi", qr_token: "", utm_source: "" }), "Budi")
eq("array value takes the first", guestToFromParams({ to: ["Budi", "Ani"] }), "Budi")
eq("missing ?to stays empty", guestToFromParams({ qr_token: "abc" }), "")

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

  // A display name typed with the "and" spellings must normalize back to the
  // same slug — only slugs carrying the "-&-" join have an invertible form;
  // plain hyphen slugs stay reachable through the raw-first step.
  const canonical = rows.filter(
    (r) => r.slug.length <= 80 && r.slug.includes("-&-") && r.slug === normalizeGuestSlug(r.slug)
  )
  const roundTrip = []
  for (const row of canonical.slice(0, 50)) {
    const typed = row.slug.replace(/-&-/g, " & ")
    if (normalizeGuestSlug(typed) !== row.slug) roundTrip.push({ typed, got: normalizeGuestSlug(typed), want: row.slug })
  }
  eq("typed and-join variants normalize back to their stored slug", roundTrip.length, 0)
  if (roundTrip.length > 0) console.log(`  e.g. ${JSON.stringify(roundTrip[0])}`)
}

console.log(failures === 0 ? "\nAll guest-slug checks passed" : `\n${failures} guest-slug check(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
