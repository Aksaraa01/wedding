// Pengetahuan produk untuk CS — ditulis dalam bahasa sederhana (bukan teknis)
// agar jawaban ke klien mudah dimengerti. Sumber: definisi paket di aplikasi.

export type ProductKey = "undangan_digital" | "buku_tamu_digital" | "galeri_tamu"

export interface ProductDetail {
  key: ProductKey
  name: string
  summary: string
  packages: { code?: string; name: string; description: string }[]
  notes: string[]
}

const UNDANGAN_DIGITAL: ProductDetail = {
  key: "undangan_digital",
  name: "Undangan Digital",
  summary:
    "Undangan pernikahan dalam bentuk website yang bisa dibagikan ke tamu. Ada 4 pilihan paket: Essential, Signature, Prestige, dan Elite.",
  packages: [
    {
      code: "essential",
      name: "Essential",
      description:
        "Paket paling hemat untuk kebutuhan dasar. Dapat 2x revisi, galeri foto 15 foto, dan undangan aktif 3 bulan. Sudah termasuk: nama tamu di undangan, hitung mundur, info acara & lokasi (Google Maps), tombol simpan tanggal, pilihan lagu, RSVP & konfirmasi kehadiran, ucapan & doa dari tamu, amplop digital (rekening), dan link undangan untuk dibagikan.",
    },
    {
      code: "signature",
      name: "Signature",
      description:
        "Paling banyak dipilih karena lebih lengkap. Dapat 3x revisi, galeri foto 20 foto, dan undangan aktif 6 bulan. Semua fitur Essential, plus: cerita perjalanan cinta (love story), video, alamat kirim kado, dan daftar turut mengundang.",
    },
    {
      code: "prestige",
      name: "Prestige",
      description:
        "Pilihan lebih premium dan lengkap. Dapat 5x revisi, galeri foto tanpa batas, dan undangan aktif 1 tahun. Semua fitur Signature, plus: logo custom dan pengingat otomatis untuk tamu VIP.",
    },
    {
      code: "elite",
      name: "Elite",
      description:
        "Dibuat khusus sesuai keinginan. Dikerjakan prioritas dengan pendampingan khusus, desain full custom, dan undangan aktif 1 tahun. Sudah mencakup fitur-fitur lengkap seperti paket Prestige.",
    },
  ],
  notes: [
    "Jumlah revisi, galeri foto, dan masa aktif berbeda di tiap paket (lihat detail di atas).",
    "Semua paket Undangan Digital adalah undangan website (digital), bukan undangan cetak/fisik.",
  ],
}

const BUKU_TAMU_DIGITAL: ProductDetail = {
  key: "buku_tamu_digital",
  name: "Buku Tamu Digital",
  summary:
    "Sistem check-in tamu di hari acara pakai scan QR, jadi kehadiran tamu tercatat rapi. Tamu juga bisa mengabadikan momen lewat foto candid. Semua paket Buku Tamu Digital sudah termasuk undangan digital yang lengkap.",
  packages: [
    {
      code: "dgb_sistem",
      name: "Sistem",
      description:
        "Paket dasar Buku Tamu Digital: check-in tamu pakai QR. Tamu bisa upload foto candid, 2 foto per tamu untuk sekitar 200 tamu. Sudah termasuk undangan digital yang lengkap.",
    },
    {
      code: "dgb_pro",
      name: "Pro",
      description:
        "Untuk acara yang butuh bantuan lebih: 2 perangkat & 2 petugas. Tamu bisa upload foto candid, 2 foto per tamu untuk sekitar 200 tamu. Sudah termasuk undangan digital yang lengkap.",
    },
    {
      code: "dgb_premium",
      name: "Premium",
      description:
        "Lebih lengkap: 3 perangkat & 3 petugas. Tamu bisa upload foto candid, 3 foto per tamu untuk sekitar 200 tamu. Sudah termasuk undangan digital yang lengkap.",
    },
    {
      code: "dgb_prestige",
      name: "Prestige",
      description:
        "Paling lengkap: 4 perangkat & 4 petugas. Tamu bisa upload foto candid, 4 foto per tamu untuk sekitar 200 tamu. Sudah termasuk undangan digital yang lengkap.",
    },
  ],
  notes: [
    "Perbedaan utama tiap paket: jumlah perangkat & petugas, serta kuota foto candid per tamu.",
  ],
}

const GALERI_TAMU: ProductDetail = {
  key: "galeri_tamu",
  name: "Galeri Tamu",
  summary:
    "Galeri Tamu (Galeri Kenangan Tamu) adalah tempat tamu-tamu mengumpulkan foto momen acara langsung dari HP mereka.",
  packages: [
    {
      code: "gt",
      name: "Galeri Tamu",
      description:
        "Tamu cukup scan QR untuk upload foto candid dari HP, jadi momen-momen acara terkumpul di satu galeri. Foto-fotonya bisa dilihat bareng dan disimpan sebagai kenangan. Kuota foto dan jumlah tamu bisa disesuaikan dengan kebutuhan acara.",
    },
  ],
  notes: [
    "Galeri Tamu ini khusus foto ya, Kak — belum termasuk video sinematik.",
  ],
}

