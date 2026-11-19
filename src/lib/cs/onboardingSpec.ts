// Spesifikasi alur "Bantu Isi Undangan" — murni, tanpa DB, supaya bisa diuji.
//
// Bagian mengikuti urutan publikasi (getPublishBlockers). Untuk tiap bagian,
// daftar field yang ditanyakan satu per satu. Pertanyaan memakai label/field
// yang sudah dipakai editor, jadi data yang dikirim CS sama bentuknya.

import { FIELD_BY_KEY, validateField } from "./profileFields"

export type FlowFieldKind =
  | "text"
  | "longtext"
  | "date"
  | "time"
  | "url"
  | "image"
  | "number"
  | "list"
  | "lines"
  | "lines"

export interface FlowField {
  key: string
  label: string
  question: string
  kind: FlowFieldKind
  optional?: boolean
}

export interface SectionSpec {
  key: string
  label: string
  fields: FlowField[]
  // Bagian yang tidak bisa diisi lewat chat (uang/transaksi) tetap di dashboard.
  manual?: string
  // Bagian yang datanya berbentuk daftar objek (sesi/cerita) ditangani loop.
  repeat?: "sessions" | "stories" | "gifts" | "rundown" | "contacts"
}

export const SECTION_LABELS: Record<string, string> = {
  tema: "Template",
  sampul: "Foto Sampul",
  pembuka: "Kalimat Pembuka",
  profile: "Profil Mempelai",
  acara: "Acara",
  galeri: "Galeri",
  inviting: "Turut Mengundang",
  kutipan: "Kutipan",
  video: "Video",
  story: "Kisah Cinta",
  gift: "Hadiah",
}

