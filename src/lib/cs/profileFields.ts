// Field yang boleh diisi lewat percakapan, plus validasinya.
//
// Prinsip: bot hanya boleh menulis field konten. Apa pun yang menyentuh uang,
// tanggal acara, status, atau identitas publik tetap di tangan ops.

export type FieldType = "text" | "longtext" | "instagram" | "int" | "uuid" | "text_list" | "sessions" | "stories"

export interface FieldSpec {
  key: string
  label: string
  type: FieldType
  question: string
  required: boolean
  hint?: string
}

export const BOT_WRITABLE_FIELDS: FieldSpec[] = [
  {
    key: "display_name",
    label: "Nama tampilan",
    type: "text",
    question: "Nama pasangan yang mau ditampilkan di undangan mau ditulis bagaimana? Contoh: Rafi & Novi",
    required: false,
  },
  {
    key: "groom_full_name",
    label: "Nama lengkap mempelai pria",
    type: "text",
    question: "Nama lengkap mempelai pria siapa ya Kak?",
    required: false,
  },
  {
    key: "bride_full_name",
    label: "Nama lengkap mempelai wanita",
    type: "text",
    question: "Kalau nama lengkap mempelai wanita?",
    required: false,
  },
  {
    key: "groom_parents",
    label: "Orang tua mempelai pria",
    type: "text",
    question: "Nama orang tua mempelai pria, formatnya: Bapak X & Ibu Y",
    required: false,
  },
  {
    key: "bride_parents",
    label: "Orang tua mempelai wanita",
    type: "text",
    question: "Kalau orang tua mempelai wanita, siapa namanya?",
    required: false,
  },
  {
    key: "groom_instagram",
    label: "Instagram mempelai pria",
    type: "instagram",
    question: "Instagram mempelai pria apa? Boleh username saja.",
    required: false,
  },
  {
    key: "bride_instagram",
    label: "Instagram mempelai wanita",
    type: "instagram",
    question: "Instagram mempelai wanita apa?",
    required: false,
  },
  {
    key: "estimated_guest_count",
    label: "Estimasi jumlah tamu",
    type: "int",
    question: "Perkiraan jumlah tamu berapa orang ya Kak?",
    required: false,
  },
  {
    key: "sessions",
    label: "Sesi acara",
    type: "sessions",
    question:
      "Boleh info acaranya: nama acara, tanggal, jam, nama tempat, dan alamatnya. Kalau ada dua acara (akad + resepsi), kirim dua-duanya ya.",
    required: false,
    hint: "name, date (YYYY-MM-DD), time (HH:MM), venue, address, maps_url",
  },
  {
    key: "quote_text",
    label: "Kutipan pembuka",
    type: "longtext",
    question: "Ada kutipan atau ayat yang mau ditampilkan di pembuka undangan?",
    required: false,
  },
  {
    key: "quote_source",
    label: "Sumber kutipan",
    type: "text",
    question: "Kutipannya dari mana? Contoh: QS. Ar-Rum: 21",
    required: false,
  },
  {
    key: "stories",
    label: "Love story",
    type: "stories",
    question: "Mau isi cerita perjalanan kalian? Kirim judul dan ceritanya, boleh beberapa bagian.",
    required: false,
  },
  {
    key: "inviting_families",
    label: "Turut mengundang",
    type: "text_list",
    question: "Ada keluarga yang mau dicantumkan di bagian turut mengundang?",
    required: false,
  },
  {
    key: "selected_template_id",
    label: "Template undangan",
    type: "uuid",
    question: "Template mana yang mau dipakai? Aku bisa kirim daftarnya dulu.",
    required: false,
  },
]

export const FIELD_BY_KEY: Record<string, FieldSpec> = Object.fromEntries(
  BOT_WRITABLE_FIELDS.map((field) => [field.key, field])
)

// Field yang TIDAK boleh ditulis bot. Perubahan tanggal, paket, dan uang
// selalu lewat ops supaya harga dan jadwal produksi tidak bergeser diam-diam.
export const FORBIDDEN_FIELDS = new Set([
  "id",
  "user_id",
  "slug",
  "package_type",
  "payment_status",
  "total_project_cost",
  "wa_blast_tier",
  "express_service",
  "undangan_fisik",
  "estimated_wedding_date",
  "scanner_pin",
  "is_published",
  "active_wp_post_id",
  "active_wp_post_url",
  "created_at",
  "updated_at",
])

