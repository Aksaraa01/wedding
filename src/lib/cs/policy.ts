import { detectPackageInterest } from "./playbook"

// Batas kewenangan agent + keputusan eskalasi.
//
// Modul ini murni (tanpa DB, tanpa LLM) supaya bisa diuji deterministik dan
// dipakai baik oleh orchestrator maupun oleh test suite.

export type Intent =
  | "human_request"
  | "opt_out"
  | "refund"
  | "reschedule"
  | "data_change"
  | "voucher"
  | "discount"
  | "timing"
  | "comparison"
  | "payment"
  | "complaint"
  | "out_of_scope"
  | "select_package"
  | "print_question"
  | "cta_register"
  | "data_collection"
  | "status"
  | "invitation_link"
  | "timeline"
  | "recommendation"
  | "package_info"
  | "product_features"
  | "price"
  | "template"
  | "technical"
  | "unknown"

export type Priority = "low" | "normal" | "high"

export type EscalationReason =
  | "human_requested"
  | "refund"
  | "reschedule"
  | "data_change"
  | "voucher"
  | "discount"
  | "payment"
  | "complaint"
  | "sensitive_data"
  | "low_confidence"
  | "no_profile"

export type ToolName =
  | "quote"
  | "list_packages"
  | "product_details"
  | "list_templates"
  | "check_voucher"
  | "list_vouchers"
  | "profile_status"
  | "guest_summary"
  | "profile_draft"

export interface DecisionContext {
  verified: boolean
  hasProfile: boolean
  published: boolean
  strikeCount: number
  sentiment: "neutral" | "frustrated" | "angry"
  objectionCount?: number
  missingFacts?: number
  leadStage?: string
  voucherCode?: string | null
}

export type Decision =
  | { action: "answer"; intent: Intent }
  | { action: "tool"; intent: Intent; tool: ToolName }
  | { action: "playbook"; intent: Intent; step: "qualify" | "objection" | "cta"; strategy?: string }
  | { action: "opt_out"; intent: Intent }
  | { action: "verify"; intent: Intent; reason: "register_and_verify" }
  | { action: "escalate"; intent: Intent; reason: EscalationReason; priority: Priority }
  | { action: "refuse"; intent: Intent; message: string }

// Aturan yang masuk ke system prompt. Dijaga juga oleh guard di sisi output.
export const BOUNDARIES: string[] = [
  "Jangan menyebut harga, diskon, atau total di luar hasil tool pada giliran yang sama.",
  "Jangan menjanjikan tanggal selesai, refund, atau potongan harga.",
  "Jangan mengubah paket, tanggal, atau status pembayaran; itu wewenang ops.",
  "Jangan membuka data tamu, nomor HP, alamat, atau data hadiah sebelum verifikasi.",
  "Jangan mengarang fitur (mis. satu link untuk dua nama) tanpa hasil tool.",
  "Komplain, refund, ubah tanggal, nego, dan bukti bayar selalu dieskalasi ke tim.",
  "Tangani keberatan harga pertama dengan nilai dan paket alternatif; eskalasi hanya kalau klien menekan lagi.",
  "Jangan menanyakan lebih dari satu fakta per balasan.",
  "Kalau klien minta berhenti dihubungi, hormati dan jangan kirim pesan lagi.",
  "Jangan menyebut dirimu AI, bot, atau model.",
]

export const OUT_OF_SCOPE_REPLY =
  "Maaf Kak, aku cuma bisa bantu seputar undangan dan layanan Aksaraa. Untuk hal itu aku belum bisa bantu ya."

const ABBREV: Record<string, string> = {
  blm: "belum",
  blum: "belum",
  udh: "sudah",
  udah: "sudah",
  gk: "tidak",
  ga: "tidak",
  gak: "tidak",
  nggak: "tidak",
  engga: "tidak",
  knp: "kenapa",
  gmn: "bagaimana",
  gmna: "bagaimana",
  brp: "berapa",
  tgl: "tanggal",
}

