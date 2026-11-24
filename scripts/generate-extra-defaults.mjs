#!/usr/bin/env node
/**
 * Generate per-template extras hints from each template's own fallback copy.
 *
 * Every in-house template renders a default when a `tc.<key>` content field is
 * empty. The extras accordion has to show that same default as the hint, in the
 * language the couple is currently editing. This script reads the template
 * source (TypeScript AST, not regex) and emits
 *
 *   EXTRA_DEFAULTS[code][key] = { en, id }   // bilingual default
 *                             | { en }       // English-only default
 *                             | { id }       // Indonesian-only default
 *
 * Rules:
 * - Only copy that belongs to the `tc.<key>` expression is attributed: the
 *   `||` chain plus the `lang === "en" ? EN : ID` fallback in the same operand.
 * - A single-language fallback is kept only when it is clearly that language;
 *   ambiguous strings are dropped rather than shown in the wrong language.
 * - Any template-level constant a chain falls back to (`DEFAULT_APOLOGY`, …) is
 *   resolved inside the same file.
 *
 * Run: npm run generate:extra-defaults
 */
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const ROOT = path.resolve(import.meta.dirname, "..")
const TEMPLATES_DIR = path.join(ROOT, "src/components/templates")
const I18N_FILE = path.join(ROOT, "src/lib/i18n.ts")
const OUT = path.join(ROOT, "src/lib/templateExtraDefaults.ts")

const CONTENT_IDENTS = new Set(["tc", "content", "template"])

const ID_WORDS =
  /\b(dan|yang|untuk|dengan|kami|anda|tidak|akan|pada|dari|ini|itu|adalah|bila|jika|sudah|lebih|dapat|dalam|acara|hari|pernikahan|kepada|tanpa|juga|agar|atau|saat|kalian|hadir|merupakan|kehormatan|kebahagiaan|silakan|mohon|terima|kasih|sampai|jumpa|restu|undangan|tamu|keluarga|mempelai|bahagia|bersama|oleh|sebagai|kini|nanti|malam|pagi|siang|waktu|tempat|alamat|kirim|kabar|ucapan|doa|para|serta|sesuai|hadir|menjadi|tanpa|serta|namun|karena|sebelum|sesudah|antara|begitu|hanya|masih|belum|selalu|sangat|paling|mari)\b/i

const EN_WORDS =
  /\b(the|and|you|your|yours|we|our|ours|with|for|from|this|that|will|would|can|may|please|thank|thanks|love|day|days|wedding|invitation|guest|guests|family|families|see|join|us|at|in|on|of|to|is|are|be|have|has|as|by|together|here|there|when|where|honour|honor|blessing|blessings|joy|happy|happiness|warmest|welcome|dear|kindly|regards|always|forever|story|stories|moment|moments|celebrate|celebration|married|marriage|bride|groom|prayer|prayers)\b/i

const MIN_LENGTH = 3

function classify(text) {
  const id = ID_WORDS.test(text)
  const en = EN_WORDS.test(text)
  if (id && !en) return "id"
  if (en && !id) return "en"
  return null
}

function literalText(node) {
  if (!node) return null
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return null
}

function isContentKeyAccess(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    CONTENT_IDENTS.has(node.expression.text)
  )
}

function isEnTest(cond) {
  if (!ts.isBinaryExpression(cond)) return false
  if (cond.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken) return false
  const { left, right } = cond
  return (
    (ts.isIdentifier(left) && left.text === "lang" && literalText(right) === "en") ||
    (ts.isIdentifier(right) && right.text === "lang" && literalText(left) === "en")
  )
}

