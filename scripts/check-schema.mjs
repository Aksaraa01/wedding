#!/usr/bin/env node
/**
 * Refuse to build/deploy when the target database is missing a migration.
 *
 *   node scripts/check-schema.mjs --env prod
 *   node scripts/check-schema.mjs --env staging
 *
 * Why: on 2026-11-23 prod was missing `20261121000001_wedding_profile_language`
 * while staging had it. The editor's API selected `wedding_profiles.language`,
 * PostgREST returned 42703, and the route surfaced it as "Profile not found" —
 * a broken editor that every smoke test passed. The deploy's own migration
 * assertion only warned because the host has no DB password.
 *
 * Connection details come from env/contract.mjs (ref + dbHost). The password is
 * read from SUPABASE_DB_PASSWORD, falling back to .env.runtime.<env> and the
 * legacy local env files. Missing credentials are fatal: a gate that silently
 * skips is the bug this script exists to prevent.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { Client } from "pg"
import { CONTRACT } from "../env/contract.mjs"

const args = process.argv.slice(2)
const envIdx = args.indexOf("--env")
const env = envIdx >= 0 ? args[envIdx + 1] : "prod"
const fail = (msg) => {
  console.error(`\n✗ SCHEMA CHECK FAILED\n  ${msg}\n`)
  process.exit(1)
}
const ok = (msg) => console.log(`✓ ${msg}`)

const contract = CONTRACT[env]
if (!contract) fail(`--env must be one of: ${Object.keys(CONTRACT).join(", ")}`)

// Load env files only for keys the shell does not already provide.
function loadEnv(file) {
  if (!existsSync(file)) return
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const i = line.indexOf("=")
    if (i < 0) continue
    const key = line.slice(0, i).trim()
    let value = line.slice(i + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnv(`.env.runtime.${env}`)
loadEnv(env === "prod" ? ".env.local.prod" : ".env.staging")

const password = (process.env.SUPABASE_DB_PASSWORD || "").trim()
if (!password) {
  fail(
    `SUPABASE_DB_PASSWORD is not set for ${env}.\n` +
      `  Put it in .env.runtime.${env} (chmod 600) or export it for this command.\n` +
      `  Rotate with: PATCH https://api.supabase.com/v1/projects/${contract.ref}/database/password`,
  )
}

const repoVersions = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.split("_")[0])
  .filter((v) => /^\d+$/.test(v))
  .sort()
if (!repoVersions.length) fail("no migrations found in supabase/migrations")

const client = new Client({
  host: contract.dbHost,
  port: 6543,
  user: `postgres.${contract.ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

try {
  await client.connect()
} catch (e) {
  fail(
    `could not connect to ${contract.dbHost} as postgres.${contract.ref}: ${e.message}\n` +
      `  Check .env.runtime.${env} (password) and env/contract.mjs (dbHost).`,
  )
}

let applied
try {
  const res = await client.query("select version from supabase_migrations.schema_migrations")
  applied = new Set(res.rows.map((r) => String(r.version)))
} catch (e) {
  fail(`could not read supabase_migrations.schema_migrations: ${e.message}`)
} finally {
  await client.end()
}

const missing = repoVersions.filter((v) => !applied.has(v))
const extra = [...applied].filter((v) => !repoVersions.includes(v)).sort()

if (missing.length) {
  fail(
    `${env} is missing ${missing.length} migration(s):\n` +
      `    ${missing.join("\n    ")}\n` +
      `  Apply them in order, then record each version:\n` +
      `    psql "$SUPABASE_DB_URL" -f supabase/migrations/<file>.sql\n` +
      `    npx supabase migration repair --status applied <version> --linked\n` +
      `  Refusing to build: code that selects a missing column breaks at runtime\n` +
      `  while every template smoke test still passes.`,
  )
}
if (extra.length) {
  console.warn(`! ${env} has ${extra.length} version(s) not in this checkout: ${extra.join(", ")}`)
}

ok(`${env}: all ${repoVersions.length} migrations applied (${contract.ref})`)
