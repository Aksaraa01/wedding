// Klasifikasi intent lapis kedua. Aturan (classify) tetap jalur utama; AI hanya
// dipanggil saat aturan tidak menemukan cabang, supaya parafrase baru tidak
// jatuh ke "unknown" dan dijawab tanpa tool/sitasi.
//
// Prinsip:
//  - Hanya untuk pesan teks yang masuk akal (bukan URL, bukan PIN, bukan "ya").
//  - Model mengembalikan JSON enum yang sama dengan classify(); di luar itu
//    dianggap unknown.
//  - Percaya diri rendah = tetap unknown. Jangan memaksa masuk cabang.
//  - Intent berisiko (refund, komplain, klaim bayar, minta manusia, opt-out)
//    butuh keyakinan lebih tinggi supaya tidak memicu eskalasi palsu.
//  - Hasil di-cache per teks ternormalisasi supaya pengulangan gratis.

import { chatCompletion } from "@/lib/cs/llm"
import type { Intent } from "@/lib/cs/policy"

export const AI_INTENTS: Intent[] = [
  "human_request",
  "opt_out",
  "refund",
  "reschedule",
  "data_change",
  "voucher",
  "discount",
  "timing",
  "comparison",
  "payment",
  "complaint",
  "out_of_scope",
  "select_package",
  "print_question",
  "cta_register",
  "data_collection",
  "status",
  "invitation_link",
  "timeline",
  "recommendation",
  "package_info",
  "price",
  "template",
  "technical",
]

const HIGH_RISK = new Set<Intent>(["refund", "complaint", "payment", "human_request", "opt_out", "out_of_scope"])

export const INTENT_CONFIDENCE_MIN = 0.6
export const INTENT_CONFIDENCE_RISK_MIN = 0.75

const SYSTEM = `Kamu mengklasifikasikan pesan klien CS undangan pernikahan (Aksaraa) ke SATU intent.

Intent yang tersedia:
- human_request: minta bicara dengan manusia/tim/telepon
- opt_out: minta berhenti dihubungi
- refund: minta uang kembali / pembatalan
- reschedule: ganti tanggal acara
- data_change: minta ubah data undangan (nama, foto, rekening, nomor, alamat)
- voucher: tanya voucher / kode promo
- discount: minta diskon / nego harga
- timing: menunda keputusan (pikir-pikir, tanya pasangan)
- comparison: membandingkan dengan vendor lain
- payment: cara bayar, klaim sudah bayar, invoice, cicilan
- complaint: keluhan, kecewa, tuduhan
- out_of_scope: topik di luar undangan (politik, saham, judi, medis)
- select_package: menyatakan memilih/mau paket tertentu
- print_question: tanya undangan cetak/fisik
- cta_register: tanya cara daftar/order
- data_collection: minta bantuan mengisi data undangan
- status: status/progres/publish undangan
- invitation_link: minta tautan undangan
- timeline: berapa lama pengerjaan
- recommendation: minta rekomendasi PAKET
- package_info: tanya isi/beda paket
- price: tanya harga/biaya
- template: tanya/rekomendasi TEMPLATE atau desain
- technical: masalah teknis (foto, musik, link error, perangkat)

Balas HANYA JSON: {"intent":"<salah satu di atas>","confidence":<0..1>}
Kalau ragu, pakai intent "template" hanya bila jelas soal desain; selain itu
pakai confidence rendah. Jangan mengarang intent baru.`

interface CachedIntent {
  intent: Intent
  confidence: number
}

const CACHE_LIMIT = 400
const cache = new Map<string, CachedIntent>()

export function normalizeIntentKey(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Pesan yang tidak perlu dikirim ke model: URL, PIN/angka, sapaan 1-2 kata. */
export function aiIntentWorthTrying(text: string): boolean {
  const t = (text || "").trim()
  if (t.length < 4) return false
  if (/^https?:\/\//i.test(t)) return false
  if (/^\d{3,8}$/.test(t)) return false
  if (!/\p{L}/u.test(t)) return false
  return true
}

export function parseIntentReply(content: string): CachedIntent | null {
  const raw = (content || "").trim()
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end <= start) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const row = parsed as { intent?: unknown; confidence?: unknown }
  const intent = String(row.intent || "") as Intent
  if (!AI_INTENTS.includes(intent)) return null
  const confidence = Number(row.confidence)
  if (!Number.isFinite(confidence)) return null
  return { intent, confidence: Math.min(1, Math.max(0, confidence)) }
}

export function acceptIntent(result: CachedIntent | null): CachedIntent | null {
  if (!result) return null
  const min = HIGH_RISK.has(result.intent) ? INTENT_CONFIDENCE_RISK_MIN : INTENT_CONFIDENCE_MIN
  return result.confidence >= min ? result : null
}

export function aiIntentEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CS_INTENT_AI !== "0"
}

export async function classifyIntentWithAi(
  text: string,
  model: string,
  timeoutMs = 2500
): Promise<CachedIntent | null> {
  const key = normalizeIntentKey(text)
  if (!key) return null
  const hit = cache.get(key)
  if (hit) return hit

  try {
    const result = await chatCompletion({
      model,
      temperature: 0,
      maxTokens: 60,
      timeoutMs,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: key.slice(0, 500) },
      ],
    })
    const parsed = acceptIntent(parseIntentReply(result.message.content || ""))
    if (!parsed) return null
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
    cache.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}
