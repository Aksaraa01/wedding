#!/usr/bin/env node
// Media budget for template art.
//
// Every template ships its decorative art in `public/templates/<code>/` and the
// app serves it from the VPS. The invitation is unusable long before the guest
// is on a fast link: the measured aggregate egress of the box is ~4 Mbps, so a
// 5 MB page costs 10 s and a 20 MB template is hopeless.
//
// This guard keeps the growth visible. Run it manually:
//   node scripts/check-media-budget.mjs
//   node scripts/check-media-budget.mjs --warn     # report only, exit 0
//
// It is wired into scripts/predeploy-guard.mjs in --warn mode until the known
// offenders are re-encoded, so it can never block an unrelated deploy.
import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { mp4AtomOrder } from "./mp4-faststart.mjs"

const ROOT = "public/templates"

// Bytes the guest actually pays for. These are budgets, not wishes: tighten them
// as the templates get optimised, never loosen them to make a build pass.
const LIMITS = {
  imageWarnKB: 300,
  imageFailKB: 800,
  videoFailKB: 1200,
  totalWarnMB: 12,
}

const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const warn = []
const fails = []

function kb(bytes) {
  return Math.round(bytes / 1024)
}

const templates = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "thumbs")
  .map((d) => d.name)
  .sort()

const rows = []
for (const code of templates) {
  const dir = join(ROOT, code)
  const files = walk(dir)
  let total = 0
  let biggest = { file: "", size: 0 }
  const videos = []

  for (const file of files) {
    const size = statSync(file).size
    total += size
    const rel = relative(ROOT, file)
    if (size > biggest.size) biggest = { file: rel, size }
    if (VIDEO_EXT.test(file)) videos.push({ file: rel, size })

    if (IMAGE_EXT.test(file) && size > LIMITS.imageFailKB * 1024) {
      fails.push(`${rel} is ${kb(size)} KB (image limit ${LIMITS.imageFailKB} KB)`)
    } else if (IMAGE_EXT.test(file) && size > LIMITS.imageWarnKB * 1024) {
      warn.push(`${rel} is ${kb(size)} KB (warn above ${LIMITS.imageWarnKB} KB)`)
    }
  }

  for (const video of videos) {
    if (video.size > LIMITS.videoFailKB * 1024) {
      fails.push(`${video.file} is ${kb(video.size)} KB (video limit ${LIMITS.videoFailKB} KB)`)
    }
    const order = mp4AtomOrder(join(ROOT, video.file))
    if (!order.ok) {
      fails.push(`${video.file} is not faststart (moov must precede mdat): ${order.reason || "moov after mdat"}`)
    }
  }

  const totalMB = total / (1024 * 1024)
  if (totalMB > LIMITS.totalWarnMB) {
    warn.push(`${code} totals ${totalMB.toFixed(1)} MB (warn above ${LIMITS.totalWarnMB} MB)`)
  }

  rows.push({ code, files: files.length, totalMB, biggest, videos: videos.length })
}

console.log("Template media budget\n")
console.log(
  ["template".padEnd(28), "files".padStart(5), "total".padStart(9), "largest file".padStart(12), "  biggest"].join(" "),
)
for (const row of rows) {
  console.log(
    [
      row.code.padEnd(28),
      String(row.files).padStart(5),
      `${row.totalMB.toFixed(1)} MB`.padStart(9),
      `${kb(row.biggest.size)} KB`.padStart(12),
      `  ${row.biggest.file}`,
    ].join(" "),
  )
}

console.log("")
if (warn.length) {
  console.log(`Warnings (${warn.length}):`)
  for (const w of warn) console.log(`  ! ${w}`)
  console.log("")
}
if (fails.length) {
  console.log(`Violations (${fails.length}):`)
  for (const f of fails) console.log(`  x ${f}`)
  console.log("")
}

const totalMB = rows.reduce((sum, row) => sum + row.totalMB, 0)
console.log(
  `Total ${rows.length} templates: ${totalMB.toFixed(1)} MB, ${warn.length} warning(s), ${fails.length} violation(s)`,
)

const warnOnly = process.argv.includes("--warn")
if (fails.length && !warnOnly) process.exit(1)
if (fails.length && warnOnly) console.log("(--warn: not failing the build)")
