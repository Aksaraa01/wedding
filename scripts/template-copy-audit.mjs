#!/usr/bin/env node
/**
 * Literal-copy audit for in-house templates.
 *
 * Every user-visible string must come from profile data or `template_content`
 * (see docs/INHOUSE_TEMPLATE_PLAYBOOK.md §0.6). This script fails when a
 * template renders a string literal that no editor field can reach, unless the
 * literal is in scripts/template-copy-allowlist.json.
 *
 * The ledger has two halves:
 *   "legacy": [...]   grandfathered literals from templates built before the
 *                     audit existed. Debt, not precedent.
 *   "allow": {...}    named structural exceptions with the reason they must
 *                     NOT be editable (brand badge, WCAG labels, units).
 *
 * New templates start with neither and must stay clean.
 *
 * Usage:
 *   node scripts/template-copy-audit.mjs                  # every template
 *   node scripts/template-copy-audit.mjs <code> [<code>]  # selected templates
 *   node scripts/template-copy-audit.mjs --emit-ledger     # print a ledger draft
 *
 * Exit codes: 0 = clean, 1 = unallowlisted copy found, 2 = bad input.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "..")
const TEMPLATES_DIR = path.join(ROOT, "src", "components", "templates")
const ALLOWLIST_PATH = path.join(HERE, "template-copy-allowlist.json")
const SOURCE_EXT = new Set([".tsx", ".jsx"])

// Attributes whose string value a visitor can read (or a screen reader reads).
const VISIBLE_ATTRS = new Set([
  "alt",
  "title",
  "placeholder",
  "label",
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "aria-valuetext",
  "aria-roledescription",
])

// Object properties that are rendered as copy. A config object like
// `[{ label: "Days" }]` sits one step away from the DOM, so it is audited.
const COPY_PROPS = new Set([
  "label",
  "title",
  "text",
  "caption",
  "description",
  "subtitle",
  "heading",
  "placeholder",
  "alt",
  "note",
  "hint",
  "kicker",
  "cta",
])

const SKIP_DIRS = new Set(["node_modules", ".next", "dist"])

function readAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return { shared: {}, templates: {} }
  const raw = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"))
  return { shared: raw.shared || {}, templates: raw.templates || {} }
}

function letterOnly(value) {
  // Strip HTML entities and markup noise, then require a real word character.
  // Match any script, not just Latin: an Arabic basmalah rendered as a JSX child
  // (ubin-ottoman) was invisible to a `[A-Za-z]` test.
  const text = value.replace(/&[a-z]+;|&#\d+;/gi, "").trim()
  if (!text) return ""
  return /\p{L}/u.test(text) ? text : ""
}

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walkFiles(path.join(dir, entry.name), out)
    } else if (SOURCE_EXT.has(path.extname(entry.name))) {
      out.push(path.join(dir, entry.name))
    }
  }
  return out
}

function lineOf(sf, node) {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
  return { line: line + 1, column: character + 1 }
}

function isStringLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

function literalText(node) {
  return isStringLiteral(node) ? node.text : ""
}

function scanFile(file) {
  const source = fs.readFileSync(file, "utf8")
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const findings = []

  const report = (node, text, kind) => {
    const cleaned = letterOnly(text)
    if (!cleaned) return
    findings.push({ ...lineOf(sf, node), text: cleaned, kind })
  }

  // Material-symbol ligatures are icon names rendered as text. They are
  // structural glyphs, not copy.
  const isIconLigature = (node) => {
    const parent = node.parent
    if (!parent) return false
    if (!ts.isJsxElement(parent) && !ts.isJsxSelfClosingElement(parent)) return false
    const opening = ts.isJsxElement(parent) ? parent.openingElement : parent
    return opening.attributes.properties.some((attr) => {
      if (!ts.isJsxAttribute(attr)) return false
      const name = attr.name.getText(sf)
      if (name !== "className" && name !== "class") return false
      return /material|icon/i.test(attr.initializer ? attr.initializer.getText(sf) : "")
    })
  }

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      if (!isIconLigature(node)) report(node, node.text, "jsx-text")
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf)
      if (VISIBLE_ATTRS.has(name) && node.initializer && ts.isStringLiteral(node.initializer)) {
        report(node.initializer, node.initializer.text, `attr:${name}`)
      }
    } else if (ts.isJsxExpression(node)) {
      const expr = node.expression
      // Attribute values (`data-aos={cond ? "slide-left" : ...}`) are not copy;
      // only expressions that are element children can reach the DOM as text.
      if (!expr || ts.isJsxAttribute(node.parent) || isIconLigature(node)) return
      if (isStringLiteral(expr)) {
        report(expr, literalText(expr), "jsx-expression")
      } else if (ts.isConditionalExpression(expr)) {
        for (const branch of [expr.whenTrue, expr.whenFalse]) {
          if (isStringLiteral(branch)) report(branch, literalText(branch), "jsx-ternary")
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = node.name.getText(sf).replace(/^["']|["']$/g, "")
      if (COPY_PROPS.has(name) && isStringLiteral(node.initializer)) {
        report(node.initializer, literalText(node.initializer), `prop:${name}`)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sf)
  return findings
}

function loadTemplateCodes() {
  return fs
    .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "shared")
    .map((entry) => entry.name)
    .sort()
}

function collect(codes) {
  const results = new Map()
  for (const code of codes) {
    const rows = []
    for (const file of walkFiles(path.join(TEMPLATES_DIR, code))) {
      const rel = path.relative(ROOT, file)
      for (const finding of scanFile(file)) rows.push({ code, rel, ...finding })
    }
    results.set(code, rows)
  }
  return results
}

function main() {
  const argv = process.argv.slice(2)
  const emitLedger = argv.includes("--emit-ledger")
  const args = argv.filter((arg) => !arg.startsWith("-"))
  const available = loadTemplateCodes()
  const codes = args.length ? args : available

  for (const code of codes) {
    if (!available.includes(code)) {
      console.error(`unknown template code: ${code}`)
      console.error(`available: ${available.join(", ")}`)
      process.exit(2)
    }
  }

  const results = collect(codes)

  if (emitLedger) {
    const draft = { templates: {} }
    for (const code of codes) {
      const texts = [...new Set((results.get(code) || []).map((row) => row.text))].sort((a, b) => a.localeCompare(b))
      if (texts.length) draft.templates[code] = { legacy: texts }
    }
    console.log(JSON.stringify(draft, null, 2))
    return
  }

  const allow = readAllowlist()
  const failures = []
  let allowedCount = 0

  for (const code of codes) {
    const entry = allow.templates[code] || {}
    const legacy = new Set(entry.legacy || [])
    const named = entry.allow || {}
    for (const finding of results.get(code) || []) {
      if (legacy.has(finding.text) || named[finding.text] || allow.shared[finding.text]) {
        allowedCount += 1
        continue
      }
      failures.push(finding)
    }
  }

  if (!failures.length) {
    console.log(
      `copy audit: clean (${codes.length} template${codes.length === 1 ? "" : "s"}, ${allowedCount} allowlisted literal${allowedCount === 1 ? "" : "s"})`
    )
    return
  }

  const byFile = new Map()
  for (const failure of failures) {
    if (!byFile.has(failure.rel)) byFile.set(failure.rel, [])
    byFile.get(failure.rel).push(failure)
  }

  console.error(`copy audit: ${failures.length} unallowlisted user-visible literal${failures.length === 1 ? "" : "s"}\n`)
  for (const [file, items] of byFile) {
    console.error(file)
    for (const item of items) {
      console.error(`  ${item.line}:${item.column}  ${JSON.stringify(item.text)}  (${item.kind})`)
    }
    console.error("")
  }
  console.error("Fix: read the value from profile data or template_content (register the key in")
  console.error("src/lib/templateExtras.ts), or add it to scripts/template-copy-allowlist.json")
  console.error("with the reason it is structural and must not be editable.")
  process.exit(1)
}

main()
