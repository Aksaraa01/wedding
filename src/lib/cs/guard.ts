// Pemeriksaan output SEBELUM dikirim ke klien.
//
// Ini lapisan yang membuat "tidak mengarang" bisa diuji, bukan sekadar
// diharapkan dari model. Setiap pelanggaran punya kode supaya test bisa
// menegaskan perilaku yang benar.

export type Severity = "error" | "warn"

export interface Violation {
  code: string
  severity: Severity
  detail: string
}

export interface GuardInput {
  reply: string
  // Hasil tool pada giliran yang sama. Semua angka di balasan harus ada di sini.
  evidence?: unknown
  // Nomor HP pemilik percakapan (boleh muncul, nomor lain tidak).
  verifiedPhone?: string | null
  maxWords?: number
  expectPrice?: boolean
  expectNoVoucherCodes?: boolean
  expectedVoucherCode?: string | null
}

export interface GuardResult {
  ok: boolean
  violations: Violation[]
}

const LINK_ALLOWLIST = [
  "wedding.aksaraa.com",
  "aksaraa.com",
  "cdn.aksaraa.com",
  "wp.aksaraa.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]

const CLAIM_RULES: { code: string; re: RegExp; evidenceNeedle: string }[] = [
  { code: "policy_claim", re: /\bnett\b/i, evidenceNeedle: "nett" },
  {
    code: "guarantee_claim",
    re: /(?<!tidak )(?<!belum )(?<!bisa )(?<!nggak )(?<!gak )\b(dijamin|terjamin|garansi|pasti (jadi|selesai|beres|datang|bisa))\b/i,
    evidenceNeedle: "guarantee",
  },
  { code: "free_claim", re: /\b(gratis|free)\b/i, evidenceNeedle: "free" },
  { code: "discount_claim", re: /\b(diskon|potongan harga)\b/i, evidenceNeedle: "discount" },
  {
    code: "deadline_claim",
    re: /\b(paling lambat|selesai dalam \d+\s*(hari|jam|menit)|dalam \d+\s*(hari|jam)\s*(lagi|saja|kerja))\b/i,
    evidenceNeedle: "eta",
  },
  { code: "unlimited_claim", re: /\b(unlimited|tanpa batas|sepuasnya)\b/i, evidenceNeedle: "unlimited" },
  {
    code: "capability_claim",
    re: /\b(1|satu)\s+link\b[^.!?]{0,50}\b(2|dua|berdua|pasangan)\b/i,
    evidenceNeedle: "multi_guest_link",
  },
  {
    code: "capability_claim",
    re: /\b(bisa|dapat)\s+(dipakai|digunakan)\s+(2|dua|berdua)\b/i,
    evidenceNeedle: "multi_guest_link",
  },
  // Agent tidak punya tool yang mengubah data. Klaim "sudah diganti/diubah"
  // berarti halusinasi (pernah terjadi: klien tanya "yakin sudah diganti?").
  {
    code: "action_claim",
    re: /\b(sudah|telah)\s+(aku\s+|kami\s+|admin\s+)?(ganti|mengganti|ubah|mengubah|perbarui|memperbarui|update|hapus|menghapus|pindahkan)\b(?!\s*\?)/i,
    evidenceNeedle: "profile_updated",
  },
  {
    code: "action_claim",
    re: /\b(sudah|telah)\s+(di)?(ganti|ubah|perbarui|update|hapus|pindahkan)\b(?!\s*\?)/i,
    evidenceNeedle: "profile_updated",
  },
]

const BUREAUCRATIC_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bsudah saya (catat|terima|proses|teruskan)\b/i, label: "sudah saya catat/terima" },
  { re: /\btelah (saya|kami) (catat|terima|proses)\b/i, label: "telah kami catat/terima" },
  { re: /\bakan kami tindak lanjuti\b/i, label: "akan kami tindak lanjuti" },
  { re: /\bmohon ditunggu\b/i, label: "mohon ditunggu" },
  { re: /\bkami informasikan\b/i, label: "kami informasikan" },
  { re: /\bformulir\b/i, label: "formulir" },
  { re: /\b(kirim|kasih|share)\b[^.!?]{0,40}\bkode\b/i, label: "minta kode voucher" },
  { re: /\bkode voucher\b[^.!?]{0,40}\b(kirim|kasih|sini)\b/i, label: "minta kode voucher" },
  { re: /\bsistem\b/, label: "sistem" },
  { re: /\bpermintaan (anda|kakak) (telah|sudah)\b/i, label: "permintaan Anda telah" },
]

