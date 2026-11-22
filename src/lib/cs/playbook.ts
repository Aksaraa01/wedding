// SOP sales/CS: tahap percakapan, kualifikasi, keberatan, CTA, dan serah terima.
// Murni (tanpa DB/LLM) supaya aturannya bisa diuji dan tidak bergantung model.

export type LeadStage =
  | "new"
  | "qualifying"
  | "recommending"
  | "objection"
  | "cta"
  | "handoff"
  | "support"

export type BudgetBand = "under_1m" | "1_3m" | "3_6m" | "6_10m" | "above_10m"
export type Need = "undangan" | "buku_tamu" | "galeri" | "belum_tahu"
export type ObjectionKind = "price" | "timing" | "comparison" | "trust" | "none"

export interface LeadFacts {
  wedding_date?: string | null
  city?: string | null
  guest_count?: number | null
  budget_band?: BudgetBand | null
  need?: Need | null
  package_interest?: string | null
  template_interest?: string | null
}

export interface QualifyingQuestion {
  key: keyof LeadFacts
  question: string
}

// Hanya dua hal yang benar-benar mengubah rekomendasi paket. Tanggal dan kota
// tidak ditanyakan: untuk undangan digital keduanya tidak relevan, dan
// menanyakannya membuat percakapan terasa seperti formulir.
const QUESTIONS: Partial<Record<keyof LeadFacts, string>> = {
  need: "Kakak lebih butuh undangan digital, buku tamu QR, atau galeri foto tamu?",
  guest_count: "Biar rekomendasinya pas, perkiraan tamunya berapa orang?",
}

const CORE_ORDER: (keyof LeadFacts)[] = ["need", "guest_count"]
const MAX_QUALIFYING_QUESTIONS = 2

export function missingCoreFacts(facts: LeadFacts): (keyof LeadFacts)[] {
  return CORE_ORDER.filter((key) => facts[key] === null || facts[key] === undefined || facts[key] === "")
}

export function nextQualifyingQuestion(
  facts: LeadFacts,
  alreadyAsked = 0
): QualifyingQuestion | null {
  if (alreadyAsked >= MAX_QUALIFYING_QUESTIONS) return null
  const missing = missingCoreFacts(facts)
  if (missing.length === 0) return null
  const key = missing[0]
  const question = QUESTIONS[key]
  return question ? { key, question } : null
}

const MONTHS: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, agt: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  desember: 12, des: 12,
}

function validIso(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date.toISOString().slice(0, 10)
}

export function parseWeddingDate(
  text: string,
  now: Date = new Date()
): { iso: string; approximate: boolean } | null {
  const value = (text || "").toLowerCase()

  // 12/12/2026 atau 12-12-2026
  const numeric = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (numeric) {
    const iso = validIso(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]))
    return iso ? { iso, approximate: false } : null
  }

  // 12 Desember 2026
  const full = value.match(/\b(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/)
  if (full && MONTHS[full[2]]) {
    const iso = validIso(Number(full[3]), MONTHS[full[2]], Number(full[1]))
    return iso ? { iso, approximate: false } : null
  }

  // Desember 2026 → awal bulan, ditandai perkiraan
  const monthOnly = value.match(/\b([a-z]+)\s+(\d{4})\b/)
  if (monthOnly && MONTHS[monthOnly[1]]) {
    const year = Number(monthOnly[2])
    if (year >= now.getUTCFullYear() - 1 && year <= now.getUTCFullYear() + 5) {
      const iso = validIso(year, MONTHS[monthOnly[1]], 1)
      return iso ? { iso, approximate: true } : null
    }
  }

  return null
}

function numberWithUnit(text: string): number | null {
  const match = text.match(/(\d[\d.,]*)(?:\s*(juta|jt|ribu|rb|k)\b)?/i)
  if (!match) return null
  const base = Number(match[1].replace(/\./g, "").replace(",", "."))
  if (!Number.isFinite(base)) return null
  const unit = (match[2] || "").toLowerCase()
  if (unit === "juta" || unit === "jt") return base * 1_000_000
  if (unit === "ribu" || unit === "rb" || unit === "k") return base * 1_000
  return base
}

export function parseBudgetBand(text: string): BudgetBand | null {
  const amount = numberWithUnit(text)
  if (amount === null || amount <= 0) return null
  if (amount < 1_000_000) return "under_1m"
  if (amount < 3_000_000) return "1_3m"
  if (amount < 6_000_000) return "3_6m"
  if (amount < 10_000_000) return "6_10m"
  return "above_10m"
}