function owningExpression(keyNode) {
  let cur = keyNode
  for (;;) {
    const parent = cur.parent
    if (!parent) return cur
    if (ts.isParenthesizedExpression(parent)) {
      cur = parent
      continue
    }
    if (
      ts.isBinaryExpression(parent) &&
      (parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
        parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
    ) {
      cur = parent
      continue
    }
    if ((ts.isPropertyAccessExpression(parent) || ts.isCallExpression(parent)) && parent.expression === cur) {
      // `.trim()`, `.replace(…)` and friends keep the same operand
      cur = parent
      continue
    }
    return cur
  }
}

function collectContentKeys(node, out) {
  if (isContentKeyAccess(node)) out.add(node.name.text)
  ts.forEachChild(node, (child) => collectContentKeys(child, out))
}

function findLangPair(node) {
  let found = null
  const visit = (n) => {
    if (found) return
    if (ts.isConditionalExpression(n) && isEnTest(n.condition)) {
      const en = literalText(n.whenTrue)
      const id = literalText(n.whenFalse)
      if (en && id) {
        found = { en, id }
        return
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

function rightmostOperand(node) {
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    return rightmostOperand(node.right)
  }
  return node
}

function collectDictionary(file) {
  const text = fs.readFileSync(file, "utf8")
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const map = new Map()
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name && ts.isIdentifier(node.name) && ts.isObjectLiteralExpression(node.initializer)) {
      const entries = new Map()
      for (const prop of node.initializer.properties) {
        if (!ts.isPropertyAssignment(prop) || !prop.name || !ts.isIdentifier(prop.name)) continue
        const value = literalText(prop.initializer)
        if (value !== null) entries.set(prop.name.text, value)
      }
      if (entries.get("id") && entries.get("en")) {
        map.set(node.name.text, { en: entries.get("en"), id: entries.get("id") })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return map
}

function translatedPair(node, dict) {
  if (!ts.isCallExpression(node)) return null
  if (!ts.isIdentifier(node.expression) || node.expression.text !== "t") return null
  const key = literalText(node.arguments[0])
  if (!key) return null
  return dict.get(key) ?? null
}

function collectStringConsts(sourceFile) {
  const map = new Map()
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const direct = literalText(node.initializer)
      if (direct !== null) {
        map.set(node.name.text, { kind: "text", value: direct })
      } else if (ts.isConditionalExpression(node.initializer) && isEnTest(node.initializer.condition)) {
        const en = literalText(node.initializer.whenTrue)
        const id = literalText(node.initializer.whenFalse)
        if (en && id) map.set(node.name.text, { kind: "pair", en, id })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return map
}

function extractTemplate(file, dict) {
  const text = fs.readFileSync(file, "utf8")
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const consts = collectStringConsts(sourceFile)
  const out = {}

  const assignPair = (keys, pair) => {
    for (const key of keys) out[key] = { ...(out[key] || {}), en: pair.en, id: pair.id }
  }
  const assignSingle = (keys, textValue) => {
    if (!textValue || textValue.trim().length < MIN_LENGTH) return
    if (/^(https?:|\/|#)/.test(textValue)) return
    const lang = classify(textValue)
    if (!lang) return
    for (const key of keys) {
      // never overwrite a bilingual pair with a single-language fallback
      if (out[key]?.en && out[key]?.id) continue
      out[key] = { ...(out[key] || {}), [lang]: textValue }
    }
  }

  const visit = (node) => {
    if (isContentKeyAccess(node)) {
      const key = node.name.text
      const top = owningExpression(node)
      const keys = new Set([key])
      collectContentKeys(top, keys)

      const pair = findLangPair(top)
      if (pair) {
        assignPair(keys, pair)
      } else if (!containsConditional(top)) {
        const tail = rightmostOperand(top)
        const literal = literalText(tail)
        if (literal !== null) {
          assignSingle(keys, literal)
        } else if (ts.isIdentifier(tail) && consts.has(tail.text)) {
          const resolved = consts.get(tail.text)
          if (resolved.kind === "text") assignSingle(keys, resolved.value)
          else assignPair(keys, resolved)
        } else {
          const translated = translatedPair(tail, dict)
          if (translated) assignPair(keys, translated)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return out
}

function containsConditional(node) {
  let found = false
  const visit = (n) => {
    if (found) return
    if (ts.isConditionalExpression(n)) {
      found = true
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

const dictionary = collectDictionary(I18N_FILE)
const result = {}
for (const code of fs.readdirSync(TEMPLATES_DIR).sort()) {
  const dir = path.join(TEMPLATES_DIR, code)
  if (!fs.statSync(dir).isDirectory()) continue
  // Ports keep copy in subcomponents (Cover, modals, pages/*), so scan the
  // whole template dir — not just index.tsx — or the registry silently misses
  // every default that lives one level down.
  const files = fs
    .readdirSync(dir, { recursive: true })
    .map((f) => path.join(dir, String(f)))
    .filter((f) => f.endsWith(".tsx"))
    .sort((a, b) => (a.endsWith("index.tsx") ? -1 : b.endsWith("index.tsx") ? 1 : a.localeCompare(b)))
  const fields = {}
  for (const file of files) {
    for (const [key, value] of Object.entries(extractTemplate(file, dictionary))) {
      if (!fields[key]) fields[key] = value
    }
  }
  if (Object.keys(fields).length) result[code] = fields
}

const stats = { templates: 0, both: 0, enOnly: 0, idOnly: 0 }
for (const fields of Object.values(result)) {
  stats.templates += 1
  for (const v of Object.values(fields)) {
    if (v.en && v.id) stats.both += 1
    else if (v.en) stats.enOnly += 1
    else if (v.id) stats.idOnly += 1
  }
}

const header = `// GENERATED by scripts/generate-extra-defaults.mjs — do not edit by hand.
// Run \`npm run generate:extra-defaults\` after changing template fallback copy.
// Per-template default copy, used as the extras-accordion hint in each language.
export type ExtraDefault = { en?: string; id?: string }
export const EXTRA_DEFAULTS: Record<string, Record<string, ExtraDefault>> = `
const generated = `${header}${JSON.stringify(result, null, 2).replace(/\n/g, "\n")}\n`

// --check: the registry is generated, so a stale file means the editor shows a
// hint the invitation no longer prints. The deploy guard runs this mode.
if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""
  if (current !== generated) {
    console.error(
      "✗ src/lib/templateExtraDefaults.ts is stale — run `npm run generate:extra-defaults`",
    )
    process.exit(1)
  }
  console.log("✓ extra defaults up to date")
  process.exit(0)
}

fs.writeFileSync(OUT, generated)
console.log(stats, "->", path.relative(ROOT, OUT))
