// Pure decisions for the release guards. No I/O here so they can be unit-tested.
//
// WHY: on 2026-11-23 a prod deploy promoted switch `prod`'s branch tip while the
// live server was running a NEWER commit from main (136156b8). The guard checked
// env, ancestry to a verified staging tip and a clean tree — none of which notice
// that the bundle is OLDER than what is running. Prod went backwards 81 commits
// and silently lost the film-roll/shared video normalisation.

/**
 * Compare the commit that is live in prod with the commit about to be deployed.
 * A deploy is a downgrade when the live commit is not an ancestor of the target:
 * the target then does not contain what users are already using.
 *
 * `liveCommit === null` means the live build could not be read (ssh down, no
 * RELEASE.json, first ever deploy) — that is a skip, never a failure: the guard
 * must not become a deploy blocker when the server is unreachable.
 *
 * @param {object} input
 * @param {string|null} input.liveCommit
 * @param {string|null} input.targetCommit
 * @param {boolean} input.localHasLiveCommit
 * @param {boolean} input.liveIsAncestorOfTarget
 * @returns {{level: "ok"|"skip"|"warn"|"fail", message: string}}
 */
export function evaluateDowngrade({
  liveCommit,
  targetCommit,
  localHasLiveCommit,
  liveIsAncestorOfTarget,
}) {
  const live = liveCommit ? String(liveCommit).slice(0, 7) : null
  const target = targetCommit ? String(targetCommit).slice(0, 7) : null

  if (!targetCommit) return { level: "skip", message: "bundle has no commit in RELEASE.json — downgrade check skipped" }
  if (!liveCommit) return { level: "skip", message: "live prod commit unknown — downgrade check skipped" }
  if (liveCommit === targetCommit) return { level: "ok", message: `prod already runs ${live}` }
  if (!localHasLiveCommit) {
    return {
      level: "skip",
      message: `live prod commit ${live} is not in this clone — downgrade check skipped (run git fetch)`,
    }
  }
  if (liveIsAncestorOfTarget) {
    return { level: "ok", message: `live prod ${live} is an ancestor of ${target} (forward deploy)` }
  }
  return {
    level: "fail",
    message:
      `commit ${target} does NOT contain the commit that is live in prod (${live}).\n` +
      `  Deploying it moves prod backwards and silently drops everything between them.\n` +
      `  Rebuild on top of the live commit (or the branch that contains it), then redeploy.\n` +
      `  Emergency override: npm run deploy -- --allow-downgrade`,
  }
}

/**
 * Decide whether a live commit that is NOT an ancestor of the target can still
 * be superseded safely: a hotfix branch cut from the deployed commit (e.g.
 * `c0f5d766` cut from `136156b8`) has no ancestry link to the release train, so
 * the ancestry check cannot prove the deploy keeps the hotfix. This compares the
 * content instead — the files the live commit changed must be byte-identical in
 * the target. Nothing is lost when they are, even though the SHA is.
 *
 * @param {object} input
 * @param {string|null} input.liveCommit
 * @param {string|null} input.targetCommit
 * @param {string[]} input.changedFiles  files the live commit changed (vs its parent)
 * @param {string[]} input.lostFiles     those of `changedFiles` that differ in the target
 * @returns {{level: "warn"|"fail", message: string}}
 */
export function evaluateSupersession({ liveCommit, targetCommit, changedFiles, lostFiles }) {
  const live = liveCommit ? String(liveCommit).slice(0, 7) : "?"
  const target = targetCommit ? String(targetCommit).slice(0, 7) : "?"

  if (!liveCommit || !targetCommit) {
    return { level: "fail", message: `cannot prove supersession without both commits (live ${live}, target ${target})` }
  }
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return { level: "fail", message: `live prod ${live} is not an ancestor of ${target} and its diff against the parent is unreadable` }
  }
  if (Array.isArray(lostFiles) && lostFiles.length > 0) {
    const shown = lostFiles.slice(0, 4).join(", ")
    return {
      level: "fail",
      message:
        `live prod ${live} is not an ancestor of ${target}, and ${lostFiles.length} file(s) it changed differ in the target (${shown}${lostFiles.length > 4 ? ", …" : ""}).\n` +
        `  Deploying it would drop that hotfix. Rebuild on top of ${live} instead.`,
    }
  }
  const shown = changedFiles.slice(0, 4).join(", ")
  return {
    level: "warn",
    message:
      `live prod ${live} is not an ancestor of ${target}, but the ${changedFiles.length} file(s) it changed are byte-identical in the target ` +
      `(${shown}${changedFiles.length > 4 ? ", …" : ""}) — content-superseded, the hotfix is preserved.`,
  }
}

/**
 * Cross-check the three sources of truth for what is in prod: the branch tip,
 * the last `deployed` ledger entry, and the live RELEASE.json. Report-only.
 *
 * @param {object} input
 * @param {string|null} input.branchTip
 * @param {{sha: string, at?: string}|null} input.ledgerProd
 * @param {string|null} input.liveCommit
 * @param {(a: string, b: string) => boolean|null} input.isAncestor
 * @returns {Array<{level: "ok"|"warn", label: string, message: string}>}
 */
export function diagnoseProdDrift({ branchTip, ledgerProd, liveCommit, isAncestor }) {
  const short = (sha) => (sha ? String(sha).slice(0, 7) : "unknown")
  const out = []

  out.push({ level: "ok", label: "prod branch", message: short(branchTip) })
  out.push({ level: "ok", label: "ledger (last prod deploy)", message: ledgerProd ? short(ledgerProd.sha) : "none recorded" })
  out.push({ level: "ok", label: "live RELEASE.json", message: short(liveCommit) })

  if (ledgerProd && liveCommit && ledgerProd.sha !== liveCommit) {
    out.push({
      level: "warn",
      label: "ledger vs live",
      message: `ledger says ${short(ledgerProd.sha)} was deployed but the server runs ${short(liveCommit)}`,
    })
  }
  if (branchTip && liveCommit) {
    const contains = isAncestor ? isAncestor(liveCommit, branchTip) : null
    if (liveCommit !== branchTip && contains === false) {
      out.push({
        level: "warn",
        label: "branch vs live",
        message: `prod branch ${short(branchTip)} does NOT contain the live commit ${short(liveCommit)} — deploying --branch prod would move prod backwards`,
      })
    } else if (liveCommit !== branchTip) {
      out.push({
        level: "ok",
        label: "branch vs live",
        message: `prod branch ${short(branchTip)} is ahead of live ${short(liveCommit)}`,
      })
    }
  }
  return out
}
