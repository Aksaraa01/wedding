import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"
import Navigation from "@/components/Navigation"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Reminder WhatsApp Otomatis",
  description:
    "Reminder WA otomatis untuk undangan pernikahan: blast undangan, pengingat H-7/H-1, RSVP via WA, tautan unik & nomor meja per tamu.",
  alternates: { canonical: `${siteOrigin()}/fitur/reminder-wa` },
  openGraph: {
    title: "Reminder WhatsApp Otomatis untuk Tamu | Aksaraa",
    description:
      "Blast undangan & pengingat otomatis via WA, personal per tamu, tautan unik, nomor meja, RSVP via WA.",
  },
}

export default function ReminderWaPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <a href="/fitur" className="hover:underline">Fitur</a>
          {" • "}
          Reminder WA
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          Reminder WhatsApp Otomatis
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
          Blast undangan & pengingat otomatis via WhatsApp, setiap tamu dapat pesan personal dengan
          tautan undangan unik, nomor meja, dan RSVP via WA. Tanpa broadcast manual satu per satu.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Blast Otomatis Terjadwal</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Atur jadwal blast: undangan H-30, reminder H-7, pengingat H-1. Sistem kirim otomatis
              via WhatsApp Business API, tanpa broadcast manual, tanpa risiko spam/blocked.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Pesan Personal per Tamu</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap pesan berisi nama tamu, tautan undangan unik, dan nomor meja masing-masing.
              Bukan broadcast generik, tamu merasa diperlakukan personal.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">RSVP via WhatsApp</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Tamu klik tautan di WA → buka undangan → RSVP Hadir/Tidak Hadir → data masuk dashboard
              real-time. Tidak perlu balas WA manual, tidak perlu form terpisah.
            </p>
          </div>
          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-3">Nomor Meja & Tautan Unik per Tamu</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Setiap pesan WA berisi nama tamu, tautan undangan unik, dan nomor meja masing-masing.
              Bukan broadcast generik, tamu merasa diperlakukan personal.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-3">Fitur Lengkap Reminder WA</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-on-surface-variant">
            <span>✓ Blast terjadwal (H-30, H-7, H-1)</span>
            <span>✓ Pesan personal per tamu (nama, meja, link)</span>
            <span>✓ RSVP via tautan di WA</span>
            <span>✓ Nomor meja & tautan unik per pesan</span>
            <span>✓ Menggunakan WA Business API (anti blokir)</span>
            <span>✓ Laporan pengiriman: terkirim/dibaca/gagal</span>
            <span>✓ Jadwal kustom (bisa atur jam khusus)</span>
            <span>✓ Template pesan: formal/hangat/islami/dll</span>
            <span>✓ Riwayat blast & status per tamu</span>
            <span>✓ Integrasi RSVP & dashboard real-time</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Aktifkan Reminder WA
          </a>
        </div>
      </article>
    </main>
  )
}