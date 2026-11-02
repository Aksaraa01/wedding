#!/usr/bin/env node
// The Material Symbols stylesheet is subset to the icons the app actually uses
// (`icon_names=` in src/app/layout.tsx): 179 KB instead of the 1.1 MB variable
// font. A new icon name that is not in that list renders as a blank glyph, which
// is invisible in code review and only shows up in production.
//
// Usage:
//   node scripts/check-material-icons.mjs           # fail on missing icons
//   node scripts/check-material-icons.mjs --fix     # rewrite the subset list
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const LAYOUT = "src/app/layout.tsx"

function usedIcons() {
  const out = execSync(
    `grep -rhoE "material-symbols-outlined[^>]*>[[:space:]]*[a-z0-9_]+" src | sed -E "s/.*>[[:space:]]*//"`,
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  )
  return [...new Set(out.split("\n").map((s) => s.trim()).filter(Boolean))].sort()
}

function subsetFromLayout() {
  const src = readFileSync(LAYOUT, "utf8")
  const m = src.match(/&icon_names=([a-z0-9_,]+)&/)
  if (!m) return null
  return m[1].split(",").filter(Boolean)
}

const used = usedIcons()
const subset = subsetFromLayout()

if (!subset) {
  console.error("✗ could not find &icon_names=… in src/app/layout.tsx")
  process.exit(1)
}

const missing = used.filter((name) => !subset.includes(name))
const unused = subset.filter((name) => !used.includes(name))

if (process.argv.includes("--fix")) {
  const src = readFileSync(LAYOUT, "utf8")
  writeFileSync(LAYOUT, src.replace(/&icon_names=[a-z0-9_,]+&/, `&icon_names=${used.join(",")}&`))
  console.log(`rewrote subset: ${used.length} icons`)
  process.exit(0)
}

if (unused.length) console.log(`! ${unused.length} icon(s) in the subset are no longer used (harmless, ${unused.slice(0, 5).join(", ")})`)

if (missing.length) {
  console.error(`✗ ${missing.length} icon(s) used in code but missing from the font subset:`)
  for (const name of missing) console.error(`  - ${name}`)
  console.error("  Run: node scripts/check-material-icons.mjs --fix")
  process.exit(1)
}

console.log(`✓ all ${used.length} Material Symbols icons are in the subset`)
