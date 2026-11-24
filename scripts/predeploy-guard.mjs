#!/usr/bin/env node
/**
 * Pre-deploy guard. Run AFTER `npm run build`, BEFORE any rsync.
 *
 * Fails loudly when the build is not safe to ship:
 *  1. working tree is behind origin/main (the exact cause of the adat-jawa-2 wipe:
 *     a stale tree deployed over a newer build), is ahead of it (unpushed work
 *     other agents cannot see), or has uncommitted changes (another agent's WIP
 *     would be compiled into the bundle),
 *  2. NEXT_PUBLIC_* env baked into the bundle points at the wrong Supabase project,
 *  3. a registered in-house template is missing from the built bundle,
 *  4. (prod only) the bundle is OLDER than the build that is live on the server.
 *     This one exists because a "verified" deploy of prod's branch tip silently
 *     reverted 81 commits that were live but never cherry-picked onto `prod`
 *     (2026-11-23, film-roll video). The check reads the server's RELEASE.json;
 *     when it cannot be read (ssh down, first deploy) it warns and continues —
 *     it must never become a deploy blocker on its own.
 *
 * Usage:
 *   node scripts/predeploy-guard.mjs                 # prod (default)
 *   node scripts/predeploy-guard.mjs --ref jclolnjkjhyjilvymagr   # staging
 *   node scripts/predeploy-guard.mjs --allow-stale   # skip the git sync check
 *   node scripts/predeploy-guard.mjs --allow-dirty   # skip the clean-tree check
 *   node scripts/predeploy-guard.mjs --allow-downgrade  # ship an older commit anyway
 *   node scripts/predeploy-guard.mjs --live-release <file>  # evaluate a fixture instead of ssh
 *   node scripts/predeploy-guard.mjs --sync-only     # git checks only (post-rsync)
 */
import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync, existsSync } from "node:fs"
import { CONTRACT } from "../env/contract.mjs"
import { evaluateDowngrade } from "./lib/release-guards.mjs"

const args = process.argv.slice(2)
const allowStale = args.includes("--allow-stale")
const allowAhead = args.includes("--allow-ahead")
const allowDirty = args.includes("--allow-dirty")
// --sync-only re-runs just the git checks (used after the rsync to catch a push
// that landed while the deploy was copying files).
const syncOnly = args.includes("--sync-only")
const targetIdx = args.indexOf("--target")
const expectTarget = targetIdx >= 0 ? args[targetIdx + 1] : "prod"
const refIdx = args.indexOf("--ref")
const expectRef = refIdx >= 0 ? args[refIdx + 1] : CONTRACT[expectTarget]?.ref
const siteIdx = args.indexOf("--site-url")
const expectSiteUrl = siteIdx >= 0 ? args[siteIdx + 1] : null
// Which branch prod/staging is supposed to be built from. `main` until the
// release train introduces the `prod` branch (phase 5), then deploy passes
// --branch prod.
const branchIdx = args.indexOf("--branch")
const expectBranch = branchIdx >= 0 ? args[branchIdx + 1] : "main"

// Build noise + docs never affect the bundle or the served files.
const DIRTY_ALLOWLIST = [
  /^tsconfig\.tsbuildinfo$/,
  /\.log$/,
  /^docs\//,
  /^(^|\/)\.DS_Store$/,
]

const fail = (msg) => {
  console.error(`\n✗ PREDEPLOY GUARD FAILED\n  ${msg}\n`)
  process.exit(1)
}
const ok = (msg) => console.log(`✓ ${msg}`)
const warn = (msg) => console.warn(`! ${msg}`)

/**
 * Read the RELEASE.json of the build that is currently live on prod. Any failure
 * (ssh down, missing file, bad JSON) returns `{ commit: null }` so the caller can
 * skip instead of blocking: this guard must never make a healthy deploy fail.
 */
