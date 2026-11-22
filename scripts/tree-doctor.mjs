#!/usr/bin/env node
/**
 * Repo hygiene checks. Fails on conditions that have caused real incidents.
 *
 *   node scripts/tree-doctor.mjs
 *
 * Checks:
 *  - no staged deletion whose file still exists on disk
 *  - no stale REBASE_HEAD/MERGE_HEAD without rebase-merge/rebase-apply
 *  - tsconfig.tsbuildinfo not tracked
 *  - no .env.local in a deploy-oriented worktree (warning)
 */
import { existsSync } from "node:fs"
import { execSync } from "node:child_process"

const GIT_ENV = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" }
const git = (a) => execSync(`git ${a}`, { encoding: "utf8", env: GIT_ENV }).trim()
let bad = 0
const fail = (msg) => { console.error(`✗ ${msg}`); bad++ }
const ok = (msg) => console.log(`✓ ${msg}`)

const status = git("status --porcelain")
const stagedDeletes = status
  .split("\n")
  .filter((l) => /^D[ M]/.test(l) || /^ D/.test(l))
  .map((l) => l.slice(3).trim())
  .filter(Boolean)
const ghostDeletes = stagedDeletes.filter((p) => existsSync(p))
if (ghostDeletes.length) {
  fail(`staged deletions but files still exist on disk:\n  ${ghostDeletes.join("\n  ")}\n  Fix: git add -A -- <path>  (or actually delete them)`)
} else {
  ok("no ghost staged deletions")
}

const gitDir = git("rev-parse --git-dir")
const staleHeads = ["REBASE_HEAD", "MERGE_HEAD", "CHERRY_PICK_HEAD"]
  .filter((f) => existsSync(`${gitDir}/${f}`))
  .filter((f) => {
    if (f === "REBASE_HEAD") return !existsSync(`${gitDir}/rebase-merge`) && !existsSync(`${gitDir}/rebase-apply`)
    if (f === "MERGE_HEAD") return !existsSync(`${gitDir}/MERGE_MSG`)
    return true
  })
if (staleHeads.length) {
  fail(`stale git state files: ${staleHeads.join(", ")} (no active operation). Remove them only after confirming no rebase/merge is running.`)
} else {
  ok("no stale git operation state")
}

const tracked = git("ls-files --error-unmatch tsconfig.tsbuildinfo 2>/dev/null || true")
if (tracked.includes("tsconfig.tsbuildinfo")) {
  fail("tsconfig.tsbuildinfo is tracked — it is build noise and causes dirty-tree churn. git rm --cached tsconfig.tsbuildinfo")
} else {
  ok("tsconfig.tsbuildinfo not tracked")
}

if (existsSync(".env.local")) {
  console.warn("! .env.local exists — Next loads it during production builds; prefer .env.development.local + clean worktrees")
} else {
  ok("no .env.local in this tree")
}

if (bad) {
  console.error(`\n✗ tree doctor: ${bad} issue(s)`)
  process.exit(1)
}
console.log("\n✓ tree doctor clean")
