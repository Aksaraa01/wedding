#!/usr/bin/env node
/**
 * Pre-deploy guard. Run AFTER `npm run build`, BEFORE any rsync.
 *
 * Fails loudly when the build is not safe to ship:
 *  1. working tree is behind origin/main (the exact cause of the adat-jawa-2 wipe:
 *     a stale tree deployed over a newer build),
 *  2. NEXT_PUBLIC_* env baked into the bundle points at the wrong Supabase project,
 *  3. a registered in-house template is missing from the built bundle.
 *
 * Usage:
 *   node scripts/predeploy-guard.mjs                 # prod (default)
 *   node scripts/predeploy-guard.mjs --ref jclolnjkjhyjilvymagr   # staging
 *   node scripts/predeploy-guard.mjs --allow-stale   # skip the git check
 */
import { execSync } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"

const args = process.argv.slice(2)
const allowStale = args.includes("--allow-stale")
const refIdx = args.indexOf("--ref")
const expectRef = refIdx >= 0 ? args[refIdx + 1] : "ylmfgorryxzpdckkebnr"

const fail = (msg) => {
  console.error(`\n✗ PREDEPLOY GUARD FAILED\n  ${msg}\n`)
  process.exit(1)
}
const ok = (msg) => console.log(`✓ ${msg}`)

// ---------- 1. git must not be behind origin/main ----------
if (!allowStale) {
  try {
    execSync("git fetch origin --quiet", { stdio: "ignore", env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" } })
    const behind = execSync("git rev-list --count HEAD..origin/main", {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    }).trim()
    if (Number(behind) > 0) {
      fail(
        `local HEAD is ${behind} commit(s) behind origin/main.\n` +
          `  A deploy from this tree would overwrite newer work (this is what wiped adat-jawa-2).\n` +
          `  Run: git pull --rebase origin main   (or pass --allow-stale if intentional)`,
      )
    }
    const head = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    }).trim()
    ok(`tree in sync with origin/main (HEAD ${head})`)
  } catch (e) {
    if (String(e.message).includes("PREDEPLOY")) throw e
    console.warn("! could not verify git sync (git unavailable) — continuing")
  }
}

// ---------- 2. baked Supabase env ----------
const chunkDir = ".next/standalone/.next/server/chunks"
if (!existsSync(chunkDir)) fail("no .next/standalone build found — run `npm run build` first")

let baked = ""
try {
  baked = execSync(`grep -rho "127\\.0\\.0\\.1:54321\\|${expectRef}\\.supabase\\.co\\|supabase-demo" ${chunkDir} || true`, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
} catch {
  /* grep exits 1 when nothing matched */
}
if (baked.includes("127.0.0.1:54321") || baked.includes("supabase-demo")) {
  fail(
    "bundle contains LOCAL Supabase credentials (127.0.0.1:54321 / supabase-demo).\n" +
      "  Rebuild with the right env sourced:  set -a; source .env.local.prod; set +a; npm run build",
  )
}
if (!baked.includes(`${expectRef}.supabase.co`)) {
  fail(`bundle does not reference ${expectRef}.supabase.co — wrong env was baked.`)
}
ok(`baked env points at ${expectRef}.supabase.co`)

// ---------- 3. every registered template must exist in the bundle ----------
const registry = readFileSync("src/components/templates/index.ts", "utf8")
const mapBlock = registry.slice(registry.indexOf("TEMPLATE_MAP"), registry.indexOf("}", registry.indexOf("TEMPLATE_MAP")))
const codes = [...mapBlock.matchAll(/^\s{2}"?([a-z0-9_-]+)"?:\s*\w+,$/gim)].map((m) => m[1])
if (codes.length < 5) fail(`could not parse template codes from TEMPLATE_MAP (found ${codes.length})`)

const bundleText = execSync(`grep -rho '"${codes.join('"\\|"')}"' ${chunkDir} 2>/dev/null | sort -u || true`, {
  encoding: "utf8",
  maxBuffer: 128 * 1024 * 1024,
})
const missing = codes.filter((c) => !bundleText.includes(`"${c}"`))
if (missing.length) {
  fail(`template code(s) registered but missing from the bundle: ${missing.join(", ")}`)
}
ok(`all ${codes.length} registered templates present in bundle`)

const buildId = readFileSync(".next/standalone/.next/BUILD_ID", "utf8").trim()
ok(`BUILD_ID ${buildId} — safe to rsync`)
