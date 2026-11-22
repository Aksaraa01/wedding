#!/usr/bin/env node
/**
 * Record a human/agent verification decision for a commit in an environment.
 *
 *   node scripts/release-verify.mjs --env staging --commit <sha> [--note "..."]
 *   node scripts/release-verify.mjs --env staging --ref prod
 *   node scripts/release-reject.mjs --env staging --commit <sha> --reason "..."
 *
 * The ledger is append-only JSONL. Latest record per (sha, env) wins.
 * Default ledger: releases/ledger.jsonl (git-tracked, durable). Override with
 * --ledger <path> for a server-local ledger.
 */
import { appendJsonl, arg, die, git, hasFlag, loadLedger, normalizeSha, nowIso, short } from "./release-lib.mjs"

const args = process.argv.slice(2)
const reject = hasFlag(args, "--reject")
const env = arg(args, "--env", "staging")
if (!["staging", "prod"].includes(env)) die("--env must be staging or prod")

const ref = arg(args, "--ref", null)
const commitArg = arg(args, "--commit", null)
const sha = normalizeSha(ref || commitArg || "HEAD")
const note = arg(args, "--note", arg(args, "--reason", ""))
const ledgerPath = arg(args, "--ledger", "releases/ledger.jsonl")
const by = process.env.USER || process.env.LOGNAME || "unknown"

const state = reject ? "rejected" : "verified"
if (reject && !note) die("--reason is required for --reject")

const entry = {
  at: nowIso(),
  sha,
  short: short(sha),
  env,
  state,
  by,
  note: note || undefined,
  branch: git("rev-parse --abbrev-ref HEAD"),
}

appendJsonl(ledgerPath, entry)
console.log(`✓ ${state} ${env} ${entry.short} ${note ? `— ${note}` : ""}`)
console.log(`  ledger: ${ledgerPath}`)

if (!reject) {
  // Helpful context: show whether this SHA is eligible for prod by ancestry.
  const entries = loadLedger(ledgerPath)
  const tip = entries.filter((e) => e.env === "staging" && e.state === "verified").slice(-1)[0]
  if (tip) console.log(`  latest verified staging tip: ${tip.short}`)
}
