import { detectPackageInterest } from "./playbook"
import {
  paymentInstructionsReply,
  premiumTemplateReply,
  switchTemplateReply,
  templateGalleryReply,
} from "./contact"
import {
  asksToSwitchTemplate,
  detectTemplateCategory,
  detectTemplateShelf,
} from "./templateFilter"

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
  | "feedback_status"
  | "invitation_link"
  | "timeline"
  | "recommendation"
  | "package_info"
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
  | "discount"
  | "voucher"
  | "payment"
  | "complaint"
  | "sensitive_data"
  | "low_confidence"
  | "no_profile"

export type ToolName =
  | "quote"
  | "list_packages"
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
  // Klien menyatakan sudah membayar / mengirim bukti. Pertanyaan "cara bayar"
  // dijawab nomor tim; klaim pembayaran tetap jadi tiket.
  paidClaim?: boolean
  // Klien minta SELURUH daftar template ("semua template dilihat di mana").
  wantsAllTemplates?: boolean
  kidsTopic?: boolean
  // "template premium itu apa?" → soal filter Basic/Premium di galeri.
  asksPremiumTemplate?: boolean
  // "bisa ganti template setelah daftar?" → kebijakan, bukan permintaan galeri.
  asksSwitchTemplate?: boolean
  // Web anonim tidak punya jalur verifikasi (PIN/OTP dikirim ke WhatsApp),
  // jadi permintaan data langsung dieskalasi, bukan disuruh kirim PIN.
  channel?: "web" | "wa"
}

export type Decision =
  | { action: "answer"; intent: Intent }
  | { action: "tool"; intent: Intent; tool: ToolName }
  | { action: "playbook"; intent: Intent; step: "qualify" | "objection" | "cta"; strategy?: string }
  | { action: "opt_out"; intent: Intent }
  | { action: "verify"; intent: Intent; reason: "register_and_verify" }
  | { action: "escalate"; intent: Intent; reason: EscalationReason; priority: Priority }
  | { action: "refuse"; intent: Intent; message: string }
  | { action: "contact"; intent: Intent; message: string }

