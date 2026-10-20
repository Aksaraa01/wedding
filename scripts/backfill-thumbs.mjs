#!/usr/bin/env node
/**
 * Backfill pre-generated WebP thumbnails for objects already in the `media`
 * bucket (uploads after this change generate them inline).
 *
 * Usage (prod):
 *   node --env-file=.env.local.prod scripts/backfill-thumbs.mjs --dry-run
 *   node --env-file=.env.local.prod scripts/backfill-thumbs.mjs
 *   node --env-file=.env.local.prod scripts/backfill-thumbs.mjs --verify
 *
 * Flags: --dry-run, --verify, --concurrency=N, --limit=N
 *
 * Skips: thumbs/, template-media/og/, svg/gif/heic/heif/audio. Thumbnail
 * widths MUST match src/lib/storageUrl.ts (guest-photos: 400/800, others:
 * 400/800/1200).
 */
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const BUCKET = "media"
const THUMB_PREFIX = "thumbs"
const SKIP_MANIFEST = `${THUMB_PREFIX}/_skipped.json`
const GUEST_WIDTHS = [400, 800]
const DEFAULT_WIDTHS = [400, 800, 1200]
const NON_DERIVABLE_EXT = /\.(svg|gif|heic|heif|mp3|wav|ogg|m4a|aac)$/i
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|bmp|tiff?)$/i
const THUMB_QUALITY = 72

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const verifyOnly = args.includes("--verify")
const limitArg = args.find((a) => a.startsWith("--limit="))
const limit = limitArg ? Math.max(0, parseInt(limitArg.split("=")[1], 10) || 0) : 0
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="))
const concurrency = concurrencyArg
  ? Math.min(12, Math.max(1, parseInt(concurrencyArg.split("=")[1], 10) || 4))
  : 4

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (use --env-file)")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

function widthsFor(path) {
  if (path.startsWith(`${THUMB_PREFIX}/`)) return []
  if (path.startsWith("template-media/og/")) return []
  if (NON_DERIVABLE_EXT.test(path)) return []
  if (path.startsWith("guest-photos/")) return GUEST_WIDTHS
  return DEFAULT_WIDTHS
}

function thumbPath(path, width) {
  return `${THUMB_PREFIX}/${width}/${path.replace(/\.[^./]+$/, "")}.webp`
}

async function listAll(prefix) {
  const out = []
  const queue = [prefix]
  while (queue.length) {
    const current = queue.shift()
    let offset = 0
    for (;;) {
      const { data, error } = await supabase.storage.from(BUCKET).list(current, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      })
      if (error) throw error
      if (!data?.length) break
      for (const item of data) {
        const path = current ? `${current}/${item.name}` : item.name
        if (!item.id) {
          queue.push(path)
          continue
        }
        out.push({
          path,
          size: Number(item.metadata?.size || 0),
          mimetype: item.metadata?.mimetype || "",
        })
      }
      if (data.length < 100) break
      offset += 100
    }
  }
  return out
}

async function loadSkipped() {
  const { data, error } = await supabase.storage.from(BUCKET).download(SKIP_MANIFEST)
  if (error || !data) return new Set()
  try {
    const parsed = JSON.parse(await data.text())
    return new Set(Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [])
  } catch {
    return new Set()
  }
}

async function saveSkipped(skipped) {
  const body = JSON.stringify([...skipped].sort(), null, 2)
  const { error } = await supabase.storage.from(BUCKET).upload(SKIP_MANIFEST, body, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "60",
  })
  if (error) console.warn("[backfill] failed to save skip manifest:", error.message)
}

async function withRetry(fn, label, attempts = 3) {
  let lastErr
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < attempts) await new Promise((r) => setTimeout(r, 500 * i))
    }
  }
  throw new Error(`${label}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`)
}