export function parseGuestCount(text: string): number | null {
  const match = text.match(/\b(\d{1,4})\b/)
  if (!match) return null
  const value = Number(match[1])
  return value > 0 && value <= 5000 ? value : null
}

export function parseObjectiveNeed(text: string): Need | null {
  const value = (text || "").toLowerCase()
  if (/buku tamu|\bqr\b|check ?in|kehadiran/.test(value)) return "buku_tamu"
  if (/galeri|foto tamu|kenangan/.test(value)) return "galeri"
  if (/undangan|invitation|website/.test(value)) return "undangan"
  if (/belum tahu|bingung|belum yakin/.test(value)) return "belum_tahu"
  return null
}

export function extractVoucherCode(text: string): string | null {
  const match = (text || "").match(/\b(?=[A-Z0-9-]{4,24}\b)(?=[A-Z0-9-]*\d)[A-Z][A-Z0-9-]*\b/)
  return match ? match[0] : null
}

export function detectPackageInterest(text: string): string | null {
  const t = (text || "").toLowerCase()
  if (/buku tamu[^.]{0,24}prestige|dgb[ _-]?prestige/.test(t)) return "dgb_prestige"
  if (/buku tamu[^.]{0,24}premium|dgb[ _-]?premium/.test(t)) return "dgb_premium"
  if (/buku tamu[^.]{0,24}\bpro\b|dgb[ _-]?pro/.test(t)) return "dgb_pro"
  if (/buku tamu[^.]{0,24}sistem|dgb[ _-]?sistem/.test(t)) return "dgb_sistem"
  if (/\bgaleri( tamu)?\b/.test(t)) return "gt"
  if (/\bsignature\b/.test(t)) return "signature"
  if (/\bessential\b/.test(t)) return "essential"
  if (/\bprestige\b/.test(t)) return "prestige"
  if (/\belite\b/.test(t)) return "elite"
  return null
}

export function detectOptOut(text: string): boolean {
  const value = (text || "").toLowerCase()
  return /jangan (chat|hubungi|wa|kirim)|stop (chat|kirim)|unsubscribe|jangan spam|hapus nomor/.test(value)
}

export function classifyObjection(text: string): ObjectionKind {
  const value = (text || "").toLowerCase()
  if (/mahal|kemahalan|kurang|diskon|nego|potongan|turunin|murah/.test(value)) return "price"
  if (/nanti dulu|pikir|diskusi|tanya (pasangan|keluarga)|belum yakin|minggu depan|bulan depan/.test(value)) {
    return "timing"
  }
  if (/banding|vendor lain|kompetitor|pilihan lain|mau lihat lain/.test(value)) return "comparison"
  if (/tipu|penipuan|aman|percaya|legit|pengalaman/.test(value)) return "trust"
  return "none"
}

export interface ObjectionPlan {
  kind: ObjectionKind
  escalate: boolean
  strategy: "value_then_alternative" | "save_and_followup" | "compare" | "proof" | "none"
  tools: string[]
  followupDays: number | null
  directive: string
}

export function objectionPlan(kind: ObjectionKind, previousObjections: number): ObjectionPlan {
  if (kind === "none") {
    return { kind, escalate: false, strategy: "none", tools: [], followupDays: null, directive: "" }
  }

  if (previousObjections >= 1) {
    return {
      kind,
      escalate: true,
      strategy: "none",
      tools: [],
      followupDays: null,
      directive: "Klien sudah menyampaikan keberatan sebelumnya. Eskalasi ke tim, jangan menawar sendiri.",
    }
  }

  switch (kind) {
    case "price":
      return {
        kind,
        escalate: false,
        strategy: "value_then_alternative",
        tools: ["quote_price"],
        followupDays: null,
        directive:
          'Akui keberatannya, sebutkan nilai yang didapat, lalu tawarkan paket yang lebih rendah dengan memanggil "quote_price". Jangan memberi diskon dan jangan menjanjikan potongan. Maksimal satu pertanyaan.',
      }
    case "timing":
      return {
        kind,
        escalate: false,
        strategy: "save_and_followup",
        tools: [],
        followupDays: 2,
        directive:
          "Tidak perlu menekan. Tanya satu hal yang paling menentukan (tanggal atau kota), lalu bilang akan diingatkan lagi. Jangan memaksa daftar sekarang.",
      }
    case "comparison":
      return {
        kind,
        escalate: false,
        strategy: "compare",
        tools: ["list_templates"],
        followupDays: null,
        directive:
          'Bantu membandingkan secara faktual memakai "list_templates" atau "get_price_book". Jangan menjelekkan kompetitor.',
      }
    case "trust":
      return {
        kind,
        escalate: false,
        strategy: "proof",
        tools: [],
        followupDays: null,
        directive:
          "Tenangkan dengan fakta yang ada (jumlah klien, portofolio, garansi yang memang tertulis). Jangan mengarang sertifikasi.",
      }
    default:
      return { kind, escalate: false, strategy: "none", tools: [], followupDays: null, directive: "" }
  }
}

