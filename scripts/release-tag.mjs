#!/usr/bin/env node
/**
 * Tag a verified commit as a release candidate for one environment.
 *
 *   node scripts/release-tag.mjs --env prod --commit <sha>
 *   node scripts/release-tag.mjs --env prod            # defaults to origin/main
 *
 * Trunk promotion: prod deployments build a tag, never a long-lived branch that
 * accumulates cherry-picks. The tag is immutable and the ledger records which
 * tag is live, so a rollback is "deploy an older tag", with no history rewrite.
 *
 * Refuses unless the commit is recorded `verified` in the release ledger and has
 * not been rejected afterwards.
 */
import { appendJsonl, arg, die, git, gitTry, loadLedger, normalizeSha, nowIso, short } from "./release-lib.mjs"

const args = process.argv.slice(2)
const env = arg(args, "--env", "prod")
if (!["staging", "prod"].includes(env)) die("--env must be staging or prod")
const ledgerPath = arg(args, "--ledger", "releases/ledger.jsonl")
const ref = arg(args, "--commit", "origin/main")
const sha = normalizeSha(ref)
const date = new Date().toISOString().slice(0, 10)
const tag = `release/${env}/${date}.${short(sha)}`

const entries = loadLedger(ledgerPath)
const verified = entries.filter((e) => e.sha === sha && e.env === "staging" && e.state === "verified")
if (!verified.length) {
  die(
    `${short(sha)} is not recorded as verified on staging.\n` +
      `  Run: npm run release:verify -- --env staging --commit ${short(sha)}`,
  )
}
const lastVerified = verified[verified.length - 1]
const rejectedAfter = entries.find((e) => e.sha === sha && e.env === "staging" && e.state === "rejected" && e.at > lastVerified.at)
if (rejectedAfter) die(`${short(sha)} was rejected after verification: ${rejectedAfter.note || "(no reason)"}`)

const exists = gitTry(`rev-parse -q --verify refs/tags/${tag}`)
if (exists.ok) die(`tag ${tag} already exists`)

git(`tag -a ${tag} -m "Aksaraa ${env} release ${date}\n\ncommit ${sha}\nverified ${lastVerified.at}"`)
git(`push origin refs/tags/${tag}`)
appendJsonl(ledgerPath, {
  at: nowIso(),
  sha,
  short: short(sha),
  env,
  state: "tagged",
  tag,
  by: process.env.USER || process.env.LOGNAME || "unknown",
})
console.log(`✓ tagged ${tag} -> ${short(sha)}`)
console.log(`\nDeploy it from the tag:\n  git worktree add --detach /tmp/build-${short(sha)} ${tag}`)
console.log(`  set -a; source .env.build.${env}; set +a`)
console.log(`  npm run build:env -- --env ${env}`)
console.log(`  npm run deploy -- --target ${env} --commit ${tag}`)