export const SECTION_SPECS: Record<string, SectionSpec> = {
  sample: {
    key: "sample",
    label: SECTION_LABELS.sampul,
    fields: [
      {
        key: "cover_photos",
        label: "Foto Sampul",
        question: "Kirim 1–3 foto untuk sampul undangan ya Kak (lewat tombol foto). Balas \"selesai\" kalau cukup.",
        kind: "image",
      },
    ],
  },
  pembuka: {
    key: "pembuka",
    label: SECTION_LABELS.pembuka,
    fields: [
      {
        key: "opening_title",
        label: "Judul Pembuka",
        question: "Kalimat pembuka undangan mau diawali apa? Contoh: The Wedding of",
        kind: "text",
        optional: true,
      },
      {
        key: "opening_description",
        label: "Deskripsi Pembuka",
        question: "Tambahkan satu kalimat pembuka (boleh di-skip dengan \"lewati\").",
        kind: "longtext",
        optional: true,
      },
    ],
  },
  profile: {
    key: "profile",
    label: SECTION_LABELS.profile,
    fields: [
      {
        key: "groom_full_name",
        label: "Nama Lengkap Mempelai 1",
        question: "Nama lengkap mempelai pertama siapa ya Kak?",
        kind: "text",
      },
      {
        key: "bride_full_name",
        label: "Nama Lengkap Mempelai 2",
        question: "Kalau nama lengkap mempelai kedua?",
        kind: "text",
      },
      {
        key: "groom_name",
        label: "Nama Panggilan Mempelai 1",
        question: "Nama panggilan mempelai pertama (yang tampil di undangan)?",
        kind: "text",
        optional: true,
      },
      {
        key: "bride_name",
        label: "Nama Panggilan Mempelai 2",
        question: "Nama panggilan mempelai kedua?",
        kind: "text",
        optional: true,
      },
      {
        key: "groom_parents",
        label: "Orang Tua Mempelai 1",
        question: "Nama orang tua mempelai pertama, format: Bapak X & Ibu Y.",
        kind: "text",
        optional: true,
      },
      {
        key: "bride_parents",
        label: "Orang Tua Mempelai 2",
        question: "Nama orang tua mempelai kedua?",
        kind: "text",
        optional: true,
      },
      {
        key: "groom_instagram",
        label: "Instagram Mempelai 1",
        question: "Instagram mempelai pertama? (username saja, atau \"lewati\")",
        kind: "text",
        optional: true,
      },
      {
        key: "bride_instagram",
        label: "Instagram Mempelai 2",
        question: "Instagram mempelai kedua?",
        kind: "text",
        optional: true,
      },
      {
        key: "couple_initials",
        label: "Inisial Pasangan",
        question: "Inisial pasangan untuk monogram? Contoh: R & N (boleh di-skip).",
        kind: "text",
        optional: true,
      },
      {
        key: "display_name",
        label: "Nama Tampilan / Hashtag",
        question: "Nama tampilan atau hashtag undangan? Contoh: Rafi & Novi (boleh di-skip).",
        kind: "text",
        optional: true,
      },
      {
        key: "groom_photo_url",
        label: "Foto Mempelai 1",
        question: "Kirim foto mempelai pertama lewat tombol foto ya Kak (boleh di-skip).",
        kind: "image",
        optional: true,
      },
      {
        key: "bride_photo_url",
        label: "Foto Mempelai 2",
        question: "Sekarang foto mempelai kedua.",
        kind: "image",
        optional: true,
      },
    ],
  },
  acara: {
    key: "acara",
    label: SECTION_LABELS.acara,
    repeat: "sessions",
    fields: [
      {
        key: "sessions",
        label: "Sesi Acara",
        question: "Ayo isi acara pertama. Nama acaranya apa? (contoh: Akad Nikah)",
        kind: "text",
      },
    ],
  },
  galeri: {
    key: "galeri",
    label: SECTION_LABELS.galeri,
    fields: [
      {
        key: "gallery_photos",
        label: "Galeri Foto",
        question: "Kirim foto galeri satu per satu (minimal 1). Balas \"selesai\" kalau cukup.",
        kind: "image",
      },
    ],
  },
  inviting: {
    key: "inviting",
    label: SECTION_LABELS.inviting,
    fields: [
      {
        key: "inviting_families",
        label: "Turut Mengundang",
        question: "Siapa saja yang turut mengundang? Pisahkan dengan koma, contoh: Keluarga Bapak A, Keluarga Ibu B.",
        kind: "list",
      },
    ],
  },
  kutipan: {
    key: "kutipan",
    label: SECTION_LABELS.kutipan,
    fields: [
      {
        key: "quote_text",
        label: "Kutipan",
        question: "Tulis kutipan atau ayat yang mau ditampilkan di undangan.",
        kind: "longtext",
      },
      {
        key: "quote_source",
        label: "Sumber Kutipan",
        question: "Sumber kutipannya? (contoh: QS. Ar-Rum: 21)",
        kind: "text",
        optional: true,
      },
    ],
  },
  video: {
    key: "video",
    label: SECTION_LABELS.video,
    fields: [
      {
        key: "video_url",
        label: "Link Video",
        question: "Kirim link video (YouTube) untuk bagian sinematik ya Kak.",
        kind: "url",
      },
    ],
  },
  story: {
    key: "story",
    label: SECTION_LABELS.story,
    repeat: "stories",
    fields: [
      {
        key: "stories",
        label: "Kisah Cinta",
        question: "Cerita pertama: judulnya apa? (contoh: Pertama Bertemu)",
        kind: "text",
      },
    ],
  },
  gift: {
    key: "gift",
    label: SECTION_LABELS.gift,
    repeat: "gifts",
    fields: [
      {
        key: "gift_accounts",
        label: "Rekening Hadiah",
        question: "Mau isi rekening/e-wallet untuk hadiah? Sebutkan bank/e-wallet-nya, nomor rekening, dan atas nama. Balas \"lewati\" kalau belum mau.",
        kind: "text",
      },
    ],
  },
  dresscode: {
    key: "dresscode",
    label: "Dress Code",
    fields: [
      {
        key: "dresscode_title",
        label: "Judul Dress Code",
        question: "Bagian dress code mau diberi judul apa? Contoh: Dress Code (boleh di-skip).",
        kind: "text",
        optional: true,
      },
      {
        key: "dresscode_description",
        label: "Deskripsi Dress Code",
        question: "Tulis arahan dress code-nya (boleh di-skip).",
        kind: "longtext",
        optional: true,
      },
    ],
  },
  livestream: {
    key: "livestream",
    label: "Live Streaming",
    fields: [
      {
        key: "livestream_url",
        label: "Link Live Streaming",
        question: "Kirim link live streaming acara (boleh di-skip).",
        kind: "url",
        optional: true,
      },
      {
        key: "livestream_title",
        label: "Judul Live Streaming",
        question: "Judul untuk bagian live streaming? (boleh di-skip)",
        kind: "text",
        optional: true,
      },
    ],
  },
  rundown: {
    key: "rundown",
    label: "Rundown",
    fields: [
      {
        key: "rundown",
        label: "Rundown Acara",
        question: "Kirim rundown acara, satu baris satu kegiatan: 08:00 Akad Nikah (boleh di-skip dengan \"lewati\").",
        kind: "lines",
        optional: true,
      },
    ],
  },
  contacts: {
    key: "contacts",
    label: "Kontak Keluarga",
    fields: [
      {
        key: "contacts",
        label: "Kontak Keluarga",
        question: "Kirim kontak yang bisa dihubungi tamu, satu baris satu kontak: Nama - 08xx - keterangan (boleh di-skip).",
        kind: "lines",
        optional: true,
      },
    ],
  },
}