export interface ValidationOk {
  ok: true
  value: unknown
  summary: string
}

export interface ValidationError {
  ok: false
  code: string
  message: string
}

export type FieldResult = ValidationOk | ValidationError

const fail = (code: string, message: string): ValidationError => ({ ok: false, code, message })

function cleanText(raw: string): string {
  return raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
}

function text(raw: unknown, min: number, max: number): string | null {
  if (typeof raw !== "string") return null
  const value = cleanText(raw)
  if (value.length < min || value.length > max) return null
  return value
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return false
  return date.toISOString().slice(0, 10) === value
}

function isPastDate(value: string, now: Date): boolean {
  const today = now.toISOString().slice(0, 10)
  return value < today
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

const MAPS_HOSTS = ["maps.google.com", "maps.app.goo.gl", "goo.gl", "google.com"]

function isMapsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    return MAPS_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

export function validateField(key: string, raw: unknown, now: Date = new Date()): FieldResult {
  if (FORBIDDEN_FIELDS.has(key)) {
    return fail("forbidden_field", `Field ${key} tidak boleh diubah lewat bot`)
  }
  const spec = FIELD_BY_KEY[key]
  if (!spec) return fail("unknown_field", `Field ${key} tidak dikenal`)

  switch (spec.type) {
    case "text": {
      const value = text(raw, 2, 120)
      return value ? { ok: true, value, summary: value } : fail("invalid_text", `${spec.label} tidak valid`)
    }

    case "longtext": {
      const value = text(raw, 2, 600)
      return value ? { ok: true, value, summary: value } : fail("invalid_text", `${spec.label} tidak valid`)
    }

    case "instagram": {
      if (typeof raw !== "string") return fail("invalid_instagram", "Instagram tidak valid")
      // Terima bentuk yang wajar ditulis klien: "@novi", "ig: novi",
      // "instagram.com/novi", dengan spasi/trailing slash.
      const value = raw
        .trim()
        .replace(/^(ig|instagram)\s*[:=]\s*/i, "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@+/, "")
        .replace(/\/.*$/, "")
        .trim()
      if (!/^[A-Za-z0-9._]{1,30}$/.test(value)) {
        return fail("invalid_instagram", "Username Instagram tidak valid")
      }
      return { ok: true, value, summary: `@${value}` }
    }

    case "int": {
      const value = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d]/g, ""))
      if (!Number.isFinite(value) || value < 1 || value > 5000) {
        return fail("invalid_guest_count", "Jumlah tamu harus antara 1 dan 5000")
      }
      return { ok: true, value: Math.round(value), summary: `${Math.round(value)} tamu` }
    }

    case "uuid": {
      const value = typeof raw === "string" ? raw.trim() : ""
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return fail("invalid_uuid", "Template tidak valid")
      }
      return { ok: true, value, summary: "template dipilih" }
    }

    case "text_list": {
      if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) {
        return fail("invalid_list", "Daftar harus berisi 1 sampai 20 item")
      }
      const values: string[] = []
      for (const item of raw) {
        const value = text(item, 2, 80)
        if (!value) return fail("invalid_list_item", "Ada item yang tidak valid")
        values.push(value)
      }
      return {
        ok: true,
        value: values,
        summary: values.join(", "),
      }
    }

    case "sessions": {
      if (!Array.isArray(raw) || raw.length < 1 || raw.length > 6) {
        return fail("invalid_sessions", "Isi 1 sampai 6 sesi acara")
      }
      const sessions = []
      for (const item of raw) {
        if (!item || typeof item !== "object") return fail("invalid_sessions", "Format sesi tidak valid")
        const source = item as Record<string, unknown>
        const name = text(source.name ?? "Acara", 2, 60)
        const venue = text(source.venue, 3, 120)
        const address = text(source.address, 5, 300)
        const date = typeof source.date === "string" ? source.date.trim() : ""
        const time = typeof source.time === "string" ? source.time.trim() : ""
        if (!name) return fail("invalid_sessions", "Nama acara tidak valid")
        if (!isIsoDate(date)) return fail("invalid_sessions", "Tanggal acara harus format YYYY-MM-DD")
        if (isPastDate(date, now)) return fail("invalid_sessions", "Tanggal acara tidak boleh di masa lalu")
        if (!isTime(time)) return fail("invalid_sessions", "Jam acara harus format HH:MM")
        if (!venue) return fail("invalid_sessions", "Nama tempat tidak valid")
        if (!address) return fail("invalid_sessions", "Alamat tidak valid")

        let mapsUrl = ""
        if (source.maps_url !== undefined && source.maps_url !== "") {
          if (typeof source.maps_url !== "string" || !isMapsUrl(source.maps_url)) {
            return fail("invalid_sessions", "Link maps harus https dan dari Google Maps")
          }
          mapsUrl = source.maps_url
        }

        sessions.push({ name, date, time, venue, address, maps_url: mapsUrl })
      }
      return {
        ok: true,
        value: sessions,
        summary: sessions.map((s) => `${s.name} ${s.date} ${s.time} di ${s.venue}`).join("; "),
      }
    }

    case "stories": {
      if (!Array.isArray(raw) || raw.length < 1 || raw.length > 12) {
        return fail("invalid_stories", "Isi 1 sampai 12 bagian cerita")
      }
      const stories = []
      for (const item of raw) {
        if (!item || typeof item !== "object") return fail("invalid_stories", "Format cerita tidak valid")
        const source = item as Record<string, unknown>
        const title = text(source.title, 2, 120)
        const description = text(source.description, 2, 600)
        if (!title || !description) return fail("invalid_stories", "Judul dan cerita wajib diisi")
        let year = ""
        if (source.year !== undefined && source.year !== "") {
          const candidate = String(source.year).trim()
          if (!/^\d{4}$/.test(candidate)) return fail("invalid_stories", "Tahun harus 4 digit")
          year = candidate
        }
        stories.push({ title, description, year })
      }
      return { ok: true, value: stories, summary: stories.map((s) => s.title).join(", ") }
    }

    default:
      return fail("unsupported_type", "Tipe field tidak didukung")
  }
}