export interface PackageRecommendation {
  package_code: string
  reason: string
  alternatives: string[]
  wa_blast_tier: number
  express: boolean
}

export function recommendPackage(
  facts: LeadFacts,
  priceBook: { base: Record<string, number> },
  now: Date = new Date()
): PackageRecommendation {
  const guests = facts.guest_count || 0
  const need = facts.need || "undangan"
  const budget = facts.budget_band || null

  let code = "signature"
  let reason = "Paling seimbang untuk kebutuhan undangan digital."

  if (need === "buku_tamu") {
    if (guests >= 1500) {
      code = "dgb_prestige"
      reason = "Buku tamu digital untuk tamu di atas 1.500 orang."
    } else if (guests >= 800) {
      code = "dgb_premium"
      reason = "Buku tamu digital untuk tamu 800–1.500 orang."
    } else if (guests >= 300) {
      code = "dgb_pro"
      reason = "Buku tamu digital untuk tamu 300–800 orang."
    } else {
      code = "dgb_sistem"
      reason = "Buku tamu digital untuk tamu di bawah 300 orang."
    }
  } else if (need === "galeri") {
    code = "gt"
    reason = "Galeri tamu untuk mengumpulkan foto dari tamu."
  } else {
    if (budget === "under_1m" || guests > 0 && guests < 150) {
      code = "essential"
      reason = "Paling hemat untuk acara intim atau budget di bawah 1 juta."
    } else if (budget === "above_10m" || guests >= 1000) {
      code = "elite"
      reason = "Kapasitas dan fitur paling lengkap untuk acara besar."
    } else if (budget === "6_10m" || guests >= 500) {
      code = "prestige"
      reason = "Cocok untuk tamu 500+ dengan kebutuhan fitur lengkap."
    } else {
      code = "signature"
      reason = "Pilihan paling seimbang untuk sebagian besar acara."
    }
  }

  if (priceBook.base[code] === undefined) {
    const fallback = Object.keys(priceBook.base).find((key) => key === "signature") || Object.keys(priceBook.base)[0]
    if (fallback) code = fallback
  }

  const alternatives = ["essential", "signature", "prestige", "elite"].filter(
    (item) => item !== code && priceBook.base[item] !== undefined
  )

  const express = (() => {
    const iso = facts.wedding_date
    if (!iso) return false
    const days = Math.floor((new Date(iso).getTime() - now.getTime()) / 86_400_000)
    return days >= 0 && days <= 21
  })()

  const waBlastTier = guests >= 1000 ? 300 : guests >= 500 ? 150 : 0

  return {
    package_code: code,
    reason,
    alternatives: alternatives.slice(0, 2),
    wa_blast_tier: waBlastTier,
    express,
  }
}

import { siteOrigin } from "@/lib/site"

export function ctaFor(facts: LeadFacts): { label: string; url: string } {
  const template = facts.template_interest ? encodeURIComponent(facts.template_interest) : ""
  const pkg = facts.package_interest ? encodeURIComponent(facts.package_interest) : ""
  const base = siteOrigin()

  if (template) {
    return {
      label: "Pilih template ini",
      url: `${base}/register?template=${template}${pkg ? `&package=${pkg}` : ""}`,
    }
  }
  if (pkg) {
    return {
      label: "Daftar dengan paket ini",
      url: `${base}/register?package=${pkg}`,
    }
  }
  return { label: "Lihat template dulu", url: `${base}/templates` }
}

export function nextStage(current: LeadStage, signals: {
  missingFacts: number
  objectionCount: number
  ctaReady: boolean
  handoff: boolean
}): LeadStage {
  if (signals.handoff) return "handoff"
  if (signals.ctaReady) return "cta"
  if (signals.objectionCount > 0 && (current === "objection" || current === "recommending")) return "objection"
  if (signals.missingFacts === 0) return current === "new" || current === "qualifying" ? "recommending" : current
  if (current === "new") return "qualifying"
  return current
}

export type FactValidation =
  | { ok: true; value: unknown; summary: string }
  | { ok: false; error: string }