export const SESSION_QUESTIONS = [
  { key: "name", question: "Nama acaranya apa? (contoh: Akad Nikah)" },
  { key: "date", question: "Tanggal acaranya? Format: 2026-12-12", kind: "date" },
  { key: "time", question: "Jam mulai? Format: 08:00", kind: "time" },
  { key: "venue", question: "Nama tempat acaranya?" },
  { key: "address", question: "Alamat lengkap tempat acara?" },
  { key: "maps_url", question: "Tempel link Google Maps lokasi acaranya." },
] as const

export const STORY_QUESTIONS = [
  { key: "title", question: "Judul momennya? (contoh: Pertama Bertemu)" },
  { key: "description", question: "Ceritakan singkat momen itu (1–2 kalimat)." },
  { key: "year", question: "Tahunnya? (4 digit, boleh di-skip)", optional: true },
] as const

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(\s*-\s*([01]\d|2[0-3]):[0-5]\d)?$/
const MAPS_RE = /^https?:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)\//i

// Validasi per sub-field sesi. Sengaja tidak memvalidasi seluruh array: data
// lama boleh punya tanggal lampau atau jam berbentuk rentang ("08:00-10:00"),
// dan itu tidak boleh menghalangi klien melengkapi field lain.
export function validateSessionField(
  key: string,
  raw: string,
  now: Date = new Date()
): { ok: boolean; value?: string; error?: string } {
  const text = (raw || "").trim()
  if (!text) return { ok: false, error: "Jawabannya masih kosong." }

  switch (key) {
    case "name":
      return text.length <= 80 ? { ok: true, value: text } : { ok: false, error: "Nama acara terlalu panjang." }
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return { ok: false, error: "Format tanggal: 2026-12-12" }
      }
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (new Date(`${text}T00:00:00`) < today) {
        return { ok: false, error: "Tanggal acara tidak boleh di masa lalu." }
      }
      return { ok: true, value: text }
    }
    case "time":
      return TIME_RE.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: "Format jam: 08:00 atau 08:00-10:00" }
    case "venue":
      return text.length <= 120 ? { ok: true, value: text } : { ok: false, error: "Nama tempat terlalu panjang." }
    case "address":
      return text.length <= 300 ? { ok: true, value: text } : { ok: false, error: "Alamat terlalu panjang." }
    case "maps_url":
      return MAPS_RE.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: "Tempel link Google Maps (https://maps…)." }
    default:
      return { ok: true, value: text }
  }
}


const SKIP_WORDS = [
  "lewati",
  "skip",
  "kosong",
  "tidak ada",
  "-",
  "gak ada",
  "nggak ada",
  "ngga ada",
  "ga ada",
  "gak punya",
  "nggak punya",
  "ngga punya",
  "ga punya",
  "tidak punya",
  "belum ada",
  "belum punya",
  "gak punya ig",
  "ga punya ig",
  "tidak punya ig",
  "no",
]

export function isSkip(text: string): boolean {
  return SKIP_WORDS.includes((text || "").trim().toLowerCase())
}

export function fieldSpec(key: string): FlowField | null {
  for (const section of Object.values(SECTION_SPECS)) {
    const found = section.fields.find((field) => field.key === key)
    if (found) return found
  }
  return null
}

