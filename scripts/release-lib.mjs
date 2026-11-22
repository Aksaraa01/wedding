import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs"
import { dirname } from "node:path"

export const GIT_ENV = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" }

export function git(args, opts = {}) {
  return execSync(`git ${args}`, { encoding: "utf8", env: GIT_ENV, ...opts }).trim()
}

export function gitTry(args) {
  try {
    return { ok: true, out: git(args) }
  } catch (e) {
    return { ok: false, out: String(e.stdout || e.message || e).trim() }
  }
}

export function nowIso() {
  return new Date().toISOString()
}

export function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return fallback
  }
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n")
}

export function readJsonl(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)]
      } catch {
        return []
      }
    })
}

export function appendJsonl(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  appendFileSync(path, JSON.stringify(value) + "\n")
}

export function arg(args, name, fallback = null) {
  const i = args.indexOf(name)
  if (i < 0) return fallback
  return args[i + 1] ?? fallback
}

export function hasFlag(args, name) {
  return args.includes(name)
}

export function die(msg, code = 1) {
  console.error(`\n✗ ${msg}\n`)
  process.exit(code)
}

export function short(sha) {
  return String(sha || "").slice(0, 7)
}

export function isAncestor(ancestor, descendant) {
  const r = gitTry(`merge-base --is-ancestor ${ancestor} ${descendant}`)
  return r.ok
}

export function commitExists(sha) {
  return gitTry(`cat-file -t ${sha}`).ok
}

export function normalizeSha(ref) {
  const r = gitTry(`rev-parse --verify ${ref}^{commit}`)
  if (!r.ok) die(`cannot resolve commit/ref: ${ref}`)
  return r.out.trim()
}

export function currentBranch() {
  return git("rev-parse --abbrev-ref HEAD")
}

export function ensureClean() {
  const out = git("status --porcelain --untracked-files=all")
  if (out.trim()) die(`working tree is dirty:\n${out}`)
}

export function loadLedger(path) {
  return readJsonl(path)
}

export function latestLedgerState(entries, sha, env) {
  const matches = entries.filter((e) => e.sha === sha && e.env === env)
  return matches.length ? matches[matches.length - 1] : null
}

export function latestVerifiedStagingTip(entries) {
  const tips = entries
    .filter((e) => e.env === "staging" && e.state === "verified")
    .map((e) => e.sha)
  return tips.length ? tips[tips.length - 1] : null
}
