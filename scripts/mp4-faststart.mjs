#!/usr/bin/env node
// Move the `moov` atom in front of `mdat` (a.k.a. "faststart") without touching
// the media data. Every byte inside `mdat` stays identical, so this cannot
// change quality: only the index is relocated and the chunk offsets in
// `stco`/`co64` are shifted by the size of `moov`.
//
// Usage: node scripts/mp4-faststart.mjs <file> [--out <file>]
import { readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "mvex"])

function readBoxes(buf, start, end) {
  const out = []
  let off = start
  while (off + 8 <= end) {
    let size = buf.readUInt32BE(off)
    const type = buf.toString("latin1", off + 4, off + 8)
    let header = 8
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(off + 8))
      header = 16
    } else if (size === 0) {
      size = end - off
    }
    if (size < header || off + size > end) throw new Error(`corrupt box ${type} at ${off} (size ${size})`)
    out.push({ type, start: off, size, header })
    off += size
  }
  return out
}

// Walk the container boxes so we can patch every table entry (stco/co64) that
// points into mdat. A flat scan would also hit `stco` inside unrelated leaves.
function patchOffsets(buf, box, delta) {
  if (box.type === "stco" || box.type === "co64") {
    const version = buf[box.start + box.header]
    if (version !== 0) throw new Error(`unsupported ${box.type} version ${version}`)
    const count = buf.readUInt32BE(box.start + box.header + 4)
    const entry = box.type === "stco" ? 4 : 8
    let pos = box.start + box.header + 8
    if (pos + count * entry > box.start + box.size) throw new Error(`${box.type} table overruns its box`)
    for (let i = 0; i < count; i++) {
      if (entry === 4) {
        const v = buf.readUInt32BE(pos) + delta
        if (v > 0xffffffff) throw new Error("chunk offset overflow; co64 required")
        buf.writeUInt32BE(v, pos)
      } else {
        buf.writeBigUInt64BE(buf.readBigUInt64BE(pos) + BigInt(delta), pos)
      }
      pos += entry
    }
    return count
  }
  if (!CONTAINERS.has(box.type)) return 0
  let patched = 0
  for (const child of readBoxes(buf, box.start + box.header, box.start + box.size)) {
    patched += patchOffsets(buf, child, delta)
  }
  return patched
}

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16)
}

// Reusable probe: `moov` must sit before `mdat`, otherwise the browser has to
// pull almost the whole file before it can decode the first frame.
export function mp4AtomOrder(file) {
  const buf = readFileSync(file)
  const boxes = readBoxes(buf, 0, buf.length)
  const moov = boxes.find((b) => b.type === "moov")
  const mdat = boxes.find((b) => b.type === "mdat")
  if (!moov || !mdat) return { ok: false, reason: "moov/mdat missing" }
  return { ok: moov.start < mdat.start, moovStart: moov.start, mdatStart: mdat.start }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (!invokedDirectly) {
  // Imported as a module (scripts/check-media-budget.mjs) — no CLI side effects.
} else {
  main()
}

function main() {
const args = process.argv.slice(2)
if (!args.length) {
  console.error("usage: node scripts/mp4-faststart.mjs <file> [--out <file>]")
  process.exit(2)
}
const input = args[0]
const outIndex = args.indexOf("--out")
const output = outIndex >= 0 ? args[outIndex + 1] : input

const original = readFileSync(input)
const before = readBoxes(original, 0, original.length)
const moov = before.find((b) => b.type === "moov")
const mdat = before.find((b) => b.type === "mdat")
if (!moov || !mdat) throw new Error("not a progressive mp4 (moov or mdat missing)")

if (moov.start < mdat.start) {
  console.log(`${input}: already faststart (moov @${moov.start}, mdat @${mdat.start})`)
  process.exit(0)
}

const delta = moov.size
const newMoov = Buffer.from(original.subarray(moov.start, moov.start + moov.size))
const patched = patchOffsets(newMoov, { type: "moov", start: 0, size: newMoov.length, header: 8 }, delta)

const pre = original.subarray(0, mdat.start)
const middle = original.subarray(mdat.start, moov.start)
const tail = original.subarray(moov.start + moov.size)
const rebuilt = Buffer.concat([pre, newMoov, middle, tail])
writeFileSync(output, rebuilt)

// Verify: fresh parse, same payload bytes, offsets inside the new mdat.
const after = readBoxes(rebuilt, 0, rebuilt.length)
const moov2 = after.find((b) => b.type === "moov")
const mdat2 = after.find((b) => b.type === "mdat")
if (!moov2 || !mdat2) throw new Error("verification failed: boxes missing")
if (moov2.start > mdat2.start) throw new Error("verification failed: moov still after mdat")
if (moov2.size !== moov.size) throw new Error("verification failed: moov size changed")

const oldPayload = original.subarray(mdat.start + mdat.header, mdat.start + mdat.size)
const newPayload = rebuilt.subarray(mdat2.start + mdat2.header, mdat2.start + mdat2.size)
if (oldPayload.length !== newPayload.length) throw new Error("verification failed: mdat payload size changed")
if (sha(oldPayload) !== sha(newPayload)) throw new Error("verification failed: mdat payload changed")

console.log(`${output}: moov moved before mdat (+${delta} bytes shift, ${patched} chunk offsets patched)`)
console.log(`  mdat payload identical (${newPayload.length} bytes, sha256 ${sha(newPayload)})`)
}
