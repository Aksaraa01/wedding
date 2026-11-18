// Retrieval untuk knowledge base CS.
//
// Sengaja leksikal (tanpa embedding): tidak butuh provider embedding, jalan di
// VPS kecil, dan hasilnya deterministik sehingga bisa diuji. Kolom
// `cs_chunks.embedding` tetap disiapkan untuk upgrade semantik nanti.
//
// Aturan penting: knowledge base TIDAK BOLEH memuat nominal. Harga selalu dari
// tool; teks artikel yang menyebut rupiah dinetralkan saat ingest.

export interface KnowledgeChunk {
  title: string
  url: string | null
  heading: string | null
  content: string
}

export interface RetrievedSource extends KnowledgeChunk {
  score: number
}

const STOPWORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "ini", "itu", "ada",
  "atau", "juga", "akan", "bisa", "tidak", "gak", "nggak", "ga", "saya", "aku",
  "kamu", "kakak", "kak", "ya", "sih", "dong", "deh", "mau", "apa", "apakah",
  "bagaimana", "gimana", "berapa", "kapan", "dimana", "mana", "nya", "aja",
  "saja", "udah", "sudah", "belum", "kalau", "kalo", "biar", "sama", "pada",
  "oleh", "dalam", "kita", "kami", "mereka", "anda", "the", "and", "for",
  "boleh", "minta", "tolong", "mohon", "min", "admin",
])

// Ekspansi sinonim dua arah: istilah klien ↔ istilah dokumen.
const SYNONYMS: Record<string, string[]> = {
  harga: ["harga", "biaya", "tarif"],
  biaya: ["biaya", "harga", "tarif"],
  tarif: ["tarif", "harga", "biaya"],
  bayar: ["bayar", "pembayaran", "transfer", "tagihan"],
  pembayaran: ["pembayaran", "bayar", "transfer"],
  tagihan: ["tagihan", "pembayaran", "invoice"],
  daftar: ["daftar", "registrasi", "booking"],
  registrasi: ["registrasi", "daftar"],
  rsvp: ["rsvp", "konfirmasi", "hadir"],
  konfirmasi: ["konfirmasi", "rsvp", "hadir"],
  cetak: ["cetak", "fisik", "printing"],
  fisik: ["fisik", "cetak"],
  foto: ["foto", "galeri", "kamera"],
  galeri: ["galeri", "foto"],
  musik: ["musik", "lagu", "audio"],
  lagu: ["lagu", "musik"],
  qr: ["qr", "barcode", "checkin", "scanner"],
  checkin: ["checkin", "qr", "kehadiran"],
  revisi: ["revisi", "ubah", "edit", "ganti"],
  ubah: ["ubah", "revisi", "ganti"],
  ganti: ["ganti", "ubah", "revisi"],
  link: ["link", "tautan", "url", "domain"],
  tautan: ["tautan", "link", "url"],
  domain: ["domain", "link", "subdomain"],
  batal: ["batal", "refund", "pembatalan"],
  refund: ["refund", "batal", "pembatalan"],
  promo: ["promo", "voucher", "diskon", "potongan"],
  voucher: ["voucher", "promo", "diskon"],
  diskon: ["diskon", "promo", "voucher"],
  express: ["express", "kilat", "cepat"],
  kilat: ["kilat", "express"],
  template: ["template", "desain", "tema"],
  desain: ["desain", "template", "tema"],
  status: ["status", "progres", "progress"],
  progres: ["progres", "status", "progress"],
  tamu: ["tamu", "guest", "undangan"],
  nama: ["nama", "tamu"],
  kado: ["kado", "hadiah", "amplop"],
  hadiah: ["hadiah", "kado", "amplop"],
  alamat: ["alamat", "kirim", "kado"],
}

