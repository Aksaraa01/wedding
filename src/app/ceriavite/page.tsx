import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import { KIDS_SITE } from "@/lib/eventType"
import { waLink } from "@/lib/contact"

export const metadata: Metadata = {
  title: { absolute: "Ceriavite | Undangan Digital Khitanan, Aqiqah, dan Ulang Tahun" },
  description:
    "Undangan website untuk khitanan, aqiqah, dan ulang tahun ananda. Satu paket Rp 199.000 dengan RSVP, doa dan ucapan, tautan tamu, serta tanda kasih.",
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

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

// Short window while the catalogue is being filled; the page only renders
// template rows, so a slow revalidate buys nothing and makes edits look stale.
export const revalidate = 60

type KidsTemplate = {
  id: string
  code: string
  category?: string | null
  name: string
  description: string | null
  preview_image_url: string | null
  demo_url: string | null
}

async function getTemplates(): Promise<KidsTemplate[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,code,name,description,preview_image_url,demo_url,category")
    .eq("is_active", true)
    .eq("event_type", "kids")
    .order("sort_order", { ascending: true })
  return (data as KidsTemplate[] | null) || []
}

const WA_CHAT = waLink(
  "Halo Aksaraa, saya ingin konsultasi undangan digital khitanan/aqiqah/ulang tahun untuk ananda. Mohon informasi paketnya.",
)

const PACKAGE_INCLUDES = [
  "Undangan website dengan tautan tamu tanpa batas",
  "Konfirmasi kehadiran (hadir, tidak hadir, jumlah orang)",
  "Doa dan ucapan dengan moderasi",
  "Galeri foto ananda",
  "Tanda kasih: rekening, e-wallet, dan alamat kirim",
  "Musik latar dan hitung mundur",
  "Revisi data kapan saja",
]

const STEPS = [
  {
    icon: "palette",
    title: "Pilih desain",
    text: "Beberapa desain khitanan, aqiqah, dan ulang tahun. Pratinjau langsung dari layar HP.",
  },
  {
    icon: "edit_note",
    title: "Isi data ananda",
    text: "Nama ananda, orang tua, jadwal, lokasi maps, dan galeri. Editor rapi tanpa keahlian desain.",
  },
  {
    icon: "send",
    title: "Bagikan",
    text: "Kirim tautan personal lewat WhatsApp, lalu pantau kehadiran dari dashboard.",
  },
] as const

export default async function CeriaviteLandingPage() {
  const templates = await getTemplates()
  const shelf = templates.length > 0 ? templates : PLACEHOLDER_TEMPLATES
  const categories = Array.from(new Set(shelf.map((t) => (t as { category?: string | null }).category || ""))).filter(Boolean) as string[]

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-[#1A1817] antialiased">
      <header className="sticky top-0 z-50 border-b border-[#EFE9DD] bg-[#FAF7F2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/ceriavite" className="group flex items-center gap-1.5">
            <span className="font-headline-sm text-headline-sm tracking-tight text-[#1A1817] transition-colors group-hover:text-[#8D4D39]">
              Ceriavite
            </span>
            <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#paket" className="hidden font-label-lg text-label-lg text-[#6E6A63] hover:text-[#1A1817] sm:inline">
              Harga
            </a>
            <Link href="/login" className="font-label-lg text-label-lg text-[#6E6A63] hover:text-[#1A1817]">
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="inline-flex items-center whitespace-nowrap rounded-full bg-[#8D4D39] px-4 py-2 font-label-lg text-[11px] text-white transition-colors hover:bg-[#7A4130] sm:px-5 sm:text-label-lg"
            >
              Buat undangan
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 1. Design catalogue: heading + chips + 2-up portrait grid on phones */}
        <section className="bg-white py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            {categories.length > 1 && (
              <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto md:mb-6">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="shrink-0 rounded-full border border-[#E7DECF] bg-[#FCFAF6] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6E6A63]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
              {shelf.map((t) => (
                <article key={t.code} className="group">
                  <div className="relative overflow-hidden rounded-2xl border border-[#EFE9DD] bg-[#F5F0E7]">
                    <div className="aspect-[9/19]">
                      {t.preview_image_url && (
                        <img
                          src={t.preview_image_url}
                          alt={t.name}
                          loading="lazy"
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                  </div>
                  <h3 className="mt-2.5 font-headline-sm text-[13px] leading-tight text-[#1A1817] md:text-[15px]">
                    {t.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    {t.demo_url && (
                      <a
                        href={t.demo_url}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-[#DCD2C2] bg-white px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#1A1817] transition-colors hover:border-[#1A1817]"
                      >
                        Lihat
                      </a>
                    )}
                    <Link
                      href={`/daftar?template=${encodeURIComponent(t.code)}`}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-[#8D4D39] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#7A4130]"
                    >
                      Pilih
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Title + subtext */}
        <section className="bg-[#FAF7F2] py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8DFCE] bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8D4D39]">
                Khitanan · Aqiqah · Ulang Tahun
              </span>
            </div>
            <h1 className="mt-4 font-display-hero text-display-hero-mobile tracking-tight text-[#1A1817] md:text-display-hero">
              Undangan digital
              <span
                className="mt-1 block text-[#8D4D39]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 600, letterSpacing: "-0.01em" }}
              >
                untuk acara ananda.
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[13px] leading-[1.65] text-[#6E6A63] md:text-[15.5px]">
              Satu tautan untuk seluruh keluarga. Berisi jadwal acara, konfirmasi kehadiran, doa restu,
              galeri, dan tanda kasih. Semua data diisi sendiri lewat dashboard.
            </p>
          </div>
        </section>

        {/* 3. Harga & paket: price, what is included and the two actions in one card */}
        <section id="paket" className="bg-white pb-6 pt-2 md:pb-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="overflow-hidden rounded-3xl border border-[#EDE4D5] bg-white shadow-[0_30px_60px_-46px_rgba(26,24,23,0.45)]">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className="relative overflow-hidden bg-[#FBF6EC] p-6 text-center md:p-10 md:text-left">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#EFE1C9] opacity-60 blur-3xl"
                  />
                  <div className="relative">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B08A4A]">
                      Satu paket
                    </p>
                    <p className="mt-4 text-[13px] text-[#A39B8E] line-through md:text-[15px]">Rp 299.000</p>
                    <p className="mt-1 font-headline-lg text-[34px] leading-none tracking-tight text-[#1A1817] md:text-[46px]">
                      Rp 199.000
                    </p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#8B857C]">sekali bayar</p>

                    <div className="mt-6 flex flex-col gap-2.5">
                      <Link
                        href="/daftar"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8D4D39] px-6 py-3 font-label-lg text-label-lg text-white transition-colors hover:bg-[#7A4130]"
                      >
                        Buat undangan
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                      <a
                        href={WA_CHAT}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DCD2C2] bg-white px-6 py-3 font-label-lg text-label-lg text-[#1A1817] transition-colors hover:border-[#1A1817]"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        Konsultasi gratis
                      </a>
                    </div>
                    <p className="mt-3 text-center text-[11px] text-[#8B857C] md:text-left">
                      Undangan aktif setelah pembayaran dikonfirmasi tim kami.
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D4D39]">
                    Termasuk
                  </p>
                  <h2 className="mt-2 font-headline-lg text-[22px] tracking-tight text-[#1A1817] md:text-[26px]">
                    Apa saja di dalam paket
                  </h2>
                  <ul className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {PACKAGE_INCLUDES.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 py-2.5">
                        <span className="material-symbols-outlined mt-0.5 text-[17px] text-[#8D4D39]">
                          check_circle
                        </span>
                        <span className="text-[12.5px] leading-relaxed text-[#3B3833] md:text-[13px]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Tiga langkah */}
        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-7 flex flex-col gap-2 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D4D39] md:text-[11px]">
                  Cara kerjanya
                </p>
                <h2 className="mt-2 font-headline-lg text-[24px] leading-[1.2] tracking-tight text-[#1A1817] md:text-headline-lg">
                  Tiga langkah, undangan siap dibagikan.
                </h2>
              </div>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-[#6E6A63] md:text-right md:text-[14px]">
                Dari nol sampai tamu menerima tautan personal, rata-rata selesai dalam 15 menit.
              </p>
            </div>
            <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="relative flex items-start gap-3.5 rounded-2xl border border-[#F0EAE0] bg-[#FCFAF6] p-4 md:block md:p-7"
                >
                  <div className="flex shrink-0 items-center gap-3 md:mb-6 md:justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8D4D39] shadow-sm md:h-11 md:w-11">
                      <span className="material-symbols-outlined text-[19px] md:text-[22px]">{step.icon}</span>
                    </span>
                    <span className="font-headline-lg text-[26px] leading-none text-[#E3D8C6] md:text-[32px]">
                      0{i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-[15px] text-[#1A1817] md:text-[16px]">{step.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#6E6A63] md:text-[13px]">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* Footer, with the Aksaraa contact number like the wedding site */}
      <footer className="border-t border-[#EFE9DD] bg-[#F8F3E9] px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-[16px] tracking-tight text-[#1A1817]">Ceriavite</span>
                <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
              </div>
              <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-[#6E6A63]">
                Undangan digital khitanan, aqiqah, dan ulang tahun oleh Aksaraa.
              </p>
            </div>
            <div className="text-[12.5px] text-[#3B3833]">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#8B857C]">
                Hubungi kami
              </p>
              <a
                href="https://wa.me/6281161613071"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex items-center gap-2 transition-colors hover:text-[#8D4D39]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8D4D39]">call</span>
                +62 811 6161 3071
              </a>
              <a
                href={WA_CHAT}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 transition-colors hover:text-[#8D4D39]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8D4D39]">chat</span>
                WhatsApp konsultasi
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EFE9DD] pt-5 text-[11px] text-[#8B857C]">
            <Link href="/daftar" className="hover:text-[#1A1817]">Daftar</Link>
            <Link href="/login" className="hover:text-[#1A1817]">Masuk</Link>
            <a href="https://wedding.aksaraa.com" className="hover:text-[#1A1817]">Aksaraa Wedding</a>
            <span className="ml-auto">© {new Date().getFullYear()} Aksaraa</span>
          </div>
        </div>
      </footer>
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
    demo_url: `${KIDS_SITE}/templates/songket-marun/preview`,
  },
  {
    id: "ubin-ottoman",
    code: "ubin-ottoman",
    name: "Ubin Ottoman",
    description: "Biru Ottoman dan krem, ubin biru dan lentera tembaga.",
    preview_image_url: "/templates/ubin-ottoman/thumbnail.webp",
    demo_url: `${KIDS_SITE}/templates/ubin-ottoman/preview`,
  },
]
