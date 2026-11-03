#!/usr/bin/env node
// The Material Symbols stylesheet is subset to the icons the app actually uses
// (`icon_names=` in src/app/layout.tsx): ~225 KB instead of the 1.1 MB variable
// font. A new icon name that is not in that list renders as a blank glyph, which
// is invisible in code review and only shows up in production.
//
// The old version only grepped `>name<` JSX children, so every icon passed
// through a variable (`{col.icon}`, `icon="checkroom"`, `renderSection(…,
// "photo_album", …)`) was invisible to it and shipped blank. This version
// resolves four sources:
//   1. literal JSX children of a `material-symbols-outlined` span
//   2. string literals inside such a span (ternaries: `{on ? "a" : "b"}`)
//   3. `icon: "x"` / `icon="x"` / `icon={"x"}` object props and JSX attributes
//   4. positional icon arguments of local helpers (`renderSection(k, icon, …)`)
//
// Usage:
//   node scripts/check-material-icons.mjs           # fail on missing icons
//   node scripts/check-material-icons.mjs --fix     # rewrite the subset list
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const LAYOUT = "src/app/layout.tsx"

// Not icons: `icon` is a data key here (manifest widget type -> WP setting).
const IGNORED = new Set(["title"])

function sourceFiles() {
  return execSync(`grep -rlE "material-symbols-outlined|icon[:=]|icon: string" src --include="*.tsx" --include="*.ts"`, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
}

function literalIcons() {
  const found = new Map() // name -> first location
  const add = (name, loc) => {
    if (!/^[a-z][a-z0-9_]{1,40}$/.test(name)) return
    if (IGNORED.has(name)) return
    if (!found.has(name)) found.set(name, loc)
  }

  for (const file of sourceFiles()) {
    const src = readFileSync(file, "utf8")

    // 1 + 2: inside a material-symbols span (open tag up to the closing tag,
    // bounded so a stray unclosed span cannot swallow the whole file).
    const spanRe = /material-symbols-outlined[^>]*>\s*([\s\S]{0,240}?)<\/span>/g
    for (const m of src.matchAll(spanRe)) {
      // bare child: `>photo_camera<`
      const bare = m[1].trim().match(/^([a-z][a-z0-9_]{1,40})$/)
      if (bare) add(bare[1], file)
      // ternary branches inside the span: `{on ? "pause" : "play_arrow"}`
      for (const lit of m[1].matchAll(/[?:]\s*["']([a-z][a-z0-9_]{1,40})["']/g)) add(lit[1], file)
    }

    // 3: `icon: "x"`, `icon="x"`, `icon={"x"}`
    for (const m of src.matchAll(/\bicon\s*[:=]\s*\{?\s*["']([a-z][a-z0-9_]{1,40})["']/g)) {
      add(m[1], file)
    }

    // 4: helpers declared as `(foo: X, icon: string, …)` — the call site passes
    // a bare literal that no other rule sees.
    for (const decl of src.matchAll(/(?:const\s+)?(\w+)\s*=\s*\(([^)]*)\)\s*(?::[^=]+)?=>/g)) {
      const [, fn, params] = decl
      const names = params.split(",").map((p) => p.split(/[:=\s]/)[0].trim())
      const idx = names.indexOf("icon")
      if (idx < 1) continue
      // args before the icon are string literals in every real call site
      const callRe = new RegExp(`\\b${fn}\\(\\s*(?:(?:"[^"]*"|'[^']*')\\s*,\\s*){${idx}}["']([a-z][a-z0-9_]{1,40})["']`, "g")
      for (const m of src.matchAll(callRe)) add(m[1], file)
    }
  }

  return [...found.keys()].sort()
}

function subsetFromLayout() {
  const src = readFileSync(LAYOUT, "utf8")
  const m = src.match(/&icon_names=([a-z0-9_,]+)&/)
  if (!m) return null
  return m[1].split(",").filter(Boolean)
}

const used = literalIcons()
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