function readLiveRelease(argv) {
  const fileIdx = argv.indexOf("--live-release")
  if (fileIdx >= 0) {
    const file = argv[fileIdx + 1]
    try {
      const j = JSON.parse(readFileSync(file, "utf8"))
      return { commit: j.commit || null, source: file }
    } catch (e) {
      return { commit: null, source: `${file}: ${e.message}` }
    }
  }
  const server = process.env.DEPLOY_SERVER || "askaraa@103.93.135.176"
  const key = process.env.SSH_KEY || `${process.env.HOME}/.ssh/aksaraa_deploy`
  const remote = process.env.LIVE_REMOTE || "/var/www/aksara-wedding"
  const timeout = Number(process.env.DOWNGRADE_CHECK_TIMEOUT_MS || 12000)
  try {
    const raw = execSync(
      `ssh -i "${key}" -o BatchMode=yes -o ConnectTimeout=8 -o ServerAliveInterval=15 -o ServerAliveCountMax=2 ` +
        `${server} 'cat ${remote}/.next/standalone/RELEASE.json'`,
      { encoding: "utf8", timeout, stdio: ["ignore", "pipe", "ignore"] },
    )
    const j = JSON.parse(raw)
    return { commit: j.commit || null, source: `${server}:${remote}` }
  } catch (e) {
    return { commit: null, source: `ssh ${server} failed (${String(e.message).split("\n")[0]})` }
  }
}

// ---------- 1. git must not be behind origin/<expectBranch> ----------
if (!allowStale) {
  try {
    execSync("git fetch origin --quiet", { stdio: "ignore", env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" } })
    // A tag/commit build skips the branch comparison: the tag is immutable and
    // `--commit` pins exactly which tree must be in the working directory.
    const commitIdx2 = args.indexOf("--commit")
    const expectCommit = commitIdx2 >= 0 ? args[commitIdx2 + 1] : null
    if (expectCommit) {
      const want = execSync(`git rev-parse ${expectCommit}^{commit}`, {
        encoding: "utf8",
        env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
      }).trim()
      const headFull = execSync("git rev-parse HEAD", {
        encoding: "utf8",
        env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
      }).trim()
      if (want !== headFull) {
        fail(`working tree is at ${headFull.slice(0, 7)} but --commit ${expectCommit} is ${want.slice(0, 7)}.\n  Build from that ref: git worktree add --detach /tmp/build ${expectCommit}`)
      }
      ok(`tree matches --commit ${expectCommit} (${headFull.slice(0, 7)})`)
    } else {
    const upstream = `origin/${expectBranch}`
    const behind = execSync(`git rev-list --count HEAD..${upstream}`, {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    }).trim()
    const ahead = execSync(`git rev-list --count ${upstream}..HEAD`, {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    }).trim()
    if (Number(behind) > 0) {
      // "Behind" is an ancestry count, not a timeline: a cherry-picked branch
      // always has commits the other line does not. Say that, with the numbers,
      // and point at the fix instead of a misleading "git pull --rebase".
      const hint =
        expectBranch === "prod"
          ? `  A prod deploy must be built from ${upstream}. Promote first:\n` +
            `    - cherry-pick model: git switch prod && npm run release:pick -- <sha>\n` +
            `    - trunk model: tag the verified main commit (npm run release:tag) and build that tag\n` +
            `  Never build prod from main: NEXT_PUBLIC_* is baked per environment.`
          : `  Run: git pull --rebase origin ${expectBranch}   (or pass --allow-stale if intentional)`
      fail(
        `HEAD is not ${upstream}.\n` +
          `  diverged: HEAD-only ${ahead} commit(s), ${upstream}-only ${behind} commit(s).\n` +
          `  "${behind} behind" means ${upstream} contains ${behind} commit(s) this build does not.\n` +
          hint,
      )
    }
    if (!allowAhead && Number(ahead) > 0) {
      fail(
        `local HEAD is ${ahead} commit(s) ahead of ${upstream}.\n` +
          `  Push first so other agents cannot build/deploy a tree without your work.\n` +
          `  Run: git push origin HEAD:${expectBranch}   (or pass --allow-ahead if intentional)`,
      )
    }
    const head = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    }).trim()
    ok(`tree in sync with ${upstream} (HEAD ${head})`)
    }
  } catch (e) {
    if (String(e.message).includes("PREDEPLOY")) throw e
    console.warn("! could not verify git sync (git unavailable) — continuing")
  }
}

