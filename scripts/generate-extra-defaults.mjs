import fs from "node:fs"
import path from "node:path"

const ROOT = "/private/tmp/cs-template-fix"
const TPL = path.join(ROOT, "src/components/templates")

const reg = fs.readFileSync(path.join(TPL, "index.ts"), "utf8")
const imports = Object.fromEntries([...reg.matchAll(/import\s+(\w+)\s+from\s+"\.\/([^"]+)"/g)].map((m) => [m[1], m[2]]))
const mapBlock = reg.slice(reg.indexOf("const TEMPLATE_MAP"))
const pairs = [...mapBlock.matchAll(/^\s*"?([a-z0-9_-]+)"?:\s*(\w+),/gm)]
const codeToDir = Object.fromEntries(pairs.filter((m) => imports[m[2]]).map((m) => [m[1], imports[m[2]]]))

const unescape = (s) => s.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\")

function extract(file) {
  const text = fs.readFileSync(file, "utf8")
  const out = {}
  // tc.key || ... (lang === "en" ? "EN" : "ID")
  const inline = /(?:tc|content)\.([a-z0-9_]+)\s*\|\|[\s\S]{0,120}?lang\s*===\s*"en"\s*\?\s*"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g
  for (const m of text.matchAll(inline)) {
    out[m[1]] ??= {}
    out[m[1]].en = unescape(m[2])
    out[m[1]].id = unescape(m[3])
  }
  // copy objects: const COPY_EN|EN|COPY_ID|ID = { ... }
  for (const m of text.matchAll(/const\s+(COPY_EN|EN|COPY_ID|ID)\s*=\s*\{([\s\S]*?)\n\}/g)) {
    const lang = /EN/.test(m[1]) ? "en" : "id"
    for (const kv of m[2].matchAll(/([a-z0-9_]+)\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
      out[kv[1]] ??= {}
      if (!out[kv[1]][lang]) out[kv[1]][lang] = unescape(kv[2])
    }
  }
  // single-language fallback: tc.key || "STRING"
  const single = /(?:tc|content)\.([a-z0-9_]+)\s*\|\|\s*"((?:[^"\\]|\\.)*)"/g
  for (const m of text.matchAll(single)) {
    out[m[1]] ??= {}
    if (!out[m[1]].id && !out[m[1]].en && !out[m[1]].raw) out[m[1]].raw = unescape(m[2])
  }
  return out
}

const result = {}
for (const [code, dir] of Object.entries(codeToDir)) {
  const files = []
  const idx = path.join(TPL, dir, "index.tsx")
  if (fs.existsSync(idx)) files.push(idx)
  for (const sub of ["sections", "cards", "modals", "pages"]) {
    const d = path.join(TPL, dir, sub)
    if (!fs.existsSync(d)) continue
    for (const f of fs.readdirSync(d)) if (f.endsWith(".tsx")) files.push(path.join(d, f))
  }
  const merged = {}
  for (const f of files) {
    const map = extract(f)
    for (const [k, v] of Object.entries(map)) merged[k] = { ...(merged[k] || {}), ...v }
  }
  if (Object.keys(merged).length) result[code] = merged
}

const both = Object.values(result).flatMap((m) => Object.values(m)).filter((v) => v.id && v.en).length
const idOnly = Object.values(result).flatMap((m) => Object.values(m)).filter((v) => v.id && !v.en).length
const enOnly = Object.values(result).flatMap((m) => Object.values(m)).filter((v) => !v.id && v.en).length
const raw = Object.values(result).flatMap((m) => Object.values(m)).filter((v) => v.raw).length
console.log({ templates: Object.keys(result).length, both, idOnly, enOnly, rawSingle: raw })

const header = `// GENERATED from src/components/templates/** (scripts/generate-extra-defaults.mjs).
// The default copy each template renders when an extra field is empty, per
// language. Used by templateExtras.ts so the editor accordion shows the hint in
// the selected language (the same text the invitation will render).
export type ExtraDefault = { id?: string; en?: string; raw?: string }
export const EXTRA_DEFAULTS: Record<string, Record<string, ExtraDefault>> = `
fs.writeFileSync(path.join(ROOT, "src/lib/templateExtraDefaults.ts"), header + JSON.stringify(result, null, 1) + " as const\n")
console.log("wrote src/lib/templateExtraDefaults.ts")