async function main() {
  console.log(`[backfill] ${url} bucket=${BUCKET} dryRun=${dryRun} verify=${verifyOnly} concurrency=${concurrency}`)
  console.log("[backfill] listing objects...")
  const objects = await listAll("")
  const originals = objects.filter(
    (o) =>
      !o.path.startsWith(`${THUMB_PREFIX}/`) &&
      widthsFor(o.path).length > 0 &&
      (IMAGE_EXT.test(o.path) || o.mimetype.startsWith("image/"))
  )
  const limited = limit ? originals.slice(0, limit) : originals
  console.log(`[backfill] ${objects.length} objects, ${originals.length} image candidates${limit ? `, limited to ${limited.length}` : ""}`)

  console.log("[backfill] indexing existing thumbnails...")
  const existing = new Set()
  for (const width of new Set([...GUEST_WIDTHS, ...DEFAULT_WIDTHS])) {
    for (const item of await listAll(`${THUMB_PREFIX}/${width}`)) {
      existing.add(item.path)
    }
  }
  console.log(`[backfill] ${existing.size} existing thumbnails`)
  const skipped = await loadSkipped()
  const skippedAtStart = skipped.size
  if (skipped.size) console.log(`[backfill] ${skipped.size} known-unprocessable originals (skip manifest)`)

  const tasks = []
  for (const original of limited) {
    if (skipped.has(original.path)) continue
    const missing = widthsFor(original.path)
      .map((w) => thumbPath(original.path, w))
      .filter((p) => !existing.has(p))
    if (missing.length) tasks.push({ original, missing })
  }

  console.log(`[backfill] ${tasks.length} originals need ${tasks.reduce((n, t) => n + t.missing.length, 0)} thumbnails`)

  if (verifyOnly) {
    if (tasks.length) {
      for (const t of tasks.slice(0, 50)) {
        console.log(`MISSING ${t.original.path} -> ${t.missing.join(", ")}`)
      }
      console.error(`[backfill] verify FAILED: ${tasks.length} originals missing thumbnails`)
      process.exit(1)
    }
    console.log("[backfill] verify OK")
    return
  }

  if (dryRun || tasks.length === 0) {
    const originalBytes = tasks.reduce((n, t) => n + t.original.size, 0)
    console.log(`[backfill] dry run: would download ${(originalBytes / 1024 / 1024).toFixed(1)} MB and write ${tasks.reduce((n, t) => n + t.missing.length, 0)} WebP files`)
    return
  }

  let done = 0
  let failed = 0
  let written = 0
  let writtenBytes = 0

  async function processOne(task) {
    const data = await withRetry(async () => {
      const res = await supabase.storage.from(BUCKET).download(task.original.path)
      if (res.error) throw res.error
      if (!res.data) throw new Error("empty download")
      return res.data
    }, `download ${task.original.path}`)
    const input = Buffer.from(await data.arrayBuffer())
    for (const path of task.missing) {
      const width = parseInt(path.split("/")[1], 10)
      let out
      try {
        out = await sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: THUMB_QUALITY, effort: 4 })
          .toBuffer()
      } catch (err) {
        skipped.add(task.original.path)
        console.warn(
          `[backfill] SKIP (cannot decode) ${task.original.path}:`,
          err instanceof Error ? err.message : err
        )
        return
      }
      let uploaded = false
      await withRetry(async () => {
        const res = await supabase.storage.from(BUCKET).upload(
          path,
          new Blob([new Uint8Array(out)], { type: "image/webp" }),
          {
            upsert: false,
            contentType: "image/webp",
            cacheControl: "31536000",
          }
        )
        if (res.error) {
          if (/already exists|duplicate/i.test(res.error.message)) return
          throw res.error
        }
        uploaded = true
      }, `upload ${path}`)
      if (uploaded) {
        written++
        writtenBytes += out.length
      }
    }
  }

  const queue = [...tasks]
  const workers = Array.from({ length: concurrency }, async () => {
    for (;;) {
      const task = queue.shift()
      if (!task) return
      try {
        await processOne(task)
        done++
      } catch (err) {
        failed++
        console.error(`[backfill] FAILED ${task.original.path}:`, err instanceof Error ? err.message : err)
      }
      if ((done + failed) % 25 === 0 || queue.length === 0) {
        console.log(`[backfill] progress ${done + failed}/${tasks.length} (failed ${failed}, written ${written})`)
      }
    }
  })
  await Promise.all(workers)

  if (skipped.size !== skippedAtStart) await saveSkipped(skipped)

  console.log(`[backfill] done: ${done} originals, ${written} thumbnails, ${(writtenBytes / 1024 / 1024).toFixed(1)} MB written, ${failed} failures, ${skipped.size} skipped`)
  if (failed) process.exit(1)
}

main().catch((err) => {
  console.error("[backfill] fatal:", err)
  process.exit(1)
})
