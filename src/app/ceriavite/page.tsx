import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import { KIDS_SITE } from "@/lib/eventType"
import { waLink } from "@/lib/contact"
import TemplateCarousel from "@/components/ceriavite/TemplateCarousel"

export const metadata: Metadata = {
  // Absolute: the root layout would otherwise append "| Aksaraa Wedding".
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

const FEATURES = [
  {
    icon: "how_to_reg",
    title: "Konfirmasi Kehadiran",
    body: "Tamu memilih hadir atau tidak, lengkap dengan jumlah orang. Rekapnya langsung terlihat di dashboard.",
  },
  {
    icon: "favorite",
    title: "Doa dan Ucapan",
    body: "Doa restu tamu terkumpul di satu halaman. Anda memilih ucapan mana yang tampil.",
  },
  {
    icon: "redeem",
    title: "Tanda Kasih",
    body: "Rekening atau e-wallet tampil rapi. Tamu cukup menekan satu tombol untuk menyalin.",
  },
]

const PACKAGE_DETAIL = [
  { label: "Undangan website", value: "1 tautan, tanpa batas tamu" },
  { label: "Konfirmasi kehadiran", value: "Hadir, tidak hadir, jumlah orang" },
  { label: "Doa dan ucapan", value: "Dengan moderasi" },
  { label: "Galeri foto", value: "Momen ananda" },
  { label: "Tanda kasih", value: "Rekening, e-wallet, alamat kirim" },
  { label: "Musik dan hitung mundur", value: "Termasuk" },
  { label: "Revisi data", value: "Kapan saja" },
]

const STEPS = [
  { n: "01", title: "Daftar", body: "Isi nama ananda, orang tua, jenis acara, dan tanggal. Sekali isi, satu menit." },
  { n: "02", title: "Pilih desain dan isi data", body: "Pilih template, unggah foto, lengkapi waktu dan tempat acara." },
  { n: "03", title: "Bagikan", body: "Kirim satu tautan ke WhatsApp. Setiap tamu membuka undangan dengan namanya." },
]

export default async function CeriaviteLandingPage() {
  const templates = await getTemplates()
  const shelf = templates.length > 0 ? templates : PLACEHOLDER_TEMPLATES

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] text-[#1A1817] antialiased">
      {/* Header, same pattern as the wedding landing */}
      <header className="sticky top-0 z-50 border-b border-[#EFE9DD] bg-[#FAF7F2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-12">
          <Link href="/ceriavite" className="group flex items-center gap-1.5">
            <span className="font-headline-sm text-headline-sm tracking-tight text-[#1A1817] transition-colors group-hover:text-[#8D4D39]">
              Ceriavite
            </span>
            <span className="mb-1 inline-block h-1.5 w-1.5 rounded-full bg-[#B08A4A]" />
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#paket" className="font-label-lg text-label-lg text-[#6E6A63] hover:text-[#1A1817]">
              Harga
            </a>
            <Link href="/login" className="font-label-lg text-label-lg text-[#6E6A63] hover:text-[#1A1817]">
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="rounded-full bg-[#8D4D39] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#7A4130]"
            >
              Buat undangan
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 1. Template list, auto slide */}
        <section className="pt-6 sm:pt-10">
          <TemplateCarousel items={shelf} />
        </section>

        {/* 2. Title + subtext */}
        <section className="px-5 pt-8 text-center sm:px-6 sm:pt-12 lg:px-12">
          <p className="font-label-md text-[10px] uppercase tracking-[0.32em] text-[#B08A4A]">
            Khitanan · Aqiqah · Ulang Tahun
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-headline-lg text-[26px] leading-[1.2] text-[#1A1817] sm:text-[40px]">
            Undangan digital untuk acara ananda
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-[#6E6A63] sm:text-[15.5px]">
            Satu tautan untuk seluruh keluarga. Berisi jadwal acara, konfirmasi kehadiran, doa restu,
            galeri, dan tanda kasih. Semua data diisi sendiri lewat dashboard.
          </p>
        </section>

        {/* 3. Harga + buat undangan / konsultasi gratis */}
        <section className="px-5 pt-8 sm:px-6 sm:pt-10 lg:px-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-[#EFE9DD] bg-white px-5 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-label-md text-[9.5px] uppercase tracking-[0.24em] text-[#B08A4A]">Harga paket</p>
              <p className="mt-2 text-[12px] text-[#A39B8E] line-through">Rp 299.000</p>
              <p className="font-headline-md text-[30px] leading-none text-[#1A1817]">Rp 199.000</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-[#8B857C]">sekali bayar</p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:min-w-[220px]">
              <Link
                href="/daftar"
                className="flex h-11 items-center justify-center rounded-full bg-[#8D4D39] px-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#7A4130]"
              >
                Buat undangan
              </Link>
              <a
                href={waLink(
                  "Halo Aksaraa, saya ingin konsultasi undangan digital khitanan/aqiqah/ulang tahun untuk ananda. Mohon informasi paketnya.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#8D4D39]/40 px-6 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#8D4D39] transition-colors hover:border-[#8D4D39]"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                Konsultasi gratis
              </a>
            </div>
          </div>
        </section>

        {/* 4. Yang Anda dapat */}
        <section className="px-5 pt-12 sm:px-6 sm:pt-16 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-headline-md text-[21px] text-[#1A1817] sm:text-[26px]">
              Yang Anda dapat
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-[#EFE9DD] bg-white p-5">
                  <span className="material-symbols-outlined text-[22px] text-[#B08A4A]">{f.icon}</span>
                  <h3 className="mt-3 font-headline-sm text-[15px] text-[#1A1817]">{f.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#6E6A63]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Detail paket */}
        <section id="paket" className="px-5 pt-12 sm:px-6 sm:pt-16 lg:px-12">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#EFE9DD] bg-white">
            <div className="border-b border-[#EFE9DD] px-5 py-4">
              <h2 className="font-headline-md text-[19px] text-[#1A1817]">Detail paket</h2>
              <p className="mt-1 text-[12px] text-[#6E6A63]">Satu paket Rp 199.000, tanpa biaya bulanan.</p>
            </div>
            <dl>
              {PACKAGE_DETAIL.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-start justify-between gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-[#F3EEE4]" : ""}`}
                >
                  <dt className="text-[12.5px] text-[#3B3833]">{row.label}</dt>
                  <dd className="text-right text-[12.5px] font-medium text-[#1A1817]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 6. Tiga langkah */}
        <section className="px-5 pt-12 sm:px-6 sm:pt-16 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-headline-md text-[21px] text-[#1A1817] sm:text-[26px]">
              Tiga langkah
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl border border-[#EFE9DD] bg-white p-5">
                  <span className="font-headline-sm text-[11px] tracking-[0.3em] text-[#B08A4A]">{s.n}</span>
                  <h3 className="mt-2 font-headline-sm text-[15px] text-[#1A1817]">{s.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#6E6A63]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer, with the Aksaraa contact number like the wedding site */}
      <footer className="mt-14 border-t border-[#EFE9DD] bg-[#F8F3E9] px-5 py-10 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-headline-sm text-[16px] text-[#1A1817]">Ceriavite</p>
              <p className="mt-1.5 max-w-xs text-[12px] leading-relaxed text-[#6E6A63]">
                Undangan digital khitanan, aqiqah, dan ulang tahun oleh Aksaraa.
              </p>
            </div>
            <div className="text-[12.5px] text-[#3B3833]">
              <p className="font-label-md text-[9.5px] uppercase tracking-[0.24em] text-[#8B857C]">Hubungi kami</p>
              <a
                href="https://wa.me/6281161613071"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 hover:text-[#8D4D39]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8D4D39]">call</span>
                +62 811 6161 3071
              </a>
              <a
                href="https://wa.me/6281161613071"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-2 hover:text-[#8D4D39]"
              >
                <span className="material-symbols-outlined text-[16px] text-[#8D4D39]">chat</span>
                WhatsApp konsultasi
              </a>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#EFE9DD] pt-5 text-[11px] text-[#8B857C]">
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
    demo_url: "/templates/songket-marun/preview",
  },
]
