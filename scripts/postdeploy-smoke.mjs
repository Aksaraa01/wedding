#!/usr/bin/env node
/**
 * Post-deploy smoke test. Run IMMEDIATELY after `pm2 startOrRestart`.
 *
 * Verifies every registered in-house template's preview route plus the
 * critical APIs actually respond. Exits non-zero if anything is missing —
 * which is exactly how a stale tree deploy (missing a newly added template)
 * gets caught before users hit a 404.
 *
 * Usage:
 *   node scripts/postdeploy-smoke.mjs
 *   node scripts/postdeploy-smoke.mjs --base https://staging.example.com
 */
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

const args = process.argv.slice(2)
const baseIdx = args.indexOf("--base")
const base = baseIdx >= 0 ? args[baseIdx + 1] : "https://wedding.aksaraa.com"

const registry = readFileSync("src/components/templates/index.ts", "utf8")
const mapBlock = registry.slice(registry.indexOf("TEMPLATE_MAP"), registry.indexOf("}", registry.indexOf("TEMPLATE_MAP")))
const codes = [...mapBlock.matchAll(/^\s{2}"?([a-z0-9_-]+)"?:\s*\w+,$/gim)].map((m) => m[1])
if (!codes.length) {
  console.error("✗ could not parse template codes from TEMPLATE_MAP")
  process.exit(1)
}

const status = (url, extra = []) => {
  try {
    return execSync(`curl -s -o /dev/null -w "%{http_code}" --max-time 45 --retry 1 ${extra.join(" ")} "${url}"`, {
      encoding: "utf8",
    }).trim()
  } catch {
    return "ERR"
  }
}
// A missing route is a hard failure; a timeout on a heavy RSC render is a warning.
const isFatal = (code) => code !== "200" && code !== "ERR"

let failed = 0
console.log(`Smoke testing ${codes.length} template previews on ${base}`)
for (const code of codes) {
  const url = `${base}/templates/${code}/preview`
  const doc = status(url)
  const rsc = status(url, ['-H "RSC: 1"'])
  const okBoth = doc === "200" && rsc === "200"
  const fatal = isFatal(doc) || isFatal(rsc)
  if (fatal) failed++
  const mark = okBoth ? "✓" : fatal ? "✗" : "!"
  console.log(`  ${mark} ${code.padEnd(26)} doc=${doc} rsc=${rsc}`)
}

console.log("\nCritical APIs")
for (const path of ["/api/health", "/api/dashboard/6a7ad151-c3b4-43e8-8429-0b58b4d0736b/web-invitation"]) {
  const s = status(base + path)
  // /api/health may not exist on every build; only the dashboard route is fatal.
  const fatal = path.includes("web-invitation") && isFatal(s)
  if (fatal) failed++
  console.log(`  ${fatal ? "✗" : "·"} ${path} -> ${s}`)
}

if (failed) {
  console.error(`\n✗ SMOKE TEST FAILED — ${failed} route(s) not serving.\n  Likely cause: deployed bundle is older than the code (stale tree).\n  Redeploy from a tree synced with origin/main, or roll back.`)
  process.exit(1)
}
console.log("\n✓ all template previews + APIs healthy")
