#!/usr/bin/env node
/**
 * Build for one environment, with the environment proven before and after.
 *
 *   set -a; source .env.build.prod; set +a
 *   npm run build:env -- --env prod
 *
 * Why this exists: `next build` also loads `.env.local`, and the repo's
 * `.env.local` is the *staging* project. A prod build that forgets one variable
 * silently inherits staging. This script refuses to build unless the environment
 * matches `env/contract.mjs`, then bakes the identity into the bundle
 * (`RELEASE.json`) so the deploy can prove which tree/env is live.
 *
 * Refuses: missing/mismatched public keys, forbidden staging values, unknown
 * NEXT_PUBLIC_* variables, a dirty working tree.
 */
import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { CONTRACT, ENV_NAMES } from "../env/contract.mjs"

const gitEnv = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" }

function fail(msg) {
  console.error(`\n✗ BUILD ENV CHECK FAILED\n  ${msg}\n`)
  process.exit(1)
}
function ok(msg) {
  console.log(`✓ ${msg}`)
}

const args = process.argv.slice(2)
const envIdx = args.indexOf("--env")
const target = envIdx >= 0 ? args[envIdx + 1] : ""
if (!CONTRACT[target]) {
  fail(`--env must be one of: ${ENV_NAMES.join(", ")}`)
}
const contract = CONTRACT[target]

// ---------- 0. load the environment files this repo defines ----------
// `build:env` is the only supported build path, so it must not depend on the
// operator remembering to `source` anything. Values already in the shell win
// (CI secrets), missing keys come from .env.build.<env> then .env.runtime.<env>.
// This is also what makes SUPABASE_SERVICE_ROLE_KEY available for the
// module-eval `createClient()` in src/lib/supabase.ts.
function loadEnvFile(file) {
  if (!existsSync(file)) return 0
  let n = 0
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
    if (process.env[key] === undefined) {
      process.env[key] = value
      n++
    }
  }
  return n
}
const loadedBuild = loadEnvFile(`.env.build.${target}`)
const loadedRuntime = loadEnvFile(`.env.runtime.${target}`)
ok(`env files: .env.build.${target} (${loadedBuild}) + .env.runtime.${target} (${loadedRuntime})`)

// ---------- 1. required public keys must match the contract ----------
for (const [key, expected] of Object.entries(contract.buildPublic)) {
  const actual = (process.env[key] || "").trim()
  if (!actual) fail(`${key} is not set for ${target}`)
  const matches = expected instanceof RegExp ? expected.test(actual) : actual === expected
  if (!matches) fail(`${key}="${actual}" does not match the ${target} contract (expected ${expected})`)
}
ok(`${Object.keys(contract.buildPublic).length} public keys match the ${target} contract`)

// ---------- 2. forbidden (other-environment) values ----------
for (const [key, bad] of Object.entries(contract.forbiddenPublic || {})) {
  if ((process.env[key] || "").trim() === bad) {
    fail(`${key}="${bad}" is forbidden for ${target} — you are probably building with the other env sourced`)
  }
}
ok("no forbidden environment values")

// ---------- 3. no unknown NEXT_PUBLIC_* (catches a leftover `source .env.staging`) ----------
const known = new Set([...Object.keys(contract.buildPublic), ...(contract.optionalPublic || [])])
const unknown = Object.keys(process.env)
  .filter((k) => k.startsWith("NEXT_PUBLIC_") && !known.has(k))
  .sort()
if (unknown.length) {
  fail(
    `unknown NEXT_PUBLIC_* in this shell: ${unknown.join(", ")}\n` +
      `  Declare them in env/contract.mjs (buildPublic/optionalPublic) or unset them.\n` +
      `  This is how staging values leak into a prod build.`,
  )
}
ok("no unknown NEXT_PUBLIC_* variables")

