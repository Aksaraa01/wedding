#!/usr/bin/env node
/**
 * Extra-field integrity check for in-house templates.
 *
 * Today's port showed three failure modes that no existing guard caught:
 *
 *   1. the same EKSTRA key registered twice for one template → the editor and
 *      ops render two identical-looking fields ("duplicate extras");
 *   2. two different keys carrying the same label → also reads as a duplicate;
 *   3. a `template_content.<key>` read by a component that no field registers
 *      (dead control the couple cannot edit), or a registered field the
 *      component never reads (an editor input that does nothing).
 *
 * It walks src/components/templates/<code>/*.tsx, collects `tc.<key>` reads,
 * resolves getTemplateExtraFields(code) and fails on any of the above.
 *
 * Usage:
 *   node --experimental-strip-types scripts/template-extras-check.mjs [code…]
 *
 * Exit codes: 0 = clean, 1 = problems found.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getTemplateExtraFields, templateContentWithDefaults } from "../src/lib/templateExtras.ts"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const TEMPLATES_DIR = path.join(ROOT, "src", "components", "templates")
const INDEX_TS = path.join(TEMPLATES_DIR, "index.ts")

// Template codes come from TEMPLATE_MAP in index.ts. Importing the barrel would
// pull React components into this Node script, so read the map by regex.
function templateCodes() {
  const src = fs.readFileSync(INDEX_TS, "utf8")
  const map = src.slice(src.indexOf("const TEMPLATE_MAP"), src.indexOf("export const TEMPLATE_CONFIGS"))
  return [...map.matchAll(/^\s{2}"?([a-z0-9_-]+)"?:\s*[A-Za-z0-9_]+,/gim)].map((m) => m[1])
}

// Map code -> folder when the TEMPLATE_MAP key differs from the folder name.
const FOLDER_ALIASES = { "impasto-mosque-dark-gold": "impasto-mosque", pixel_quest: "pixel-quest" }

function componentFiles(code) {
  const dir = path.join(TEMPLATES_DIR, FOLDER_ALIASES[code] ?? code)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { recursive: true })
    .map((f) => path.join(dir, String(f)))
    .filter((f) => f.endsWith(".tsx"))
}

function usedKeys(code) {
  const keys = new Set()
  for (const file of componentFiles(code)) {
    const src = fs.readFileSync(file, "utf8")
    // Templates name the template_content bag `tc`, `content` or `template`.
    for (const m of src.matchAll(/(?<![A-Za-z0-9_-])(?:tc|content|template)\.([A-Za-z0-9_]+)/g)) keys.add(m[1])
  }
  return keys
}

// Keys read by a component that are deliberately NOT couple-facing copy:
// audio trim offsets are set by ops/dev, never edited from the invitation UI.
const TECHNICAL_KEYS = new Set(["music_start_seconds", "music_end_seconds"])

const args = process.argv.slice(2).filter((a) => !a.startsWith("-"))
const codes = args.length ? args : templateCodes()
let failures = 0

// The editor and the ops console only render the EKSTRA accordion when the
// template config declares `content.extras`. A template can register a perfect
// field catalogue and still show nothing, so tie the two together here: fields
// without the flag are a broken control, not a design choice.
function configHasExtrasFlag(code) {
  const src = fs.readFileSync(INDEX_TS, "utf8")
  const body = src.slice(src.indexOf("export const TEMPLATE_CONFIGS"))
  const start = body.search(new RegExp(`\\n  \\{\\n    code: "${code}",`))
  if (start < 0) return true // not a TEMPLATE_CONFIGS entry (WP catalog row)
  const next = body.slice(start + 1).search(/\n  \{\n    code: "/)
  const end = next >= 0 ? start + 1 + next : body.indexOf("\n]\n", start)
  return /extras: true/.test(body.slice(start, end))
}

for (const code of codes) {
  const fields = getTemplateExtraFields(code)
  if (!fields.length) continue

  const problems = []
  const byKey = new Map()
  const byLabel = new Map()
  for (const f of fields) {
    byKey.set(f.key, [...(byKey.get(f.key) ?? []), f])
    byLabel.set(f.label, [...(byLabel.get(f.label) ?? []), f])
  }

  for (const [key, list] of byKey) {
    if (list.length > 1) {
      problems.push(`duplicate key "${key}" registered ${list.length}× (sections: ${list.map((f) => f.section ?? "?").join(", ")})`)
    }
  }
  for (const [label, list] of byLabel) {
    if (list.length > 1) {
      problems.push(`duplicate label "${label}" shared by ${list.map((f) => f.key).join(" / ")}`)
    }
  }

  // The guest invitation must never print an editor example ("Contoh:" /
  // "e.g."). Check the resolved hints, the merged defaults, and a stored value
  // that carries the prefix (old rows may have saved one).
  for (const lang of ["id", "en"]) {
    const localized = getTemplateExtraFields(code, lang)
    for (const f of localized) {
      if (/^(Contoh:|Example:|e\.g\.)/i.test(f.placeholder ?? "")) {
        problems.push(`example prefix still visible on "${f.key}" (${lang})`)
      }
    }
    for (const [key, value] of Object.entries(templateContentWithDefaults(code, lang, null))) {
      if (/^(Contoh:|Example:|e\.g\.)/i.test(value)) {
        problems.push(`example hint "${key}" would render in the invitation (${lang})`)
      }
      if (localized.find((f) => f.key === key)?.example) {
        problems.push(`example-only field "${key}" was merged into the invitation (${lang})`)
      }
    }
    const rendered = templateContentWithDefaults(code, lang, { example_probe: "Contoh: probe" })
    if (rendered.example_probe) {
      problems.push(`stored example hint would render in the invitation (${lang})`)
    }
  }

  const used = usedKeys(code)
  // Only flag dead controls for templates whose component we actually found.
  if (componentFiles(code).length) {
    for (const f of fields) {
      if (!used.has(f.key)) problems.push(`dead control "${f.key}" is registered but never read by the component`)
    }
    for (const key of used) {
      if (TECHNICAL_KEYS.has(key)) continue
      if (!byKey.has(key)) problems.push(`unreachable copy "template_content.${key}" is read but not registered (couple cannot edit it)`)
    }
  }

  if (fields.length && !configHasExtrasFlag(code)) {
    problems.push(
      `${fields.length} extra field(s) registered but the template config does not set content.extras = true — the editor/ops EKSTRA accordion stays hidden`,
    )
  }

  if (problems.length) {
    failures += problems.length
    console.error(`\n${code}`)
    for (const p of problems) console.error(`  ✗ ${p}`)
  }
}
if (failures) {
  console.error(`\n✗ ${failures} extra-field problem(s). Fix the catalogue, not the check.`)
  process.exit(1)
}
console.log(`✓ extras clean (${codes.length} template${codes.length === 1 ? "" : "s"} checked)`)