const norm = (text: string): string => {
  const cleaned = (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
  const expanded = cleaned
    .split(" ")
    .map((word) => ABBREV[word] ?? word)
    .join(" ")
  return ` ${expanded} `
}

const hasAny = (text: string, words: string[]): boolean => words.some((w) => text.includes(w))

export function classify(text: string): Intent {
  const t = norm(text)
  if (!t.trim()) return "unknown"

  if (
    hasAny(t, [
      "minta cs",
      "cs manusia",
      "orang asli",
      "admin manusia",
      "bicara dengan orang",
      "ngobrol sama orang",
      "minta dihubungkan",
      "hubungkan ke tim",
      "telepon",
      "telpon",
      "mau nelpon",
    ])
  ) {
    return "human_request"
  }

  if (
    hasAny(t, [
      "jangan chat",
      "jangan hubungi",
      "jangan kirim",
      "jangan wa",
      "stop chat",
      "unsubscribe",
      "jangan spam",
      "hapus nomor",
    ])
  ) {
    return "opt_out"
  }

  if (hasAny(t, ["refund", "uang kembali", "kembalikan uang", "pembatalan", " batal", "cancel"])) {
    return "refund"
  }

  if (
    hasAny(t, [
      "ganti tanggal",
      "ubah tanggal",
      "pindah tanggal",
      "reschedule",
      "mundurkan",
      "majukan",
      " tunda",
    ])
  ) {
    return "reschedule"
  }

  if (
    hasAny(t, ["voucher", "kode promo", "kode voucher"]) ||
    (/\bpromo\b/.test(t) && /\b(ada|apa|apa saja|yang aktif|tersedia|daftar)\b/.test(t))
  ) {
    return "voucher"
  }

  if (
    hasAny(t, [
      "diskon",
      "potongan",
      " nego",
      "kurangin",
      "bisa kurang",
      "lebih murah",
      "turunin",
      "promo",
      "mahal",
      "kemahalan",
    ])
  ) {
    return "discount"
  }

  if (
    hasAny(t, [
      "nanti dulu",
      "pikir pikir",
      "pikir dulu",
      "diskusi dulu",
      "tanya pasangan",
      "tanya keluarga",
      "belum yakin",
      "minggu depan",
      "bulan depan",
      "nanti lagi",
    ])
  ) {
    return "timing"
  }

  if (hasAny(t, ["banding", "vendor lain", "kompetitor", "pilihan lain", "mau lihat lain"])) {
    return "comparison"
  }

  if (
    hasAny(t, [
      "komplain",
      "keluhan",
      "kecewa",
      "belum jadi",
      "belum selesai",
      "telat",
      "terlambat",
      "lama banget",
      " error",
      "rusak",
      "gagal",
      "tipu",
      "marah",
      "gimana sih",
      "kok gini",
    ])
  ) {
    return "complaint"
  }

  if (
    hasAny(t, [
      "bukti transfer",
      "bukti bayar",
      "sudah bayar",
      "sudah transfer",
      "invoice",
      "tagihan",
      "cicil",
      " dp ",
      "cara bayar",
    ])
  ) {
    return "payment"
  }

  if (hasAny(t, ["politik", "presiden", "saham", "crypto", "judi", "pinjol", "dokter", "resep obat"])) {
    return "out_of_scope"
  }

  if (
    detectPackageInterest(text) &&
    /\b(mau|ambil|pilih|pesan|order|deal|gas|pakai|langganan)\b/i.test(text)
  ) {
    return "select_package"
  }

  if (
    hasAny(t, [
      "mau daftar",
      "cara daftar",
      "daftar gimana",
      "daftar bagaimana",
      "registrasi",
      "mau pesan",
      "mau booking",
      "cara order",
      "mau order",
    ])
  ) {
    return "cta_register"
  }

  if (/\b(cetak|fisik)\b/.test(t) && /undangan|invitasi/.test(t)) {
    return "print_question"
  }

  if (
    hasAny(t, [
      "isi data",
      "lengkapi data",
      "data mempelai",
      "isi undangan",
      "bantu isi",
      "formulir",
      "data acara",
      "isi form",
      "masukkan data",
    ])
  ) {
    return "data_collection"
  }

  if (hasAny(t, ["status", "progres", "progress", "sampai mana", "sudah jadi", "kapan jadi", "udah jadi"])) {
    return "status"
  }

  if (
    hasAny(t, [
      "berapa lama",
      "estimasi waktu",
      "estimasi pengerjaan",
      "lama pengerjaan",
      "waktu pengerjaan",
      "proses pembuatan",
      "berapa hari",
      "butuh berapa lama",
      "cepat ga",
      "lama ga",
      "kapan bisa jadi",
    ])
  ) {
    return "timeline"
  }

  if (
    hasAny(t, [
      "rekomendasi",
      "cocok",
      "bingung pilih",
      "paket mana",
      "saran paket",
      "pilih paket",
      "paket yang pas",
      "paling worth",
      "worth it",
    ])
  ) {
    if (hasAny(t, ["template", "desain", "tema", "model undangan", "contoh undangan"])) return "template"
    return "recommendation"
  }

  if (
    /galeri\s*tamu|buku\s*tamu(\s*digital|\s*qr)?|undangan\s*digital/.test(t) &&
    /fitur|apa itu|itu apa|apa sih|gimana|bagaimana|cara kerja|bedanya|beda apa|isinya|termasuk apa|dapet apa|dapat apa|apa saja|penjelasan|jelasin|jelaskan/.test(t)
  ) {
    return "product_features"
  }

  if (
    /fitur|termasuk apa|dapet apa|dapat apa|isinya apa|isi apa|apa saja yang (didapat|termasuk|ada)/.test(t) &&
    /\b(essential|signature|prestige|elite|dgb|sistem|pro|premium)\b/.test(t)
  ) {
    return "product_features"
  }

  if (
    hasAny(t, [
      "beda paket",
      "perbedaan paket",
      "paket apa saja",
      "fitur paket",
      "isi paket",
      "paket paling",
      "rekomendasi paket",
      "cocok paket",
    ]) ||
    /\bpaket\b[^.!?]{0,30}\b(paling|worth|bagus|cocok|rekomendasi|beda)/.test(t)
  ) {
    return "package_info"
  }

  if (hasAny(t, ["harga", "berapa", "biaya", "tarif", "budget", "anggaran", "paket"])) {
    return "price"
  }

  if (hasAny(t, ["template", "desain", "tema", "model undangan", "contoh undangan"])) {
    return "template"
  }

  if (
    hasAny(t, [
      "link",
      "rsvp",
      "buka",
      "akses",
      "android",
      "ios",
      " hp ",
      " qr",
      "musik",
      "galeri",
      "foto",
      "wish",
      "amplop",
      "undangan",
    ])
  ) {
    return "technical"
  }

  return "unknown"
}

export function decide(intent: Intent, ctx: DecisionContext): Decision {
  switch (intent) {
    case "human_request":
      return { action: "escalate", intent, reason: "human_requested", priority: "high" }

    case "refund":
      return { action: "escalate", intent, reason: "refund", priority: "high" }

    case "reschedule":
      return { action: "escalate", intent, reason: "reschedule", priority: "high" }

    case "opt_out":
      return { action: "opt_out", intent }

    case "discount": {
      if ((ctx.objectionCount || 0) >= 1) {
        return { action: "escalate", intent, reason: "discount", priority: "normal" }
      }
      return { action: "playbook", intent, step: "objection", strategy: "price" }
    }

    case "timing":
      return { action: "playbook", intent, step: "objection", strategy: "timing" }

    case "comparison":
      return { action: "tool", intent, tool: "list_templates" }

    case "select_package":
    case "cta_register":
      return { action: "playbook", intent, step: "cta" }

    case "payment":
      return { action: "escalate", intent, reason: "payment", priority: "normal" }

    case "complaint":
      return { action: "escalate", intent, reason: "complaint", priority: "high" }

    case "out_of_scope":
      return { action: "refuse", intent, message: OUT_OF_SCOPE_REPLY }

    case "print_question":
      return { action: "answer", intent }

    case "data_collection":
      if (!ctx.verified) return { action: "verify", intent, reason: "register_and_verify" }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      return { action: "tool", intent, tool: "profile_draft" }

    case "status":
      if (!ctx.verified) return { action: "verify", intent, reason: "register_and_verify" }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      return { action: "tool", intent, tool: "profile_status" }

    case "price":
      return { action: "tool", intent, tool: "quote" }

    case "timeline":
      return { action: "answer", intent }

    case "voucher":
      return { action: "tool", intent, tool: ctx.voucherCode ? "check_voucher" : "list_vouchers" }

    case "recommendation":
      return { action: "playbook", intent, step: "qualify" }

    case "package_info":
      return { action: "tool", intent, tool: "list_packages" }

    case "product_features":
      return { action: "tool", intent, tool: "product_details" }

    case "template":
      return { action: "tool", intent, tool: "list_templates" }

    case "technical":
      return { action: "answer", intent }

    default:
      if (ctx.sentiment === "angry" || ctx.strikeCount >= 2) {
        return { action: "escalate", intent: "unknown", reason: "low_confidence", priority: "normal" }
      }
      return { action: "answer", intent: "unknown" }
  }
}