// Aturan yang masuk ke system prompt. Dijaga juga oleh guard di sisi output.
export const BOUNDARIES: string[] = [
  "Jangan menyebut harga, diskon, atau total di luar hasil tool pada giliran yang sama.",
  "Jangan menjanjikan tanggal selesai, refund, atau potongan harga.",
  "Jangan mengubah paket, tanggal, atau status pembayaran; itu wewenang ops.",
  "Jangan membuka data tamu, nomor HP, alamat, atau data hadiah sebelum verifikasi.",
  "Jangan mengarang fitur (mis. satu link untuk dua nama) tanpa hasil tool.",
  "Komplain, refund, ubah tanggal, nego, dan bukti bayar selalu dieskalasi ke tim.",
  "Voucher dan potongan khusus tidak diputuskan agent; selalu diperiksa tim dulu.",
  "Jangan menjamin kuota voucher atau bahwa kode akan berhasil saat registrasi.",
  "Jangan pernah bilang data undangan sudah diubah, diganti, atau dihapus. Agent tidak punya akses ubah; perubahan data dilakukan tim atau dashboard pasangan.",
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

// Klien mengetik cepat: "tenplate", "templat", "tempelate". Tanpa ini
// "Daftar tenplate nya dong" jatuh ke model padahal itu permintaan galeri.
const TYPO: Record<string, string> = {
  tenplate: "template",
  templat: "template",
  tempelate: "template",
  tamplete: "template",
  templete: "template",
  desian: "desain",
}

export function fixTypos(text: string): string {
  return (text || "").replace(/\b(tenplate|templat|tempelate|tamplete|templete|desian)\b/g, (m) => TYPO[m] || m)
}

const norm = (text: string): string => {
  const cleaned = (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
  const expanded = cleaned
    .split(" ")
    .map((word) => ABBREV[word] ?? TYPO[word] ?? word)
    .join(" ")
  return ` ${expanded} `
}

const hasAny = (text: string, words: string[]): boolean => words.some((w) => text.includes(w))

// "Semua template nya bisa dilihat dimana?", "ada template apa saja?",
// "minta daftar desain" → klien minta GALERI, bukan 2-3 link contoh.
const ALL_TEMPLATE_TRIGGERS = [
  /\b(semua|seluruh|daftar|list|macam|jenis|pilihan|contoh|katalog|catalog)\b[^.!?]{0,25}\b(template|desain|tema)\b/,
  /\b(template|desain|tema)\b[^.!?]{0,25}\b(semua|daftar|list|apa saja|apa aja|macam|jenis|pilihan)\b/,
  /\b(lihat|liat|cek)\s+(semua|seluruh)?\s*(template|desain|galeri)\b/,
  /\bgaleri\s+(template|desain)\b/,
  // "template nya bisa dilihat dimana?", "desainnya lihat di mana ya"
  /\b(template|desain)\w*\b[^.!?]{0,30}\b(dilihat|diliat|lihat|liat|dimana|di\s*mana|kemana|ke\s*mana)\b/,
]

// Jangan salah tangkap: "template saya/undangan saya" itu soal undangan sendiri.
const OWN_INVITATION = /\b(template|desain|undangan)\s+(saya|aku|ku|kami)\b/

export function wantsAllTemplates(text: string): boolean {
  const value = fixTypos((text || "").toLowerCase())
  if (!value.trim()) return false
  if (OWN_INVITATION.test(value)) return false
  // "template adat ada apa aja?" = minta daftar kategori, bukan seluruh galeri.
  if (detectTemplateCategory(value)) return false
  // "template terbaru apa aja?" / "yang paling populer?" punya rak sendiri.
  if (detectTemplateShelf(value)) return false
  // "kalau sudah daftar bisa ganti template?" itu pertanyaan kebijakan, bukan
  // permintaan galeri — dan bot tidak boleh menjanjikan penggantian.
  if (asksToSwitchTemplate(value)) return false
  return ALL_TEMPLATE_TRIGGERS.some((re) => re.test(value))
}

// Sapaan/akuan singkat yang TIDAK boleh memicu eskalasi. Tanpa ini, "halo"
// atau "ok" akan dianggap di luar intent dan membanjiri grup ops.
const SOCIAL_RE =
  /^(halo|hallo|hai|hi|hello|pagi|siang|sore|malam|assalamualaikum|salam|permisi|ok|oke|okay|siap|baik|boleh|mantap|ya|iya|tidak|belum|sudah|terima kasih|makasih|thanks|thank you|thx|test|tes|p)\b/i

export function isSocialMessage(text: string): boolean {
  const value = (text || "").trim()
  if (!value) return true
  if (value.length <= 2) return true
  return value.length <= 24 && SOCIAL_RE.test(value)
}

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
      "minta tim",
      "teruskan ke tim",
      "sambungkan",
      "buatkan tiket",
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
    hasAny(t, [
      "ganti nama",
      "ubah nama",
      "salah nama",
      "nama salah",
      "koreksi nama",
      "ganti data",
      "ubah data",
      "perbarui data",
      "update data",
      "ganti foto",
      "ubah foto",
      "ganti rekening",
      "ubah rekening",
      "ganti nomor",
      "ubah nomor",
      "ganti alamat",
      "ubah alamat",
      "hapus data",
    ]) ||
    (/\b(ganti|ubah|perbarui|update|koreksi)\b/.test(t) &&
      /\b(data|nama|foto|rekening|alamat|nomor hp|nomor wa)\b/.test(t))
  ) {
    return "data_change"
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
      "cara pembayaran",
      "mau bayar",
      "mau transfer",
      "mau tf",
      "transfer ke",
      "bayar paket",
      "pelunasan",
      "nomor rekening",
      "no rekening",
      "rekening pembayaran",
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

  // Revisi/masukan undangan: "status feedback", "revisi saya", "berapa kali
  // revisi", "mau kasih masukan". Diletakkan sebelum status & price supaya
  // "berapa kali revisi" tidak dianggap pertanyaan harga.
  if (
    hasAny(t, [
      "feedback",
      "revisi",
      "masukan",
      "perbaikan undangan",
      "catatan dari tim",
      "catatan revisi",
    ]) &&
    !hasAny(t, ["voucher", "pembayaran", "ganti template", "ganti desain"])
  ) {
    return "feedback_status"
  }

  if (
    hasAny(t, [
      "status",
      "progres",
      "progress",
      "sampai mana",
      "sudah jadi",
      "kapan jadi",
      "udah jadi",
      "sudah aktif",
      "aktif belum",
      "publish",
      "dipublish",
      "di publish",
      "tayang",
      "terbit",
    ])
  ) {
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

  // "Rekomendasi template / desain" itu soal DESAIN, bukan kualifikasi paket.
  // Tanpa cabang ini, kata "rekomendasi" menangkap semuanya dan klien yang minta
  // template malah ditanya "butuh undangan digital, buku tamu QR, atau galeri?".
  if (
    hasAny(t, ["template", "desain", "tema"]) &&
    hasAny(t, ["rekomendasi", "rekomen", "rekomendasiin", "saran", "cocok", "bingung", "pilih", "bagus"])
  ) {
    return "template"
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
    return "recommendation"
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

  // "link pembayaran / info pembayaran" itu soal bayar, bukan soal undangan.
  // (Dibatasi supaya "status pembayaran" tetap masuk intent status.)
  if (/\b(link|tautan)\s+(pembayaran|bayar)\b/.test(t) || /\b(cara|info|prosedur)\s+(pembayaran|bayar)\b/.test(t)) {
    return "payment"
  }

  // Permintaan tautan undangan. Dibedakan dari "link pembayaran/invoice/grup".
  // Keluhan teknis ("link undangan ga bisa dibuka di android") tetap technical,
  // bukan permintaan tautan.
  if (
    !hasAny(t, [
      "bayar",
      "pembayaran",
      "invoice",
      "voucher",
      "grup",
      "group",
      "telegram",
      "error",
      "tidak bisa",
      "ga bisa",
      "gak bisa",
      "nggak bisa",
      "gagal",
      "blank",
      "android",
      "ios",
      "iphone",
      "lambat",
      "lemot",
    ]) &&
    ((hasAny(t, ["link", "tautan", "url", "share", "sebar", "bagikan"]) &&
      hasAny(t, ["undangan", "invit", "tamu", "linknya", "tautannya"])) ||
      /\b(link|tautan)\s*(nya)?\s*(mana|dimana|di mana|apa)\b/.test(t))
  ) {
    return "invitation_link"
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

const ANGRY_MARKERS = [
  "marah",
  "tipu",
  "bodoh",
  "sampah",
  "gak jelas",
  "tidak jelas",
  "ngawur",
  "parah banget",
  "bikin kesel",
]

const FRUSTRATED_MARKERS = [
  "kesal",
  "kecewa",
  "parah",
  "lama banget",
  "gimana sih",
  "kok gini",
  "kesel",
  "dibales",
  "nggak dibales",
  "tidak dibales",
]

// Deteksi kasar nada klien. Tanpa ini, eskalasi "low_confidence" tidak pernah
// menyala di web karena route dulu selalu mengirim sentiment "neutral".
export function detectSentiment(text: string): "neutral" | "frustrated" | "angry" {
  const t = norm(text)
  if (!t.trim()) return "neutral"
  if (hasAny(t, ANGRY_MARKERS)) return "angry"
  if (hasAny(t, FRUSTRATED_MARKERS)) return "frustrated"
  return "neutral"
}

// Berapa balasan agent berturut-turut yang intent-nya "unknown". Dipakai untuk
// mengeskalasi percakapan web yang berulang kali tidak dipahami.
export function countUnknownStrikes(
  rows: { direction: string; intent?: string | null }[]
): number {
  let strikes = 0
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    if (row.direction !== "out") continue
    if (row.intent === "unknown") {
      strikes += 1
      continue
    }
    break
  }
  return strikes
}

export function detectPaymentClaim(text: string): boolean {
  const t = norm(text)
  if (!t.trim()) return false
  return (
    /\b(sudah|udah|baru|telah)\s+(transfer|tf|bayar)\b/.test(t) ||
    /\bbukti\s+(transfer|bayar|pembayaran)\b/.test(t) ||
    /\bini\s+bukti(nya)?\b/.test(t) ||
    /\b(minta|kirim|terima)\s+invoice\b/.test(t) ||
    /\b(tagihan|invoice)\b/.test(t)
  )
}

export function decide(intent: Intent, ctx: DecisionContext): Decision {
  switch (intent) {
    case "human_request":
      return { action: "escalate", intent, reason: "human_requested", priority: "high" }

    case "refund":
      return { action: "escalate", intent, reason: "refund", priority: "high" }

    case "reschedule":
      return { action: "escalate", intent, reason: "reschedule", priority: "high" }

    case "data_change":
      if (!ctx.verified) {
        return ctx.channel === "web"
          ? { action: "escalate", intent, reason: "no_profile", priority: "normal" }
          : { action: "verify", intent, reason: "register_and_verify" }
      }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      // Agent tidak punya tool ubah data: selalu jadi tiket tim.
      return { action: "escalate", intent, reason: "data_change", priority: "normal" }

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
      // "Cara bayar" → arahkan ke nomor tim. Klaim sudah bayar / minta invoice
      // tetap jadi tiket supaya dicek.
      if (ctx.paidClaim) return { action: "escalate", intent, reason: "payment", priority: "normal" }
      // Pertanyaan "mau bayar / rekening / pelunasan": kirim instruksi transfer
      // (deterministik) DAN buat tiket supaya masuk filter "Perlu" di /ops/cs.
      // AI tidak dijeda supaya klien tetap bisa bertanya hal lain.
      // Belum terdaftar tetap boleh bayar, tapi diberi tautan pendaftaran.
      return {
        action: "contact",
        intent,
        message: paymentInstructionsReply({
          registered: ctx.hasProfile,
          kids: ctx.kidsTopic,
        }),
      }

    case "complaint":
      return { action: "escalate", intent, reason: "complaint", priority: "high" }

    case "out_of_scope":
      return { action: "refuse", intent, message: OUT_OF_SCOPE_REPLY }

    case "print_question":
      return { action: "answer", intent }

    case "data_collection":
      if (!ctx.verified) {
        return ctx.channel === "web"
          ? { action: "escalate", intent, reason: "no_profile", priority: "normal" }
          : { action: "verify", intent, reason: "register_and_verify" }
      }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      return { action: "tool", intent, tool: "profile_draft" }

    case "feedback_status":
      if (!ctx.verified) {
        return ctx.channel === "web"
          ? { action: "escalate", intent, reason: "no_profile", priority: "normal" }
          : { action: "verify", intent, reason: "register_and_verify" }
      }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      return { action: "answer", intent }

    case "invitation_link":
      if (!ctx.verified) {
        return ctx.channel === "web"
          ? { action: "escalate", intent, reason: "no_profile", priority: "normal" }
          : { action: "verify", intent, reason: "register_and_verify" }
      }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      return { action: "tool", intent, tool: "profile_status" }

    case "status":
      if (!ctx.verified) {
        return ctx.channel === "web"
          ? { action: "escalate", intent, reason: "no_profile", priority: "normal" }
          : { action: "verify", intent, reason: "register_and_verify" }
      }
      if (!ctx.hasProfile) return { action: "escalate", intent, reason: "no_profile", priority: "normal" }
      return { action: "tool", intent, tool: "profile_status" }

    case "price":
      return { action: "tool", intent, tool: "quote" }

    case "timeline":
      return { action: "answer", intent }

    case "voucher":
      // Semua pertanyaan voucher diteruskan ke tim. Agent tidak pernah memutuskan
      // validitas/kuota sendiri, walau kode bisa dibaca dari DB.
      return { action: "escalate", intent, reason: "voucher", priority: "normal" }

    case "recommendation":
      return { action: "playbook", intent, step: "qualify" }

    case "package_info":
      return { action: "tool", intent, tool: "list_packages" }

    case "template":
      if (ctx.asksSwitchTemplate) {
        return { action: "contact", intent, message: switchTemplateReply() }
      }
      if (ctx.asksPremiumTemplate) {
        return { action: "contact", intent, message: premiumTemplateReply() }
      }
      if (ctx.wantsAllTemplates) {
        return {
          action: "contact",
          intent,
          message: ctx.kidsTopic ? templateGalleryReply(true) : templateGalleryReply(false),
        }
      }
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