export interface Draft {
  [key: string]: unknown
}

export function applyAnswer(draft: Draft, key: string, raw: unknown, now: Date = new Date()): FieldResult {
  const result = validateField(key, raw, now)
  if (!result.ok) return result
  return { ...result, value: { ...draft, [key]: result.value } }
}

// Field yang harus dibacakan ulang sebelum disimpan.
const NEEDS_CONFIRMATION = new Set([
  "sessions",
  "stories",
  "estimated_guest_count",
  "selected_template_id",
  "inviting_families",
])

export function requiresConfirmation(key: string): boolean {
  return NEEDS_CONFIRMATION.has(key)
}

// Pertanyaan berikutnya: field pertama yang belum terisi.
export function nextQuestion(draft: Draft, present: Set<string> = new Set()): FieldSpec | null {
  for (const spec of BOT_WRITABLE_FIELDS) {
    if (draft[spec.key] !== undefined) continue
    if (present.has(spec.key)) continue
    return spec
  }
  return null
}

export interface PatchResult {
  ok: boolean
  patch: Record<string, unknown>
  rejected: string[]
}

// Ubah draft menjadi patch DB. `inviting_families` disimpan sebagai TEXT JSON
// di kolom lama, jadi harus di-stringify — jangan kirim array mentah.
export function buildPatch(draft: Draft): PatchResult {
  const patch: Record<string, unknown> = {}
  const rejected: string[] = []

  for (const [key, value] of Object.entries(draft)) {
    if (FORBIDDEN_FIELDS.has(key)) {
      rejected.push(key)
      continue
    }
    if (!FIELD_BY_KEY[key]) {
      rejected.push(key)
      continue
    }
    if (key === "inviting_families") {
      patch[key] = JSON.stringify(value)
      continue
    }
    patch[key] = value
  }

  return { ok: rejected.length === 0 && Object.keys(patch).length > 0, patch, rejected }
}
