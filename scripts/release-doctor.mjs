#!/usr/bin/env node
/**
 * Report whether the three sources of truth for prod agree:
 *   origin/prod tip  ·  releases/ledger.jsonl (last `deployed`)  ·  the live RELEASE.json
 *
 * Run before a prod deploy. It is REPORT-ONLY by design (exit 0) — the release
 * chain must not be blocked by a diagnostic. Pass --strict to make warnings fail
 * (useful in a checklist/CI step where you *want* the drift to stop you).
 *
 *   npm run release:doctor
 *   npm run release:doctor -- --offline            # skip the ssh read
 *   npm run release:doctor -- --live-release f.json  # evaluate a fixture
 *   npm run release:doctor -- --strict
 */
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { arg, die, git, gitTry, hasFlag, loadLedger } from "./release-lib.mjs"
import { diagnoseProdDrift } from "./lib/release-guards.mjs"

const args = process.argv.slice(2)
const offline = hasFlag(args, "--offline")
const strict = hasFlag(args, "--strict")
const ledgerPath = arg(args, "--ledger", "releases/ledger.jsonl")
const branchRef = arg(args, "--branch-ref", "origin/prod")

const GIT_ENV = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" }

function readLive(file) {
  if (file) {
    try {
      return { commit: JSON.parse(readFileSync(file, "utf8")).commit || null, source: file }
    } catch (e) {
      return { commit: null, source: `${file}: ${e.message}` }
    }
  }
  const server = process.env.DEPLOY_SERVER || "askaraa@103.93.135.176"
  const key = process.env.SSH_KEY || `${process.env.HOME}/.ssh/aksaraa_deploy`
  const remote = process.env.LIVE_REMOTE || "/var/www/aksara-wedding"
  try {
    const raw = execSync(
      `ssh -i "${key}" -o BatchMode=yes -o ConnectTimeout=8 -o ServerAliveInterval=15 -o ServerAliveCountMax=2 ` +
        `${server} 'cat ${remote}/.next/standalone/RELEASE.json'`,
      { encoding: "utf8", timeout: Number(process.env.DOCTOR_TIMEOUT_MS || 15000), stdio: ["ignore", "pipe", "ignore"] },
    )
    return { commit: JSON.parse(raw).commit || null, source: `${server}:${remote}` }
  } catch (e) {
    return { commit: null, source: `ssh ${server} failed (${String(e.message).split("\n")[0]})` }
  }
}

const branchTip = (() => {
  const r = gitTry(`rev-parse --verify --quiet ${branchRef}`)
  return r.ok ? r.out.trim() : gitTry(`rev-parse --verify --quiet ${branchRef.replace(/^origin\//, "")}`).out.trim() || null
})()
if (!branchTip) die(`cannot resolve ${branchRef} — run git fetch origin`)

const ledger = loadLedger(ledgerPath)
const prodDeploys = ledger.filter((e) => e.env === "prod" && e.state === "deployed")
const ledgerProd = prodDeploys.length ? prodDeploys[prodDeploys.length - 1] : null

let live = { commit: null, source: "skipped (--offline)" }
if (!offline) {
  const file = arg(args, "--live-release", null)
  live = readLive(file)
}

const isAncestor = (a, b) => {
  try {
    execSync(`git merge-base --is-ancestor ${a} ${b}`, { stdio: "ignore", env: GIT_ENV })
    return true
  } catch {
    return false
  }
}

console.log("\n▸ Release doctor — prod sources of truth\n")
const rows = diagnoseProdDrift({ branchTip, ledgerProd, liveCommit: live.commit, isAncestor })
const width = Math.max(...rows.map((r) => r.label.length))
let warnings = 0
for (const row of rows) {
  if (row.level === "warn") warnings += 1
  console.log(`  ${row.level === "warn" ? "!" : "✓"} ${row.label.padEnd(width)}  ${row.message}`)
}
if (!live.commit && !offline) console.log(`  · live build not read: ${live.source}`)
if (ledgerProd?.at) console.log(`\n  last prod deploy recorded: ${ledgerProd.at}`)
console.log(`\n  ledger: ${ledgerPath}  ·  branch: ${branchRef}\n`)

if (!warnings) {
  console.log("✓ no drift detected\n")
  process.exit(0)
}
console.log(`! ${warnings} drift warning(s) — a prod deploy from ${branchRef} may move prod backwards\n`)
process.exit(strict ? 1 : 0)
