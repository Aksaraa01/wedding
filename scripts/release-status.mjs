#!/usr/bin/env node
/**
 * Show release/deploy state across environments.
 *
 *   node scripts/release-status.mjs
 *   node scripts/release-status.mjs --ledger releases/ledger.jsonl
 *
 * Reads local git refs + ledger. Remote server state is reported if SSH works.
 */
import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { arg, gitTry, loadLedger, short } from "./release-lib.mjs"

const args = process.argv.slice(2)
const ledgerPath = arg(args, "--ledger", "releases/ledger.jsonl")
const sshKey = process.env.SSH_KEY || `${process.env.HOME}/.ssh/aksaraa_deploy`
const server = process.env.SERVER || "askaraa@103.93.135.176"

function ssh(cmd) {
  try {
    return execSync(`ssh -i ${sshKey} -o ConnectTimeout=8 -o BatchMode=yes ${server} ${JSON.stringify(cmd)}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

function ref(name) {
  const r = gitTry(`rev-parse --verify --short ${name}`)
  return r.ok ? r.out : "(missing)"
}

console.log("== refs ==")
console.log(`origin/main  ${ref("origin/main")}`)
console.log(`origin/prod  ${ref("origin/prod")}`)
console.log(`main         ${ref("main")}`)
console.log(`prod         ${ref("prod")}`)

console.log("\n== ledger ==")
if (!existsSync(ledgerPath)) {
  console.log(`(no ${ledgerPath})`)
} else {
  const entries = loadLedger(ledgerPath)
  const tail = entries.slice(-20)
  for (const e of tail) {
    console.log(`${e.at}  ${e.env.padEnd(7)} ${e.state.padEnd(8)} ${short(e.sha)}  ${e.by || ""}  ${e.note || ""}`)
  }
  if (entries.length > tail.length) console.log(`... ${entries.length - tail.length} older entries omitted`)
}

console.log("\n== live servers (best effort) ==")
for (const [name, remote] of [["prod", "/var/www/aksara-wedding"], ["staging", "/var/www/aksara-wedding-staging"]]) {
  const rel = ssh(`cat ${remote}/.next/standalone/RELEASE.json 2>/dev/null || true`)
  if (!rel) {
    console.log(`${name.padEnd(8)} unreachable/no release`)
    continue
  }
  try {
    const m = JSON.parse(rel)
    console.log(`${name.padEnd(8)} ${m.env || "?"} @ ${short(m.commit)} build=${m.buildId || "?"} at=${m.builtAt || "?"}`)
  } catch {
    console.log(`${name.padEnd(8)} unreadable RELEASE.json`)
  }
}