const PRODUCTS: Record<ProductKey, ProductDetail> = {
  undangan_digital: UNDANGAN_DIGITAL,
  buku_tamu_digital: BUKU_TAMU_DIGITAL,
  galeri_tamu: GALERI_TAMU,
}

const PRODUCT_ALIASES: { pattern: RegExp; key: ProductKey }[] = [
  { pattern: /\bgaleri\s*tamu\b|\bgaleri\s*kenangan\b|\bgaleri\s*foto\s*tamu\b/i, key: "galeri_tamu" },
  { pattern: /\bbuku\s*tamu\b|\bdigital\s*guest\s*book\b|\bguest\s*book\b|\bcheck\s*-?\s*in\b/i, key: "buku_tamu_digital" },
  { pattern: /\bundangan\s*digital\b|\bwebsite\s*undangan\b|\bundangan\s*web\b/i, key: "undangan_digital" },
]

const PACKAGE_TO_PRODUCT: Record<string, ProductKey> = {
  essential: "undangan_digital",
  signature: "undangan_digital",
  prestige: "undangan_digital",
  elite: "undangan_digital",
  dgb_sistem: "buku_tamu_digital",
  dgb_pro: "buku_tamu_digital",
  dgb_premium: "buku_tamu_digital",
  dgb_prestige: "buku_tamu_digital",
  gt: "galeri_tamu",
}

export function detectProduct(text: string): ProductKey | null {
  const value = text || ""
  for (const { pattern, key } of PRODUCT_ALIASES) {
    if (pattern.test(value)) return key
  }
  return null
}

export function productForPackage(code: string): ProductKey | null {
  return PACKAGE_TO_PRODUCT[code] || null
}

export function getProductDetail(product: ProductKey, packageCode?: string): ProductDetail {
  const detail = PRODUCTS[product]
  if (!packageCode) return detail
  const selected = detail.packages.filter((p) => p.code === packageCode)
  if (selected.length === 0) return detail
  return { ...detail, packages: selected }
}

export function listProductDetails(): ProductDetail[] {
  return [UNDANGAN_DIGITAL, BUKU_TAMU_DIGITAL, GALERI_TAMU]
}

export function formatProductDetail(detail: ProductDetail): string {
  const lines: string[] = [detail.summary, ""]
  for (const pkg of detail.packages) {
    lines.push(`• ${pkg.name}: ${pkg.description}`)
  }
  if (detail.notes.length) {
    lines.push("")
    for (const note of detail.notes) {
      lines.push(`- ${note}`)
    }
  }
  return lines.join("\n").trim()
}

// Teks singkat untuk WhatsApp saat kirim foto + PDF (visual-first).
export function shortPackageIntro(): string {
  return "Ini pilihan paket Undangan Digital kami ya, Kak: Essential, Signature, Prestige, dan Elite. Detail fitur dan harganya bisa dilihat di foto dan pricelist yang aku kirim."
}

// Media paket Undangan Digital + pricelist untuk WhatsApp.
export interface CsMedia {
  type: "image" | "document"
  url: string
  filename?: string
  caption?: string
  mimetype?: string
}

export function packageMedia(baseUrl: string): CsMedia[] {
  const base = baseUrl.replace(/\/$/, "")
  return [
    {
      type: "image",
      url: `${base}/cs/paket/essential.png`,
      filename: "essential.png",
      caption: "Paket Essential",
    },
    {
      type: "image",
      url: `${base}/cs/paket/signature.png`,
      filename: "signature.png",
      caption: "Paket Signature",
    },
    {
      type: "image",
      url: `${base}/cs/paket/prestige.png`,
      filename: "prestige.png",
      caption: "Paket Prestige",
    },
    {
      type: "image",
      url: `${base}/cs/paket/elite.png`,
      filename: "elite.png",
      caption: "Paket Elite",
    },
    {
      type: "document",
      url: `${base}/cs/pricelist/aksaraa-wedding-pricelist.pdf`,
      filename: "Aksaraa Wedding Pricelist.pdf",
      mimetype: "application/pdf",
    },
  ]
}

// Intent/konteks paket-harga di WhatsApp yang memicu lampiran visual.
export const WA_PACKAGE_PRICE_INTENTS = new Set([
  "price",
  "package_info",
  "recommendation",
  "select_package",
  "discount",
  "cta_register",
])

export function shouldAttachPackageMedia(channel: "wa" | "web", intent: string): boolean {
  return channel === "wa" && WA_PACKAGE_PRICE_INTENTS.has(intent)
}

import { siteOrigin } from "@/lib/site"

export function siteBaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim()
  return fromEnv || siteOrigin()
}
