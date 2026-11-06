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
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"

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
  } catch (e) {
    // curl exits non-zero when it cannot complete the request at all. Keep the
    // exit code: "site unreachable" (DNS/TCP/TLS) must fail the deploy, while a
    // slow heavy render (exit 28, timeout) stays a warning.
    return `ERR:${e?.status ?? "?"}`
  }
}
// curl exit codes that mean the site is not serving: 6 resolve, 7 connect,
// 35 TLS handshake, 51 peer cert, 60 cert verify (e.g. an expired certificate).
const HARD_NET_CODES = new Set([6, 7, 35, 51, 60])
// A missing route is a hard failure; a timeout on a heavy RSC render is a warning.
const isFatal = (code) => {
  if (code === "200") return false
  if (code.startsWith("ERR:")) return HARD_NET_CODES.has(Number(code.slice(4)))
  return true
}

let failed = 0
console.log(`Smoke testing ${codes.length} template previews on ${base}`)
for (const code of codes) {
  const url = `${base}/templates/${code}/preview`
  const doc = status(url)
  // -L: Next 16.4 canonicalises RSC requests by answering 307 -> ?_rsc and
  // serving the flight payload there (the client router follows it). Without
  // -L every preview "failed" on a redirect that real navigation handles.
  const rsc = status(url, ['-L', '-H "RSC: 1"'])
  const okBoth = doc === "200" && rsc === "200"
  const fatal = isFatal(doc) || isFatal(rsc)
  if (fatal) failed++
  const mark = okBoth ? "✓" : fatal ? "✗" : "!"
  console.log(`  ${mark} ${code.padEnd(26)} doc=${doc} rsc=${rsc}`)
}

console.log("\nCritical APIs")
const health = status(base + "/api/health")
console.log(`  · /api/health -> ${health} (not fatal; may not exist on every build)`)

// The dashboard editor API is session-gated. 401 is the healthy answer here:
// a 200 would mean the route is open again to anyone holding a profile UUID.
const editorApi = status(`${base}/api/dashboard/6a7ad151-c3b4-43e8-8429-0b58b4d0736b/web-invitation`)
const editorOk = editorApi === "401"
if (!editorOk) failed++
console.log(`  ${editorOk ? "·" : "✗"} web-invitation (no session) -> ${editorApi} ${editorOk ? "= gate holds" : "= EXPECTED 401 (route is unauthenticated!)"}`)

// ---------------------------------------------------------------------------
// Guest asset host. Couple hosts are DNS-only and 302 /fonts /templates /images
// to cdn.aksaraa.com, which is a Caddy file_server over .next/standalone/public.
// If that hostname is repointed (it was bound to an R2 bucket on 2026-11-03,
// serving R2's 404 page with no CORS header), every in-house template loses its
// fonts — and nobody notices for days because browsers (7d) and the edge cache
// (1y) keep serving the previous copies. Probe the ORIGIN path with a unique
// query so a warm edge cache cannot hide a broken origin.
console.log("\nGuest asset host (cdn.aksaraa.com)")
const cdnBase = "https://cdn.aksaraa.com"
const cdnProbe = (path) => {
  const url = `${cdnBase}${path}${path.includes("?") ? "&" : "?"}smoke=${Date.now()}`
  try {
    const out = execSync(`curl -sS -D - -o /dev/null -w "STATUS:%{http_code}" --max-time 30 "${url}"`, { encoding: "utf8" })
    const status = out.match(/STATUS:(\d+|000)/)?.[1] ?? "?"
    const header = (name) => (out.match(new RegExp(`^${name}:\\s*(.+)$`, "im"))?.[1] ?? "").trim()
    return { status, type: header("content-type"), acao: header("access-control-allow-origin") }
  } catch (e) {
    return { status: `ERR:${e?.status ?? "?"}`, type: "", acao: "" }
  }
}
// Use a template asset that exists in THIS build rather than a hard-coded name,
// so renaming a template does not fail the deploy for the wrong reason.
const firstTemplateAsset = (() => {
  const root = "public/templates"
  if (!existsSync(root)) return null
  for (const dir of readdirSync(root).sort()) {
    const abs = `${root}/${dir}`
    if (!statSync(abs).isDirectory()) continue
    const file = readdirSync(abs).find((f) => /\.(webp|jpe?g|png)$/i.test(f))
    if (file) return `/templates/${dir}/${file}`
  }
  return null
})()
const cdnChecks = [
  { label: "font", path: "/fonts/poppins-400.woff2", type: "font/" },
  ...(firstTemplateAsset ? [{ label: "template art", path: firstTemplateAsset, type: "image/" }] : []),
]
for (const check of cdnChecks) {
  const r = cdnProbe(check.path)
  // The R2 404 page is text/html and carries no ACAO — report that shape
  // explicitly instead of a bare "expected 200".
  const looksLikeR2 = r.type.startsWith("text/html")
  const ok = r.status === "200" && r.type.startsWith(check.type) && r.acao === "*"
  if (!ok) failed++
  console.log(
    `  ${ok ? "·" : "✗"} ${check.label.padEnd(12)} ${check.path} -> ${r.status} ${r.type || "(no type)"} ACAO=${r.acao || "(none)"}` +
      (looksLikeR2 ? "  = cdn host is NOT the wedding origin (R2/other bucket bound to cdn.aksaraa.com?)" : ""),
  )
}

if (failed) {
  console.error(`\n✗ SMOKE TEST FAILED — ${failed} route(s) not serving.\n  ERR:6/7 = DNS/connection, ERR:35/51/60 = TLS (e.g. expired certificate).\n  Otherwise: deployed bundle is older than the code (stale tree).\n  Redeploy from a tree synced with origin/main, or roll back.`)
  process.exit(1)
}
console.log("\n✓ all template previews + APIs healthy")