// ---------- 1b. working tree must be clean ----------
// Uncommitted work (typically another agent's WIP sharing this checkout) is
// compiled into the bundle and deployed, and untracked files under src/ or
// public/ are picked up by file-system routing and rsync even without a commit.
if (!allowDirty && !syncOnly) {
  let porcelain = ""
  try {
    porcelain = execSync("git status --porcelain --untracked-files=all", {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
    })
  } catch {
    console.warn("! could not read git status — continuing")
  }
  const dirty = porcelain
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[A-Z?!]{1,2}\s+/, "").trim())
    .filter((p) => p && !DIRTY_ALLOWLIST.some((re) => re.test(p)))
  if (dirty.length > 0) {
    fail(
      `working tree has ${dirty.length} uncommitted path(s):\n` +
        dirty.slice(0, 12).map((p) => `    ${p}`).join("\n") +
        (dirty.length > 12 ? `\n    …and ${dirty.length - 12} more` : "") +
        `\n  Building here would compile another agent's work-in-progress into the bundle.\n` +
        `  Commit it, stash it, or build from a clean worktree:\n` +
        `    git worktree add --detach /tmp/build origin/main && cd /tmp/build\n` +
        `  (pass --allow-dirty if the changes are yours and intended)`,
    )
  }
  ok("working tree clean")
}

// --sync-only stops here: deploy.sh re-runs this after the rsync to catch a
// push that landed while files were copying.
if (syncOnly) process.exit(0)

const GIT_ENV = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" }

// ---------- 2. the bundle must declare which env and which commit it is ----------
// `next build` also loads `.env.local` (the staging project in this repo), so an
// unset key silently bakes the wrong environment. The project-ref grep below
// cannot catch that by itself: src/lib/assets.ts hardcodes the prod project URL
// and src/components/templates/demoProps.ts hardcodes prod storage URLs, so a
// staging bundle contains the prod ref too (proven on the Nov 21 build). The
// manifest is written by scripts/build-env.mjs after validating the whole
// environment, and its anon-key fingerprint cannot be satisfied by a source
// literal.
const buildEnvPath = ".next/build-env.json"
if (!existsSync(buildEnvPath)) {
  fail(
    `no ${buildEnvPath} — this bundle was not built with \`npm run build:env\`.\n` +
      `  Its environment and commit cannot be proven, so it must not be deployed.\n` +
      `  Rebuild:\n` +
      `    set -a; source .env.build.${expectTarget}; set +a\n` +
      `    npm run build:env -- --env ${expectTarget}`,
  )
}

let manifest
try {
  manifest = JSON.parse(readFileSync(buildEnvPath, "utf8"))
} catch (e) {
  fail(`${buildEnvPath} is not valid JSON: ${e.message}`)
}

const contract = CONTRACT[expectTarget]
if (!contract) fail(`unknown target "${expectTarget}" (known: ${Object.keys(CONTRACT).join(", ")})`)

if (manifest.env !== expectTarget) {
  fail(
    `bundle was built for "${manifest.env}" but you are deploying "${expectTarget}".\n` +
      `  This is the failure mode that would bake staging credentials into prod. Rebuild for ${expectTarget}.`,
  )
}
ok(`bundle env is ${manifest.env}`)

if (manifest.dirty !== false) {
  fail(`bundle was built from a dirty tree (dirty=${manifest.dirty}) — rebuild from a clean commit.`)
}