const INTERNAL_LEAK_RE =
  /\b(system prompt|prompt|service role|supabase|api key|secret|database|tool call|environment variable)\b/i

const VOUCHER_CODE_RE = /\b(?=[A-Z0-9-]{4,24}\b)(?=[A-Z0-9-]*\d)[A-Z][A-Z0-9-]*\b/g

const PHONE_RE = /(?:\+?62|0)8\d{7,12}/g
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/gi
const MONEY_RE = /(?:\brp\.?\s*|\b)(\d[\d.,]*)(?:\s*(juta|jt|ribu|rb|k)\b)?/gi

function normalizeNumber(raw: string): number | null {
  const cleaned = raw.replace(/\./g, "").replace(",", ".")
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function moneyIn(text: string): number[] {
  const out: number[] = []
  MONEY_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = MONEY_RE.exec(text)) !== null) {
    const prefix = match[0].slice(0, 2).toLowerCase()
    const unit = (match[2] || "").toLowerCase()
    const hasCurrency = prefix === "rp" || unit.length > 0
    if (!hasCurrency) continue

    const base = normalizeNumber(match[1])
    if (base === null) continue

    let value = base
    if (unit === "juta" || unit === "jt") value = base * 1e6
    else if (unit === "ribu" || unit === "rb" || unit === "k") value = base * 1e3

    // Abaikan potongan kalimat seperti "Rp 4" yang bukan angka harga.
    if (value >= 100_000) out.push(Math.round(value))
  }
  return out
}

function numbersInEvidence(evidence: unknown): Set<number> {
  const found = new Set<number>()

  const walk = (value: unknown, depth: number): void => {
    if (depth > 6 || value === null || value === undefined) return
    if (typeof value === "number" && Number.isFinite(value)) {
      found.add(Math.round(Math.abs(value)))
      return
    }
    if (typeof value === "string") {
      for (const amount of moneyIn(value)) found.add(amount)
      const digits = Number(value.replace(/[^\d]/g, ""))
      if (Number.isFinite(digits) && digits > 0 && digits < 1e12) found.add(Math.round(digits))
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1)
      return
    }
    if (typeof value === "object") {
      for (const item of Object.values(value as Record<string, unknown>)) walk(item, depth + 1)
    }
  }

  walk(evidence, 0)
  return found
}

function evidenceText(evidence: unknown): string {
  try {
    return JSON.stringify(evidence ?? "").toLowerCase()
  } catch {
    return ""
  }
}

