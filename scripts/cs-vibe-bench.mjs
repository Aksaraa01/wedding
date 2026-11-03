#!/usr/bin/env node
// Bandingkan "human vibe" beberapa LLM lewat OpenRouter untuk prompt CS Aksaraa.
//
// Pakai:
//   node scripts/cs-vibe-bench.mjs
//
// Sumber key, berurutan:
//   1. env OPENROUTER_API_KEY
//   2. .env.local di root repo (gitignored)
//   3. ~/.config/openrouter/key (chmod 600)
//
// Opsi:
//   --models a/b,c/d     batasi model (default daftar di bawah)
//   --repeat 2           ulangi tiap prompt (lihat variasi jawaban)
//   --out docs/x.md      simpan laporan markdown
//
// Script ini tidak pernah mencetak API key.

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const API = "https://openrouter.ai/api/v1"

const DEFAULT_MODELS = [
  "anthropic/claude-haiku-5.5",
  "openai/gpt-6-luna",
  "qwen/qwen3.8-flash",
  "google/gemini-3.8-flash",
  "deepseek/deepseek-v4.1-flash",
  "z-ai/glm-5.3-flash",
]

// Angka yang boleh disebut agent. Di produksi ini datang dari getPriceBook().
const PACKAGE_PRICES = { essential: 1500000, signature: 2500000, prestige: 4000000 }
const ALLOWED_PRICES = Object.values(PACKAGE_PRICES)

const SYSTEM = `Kamu CS Aksaraa Wedding di WhatsApp.

ATURAN GAYA:
- Bahasa Indonesia santai tapi sopan, panggil klien "Kak".
- Balasan 1-3 kalimat pendek. Satu pertanyaan saja per balasan.
- Tanpa bullet point, tanpa heading, tanpa daftar bernomor.
- Maksimal satu emoji, dan hanya kalau perlu.
- Jangan pernah menyebut dirimu AI, bot, asisten, atau model.
- Jangan mengarang fakta. Harga hanya boleh dari DATA ini:
  Essential Rp 1.500.000, Signature Rp 2.500.000, Prestige Rp 4.000.000.
- Kalau tidak tahu, bilang akan cek dulu.

TUGAS: balas SATU pesan klien. Output hanya teks balasannya, tanpa tanda kutip, tanpa penjelasan.`

const PROMPTS = [
  { id: "harga", text: "halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an" },
  { id: "komplain", text: "knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih" },
  { id: "teknis", text: "kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple" },
  { id: "android", text: "kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul" },
  { id: "nego", text: "mahal bgt ya kak, bisa kurang ga?" },
]

const BANNED = [
  "sebagai ai",
  "saya adalah ai",
  "sebagai asisten",
  "tentu!",
  "tentu saja!",
  "dengan senang hati",
  "berikut adalah",
  "apakah ada yang bisa saya bantu",
  "ada yang bisa saya bantu lagi",
  "semoga membantu",
  "jangan ragu untuk",
  "saya memahami perasaan",
]

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq < 1) continue
    const name = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(name in process.env)) process.env[name] = value
  }
}

function loadKeyWithSource() {
  if (process.env.OPENROUTER_API_KEY) {
    return { key: process.env.OPENROUTER_API_KEY.trim(), source: "env OPENROUTER_API_KEY" }
  }

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  loadEnvFile(path.join(repoRoot, ".env.local"))
  if (process.env.OPENROUTER_API_KEY) {
    return { key: process.env.OPENROUTER_API_KEY.trim(), source: ".env.local" }
  }

  const file = arg("key-file", path.join(os.homedir(), ".config", "openrouter", "key"))
  if (fs.existsSync(file)) {
    return { key: fs.readFileSync(file, "utf8").trim(), source: file.replace(os.homedir(), "~") }
  }
  return { key: "", source: "tidak ditemukan" }
}

async function fetchModels() {
  const res = await fetch(`${API}/models`)
  if (!res.ok) throw new Error(`models ${res.status}`)
  const json = await res.json()
  const map = new Map()
  for (const m of json.data) map.set(m.id, m)
  return map
}