const headFull = execSync("git rev-parse HEAD", { encoding: "utf8", env: GIT_ENV }).trim()
if (manifest.commit !== headFull) {
  fail(
    `bundle commit ${String(manifest.commit).slice(0, 7)} does not match HEAD ${headFull.slice(0, 7)}.\n` +
      `  A build made before a rebase still passes the tree checks and would revert\n` +
      `  whatever landed in between. Rebuild at HEAD.`,
  )
}
if (manifest.branch !== expectBranch) {
  fail(`bundle was built on branch "${manifest.branch}", expected "${expectBranch}" — build from ${expectBranch}.`)
}
ok(`bundle commit matches HEAD (${headFull.slice(0, 7)} on ${expectBranch})`)

if (contract.anonKeySha256 && manifest.anonKeySha256 !== contract.anonKeySha256) {
  fail(
    `bundle anon-key fingerprint ${String(manifest.anonKeySha256).slice(0, 12)}… is not the ${expectTarget} key ` +
      `(${contract.anonKeySha256.slice(0, 12)}…).\n` +
      `  The wrong Supabase project was baked. Rebuild with .env.build.${expectTarget}.`,
  )
}

const shellAnon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
if (shellAnon) {
  const shellHash = createHash("sha256").update(shellAnon).digest("hex")
  if (shellHash !== manifest.anonKeySha256) {
    fail(
      "the anon key exported in this shell does not match the bundle's fingerprint.\n" +
        "  The shell and the bundle are on different Supabase projects — do not deploy.",
    )
  }
}
ok(`anon-key fingerprint matches ${expectTarget}`)

if (manifest.siteUrl !== contract.buildPublic.NEXT_PUBLIC_SITE_URL) {
  fail(
    `bundle site URL is "${manifest.siteUrl}", expected "${contract.buildPublic.NEXT_PUBLIC_SITE_URL}".\n` +
      `  A staging URL in a prod bundle breaks every generated guest link.`,
  )
}
if (manifest.coupleMode !== contract.buildPublic.NEXT_PUBLIC_COUPLE_URL_MODE) {
  fail(
    `bundle couple-link mode is "${manifest.coupleMode}", expected "${contract.buildPublic.NEXT_PUBLIC_COUPLE_URL_MODE}".`,
  )
}
ok(`bundle identity: ${manifest.env} @ ${String(manifest.commit).slice(0, 7)} (${manifest.coupleMode})`)

