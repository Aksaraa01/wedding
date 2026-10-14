"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import SeoFaq from "@/components/SeoFaq"

type LineItem = { id: string; label: string; hint: string; def: number; perPax: boolean }

const ITEMS: LineItem[] = [
  { id: "venue", label: "Gedung / Venue", hint: "Sewa gedung 1 hari", def: 25000000, perPax: false },
  { id: "catering", label: "Katering per tamu", hint: "Termasuk stall & dessert", def: 75000, perPax: true },
  { id: "mua", label: "MUA & Busana", hint: "Akad + resepsi, 2 looks", def: 15000000, perPax: false },
  { id: "dekor", label: "Dekorasi", hint: "Pelaminan + entrance + meja", def: 20000000, perPax: false },
  { id: "dokum", label: "Foto & Video", hint: "Fullday + album + cinematic", def: 12000000, perPax: false },
  { id: "hiburan", label: "Hiburan", hint: "Band akustik / organ tunggal", def: 8000000, perPax: false },
  { id: "wo", label: "Wedding Organizer", hint: "Koordinasi fullday", def: 15000000, perPax: false },
  { id: "souvenir", label: "Souvenir per tamu", hint: "Estimasi per pcs", def: 15000, perPax: true },
  { id: "undangan", label: "Undangan cetak cadangan", hint: "Untuk sesepuh (opsional)", def: 2000000, perPax: false },
]

function rupiah(n: number): string {
  return "Rp" + Math.round(n).toLocaleString("id-ID")
}

export default function KalkulatorBudgetPage() {
  const [pax, setPax] = useState(400)
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(ITEMS.map((i) => [i.id, i.def]))
  )
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ITEMS.map((i) => [i.id, true]))
  )

  const total = useMemo(
    () =>
      ITEMS.reduce((sum, i) => {
        if (!enabled[i.id]) return sum
        const v = Number(values[i.id]) || 0
        return sum + (i.perPax ? v * pax : v)
      }, 0),
    [values, enabled, pax]
  )

  const waText = encodeURIComponent(
    `Halo Aksaraa! Estimasi budget nikah saya ${rupiah(total)} untuk ${pax} tamu (via Kalkulator Budget). Minta rekomendasi paket undangan digital.`
  )

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto text-center mb-10">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Kalkulator Budget Pernikahan
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Hitung estimasi biaya nikah: atur jumlah tamu dan sesuaikan tiap pos — total terhitung otomatis.
          Undangan digital Aksaraa menghemat jutaan rupiah biaya cetak.
        </p>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto mb-8">
        <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#2C2A29] mb-2">
            Jumlah tamu undangan: {pax}
          </label>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={pax}
            onChange={(e) => setPax(Number(e.target.value))}
            className="w-full accent-[#B34E3F]"
          />
          <div className="mt-6 space-y-4">
            {ITEMS.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b border-[#F5EFE6] pb-4">
                <input
                  type="checkbox"
                  checked={!!enabled[item.id]}
                  onChange={() => setEnabled((s) => ({ ...s, [item.id]: !s[item.id] }))}
                  className="w-5 h-5 accent-[#B34E3F] shrink-0"
                  aria-label={item.label}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C2A29] text-sm">
                    {item.label}
                    {item.perPax && <span className="text-on-surface-variant font-normal"> × {pax} tamu</span>}
                  </p>
                  <p className="text-xs text-on-surface-variant">{item.hint}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  value={values[item.id]}
                  onChange={(e) => setValues((s) => ({ ...s, [item.id]: Number(e.target.value) }))}
                  className="w-32 sm:w-40 border border-[#E2D9CF] rounded-xl px-3 py-2 text-sm text-right outline-none focus:border-[#B34E3F]"
                  aria-label={`Nominal ${item.label}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F5EFE6] rounded-2xl px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
              Estimasi total budget
            </p>
            <p className="font-headline-lg text-2xl md:text-3xl text-[#B34E3F]">{rupiah(total)}</p>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/6281161613071?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full bg-[#25D366] text-white text-xs font-semibold tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              Konsultasi via WhatsApp
            </a>
            <Link
              href="/customize"
              className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
            >
              Lihat Harga Undangan
            </Link>
          </div>
        </div>
      </section>

      <SeoFaq
        heading="Pertanyaan tentang Budget Pernikahan"
        items={[
          {
            q: "Berapa budget nikah 400 tamu di 2026?",
            a: "Dengan asumsi standar di atas, estimasi berkisar Rp150–250 juta tergantung kota, venue, dan vendor. Geser jumlah tamu dan ubah tiap pos di kalkulator untuk angka yang sesuai rencana Anda.",
          },
          {
            q: "Pos apa yang paling bisa dihemat?",
            a: "Undangan dan souvenir: beralih ke [undangan digital](/premium-web-invitation) memangkas biaya cetak jutaan rupiah sekaligus mempercepat sebaran dan RSVP.",
          },
          {
            q: "Apakah estimasi ini mengikat?",
            a: "Tidak. Ini estimasi awal untuk perencanaan — angka final tergantung negosiasi vendor. Simpan hasil hitungan lalu [konsultasikan paket undangan](/customize) yang sesuai budget Anda.",
          },
        ]}
      />
    </main>
  )
}
