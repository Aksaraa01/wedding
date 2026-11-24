#!/usr/bin/env node
// Realistic galeri-tamu arrival ramp: N guests over DURATION_MIN, each uploading
// 1-2 framed photos, with a clustered peak window (the "sesi foto" moment).
// Staging-safe by default; refuses a prod BASE_URL unless ALLOW_PROD=1.
import fs from "node:fs/promises"

const BASE_URL = (process.env.BASE_URL || "https://wedding-stg.aksaraa.com").replace(/\/$/, "")
const GALLERY_TOKEN = process.env.GALLERY_TOKEN
const GUESTS = Number(process.env.GUESTS || 50)
const DURATION_MIN = Number(process.env.DURATION_MIN || 30)
const PEAK_GUESTS = Number(process.env.PEAK_GUESTS || 15)
const PEAK_AT_MIN = Number(process.env.PEAK_AT_MIN || 10)
const PEAK_WINDOW_SEC = Number(process.env.PEAK_WINDOW_SEC || 60)
const MAX_INFLIGHT = Number(process.env.MAX_INFLIGHT || 20)
const PHOTO_FILE = process.env.PHOTO_FILE || "/tmp/test-framed-big.jpg"
const LOG_FILE = process.env.LOG_FILE || "/tmp/galeri-ramp-events.jsonl"
const SUMMARY_FILE = process.env.SUMMARY_FILE || "/tmp/galeri-ramp-summary.json"
const ALLOW_PROD = process.env.ALLOW_PROD === "1"

if (!GALLERY_TOKEN) throw new Error("GALLERY_TOKEN wajib")
if (!ALLOW_PROD && /(^|\/\/)wedding\.aksaraa\.com/i.test(BASE_URL) && !/wedding-stg/i.test(BASE_URL)) {
  throw new Error("Refusing prod BASE_URL (set ALLOW_PROD=1 only if you really mean it)")
}

const photo = await fs.readFile(PHOTO_FILE)
await fs.writeFile(LOG_FILE, "")
const startedAt = Date.now()
const durationSec = DURATION_MIN * 60

const categories = ["Keluarga", "Kerabat", "Teman", "Kolega", "Lainnya"]
const rand = (a, b) => a + Math.random() * (b - a)
const uuid = () => crypto.randomUUID()
const pad = (n) => String(n).padStart(2, "0")

function deviceId(i) {
  const hex = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, "0")
  return `00000000-0000-4000-8000-${hex}${pad(i).slice(-2)}`.slice(0, 36)
}

const guests = Array.from({ length: GUESTS }, (_, idx) => {
  const i = idx + 1
  const isPeak = idx < PEAK_GUESTS
  const arrival = isPeak
    ? PEAK_AT_MIN * 60 + rand(0, PEAK_WINDOW_SEC)
    : rand(0, durationSec)
  return {
    i,
    name: `Tamu ${pad(i)}`,
    category: categories[idx % categories.length],
    deviceId: deviceId(i),
    photos: Math.random() < 0.5 ? 2 : 1,
    nextAt: startedAt + arrival * 1000,
    done: 0,
    inFlight: false,
    completed: false,
  }
})

const results = []
let inflight = 0
let started = 0
let lastReport = 0

function pct(sorted, p) {
  if (!sorted.length) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

async function logEvent(ev) {
  await fs.appendFile(LOG_FILE, `${JSON.stringify(ev)}\n`)
}

async function upload(guest, photoIndex) {
  const form = new FormData()
  form.append("file", new Blob([photo], { type: "image/jpeg" }), `ramp-${guest.i}-${photoIndex}.jpg`)
  form.append("gallery_token", GALLERY_TOKEN)
  form.append("device_id", guest.deviceId)
  form.append("capture_id", uuid())
  form.append("uploader_name", guest.name)
  form.append("category", guest.category)
  form.append("caption", `Ramp ${guest.name} foto ${photoIndex}`)
  const t0 = Date.now()
  let status = 0
  let json = {}
  let error = ""
  try {
    const res = await fetch(`${BASE_URL}/api/guest-photos/upload`, { method: "POST", body: form })
    status = res.status
    json = await res.json().catch(() => ({}))
    if (!res.ok) error = json.error || `HTTP ${res.status}`
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }
  return {
    t: Math.round((Date.now() - startedAt) / 1000),
    guest: guest.i,
    photo: photoIndex,
    status,
    ms: Date.now() - t0,
    ok: status === 200 && !!json.photo?.id,
    used: json.used,
    error: error || undefined,
  }
}

function report(force = false) {
  const t = Math.round((Date.now() - startedAt) / 1000)
  if (!force && t - lastReport < 15) return
  lastReport = t
  const ok = results.filter((r) => r.ok).length
  const fail = results.length - ok
  const statuses = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a }, {})
  console.log(JSON.stringify({ phase: "progress", t, started, done: results.length, inflight, ok, fail, statuses }))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const deadline = startedAt + (durationSec + 600) * 1000
while (Date.now() < deadline) {
  const now = Date.now()
  for (const guest of guests) {
    if (guest.completed || guest.inFlight || guest.nextAt > now) continue
    if (inflight >= MAX_INFLIGHT) break
    if (guest.done >= guest.photos) { guest.completed = true; continue }
    guest.done += 1
    guest.inFlight = true
    inflight += 1
    started += 1
    void upload(guest, guest.done).then(async (result) => {
      inflight -= 1
      guest.inFlight = false
      results.push(result)
      await logEvent(result)
      if (result.ok && guest.done < guest.photos) {
        // Real guests take a few seconds between shots.
        guest.nextAt = Date.now() + rand(5000, 20000)
      } else {
        guest.completed = true
      }
    })
  }
  if (guests.every((g) => g.completed) && inflight === 0) break
  report()
  await sleep(200)
}

// drain
while (inflight > 0) {
  report(true)
  await sleep(500)
}

const latencies = results.map((r) => r.ms).sort((a, b) => a - b)
const ok = results.filter((r) => r.ok)
const summary = {
  base_url: BASE_URL,
  guests: GUESTS,
  duration_min: DURATION_MIN,
  total_uploads: results.length,
  ok: ok.length,
  fail: results.length - ok.length,
  success_rate: results.length ? +(ok.length / results.length * 100).toFixed(1) : 0,
  p50_ms: pct(latencies, 0.5),
  p95_ms: pct(latencies, 0.95),
  max_ms: latencies[latencies.length - 1] || 0,
  statuses: results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a }, {}),
  errors: results.filter((r) => !r.ok).reduce((a, r) => { const k = `${r.status}:${r.error || "?"}`; a[k] = (a[k] || 0) + 1; return a }, {}),
  wall_sec: Math.round((Date.now() - startedAt) / 1000),
}
await fs.writeFile(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify({ phase: "summary", ...summary }))