// ---------- 2a. prod gate: only verified, non-rejected staging ancestry ----------
const allowUnverified = args.includes("--allow-unverified")
if (expectTarget === "prod") {
  // The ledger lives on main, not in the build tree: a ledger commit on prod
  // would move the tip after it was rehearsed, so the next build could never
  // satisfy its own gate. Read it from a ref instead (default origin/main).
  const ledgerRefIdx = args.indexOf("--ledger-ref")
  const ledgerRef = ledgerRefIdx >= 0 ? args[ledgerRefIdx + 1] : "origin/main"
  let ledgerText = null
  try {
    ledgerText = execSync(`git show ${ledgerRef}:releases/ledger.jsonl`, {
      encoding: "utf8",
      env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
      stdio: ["ignore", "pipe", "ignore"],
    })
  } catch {
    /* ref or file missing */
  }
  if (ledgerText === null) {
    try { ledgerText = readFileSync("releases/ledger.jsonl", "utf8") } catch { ledgerText = null }
  }
  if (ledgerText === null) {
    if (allowUnverified) console.warn(`! no release ledger at ${ledgerRef}:releases/ledger.jsonl — skipping prod verification gate (--allow-unverified)`)
    else fail(`no release ledger at ${ledgerRef}:releases/ledger.jsonl. Verify the commit on staging first, or pass --allow-unverified for an emergency.`)
  } else {
    const entries = ledgerText.split("\n").filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)] } catch { return [] } })
    const verifiedStaging = entries.filter((e) => e.env === "staging" && e.state === "verified")
    const tip = verifiedStaging[verifiedStaging.length - 1]
    if (!tip) {
      if (allowUnverified) console.warn("! no verified staging tip in ledger (--allow-unverified)")
      else fail("prod deploy requires a verified staging tip in releases/ledger.jsonl. Run: npm run release:verify -- --env staging --commit <sha>")
    } else {
      const isAnc = (() => { try { execSync(`git merge-base --is-ancestor ${manifest.commit} ${tip.sha}`, { stdio: "ignore", env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" } }); return true } catch { return false } })()
      if (!isAnc) {
        if (allowUnverified) console.warn(`! ${manifest.short} is not an ancestor of verified staging tip ${String(tip.sha).slice(0,7)} (--allow-unverified)`)
        else fail(`commit ${manifest.short} is not an ancestor of the latest verified staging tip ${String(tip.sha).slice(0,7)}.\n  Verify it on staging before promoting to prod.`)
      } else {
        const rejection = entries.find((e) => e.sha === manifest.commit && e.env === "staging" && e.state === "rejected" && e.at > tip.at)
        if (rejection) {
          if (allowUnverified) console.warn(`! commit ${manifest.short} was rejected after verification (--allow-unverified): ${rejection.note || ""}`)
          else fail(`commit ${manifest.short} was rejected after staging verification: ${rejection.note || "(no reason)"}`)
        } else {
          ok(`prod gate: ${manifest.short} is ancestor of verified staging tip ${String(tip.sha).slice(0,7)}`)
        }
      }
    }
  }
}

// ---------- 2a2. prod must never move backwards ----------
// The verified-staging gate above proves a commit was *tested*; it does not prove
// it is *newer* than the build users are on. On 2026-11-23 that gap shipped prod
// backwards 81 commits (branch `prod` never got the commits that had been deployed
// from main) and the loss was invisible to the smoke test.
if (expectTarget === "prod" && !syncOnly) {
  const allowDowngrade = args.includes("--allow-downgrade")
  const GIT_ENV = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" }
  const live = readLiveRelease(args)
  if (!live.commit) {
    warn(`live prod build unreadable (${live.source}) — downgrade check skipped`)
  } else {
    const hasCommit = (sha) => {
      try {
        execSync(`git cat-file -e ${sha}^{commit}`, { stdio: "ignore", env: GIT_ENV })
        return true
      } catch {
        return false
      }
    }
    // A live commit that predates our clone (a fresh shallow checkout) must not
    // be reported as a downgrade: fetch first, then decide.
    if (!hasCommit(live.commit)) {
      try {
        execSync("git fetch origin --quiet", { stdio: "ignore", env: GIT_ENV, timeout: 30_000 })
      } catch {
        /* offline: evaluateDowngrade() reports "skip" */
      }
    }
    const localHasLive = hasCommit(live.commit)
    const liveIsAncestor = localHasLive && manifest.commit
      ? (() => {
          try {
            execSync(`git merge-base --is-ancestor ${live.commit} ${manifest.commit}`, { stdio: "ignore", env: GIT_ENV })
            return true
          } catch {
            return false
          }
        })()
      : false
    const verdict = evaluateDowngrade({
      liveCommit: live.commit,
      targetCommit: manifest.commit,
      localHasLiveCommit: localHasLive,
      liveIsAncestorOfTarget: liveIsAncestor,
    })
    if (verdict.level === "fail") {
      if (allowDowngrade) warn(`${verdict.message}\n  (shipping anyway: --allow-downgrade)`)
      else fail(verdict.message)
    } else if (verdict.level === "ok") {
      ok(`prod downgrade check: ${verdict.message}`)
    } else {
      warn(verdict.message)
    }
  }
}

// ---------- 2b. baked Supabase env (defence in depth) ----------
const chunkDir = ".next/standalone/.next/server/chunks"
if (!existsSync(chunkDir)) fail("no .next/standalone build found — run `npm run build` first")

let baked = ""
try {
  baked = execSync(
    `grep -rho "127\\.0\\.0\\.1:54321\\|ylmfgorryxzpdckkebnr\\.supabase\\.co\\|jclolnjkjhyjilvymagr\\.supabase\\.co\\|supabase-demo" ${chunkDir} || true`,
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  )
} catch {
  /* grep exits 1 when nothing matched */
}
if (baked.includes("127.0.0.1:54321") || baked.includes("supabase-demo")) {
  fail(
    "bundle contains LOCAL Supabase credentials (127.0.0.1:54321 / supabase-demo).\n" +
      "  Rebuild with the right env sourced for the target environment.",
  )
}
if (!baked.includes(`${expectRef}.supabase.co`)) {
  fail(`bundle does not reference ${expectRef}.supabase.co — wrong env was baked.`)
}
const otherRef =
  expectRef === "ylmfgorryxzpdckkebnr" ? "jclolnjkjhyjilvymagr" : "ylmfgorryxzpdckkebnr"
if (baked.includes(`${otherRef}.supabase.co`)) {
  console.warn(`! bundle also references ${otherRef}.supabase.co (mixed refs) — verify this is intentional`)
}
ok(`baked env points at ${expectRef}.supabase.co`)

if (expectSiteUrl) {
  let siteBaked = ""
  try {
    siteBaked = execSync(`grep -rho "${expectSiteUrl.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}" ${chunkDir} || true`, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch {}
  if (!siteBaked.includes(expectSiteUrl)) {
    fail(`bundle does not reference expected site URL ${expectSiteUrl} — wrong NEXT_PUBLIC_SITE_URL was baked.`)
  }
  ok(`baked site URL includes ${expectSiteUrl}`)
}

// ---------- 3. every registered template must exist in the bundle ----------
const registry = readFileSync("src/components/templates/index.ts", "utf8")
const mapBlock = registry.slice(registry.indexOf("TEMPLATE_MAP"), registry.indexOf("}", registry.indexOf("TEMPLATE_MAP")))
const codes = [...mapBlock.matchAll(/^\s{2}"?([a-z0-9_-]+)"?:\s*\w+,$/gim)].map((m) => m[1])
if (codes.length < 5) fail(`could not parse template codes from TEMPLATE_MAP (found ${codes.length})`)

const bundleText = execSync(`grep -rho '"${codes.join('"\\|"')}"' ${chunkDir} 2>/dev/null | sort -u || true`, {
  encoding: "utf8",
  maxBuffer: 128 * 1024 * 1024,
})
const missing = codes.filter((c) => !bundleText.includes(`"${c}"`))
if (missing.length) {
  fail(`template code(s) registered but missing from the bundle: ${missing.join(", ")}`)
}
ok(`all ${codes.length} registered templates present in bundle`)

const buildId = readFileSync(".next/standalone/.next/BUILD_ID", "utf8").trim()
ok(`BUILD_ID ${buildId} — safe to rsync`)

// ---------- 3b. Material Symbols subset ----------
// A used-but-unsubset icon renders as a blank glyph in production. Cheap local
// grep, no network.
try {
  const out = execSync("node scripts/check-material-icons.mjs 2>&1 || true", { encoding: "utf8" })
  const line = out.trim().split("\n").pop() || ""
  if (out.includes("✗")) fail(`Material Symbols subset is missing icons:\n${out}`)
  ok(line)
} catch {
  console.warn("! could not check the Material Symbols subset")
}

// ---------- 3b2. i18n keys ----------
// Every t()/tf() key must exist in src/lib/i18n.ts.
try {
  const out = execSync("node scripts/check-i18n.mjs 2>&1 || true", { encoding: "utf8" })
  const line = out.trim().split("\n").pop() || ""
  if (out.includes("✗")) fail(`i18n key check failed:\n${out}`)
  ok(line)
} catch {
  console.warn("! could not check i18n keys")
}

// ---------- 3b3. extras catalogue ----------
// A registered field the template never renders is a dead input, and a
// `tc.<key>` read with no field is copy the couple cannot edit. Both were
// found by hand on 2026-11-24; the check makes that class of regression a
// deploy blocker instead of a support ticket.
try {
  const out = execSync("npm run audit:extras 2>&1 || true", { encoding: "utf8" })
  if (out.includes("✗")) fail(`extra-field catalogue is inconsistent:
${out.slice(-2500)}`)
  ok("extra-field catalogue consistent")
} catch {
  console.warn("! could not run audit:extras")
}

// ---------- 3b4. generated extras defaults ----------
// EXTRA_DEFAULTS is generated from the templates' own fallback copy. Stale
// means the editor hints the wrong string in one language.
try {
  const out = execSync("npm run check:extra-defaults 2>&1 || true", { encoding: "utf8" })
  const line = out.trim().split("\n").pop() || ""
  if (out.includes("✗")) fail(`generated extra defaults are stale:
${out}`)
  ok(line)
} catch {
  console.warn("! could not check generated extra defaults")
}

// ---------- 3c. one copy path ----------
// A copy action must never serialise markup out of the DOM: iOS/iPadOS Safari
// rewrites phone-shaped text into <a href="tel:…">, which is how a bank account
// number reached guests as "<a href=\"tel:7297648165\">7297648165</a>". Every
// copy goes through src/lib/clipboard.ts; a hand-rolled execCommand fallback
// inside a component is that bug waiting to come back.
if (!existsSync("src/lib/clipboard.ts")) {
  fail("src/lib/clipboard.ts is missing — every copy path must go through it.")
}
const helper = readFileSync("src/lib/clipboard.ts", "utf8")
if (!helper.includes("export async function copyPlainText")) {
  fail("src/lib/clipboard.ts no longer exports copyPlainText.")
}
const copyOffenders = execSync(
  `grep -rn "execCommand" src --include=*.ts --include=*.tsx | grep -v "^src/lib/clipboard.ts:" || true`,
  { encoding: "utf8" },
).trim()
if (copyOffenders) {
  fail(`hand-rolled clipboard fallback outside src/lib/clipboard.ts:\n${copyOffenders}`)
}
ok("single copy path (src/lib/clipboard.ts)")

// ---------- 3d. tree hygiene + credentials ----------
// Blocks a deploy if a credential file or secret-shaped string is tracked, if
// the index lies about a deletion, or if a rebase/merge left stale state.
// (`.env.local.prod` and `.env.local.bak-*` were committed in 2026 and had to be
// rewritten out of history; this is the regression guard.)
try {
  const out = execSync("node scripts/tree-doctor.mjs 2>&1 || true", { encoding: "utf8" })
  if (out.includes("✗")) fail(`tree doctor failed:\n${out}`)
  ok("tree doctor clean (no tracked credentials)")
} catch {
  console.warn("! could not run tree doctor")
}

// ---------- 4. media budget (report only) ----------
// Every template's art is served straight from the box, whose measured egress is
// ~4 Mbps in total. This prints the offenders on every deploy so the growth is
// impossible to miss, but it must not block a deploy that is unrelated to media:
// run `node scripts/check-media-budget.mjs` (no --warn) to fail locally.
try {
  const report = execSync("node scripts/check-media-budget.mjs --warn 2>&1 || true", {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
  const summary = report
    .split("\n")
    .filter((line) => line.startsWith("Total ") || line.startsWith("  x "))
    .slice(0, 12)
    .join("\n")
  console.log(`\n— media budget (report only) —\n${summary}`)
} catch {
  console.warn("! media budget check could not run")
}