const MONEY_PATTERNS = [
  /\brp\.?\s*\d[\d.,]*(?:\s*(?:juta|jt|ribu|rb|k))?\b/gi,
  /\b\d[\d.,]*\s*(?:juta|jt|ribu|rb)\b/gi,
]

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
  ndash: "-",
  mdash: "-",
}

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        const point = Number.parseInt(code.slice(2), 16)
        return Number.isFinite(point) ? String.fromCodePoint(point) : match
      }
      if (code.startsWith("#")) {
        const point = Number.parseInt(code.slice(1), 10)
        return Number.isFinite(point) ? String.fromCodePoint(point) : match
      }
      return ENTITIES[code.toLowerCase()] ?? " "
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim()
}

// Buang nominal dari teks supaya model tidak pernah "membaca harga" dari
// artikel. Harga hanya boleh datang dari tool.
export function stripMoney(text: string): string {
  let out = text || ""
  for (const pattern of MONEY_PATTERNS) {
    out = out.replace(pattern, "[nominal sesuai paket]")
  }
  return out
}

export function htmlToChunks(body: string): { heading: string | null; content: string }[] {
  const html = (body || "").trim()
  if (!html) return []

  const chunks: { heading: string | null; content: string }[] = []
  const parts = html.split(/<h2[^>]*>/i)
  const intro = stripHtml(parts[0] || "")
  if (intro) chunks.push({ heading: null, content: intro })

  for (const part of parts.slice(1)) {
    const closeIdx = part.search(/<\/h2>/i)
    const heading = stripHtml(closeIdx >= 0 ? part.slice(0, closeIdx) : part).slice(0, 160)
    const rest = closeIdx >= 0 ? part.slice(closeIdx + 5) : ""
    const content = stripHtml(rest)
    if (content) chunks.push({ heading: heading || null, content })
  }

  return chunks
    .map((chunk) => ({ heading: chunk.heading, content: stripMoney(chunk.content) }))
    .filter((chunk) => chunk.content.length > 40)
    .map((chunk) => ({ heading: chunk.heading, content: chunk.content.slice(0, 1200) }))
}

export function tokenize(text: string): string[] {
  const base = (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))

  const out: string[] = []
  for (const word of base) {
    out.push(word)
    for (const synonym of SYNONYMS[word] || []) {
      if (synonym !== word) out.push(synonym)
    }
  }
  return out
}

export function retrieveKnowledge(
  chunks: KnowledgeChunk[],
  query: string,
  options?: { limit?: number; minScore?: number }
): RetrievedSource[] {
  const limit = options?.limit ?? 3
  const minScore = options?.minScore ?? 0
  const queryTokens = Array.from(new Set(tokenize(query)))
  if (!chunks.length || !queryTokens.length) return []

  const docFreq = new Map<string, number>()
  const prepared = chunks.map((chunk) => {
    const tokens = tokenize(`${chunk.heading || ""} ${chunk.content}`)
    const freq = new Map<string, number>()
    for (const token of tokens) freq.set(token, (freq.get(token) || 0) + 1)
    for (const token of freq.keys()) docFreq.set(token, (docFreq.get(token) || 0) + 1)
    return { chunk, freq, length: Math.max(tokens.length, 1) }
  })

  const total = prepared.length
  const scored: RetrievedSource[] = []

  for (const item of prepared) {
    let score = 0
    for (const token of queryTokens) {
      const tf = item.freq.get(token)
      if (!tf) continue
      const idf = Math.log(1 + total / (1 + (docFreq.get(token) || 0)))
      score += (1 + Math.log(tf)) * idf
    }
    if (score <= minScore) continue
    scored.push({ ...item.chunk, score: score / Math.sqrt(item.length) })
  }

  scored.sort((a, b) => b.score - a.score)

  // Satu potongan per dokumen supaya konteks tidak didominasi satu artikel.
  const seen = new Set<string>()
  const picked: RetrievedSource[] = []
  for (const source of scored) {
    const key = source.title
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(source)
    if (picked.length >= limit) break
  }
  return picked
}

export function citationLine(source: { title: string; url: string | null }): string {
  return source.url
    ? `\n\nSumber: ${source.title} (${source.url})`
    : `\n\nSumber: ${source.title}`
}
