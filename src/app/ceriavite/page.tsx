import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import { KIDS_SITE } from "@/lib/eventType"
import TemplateGallery from "@/components/template-gallery/TemplateGallery"

export const metadata: Metadata = {
  // Absolute: the root layout would otherwise append "| Aksaraa Wedding".
  title: { absolute: "Ceriavite | Undangan Digital Khitanan, Aqiqah, dan Ulang Tahun" },
  description:
    "Undangan website untuk khitanan, aqiqah, dan ulang tahun ananda. Satu paket Rp 199.000 dengan RSVP, doa & ucapan, tautan tamu, dan tanda kasih.",
  alternates: { canonical: KIDS_SITE },
  manifest: "/manifest-ceriavite.webmanifest",
  openGraph: {
    title: "Ceriavite | Undangan Digital Acara Anak",
    description:
      "Undangan digital khitanan, aqiqah, dan ulang tahun. RSVP online, doa dan ucapan, serta tanda kasih dalam satu tautan.",
    url: KIDS_SITE,
    images: [{ url: `${KIDS_SITE}/og/ceriavite.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ceriavite | Undangan Digital Acara Anak",
    description: "Undangan digital khitanan, aqiqah, dan ulang tahun dalam satu tautan.",
    images: [`${KIDS_SITE}/og/ceriavite.png`],
  },
}

// Own theme colour so the mobile browser chrome matches the app shell.
export const viewport: Viewport = {
  themeColor: "#3a0f18",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const revalidate = 3600

type KidsTemplate = {
  id: string
  code: string
  name: string
  description: string | null
  preview_image_url: string | null
  demo_url: string | null
}

async function getTemplates(): Promise<KidsTemplate[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,code,name,description,preview_image_url,demo_url")
    .eq("is_active", true)
    .eq("event_type", "kids")
    .order("sort_order", { ascending: true })
  return (data as KidsTemplate[] | null) || []
}

// Ceriavite's display voice, the same pair the Songket Marun template uses:
// Marcellus for headings, Cormorant Garamond for prose. Inline because these are
// per-brand and must not leak into the wedding surfaces.
const DISPLAY_FONT = { fontFamily: "'Marcellus', Georgia, serif" } as const
const PROSE_FONT = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const

const FEATURES = [
  {
    icon: "how_to_reg",
    title: "Konfirmasi Kehadiran",
    body: "Tamu memilih hadir atau tidak, lengkap dengan jumlah orang. Rekapnya langsung terlihat di dashboard.",
  },
  {
    icon: "favorite",
    title: "Doa & Ucapan",
    body: "Doa restu tamu terkumpul di satu halaman. Anda memilih ucapan mana yang tampil.",
  },
  {
    icon: "redeem",
    title: "Tanda Kasih",
    body: "Rekening atau e-wallet tampil rapi. Tamu cukup menekan satu tombol untuk menyalin.",
  },
]

const INCLUDED = [
  "Undangan website dengan tautan tamu",
  "Konfirmasi kehadiran (RSVP)",
  "Doa & ucapan dengan moderasi",
  "Galeri foto ananda",
  "Tanda kasih: rekening, e-wallet, alamat",
  "Musik latar dan hitung mundur",
  "Revisi data kapan saja",
]

const STEPS = [
  { n: "1", title: "Daftar", body: "Nama ananda, orang tua, jenis acara, tanggal. Satu menit." },
  { n: "2", title: "Pilih desain & isi", body: "Pilih template, unggah foto, lengkapi waktu dan tempat." },
  { n: "3", title: "Bagikan", body: "Kirim satu tautan. Tiap tamu membuka undangan dengan namanya." },
]

export default async function CeriaviteLandingPage() {
  const templates = await getTemplates()
  const shelf = templates.length > 0 ? templates : PLACEHOLDER_TEMPLATES

  return (
    <div className="min-h-[100dvh] bg-[#3a0f18] text-[#EFDFBB] antialiased [-webkit-tap-highlight-color:transparent]">
      {/* App bar */}
      <header className="sticky top-0 z-30 border-b border-[#C9A45C]/15 bg-[#3a0f18]/92 backdrop-blur-md [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-[520px] items-center justify-between px-4">
          <span className="text-[17px] tracking-tight">Ceriavite</span>
          <Link
            href="/login"
            className="rounded-full border border-[#C9A45C]/40 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#C9A45C] active:scale-95"
          >
            Masuk
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[520px] px-4 pb-28">
        {/* Hero */}
        <section className="relative overflow-hidden pt-7">
          <img
            src="/templates/songket-marun/melur.webp"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-4 w-28 opacity-35"
          />
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#C9A45C]/60" />
            <p className="text-[9.5px] uppercase tracking-[0.34em] text-[#C9A45C]">
              Khitanan · Aqiqah · Ulang Tahun
            </p>
          </div>
          <h1
            className="mt-4 text-[34px] leading-[1.1] tracking-[0.01em] text-[#EFDFBB]"
            style={DISPLAY_FONT}
          >
            Undangan digital
            <br />
            <span className="text-[#C9A45C]">untuk acara ananda</span>
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-[#E0CDB6]/75" style={PROSE_FONT}>
            Satu tautan untuk seluruh keluarga. Berisi jadwal acara, konfirmasi kehadiran,
            doa restu, dan tanda kasih. Semua data diisi sendiri lewat dashboard.
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#C9A45C]/25 bg-[#471722] p-3.5">
            <div className="min-w-0">
              <p className="text-[11px] leading-none text-[#E0CDB6]/40 line-through">Rp 299.000</p>
              <p className="mt-1 text-[23px] leading-none text-[#EFDFBB]" style={DISPLAY_FONT}>
                Rp 199.000
              </p>
              <p className="mt-1 text-[9.5px] uppercase tracking-[0.18em] text-[#E0CDB6]/50">
                sekali bayar
              </p>
            </div>
            <Link
              href="/daftar"
              className="ml-auto shrink-0 rounded-full bg-[#C9A45C] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3a0f18] active:scale-[0.97]"
            >
              Buat undangan
            </Link>
          </div>
        </section>

        {/* Design catalogue: the same tiles/shelves as the wedding gallery, on a
            light band so the tile styling reads correctly. */}
        <section id="desain" className="pt-9">
          <div className="flex items-end justify-between">
            <h2 className="text-[19px] text-[#EFDFBB]" style={DISPLAY_FONT}>Desain</h2>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#E0CDB6]/45">
              {shelf.length} pilihan
            </span>
          </div>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#E0CDB6]/60" style={PROSE_FONT}>
            Semua desain sudah berisi RSVP, doa dan ucapan, galeri, serta tanda kasih.
          </p>
          <div className="mt-4 rounded-3xl bg-[#faf5ec] p-3 sm:p-4">
            <TemplateGallery
              templates={shelf}
              previewInModal
              showShelves={false}
              showFilterBar={false}
              showSearch={false}
              selectHrefBase="/daftar"
            />
          </div>
        </section>

        {/* Features, app list rows */}
        <section className="pt-8">
          <h2 className="text-[19px] text-[#EFDFBB]" style={DISPLAY_FONT}>Yang Anda dapat</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#C9A45C]/22 bg-[#471722]">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`flex items-start gap-3 p-4 ${i > 0 ? "border-t border-[#C9A45C]/12" : ""}`}
              >
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#C9A45C]">
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] text-[#EFDFBB]">{f.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#E0CDB6]/60">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Price */}
        <section id="harga" className="pt-8">
          <div className="rounded-2xl border border-[#C9A45C]/30 bg-[#471722] p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#C9A45C]">Harga</p>
                <p className="mt-3 text-[12px] leading-none text-[#E0CDB6]/40 line-through">Rp 299.000</p>
                <p className="mt-1 text-[30px] leading-none text-[#EFDFBB]" style={DISPLAY_FONT}>
                  Rp 199.000
                </p>
              </div>
              <span className="rounded-full bg-[#C9A45C]/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-[#C9A45C]">
                sekali bayar
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-2 text-[12.5px] leading-relaxed text-[#E0CDB6]/80">
                  <span className="text-[#C9A45C]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/daftar"
              className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[#C9A45C] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3a0f18] active:scale-[0.98]"
            >
              Buat undangan sekarang
            </Link>
            <p className="mt-3 text-center text-[10.5px] text-[#E0CDB6]/40">
              Tanpa biaya bulanan. Revisi data kapan saja.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="pt-8">
          <h2 className="text-[19px] text-[#EFDFBB]" style={DISPLAY_FONT}>Tiga langkah</h2>
          <ol className="mt-3 space-y-2.5">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex items-start gap-3 rounded-2xl border border-[#C9A45C]/18 bg-[#471722]/60 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C9A45C]/15 text-[12px] text-[#C9A45C]">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] text-[#EFDFBB]">{s.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#E0CDB6]/60">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="pt-10 pb-2 text-center">
          <p className="text-[11px] text-[#E0CDB6]/40">
            Ceriavite, undangan digital acara anak dari Aksaraa.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.16em] text-[#E0CDB6]/50">
            <Link href="/daftar">Daftar</Link>
            <Link href="/login">Masuk</Link>
            <a href="https://wedding.aksaraa.com">Aksaraa Wedding</a>
          </div>
        </footer>
      </main>

      {/* Sticky primary action (mobile app pattern) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#C9A45C]/20 bg-[#3a0f18]/95 backdrop-blur-md [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-[520px] items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 leading-tight">
            <p className="text-[10px] leading-none text-[#E0CDB6]/40 line-through">Rp 299.000</p>
            <p className="text-[15px] leading-tight text-[#EFDFBB]" style={DISPLAY_FONT}>
              Rp 199.000
            </p>
            <p className="text-[9px] uppercase tracking-[0.14em] text-[#E0CDB6]/45">sekali bayar</p>
          </div>
          <Link
            href="/daftar"
            className="ml-auto flex h-11 min-w-[168px] items-center justify-center rounded-xl bg-[#C9A45C] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3a0f18] active:scale-[0.98]"
          >
            Buat undangan
          </Link>
        </div>
      </div>
    </div>
  )
}

const PLACEHOLDER_TEMPLATES: KidsTemplate[] = [
  {
    id: "songket-marun",
    code: "songket-marun",
    name: "Songket Marun",
    description: "Marun dan emas bergaya songket Melayu, bingkai lengkung masjid.",
    preview_image_url: "/templates/songket-marun/thumbnail.webp",
    demo_url: "/templates/songket-marun/preview",
  },
]
