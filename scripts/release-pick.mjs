#!/usr/bin/env node
/**
 * Cherry-pick verified staging commits onto the prod branch.
 *
 *   node scripts/release-pick.mjs <sha> [<sha>...]
 *   node scripts/release-pick.mjs --range <from>..<to>
 *
 * Rules (plan §3.9, §3.11):
 * - every picked SHA must be an ancestor of a verified staging tip
 * - no picked SHA may be rejected after that verification
 * - cherry-pick uses -x so prod commit points back to main commit
 * - conflict => abort and fix on main (never resolve on prod)
 *
 * This script does not deploy. After picking, rehearse on staging with --ref prod.
 */
import { appendJsonl, arg, die, git, gitTry, hasFlag, isAncestor, loadLedger, normalizeSha, nowIso, short } from "./release-lib.mjs"

const args = process.argv.slice(2)
const ledgerPath = arg(args, "--ledger", "releases/ledger.jsonl")
const range = arg(args, "--range", null)
const allowUnverified = hasFlag(args, "--allow-unverified")
const dryRun = hasFlag(args, "--dry-run")

let picks = args.filter((a) => !a.startsWith("--") && a !== range && a !== ledgerPath)
if (range) {
  const out = git(`rev-list --reverse ${range}`)
  picks = out.split("\n").map((s) => s.trim()).filter(Boolean)
}
if (!picks.length) die("usage: release-pick.mjs <sha> [<sha>...] | --range A..B")

const shas = picks.map((p) => normalizeSha(p))
const entries = loadLedger(ledgerPath)

function latestState(sha, env) {
  const m = entries.filter((e) => e.sha === sha && e.env === env)
  return m.length ? m[m.length - 1] : null
}

const verifiedTips = entries.filter((e) => e.env === "staging" && e.state === "verified").map((e) => e.sha)
const verifiedTip = verifiedTips[verifiedTips.length - 1] || null

for (const sha of shas) {
  const rej = latestState(sha, "staging")
  if (rej?.state === "rejected") die(`${short(sha)} was rejected on staging: ${rej.note || "(no reason)"}`)
  if (!allowUnverified) {
    if (!verifiedTip) die("no verified staging tip in ledger — verify staging first, or pass --allow-unverified")
    if (!isAncestor(sha, verifiedTip)) {
      die(`${short(sha)} is not an ancestor of latest verified staging tip ${short(verifiedTip)}. Verify staging first.`)
    }
  }
  // ensure the commit is on main
  if (!isAncestor(sha, "origin/main") && !isAncestor(sha, "main")) {
    die(`${short(sha)} is not on main/origin/main — prod must not contain code that is not on main`)
  }
}

console.log("picks:")
for (const sha of shas) console.log(`  - ${short(sha)} ${git(`log -1 --format=%s ${sha}`)}`)
if (dryRun) process.exit(0)

// Ensure we are on prod
const branch = git("rev-parse --abbrev-ref HEAD")
if (branch !== "prod") {
  die(`switch to the prod branch first (current: ${branch}).\n  git fetch origin && git switch prod && git pull --ff-only`)
}

for (const sha of shas) {
  // Skip if already cherry-picked (same patch-id)
  const cp = gitTry(`cherry-pick -x ${sha}`)
  if (!cp.ok) {
    const conflict = cp.out.includes("CONFLICT") || cp.out.includes("could not apply")
    gitTry("cherry-pick --abort")
    if (conflict) {
      die(
        `conflict cherry-picking ${short(sha)}.\n` +
          `  Aborted. Fix on main, stage/verify, then re-pick. Never resolve on prod.`,
      )
    }
    // "empty" commit (already applied) is ok to skip
    if (cp.out.includes("previous cherry-pick is now empty") || cp.out.includes("nothing to commit")) {
      gitTry("cherry-pick --skip")
      console.log(`  ~ ${short(sha)} already applied (skipped)`)
      continue
    }
    die(`cherry-pick failed for ${short(sha)}: ${cp.out}`)
  }
  console.log(`  ✓ ${short(sha)}`)
}

appendJsonl(ledgerPath, {
  at: nowIso(),
  state: "picked",
  env: "prod",
  by: process.env.USER || process.env.LOGNAME || "unknown",
  picks: shas,
  short: shas.map(short).join(","),
  note: `picked ${shas.length} commit(s) onto prod`,
})
console.log(`\n✓ picked ${shas.length} commit(s) onto prod`)
console.log("Next: git push origin prod && rehearse on staging with --ref prod before deploying prod")
