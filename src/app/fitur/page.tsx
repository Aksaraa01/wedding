import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Fitur Lengkap Undangan Digital",
  description:
    "Jelajahi 8 fitur unggulan undangan digital Aksaraa: RSVP otomatis, buku tamu QR, galeri foto, wish wall, reminder WA, amplop digital, dan banyak lagi.",
  alternates: { canonical: `${siteOrigin()}/fitur` },
  openGraph: {
    title: "Fitur Lengkap Undangan Digital | Aksaraa Wedding",
    description:
      "Semua fitur undangan digital dalam satu platform: RSVP, buku tamu QR, galeri foto tamu, wish wall, reminder WA, amplop digital, dan banyak lagi.",
  },
}

export default function FitursPage() {
  const features = [
    {
      key: "premium_web",
      label: "Undangan Digital",
      icon: "description",
      desc: "Undangan website elegan dengan desain premium, countdown, love story, dan galeri foto prewedding.",
      href: "/fitur/undangan-digital",
    },
    {
      key: "wish_wall",
      label: "Wish Wall Digital",
      icon: "favorite",
      desc: "Papan ucapan interaktif, tamu kirim doa dari HP, tampil live di layar venue dengan moderasi instan.",
      href: "/fitur/wish-wall",
    },
    {
      key: "reservation_automation",
      label: "RSVP Otomatis",
      icon: "event_available",
      desc: "Tamu konfirmasi kehadiran lewat HP, rekap real-time di dashboard, export Excel untuk katering.",
      href: "/fitur/rsvp-otomatis",
    },
    {
      key: "kolom_direct_transfer",
      label: "Amplop Digital & Alamat Kado",
      icon: "featured_seasonal_and_gifts",
      desc: "Amplop digital + rekening bank/e-wallet + alamat pengiriman kado fisik, terintegrasi di undangan.",
      href: "/fitur/amplop-digital",
    },
    {
      key: "galeri_foto_tamu",
      label: "Galeri Foto Tamu (Disposable Camera)",
      icon: "photo_library",
      desc: "Tamu upload foto candid via QR di meja, tampil live di galeri live layaknya disposable camera.",
      href: "/fitur/galeri-foto-tamu",
    },
    {
      key: "qr_code_book",
      label: "Buku Tamu Digital QR",
      icon: "qr_code_2",
      desc: "Check-in QR di pintu masuk, e-pass berisi nama & nomor meja, layar sapa, rekap hadir real-time.",
      href: "/fitur/buku-tamu-qr",
    },
    {
      key: "wa_blast",
      label: "Reminder WhatsApp Otomatis",
      icon: "chat_bubble",
      desc: "Blast undangan & pengingat H-7/H-1 otomatis via WA, personal per tamu + tautan unik + nomor meja.",
      href: "/fitur/reminder-wa",
    },
    {
      key: "kolom_direct_transfer",
      label: "Reservasi Otomatis & Link Unik",
      icon: "qr_code_2",
      desc: "Tautan unik per tamu + QR Pass + nomor meja terotomatisasi, anti tamu tak diundang.",
      href: "/fitur/link-unik",
    },
  ]

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-12">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Fitur Lengkap Undangan Digital
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Semua yang Anda butuhkan untuk pernikahan modern dalam satu platform, dari undangan hingga hari-H.
        </p>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((f) => (
            <Link
              key={f.key}
              href={f.href}
              className="group bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8 hover:shadow-md hover:border-[#B34E3F] transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F5EFE6] border border-[#E2D9CF] text-[#B34E3F] group-hover:bg-[#B34E3F] group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">{f.icon}</span>
              </div>
              <h3 className="font-headline-md text-lg md:text-xl text-[#2C2A29] group-hover:text-[#B34E3F] leading-snug mb-2 text-center">
                {f.label}
              </h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed text-center flex-1">
                {f.desc}
              </p>
              <div className="mt-4 text-center">
                <span className="font-label-md text-[11px] uppercase tracking-widest text-[#B34E3F] group-hover:underline">
                  Selengkapnya →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto text-center mb-10">
        <h2 className="font-headline-md text-xl md:text-2xl text-[#2C2A29] mb-3">
          Siap membuat undangan digital Anda?
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Pilih template, isi data, bagikan link. Jadi dalam 15 menit.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/templates"
            className="px-8 py-3.5 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors"
          >
            Lihat Template
          </a>
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Lihat Harga & Paket
          </a>
        </div>
      </section>
    </main>
  )
}