export interface ValidationOutcome {
  ok: boolean
  value?: unknown
  error?: string
}

const URL_RE = /^https?:\/\/[^\s]+$/i

export function validateFlowAnswer(field: FlowField, answer: string): ValidationOutcome {
  const text = (answer || "").trim()
  if (!text) return { ok: false, error: "Jawabannya masih kosong." }
  if (field.optional && isSkip(text)) return { ok: true, value: undefined }
  // Field wajib tidak boleh diisi kata "lewati" — itu tersimpan sebagai nama.
  if (!field.optional && isSkip(text)) {
    return { ok: false, error: "Bagian ini wajib diisi, tidak bisa dilewati." }
  }

  const known = FIELD_BY_KEY[field.key]
  if (known) {
    const result = validateField(field.key, text)
    if (!result.ok) return { ok: false, error: result.message }
    return { ok: true, value: result.value }
  }

  switch (field.kind) {
    case "url":
      return URL_RE.test(text) ? { ok: true, value: text } : { ok: false, error: "Link harus diawali https://" }
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: "Format tanggal: 2026-12-12" }
    case "time":
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: "Format jam: 08:00" }
    case "number":
      return /^\d+$/.test(text) ? { ok: true, value: Number(text) } : { ok: false, error: "Isi angka saja." }
    case "lines":
      return {
        ok: true,
        value: text
          .split(/\n|;/)
          .map((item) => item.trim())
          .filter(Boolean),
      }
    case "list":
      return {
        ok: true,
        value: text
          .split(/\n|,|;|\bdan\b/i)
          .map((item) => item.trim())
          .filter(Boolean),
      }
    case "image":
      return { ok: false, error: "Kirim foto lewat tombol foto ya Kak." }
    default:
      return { ok: true, value: text }
  }
}

// Pilih template dari nama yang disebut klien. Exact dulu, lalu partial;
// lebih dari satu kandidat = ambigu (jangan menebak).
export function matchTemplateByName(
  text: string,
  templates: { id: string; name: string; code: string }[]
): { match: { id: string; name: string; code: string } | null; candidates: typeof templates } {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

  const query = normalize(text)
  if (!query) return { match: null, candidates: [] }

  const exact = templates.filter(
    (template) => normalize(template.name) === query || normalize(template.code) === query
  )
  if (exact.length === 1) return { match: exact[0], candidates: [] }

  const partial = templates.filter(
    (template) =>
      normalize(template.name).includes(query) || normalize(template.code).includes(query)
  )
  if (partial.length === 1) return { match: partial[0], candidates: [] }
  return { match: null, candidates: partial.slice(0, 5) }
}

export function mapSectionFromText(text: string): string | null {
  const map: [string, string][] = [
    ["profil", "profile"],
    ["mempelai", "profile"],
    ["nama", "profile"],
    ["acara", "acara"],
    ["tanggal", "acara"],
    ["sesi", "acara"],
    ["sampul", "sampul"],
    ["pembuka", "pembuka"],
    ["galeri", "galeri"],
    ["foto", "galeri"],
    ["kutipan", "kutipan"],
    ["quote", "kutipan"],
    ["cerita", "story"],
    ["kisah", "story"],
    ["video", "video"],
    ["turut", "inviting"],
    ["mengundang", "inviting"],
    ["hadiah", "gift"],
  ]
  for (const [needle, section] of map) {
    if (text.includes(needle)) return section
  }
  return null
}

export function questionForField(field: FlowField): string {
  return field.question
}

// Klien sering membalas pertanyaan dengan pertanyaan lain ("maksudnya apa?",
// "berapa harganya?"). Deteksi ini dipakai agar jawaban seperti itu tidak
// tersimpan sebagai nilai field.
export function looksLikeQuestion(text: string): boolean {
  const value = (text || "").trim()
  if (!value) return false
  if (value.includes("?")) return true
  return /^(apa|apakah|berapa|gimana|bagaimana|kenapa|kok|maksud|maksudnya|bisa|bisakah|kapan|dimana|di mana|siapa|yang benar|contohnya)\b/i.test(
    value
  )
}