// ---------- 3b. the anon key must belong to this environment ----------
// The project URL is checkable against the contract, but it also appears as a
// hardcoded literal in src/lib/assets.ts, so a URL alone cannot prove which
// credentials were baked. The key itself appears nowhere in source.
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
if (!anonKey) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty — the fingerprint would be meaningless")
const anonKeySha256 = createHash("sha256").update(anonKey).digest("hex")
if (contract.anonKeySha256 && anonKeySha256 !== contract.anonKeySha256) {
  fail(
    `NEXT_PUBLIC_SUPABASE_ANON_KEY is not the ${target} key\n` +
      `  expected sha256 ${contract.anonKeySha256.slice(0, 12)}…, got ${anonKeySha256.slice(0, 12)}…\n` +
      `  You are building with the other environment's credentials.`,
  )
}
ok(`anon key is the ${target} key (${anonKeySha256.slice(0, 12)}…)`)

// ---------- 4. the tree must be committed ----------
// Same allowlist as the deploy guard: build noise and docs never reach the bundle.
const DIRTY_ALLOWLIST = [/^tsconfig\.tsbuildinfo$/, /\.log$/, /^docs\//, /(^|\/)\.DS_Store$/]
const dirtyRaw = execSync("git status --porcelain --untracked-files=all", { encoding: "utf8", env: gitEnv }).trim()
const dirty = dirtyRaw
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.replace(/^[A-Z?!]{1,2}\s+/, "").trim())
  .filter((p) => p && !DIRTY_ALLOWLIST.some((re) => re.test(p)))
if (dirty.length) fail(`working tree is dirty — commit first:\n${dirty.map((p) => `    ${p}`).join("\n")}`)
const commit = execSync("git rev-parse HEAD", { encoding: "utf8", env: gitEnv }).trim()
const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8", env: gitEnv }).trim()
ok(`clean tree at ${commit.slice(0, 7)} (${branch})`)

// ---------- 4b. .env.local is a staging footgun ----------
// Next loads .env.local for production builds too. In this repo it holds staging
// credentials. A clean worktree has no gitignored files, so the safest rule is:
// build only from a worktree that has no .env.local. Allow an explicit override
// for local debugging, never for deploy builds.
if (existsSync(".env.local") && !args.includes("--allow-env-local")) {
  fail(
    ".env.local exists in this tree. Next loads it during `next build`, which is how staging values\n" +
      "  leaked into prod builds. Build from a clean worktree, or move it to .env.development.local.\n" +
      "  (Emergency debug only: --allow-env-local)",
  )
}
if (existsSync(".env.local")) console.warn("! --allow-env-local: .env.local may override your build env")

// ---------- 5. build ----------
console.log(`\n▸ next build (${target})\n`)
execSync("npx next build", { stdio: "inherit" })

const buildIdPath = ".next/standalone/.next/BUILD_ID"
let buildId = ""
try {
  buildId = readFileSync(buildIdPath, "utf8").trim()
} catch {
  fail(`no ${buildIdPath} after the build — is \`output: "standalone"\` still set?`)
}

// ---------- 6. bake the identity into the bundle ----------
const migrations = readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.split("_")[0])
  .filter((v) => /^\d+$/.test(v))
  .sort()
const dupVersions = migrations.filter((v, i) => migrations.indexOf(v) !== i)
if (dupVersions.length) fail(`duplicate migration versions: ${[...new Set(dupVersions)].join(", ")}`)

const manifest = {
  env: target,
  commit,
  short: commit.slice(0, 7),
  branch,
  dirty: false,
  builtAt: new Date().toISOString(),
  buildId,
  supabaseRef: contract.ref,
  // The fingerprint the guard checks. The anon key appears nowhere in source, so
  // a hardcoded URL literal cannot satisfy this check.
  anonKeySha256,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "").trim(),
  coupleMode: (process.env.NEXT_PUBLIC_COUPLE_URL_MODE || "").trim(),
  contractHash: createHash("sha256").update(JSON.stringify(contract)).digest("hex"),
  migrations,
}

const write = (path, body) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(body, null, 2) + "\n")
}
write(".next/build-env.json", manifest)
write(join(".next/standalone", "RELEASE.json"), manifest)

ok(`BUILD_ID ${buildId}`)
ok(`identity: ${target} @ ${manifest.short} (anon ${manifest.anonKeySha256.slice(0, 12)}…)`)
console.log("\n✓ build is tagged for " + target + " — deploy it with the matching --target\n")