const BUDGET_BANDS: BudgetBand[] = ["under_1m", "1_3m", "3_6m", "6_10m", "above_10m"]
const NEEDS: Need[] = ["undangan", "buku_tamu", "galeri", "belum_tahu"]

export function validateLeadFact(key: string, raw: unknown, now: Date = new Date()): FactValidation {
  switch (key) {
    case "wedding_date": {
      if (typeof raw !== "string") return { ok: false, error: "tanggal tidak valid" }
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return { ok: true, value: raw, summary: raw }
      }
      const parsed = parseWeddingDate(raw, now)
      if (!parsed) return { ok: false, error: "tanggal belum bisa dibaca, minta format tanggal lengkap" }
      return {
        ok: true,
        value: parsed.iso,
        summary: parsed.approximate ? `${parsed.iso} (perkiraan bulan)` : parsed.iso,
      }
    }

    case "city": {
      if (typeof raw !== "string") return { ok: false, error: "kota tidak valid" }
      const value = raw.replace(/\s+/g, " ").trim()
      if (value.length < 2 || value.length > 60) return { ok: false, error: "nama kota tidak valid" }
      return { ok: true, value, summary: value }
    }

    case "guest_count": {
      const value = typeof raw === "number" ? raw : parseGuestCount(String(raw))
      if (value === null || !Number.isFinite(value) || value < 1 || value > 5000) {
        return { ok: false, error: "jumlah tamu harus antara 1 dan 5000" }
      }
      return { ok: true, value: Math.round(value), summary: `${Math.round(value)} tamu` }
    }

    case "budget_band": {
      const value =
        typeof raw === "string" && BUDGET_BANDS.includes(raw as BudgetBand)
          ? (raw as BudgetBand)
          : parseBudgetBand(String(raw))
      if (!value) return { ok: false, error: "range budget belum bisa dibaca" }
      return { ok: true, value, summary: value }
    }

    case "need": {
      const value =
        typeof raw === "string" && NEEDS.includes(raw as Need)
          ? (raw as Need)
          : parseObjectiveNeed(String(raw))
      if (!value) return { ok: false, error: "kebutuhan belum bisa dibaca" }
      return { ok: true, value, summary: value }
    }

    case "package_interest": {
      if (typeof raw !== "string") return { ok: false, error: "paket tidak valid" }
      const value = raw.trim()
      if (value.length < 2 || value.length > 30) return { ok: false, error: "paket tidak valid" }
      return { ok: true, value, summary: value }
    }

    case "template_interest": {
      if (typeof raw !== "string") return { ok: false, error: "template tidak valid" }
      const value = raw.trim()
      if (value.length < 2 || value.length > 60) return { ok: false, error: "template tidak valid" }
      return { ok: true, value, summary: value }
    }

    default:
      return { ok: false, error: `fakta ${key} tidak dikenal` }
  }
}

export function handoffSummary(input: {
  facts: LeadFacts
  reason: string
  name?: string | null
  phone?: string | null
  lastMessage?: string
  recent?: { role: "user" | "assistant"; content: string }[]
  objectionCount?: number
  stage?: LeadStage
}): string {
  const lines = [
    `Nama: ${input.name || "-"}`,
    `Nomor: ${input.phone || "-"}`,
    `Tahap: ${input.stage || "new"}`,
    `Tanggal acara: ${input.facts.wedding_date || "-"}`,
    `Kota: ${input.facts.city || "-"}`,
    `Jumlah tamu: ${input.facts.guest_count ?? "-"}`,
    `Budget: ${input.facts.budget_band || "-"}`,
    `Kebutuhan: ${input.facts.need || "-"}`,
    `Paket diminati: ${input.facts.package_interest || "-"}`,
    `Template diminati: ${input.facts.template_interest || "-"}`,
    `Keberatan: ${input.objectionCount ?? 0}x`,
  ]

  // Ringkasan percakapan: satu pesan terakhir tidak cukup untuk memahami
  // kasus, jadi kirim beberapa giliran terakhir apa adanya.
  const recent = (input.recent || [])
    .filter((item) => item.content && item.content.trim())
    .slice(-4)
  if (recent.length) {
    lines.push("Percakapan terakhir:")
    for (const item of recent) {
      const who = item.role === "user" ? "Klien" : "CS"
      lines.push(`  ${who}: ${item.content.replace(/\s+/g, " ").trim().slice(0, 220)}`)
    }
  } else if (input.lastMessage) {
    lines.push(`Pesan terakhir: ${input.lastMessage.replace(/\s+/g, " ").trim().slice(0, 300)}`)
  }

  return lines.join("\n")
}