export function validateReply(input: GuardInput): GuardResult {
  const reply = (input.reply || "").trim()
  const violations: Violation[] = []
  const maxWords = input.maxWords ?? 90

  if (!reply) {
    return { ok: false, violations: [{ code: "empty_reply", severity: "error", detail: "balasan kosong" }] }
  }

  const evidence = input.evidence ?? null
  const allowedNumbers = numbersInEvidence(evidence)
  const evidenceBlob = evidenceText(evidence)

  for (const amount of moneyIn(reply)) {
    if (!allowedNumbers.has(amount)) {
      violations.push({
        code: "ungrounded_price",
        severity: "error",
        detail: `menyebut Rp ${amount.toLocaleString("id-ID")} tanpa hasil tool`,
      })
    }
  }

  if (
    input.expectPrice &&
    moneyIn(reply).length === 0 &&
    /\b(paket|essential|signature|prestige|elite)\b/i.test(reply)
  ) {
    violations.push({
      code: "missing_price",
      severity: "error",
      detail: "konteks harga tetapi balasan tidak menyebut nominal",
    })
  }

  for (const rule of CLAIM_RULES) {
    if (!rule.re.test(reply)) continue
    if (evidenceBlob.includes(rule.evidenceNeedle)) continue
    violations.push({
      code: rule.code,
      severity: "error",
      detail: `klaim "${rule.code}" tidak didukung hasil tool`,
    })
  }

  for (const pattern of BUREAUCRATIC_PATTERNS) {
    if (pattern.re.test(reply)) {
      violations.push({
        code: "bureaucratic_phrase",
        severity: "error",
        detail: `frasa administrasi: ${pattern.label}`,
      })
    }
  }

  if (INTERNAL_LEAK_RE.test(reply)) {
    violations.push({
      code: "internal_leak",
      severity: "error",
      detail: "menyebut istilah internal",
    })
  }

  PHONE_RE.lastIndex = 0
  let phoneMatch: RegExpExecArray | null
  while ((phoneMatch = PHONE_RE.exec(reply)) !== null) {
    const normalized = `+62${phoneMatch[0].replace(/\D/g, "").replace(/^0+/, "").replace(/^62/, "")}`
    const allowed = input.verifiedPhone ? normalized === input.verifiedPhone : false
    if (!allowed) {
      violations.push({
        code: "pii_phone",
        severity: "error",
        detail: "menampilkan nomor HP yang bukan milik penerima",
      })
    }
  }

  EMAIL_RE.lastIndex = 0
  let emailMatch: RegExpExecArray | null
  while ((emailMatch = EMAIL_RE.exec(reply)) !== null) {
    if (!evidenceBlob.includes(emailMatch[0].toLowerCase())) {
      violations.push({
        code: "pii_email",
        severity: "error",
        detail: "menampilkan email yang tidak ada di data",
      })
    }
  }

  URL_RE.lastIndex = 0
  let urlMatch: RegExpExecArray | null
  while ((urlMatch = URL_RE.exec(reply)) !== null) {
    let host = ""
    try {
      host = new URL(urlMatch[0]).hostname.toLowerCase()
    } catch {
      violations.push({ code: "bad_link", severity: "error", detail: "URL tidak valid" })
      continue
    }
    const allowed = LINK_ALLOWLIST.some((domain) => host === domain || host.endsWith(`.${domain}`))
    if (!allowed && !evidenceBlob.includes(host)) {
      violations.push({ code: "bad_link", severity: "error", detail: `domain tidak diizinkan: ${host}` })
    }
    if (urlMatch[0].startsWith("http://")) {
      violations.push({ code: "insecure_link", severity: "warn", detail: "tautan http, seharusnya https" })
    }
  }

  if (input.expectedVoucherCode) {
    const expected = input.expectedVoucherCode.toUpperCase()
    if (!reply.toUpperCase().includes(expected)) {
      violations.push({
        code: "missing_voucher_code",
        severity: "error",
        detail: `kode ${expected} tidak disebut dalam balasan`,
      })
    }
  }

  if (input.expectNoVoucherCodes) {
    const codes = reply.match(VOUCHER_CODE_RE) || []
    if (codes.length > 0) {
      violations.push({
        code: "voucher_code_leak",
        severity: "error",
        detail: `menyebut kode voucher tanpa diminta: ${codes.slice(0, 3).join(", ")}`,
      })
    }
  }

  const urlCount = (reply.match(/https?:\/\//g) || []).length
  const hasBulletList = /(^|\n)\s*(?:[•\-*]|\d+[.)])\s+/.test(reply)
  if (urlCount >= 3 && !hasBulletList) {
    violations.push({
      code: "list_not_formatted",
      severity: "error",
      detail: `${urlCount} link ditulis dalam satu paragraf, bukan daftar poin`,
    })
  }

  const questionCount = (reply.match(/\?/g) || []).length
  if (questionCount > 1) {
    violations.push({
      code: "too_many_questions",
      severity: "error",
      detail: `${questionCount} pertanyaan dalam satu balasan`,
    })
  }

  const words = reply.split(/\s+/).filter(Boolean).length
  if (words > maxWords) {
    violations.push({
      code: "too_long",
      severity: "warn",
      detail: `${words} kata (batas ${maxWords})`,
    })
  }

  return { ok: !violations.some((v) => v.severity === "error"), violations }
}

// Balasan pengganti ketika guard menolak output model.
export const SAFE_FALLBACK =
  "Sebentar ya Kak, aku cek dulu ke tim biar jawabannya pasti. Nanti aku kabari lagi."
