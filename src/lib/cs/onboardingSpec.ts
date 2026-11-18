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
  repeat?: "sessions" | "stories"
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
        question: "Kirim 1–3 foto untuk sampul undangan ya Kak (lewat tombol foto).",
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
        key: "groom_photo_url",
        label: "Foto Mempelai 1",
        question: "Kirim foto mempelai pertama lewat tombol foto ya Kak.",
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
    manual:
      "Bagian hadiah berisi rekening/alamat, jadi harus diisi sendiri di dashboard (menu Hadiah). Aku lanjut ke bagian berikutnya ya Kak.",
    fields: [],
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

const SKIP_WORDS = ["lewati", "skip", "kosong", "tidak ada", "-", "gak ada", "nggak ada"]

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