async function chat(key, model, text, temperature = 0.7) {
  const started = Date.now()
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://wedding.aksaraa.com",
          "X-Title": "Aksaraa CS vibe bench",
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: 2000,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: text },
          ],
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`)
      }
      const json = await res.json()
      const reply = (json.choices?.[0]?.message?.content || "").trim()
      return {
        reply,
        finish: json.choices?.[0]?.finish_reason || "",
        reasoningTokens: json.usage?.completion_tokens_details?.reasoning_tokens || 0,
        latency: Date.now() - started,
        promptTokens: json.usage?.prompt_tokens || 0,
        completionTokens: json.usage?.completion_tokens || 0,
      }
    } catch (e) {
      lastErr = e
      if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt))
    }
  }
  throw lastErr
}

function normNumber(raw) {
  const cleaned = raw.replace(/\./g, "").replace(",", ".")
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

// Ambil semua angka rupiah: "Rp 1.500.000", "Rp2,5 juta", "4 jt".
function pricesIn(text) {
  const found = []
  const re = /rp\.?\s*([\d][\d.,]*)\s*(juta|jt|ribu|rb|k)?/gi
  let m
  while ((m = re.exec(text)) !== null) {
    let n = normNumber(m[1])
    if (n === null) continue
    const unit = (m[2] || "").toLowerCase()
    if (unit === "juta" || unit === "jt") n *= 1e6
    else if (unit === "ribu" || unit === "rb" || unit === "k") n *= 1e3
    if (n < 100000) continue // "Rp 4" terpotong / bukan harga paket
    found.push({ value: Math.round(n), index: m.index })
  }
  const re2 = /([\d][\d.,]*)\s*(juta|jt)\b/gi
  while ((m = re2.exec(text)) !== null) {
    const n = normNumber(m[1])
    if (n !== null) found.push({ value: Math.round(n * 1e6), index: m.index })
  }
  return found
}

// Angka dianggap salah hanya kalau angka terdekat ke nama paket tidak cocok.
function priceMismatches(text) {
  const lower = text.toLowerCase()
  const prices = pricesIn(text)
  const mentions = []
  for (const name of Object.keys(PACKAGE_PRICES)) {
    const re = new RegExp(`\\b${name}\\b`, "gi")
    let m
    while ((m = re.exec(lower)) !== null) mentions.push({ name, index: m.index })
  }

  const bad = []
  for (const mention of mentions) {
    let nearest = null
    for (const price of prices) {
      const distance = Math.abs(price.index - mention.index)
      if (distance <= 60 && (!nearest || distance < nearest.distance)) {
        nearest = { price, distance }
      }
    }
    if (nearest && nearest.price.value !== PACKAGE_PRICES[mention.name]) {
      bad.push({
        package: mention.name,
        said: nearest.price.value,
        expected: PACKAGE_PRICES[mention.name],
      })
    }
  }
  return bad
}

function analyse(reply) {
  if (!reply) {
    return {
      empty: true,
      words: 0,
      sentences: 0,
      questions: 0,
      emoji: 0,
      bullets: false,
      banned: [],
      priceMismatches: [],
      unknownPrices: [],
      score: 0,
    }
  }

  const lower = reply.toLowerCase()
  const words = reply.split(/\s+/).filter(Boolean).length
  const sentences = reply.split(/[.!?]+/).filter((s) => s.trim()).length
  const questions = (reply.match(/\?/g) || []).length
  const emoji = (reply.match(/\p{Extended_Pictographic}/gu) || []).length
  const bullets = /^\s*[-*•]\s/m.test(reply) || /^\s*\d+[.)]\s/m.test(reply)
  const banned = BANNED.filter((p) => lower.includes(p))
  const mismatches = priceMismatches(reply)
  const unknownPrices = pricesIn(reply)
    .map((p) => p.value)
    .filter((v) => !ALLOWED_PRICES.includes(v))
  const saysKak = /kak|kamu|aku/i.test(reply)

  let score = 100
  score -= banned.length * 20
  if (bullets) score -= 15
  if (words > 90) score -= 10
  if (words > 140) score -= 10
  if (emoji > 1) score -= (emoji - 1) * 4
  if (!saysKak) score -= 8
  score -= mismatches.length * 25
  if (questions === 0) score -= 3

  return {
    empty: false,
    words,
    sentences,
    questions,
    emoji,
    bullets,
    banned,
    priceMismatches: mismatches,
    unknownPrices,
    score: Math.max(0, Math.min(100, Math.round(score))),
  }
}

function money(n) {
  return `$${n.toFixed(6)}`
}

async function pool(tasks, limit) {
  const results = []
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

async function main() {
  const { key, source } = loadKeyWithSource()
  if (!key) {
    console.error("API key belum ada.")
    console.error("Tambahkan OPENROUTER_API_KEY=sk-or-v1-... ke .env.local (root repo),")
    console.error("atau set env OPENROUTER_API_KEY, atau simpan di ~/.config/openrouter/key.")
    process.exit(1)
  }
  if (!key.startsWith("sk-or-")) {
    console.error(`Key tidak mirip key OpenRouter (prefix: ${key.slice(0, 4)}…).`)
    console.error("Key OpenRouter berformat sk-or-v1-…. Token lain jangan dikirim ke OpenRouter.")
    process.exit(1)
  }

  if (process.argv.includes("--check")) {
    console.log(`sumber : ${source}`)
    console.log(`prefix : ${key.slice(0, 10)}`)
    console.log(`panjang: ${key.length}`)
    const auth = await fetch(`${API}/key`, { headers: { Authorization: `Bearer ${key}` } })
    console.log(`auth   : HTTP ${auth.status}${auth.ok ? " (valid)" : " (ditolak)"}`)
    if (auth.ok) {
      const credits = await fetch(`${API}/credits`, { headers: { Authorization: `Bearer ${key}` } })
      const json = await credits.json().catch(() => ({}))
      const total = json?.data?.total_credits
      const used = json?.data?.total_usage
      if (total !== undefined) {
        const left = (Number(total) - Number(used || 0)).toFixed(4)
        console.log(`kredit : total $${Number(total).toFixed(2)} | terpakai $${Number(used || 0).toFixed(4)} | sisa $${left}`)
      }
    } else {
      console.log(`respons: ${(await auth.text()).slice(0, 200)}`)
    }
    return
  }

  const modelsArg = arg("models")
  const models = modelsArg ? modelsArg.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_MODELS
  const repeat = Math.max(1, Number(arg("repeat", "1")) || 1)
  const out = arg("out", path.join("docs", `cs-vibe-bench-${new Date().toISOString().slice(0, 10)}.md`))

  const catalog = await fetchModels()
  const valid = []
  for (const m of models) {
    if (catalog.has(m)) valid.push(m)
    else console.warn(`lewati model tidak dikenal: ${m}`)
  }
  if (!valid.length) {
    console.error("Tidak ada model valid.")
    process.exit(1)
  }

  const jobs = []
  for (const model of valid) {
    for (const prompt of PROMPTS) {
      for (let r = 1; r <= repeat; r++) {
        jobs.push({ model, prompt, run: r })
      }
    }
  }

  console.log(`Menjalankan ${jobs.length} request ke ${valid.length} model…`)
  const started = Date.now()

  const results = await pool(
    jobs.map((job) => async () => {
      try {
        const res = await chat(key, job.model, job.prompt.text)
        return { ...job, ...res, analysis: analyse(res.reply) }
      } catch (e) {
        return { ...job, error: e.message }
      }
    }),
    2
  )

  const lines = []
  lines.push(`# CS vibe bench — ${new Date().toISOString().slice(0, 10)}`)
  lines.push("")
  lines.push("Skor adalah heuristik (frasa AI, bullet, panjang, emoji, harga).")
  lines.push("Penentu akhir tetap blind test bersama tim sales.")
  lines.push("")

  lines.push("| Model | Latency | Biaya total | Kata (rata2) | Frasa AI | Harga salah | Kosong | Skor |")
  lines.push("|---|---|---|---|---|---|---|---|")
  for (const model of valid) {
    const rows = results.filter((r) => r.model === model)
    const ok = rows.filter((r) => !r.error)
    const meta = catalog.get(model)
    const promptPrice = Number(meta?.pricing?.prompt || 0)
    const completionPrice = Number(meta?.pricing?.completion || 0)
    const cost = ok.reduce(
      (sum, r) => sum + r.promptTokens * promptPrice + r.completionTokens * completionPrice,
      0
    )
    const avgWords = ok.length ? Math.round(ok.reduce((s, r) => s + r.analysis.words, 0) / ok.length) : 0
    const avgLatency = ok.length ? Math.round(ok.reduce((s, r) => s + r.latency, 0) / ok.length) : 0
    const banned = ok.reduce((s, r) => s + r.analysis.banned.length, 0)
    const wrong = ok.reduce((s, r) => s + r.analysis.priceMismatches.length, 0)
    const empty = ok.filter((r) => r.analysis.empty).length
    const score = ok.length ? Math.round(ok.reduce((s, r) => s + r.analysis.score, 0) / ok.length) : 0
    const errs = rows.length - ok.length
    lines.push(
      `| ${model} | ${avgLatency} ms | ${money(cost)} | ${avgWords} | ${banned} | ${wrong} | ${empty} | **${score}**${errs ? ` (${errs} error)` : ""} |`
    )
  }
  lines.push("")

  for (const model of valid) {
    lines.push(`## ${model}`)
    lines.push("")
    for (const prompt of PROMPTS) {
      const row = results.find((r) => r.model === model && r.prompt.id === prompt.id && !r.error)
      const fail = results.find((r) => r.model === model && r.prompt.id === prompt.id && r.error)
      lines.push(`**${prompt.id}** — klien: ${prompt.text}`)
      lines.push("")
      if (row) {
        lines.push(`> ${row.reply.replace(/\n+/g, " / ")}`)
        lines.push("")
        lines.push(
          `${row.analysis.words} kata · ${row.analysis.questions} tanya · ${row.analysis.emoji} emoji · ${row.latency} ms · finish=${row.finish || "-"} · reasoning=${row.reasoningTokens}`
        )
      } else if (fail) {
        lines.push(`> (error) ${fail.error}`)
      }
      lines.push("")
    }
  }

  const report = lines.join("\n")
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, report)
  console.log(`Selesai dalam ${Math.round((Date.now() - started) / 1000)}s → ${out}`)
  console.log(report.slice(0, 4000))
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
