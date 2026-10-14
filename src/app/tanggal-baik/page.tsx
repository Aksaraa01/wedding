"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import SeoFaq from "@/components/SeoFaq"

// Javanese weton from a Gregorian date. Anchor: 17 Agustus 1945 = Jumat Legi
// (widely documented), pasaran cycles every 5 days.
const PASARAN = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"] as const
const PASARAN_NEPTU: Record<string, number> = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 }
const DAY_NEPTU = [5, 4, 3, 7, 8, 6, 9] // Sun..Sat: Minggu..Sabtu
const DAY_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const
const MONTH_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"] as const

const ANCHOR_MS = Date.UTC(1945, 7, 17)
const DAY_MS = 24 * 60 * 60 * 1000

function wetonOf(y: number, m: number, d: number) {
  const ms = Date.UTC(y, m - 1, d)
  const diff = Math.round((ms - ANCHOR_MS) / DAY_MS)
  const dt = new Date(ms)
  const weekday = dt.getUTCDay()
  // Anchor Friday(5) Legi(0): pasaran index = diff mod 5.
  const pasaran = PASARAN[((diff % 5) + 5) % 5]
  const neptu = DAY_NEPTU[weekday] + PASARAN_NEPTU[pasaran]
  return { weekday: DAY_ID[weekday], pasaran, neptu, isWeekend: weekday === 0 || weekday === 6 }
}

function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function TanggalBaikPage() {
  const [value, setValue] = useState(todayStr)
  const result = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "")
    if (!m) return null
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    const w = wetonOf(y, mo, d)
    return { y, mo, d, ...w }
  }, [value])

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto text-center mb-8">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Cek Weton &amp; Tanggal Baik Pernikahan
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Masukkan tanggal rencana akad atau resepsi untuk melihat hari, pasaran Jawa (weton),
          dan nilai neptunya — bahan pertimbangan memilih tanggal baik.
        </p>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto mb-8">
        <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#2C2A29] mb-2">
            Tanggal rencana acara
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-[#E2D9CF] rounded-xl px-4 py-3 text-base outline-none focus:border-[#B34E3F] bg-white"
          />
          {result && (
            <div className="mt-6 text-center">
              <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                {result.weekday}, {result.d} {MONTH_ID[result.mo - 1]} {result.y}
              </p>
              <p className="font-headline-lg text-3xl md:text-4xl text-[#B34E3F] mt-2">
                {result.weekday} {result.pasaran}
              </p>
              <p className="text-sm text-on-surface-variant mt-2">
                Neptu {result.neptu}
                {result.isWeekend ? " • Akhir pekan, mudah dihadiri tamu" : " • Hari kerja, pertimbangkan cuti tamu"}
              </p>
              <div className="mt-6 rounded-2xl bg-[#F5EFE6] px-6 py-5 text-sm leading-relaxed text-[#2C2A29]">
                Weton adalah perpaduan hari masehi dan pasaran Jawa. Banyak keluarga memakai
                hitungan neptu sebagai salah satu pertimbangan tanggal baik — diskusikan dengan
                sesepuh dan pastikan gedung serta vendor tersedia di tanggal tersebut.
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/checklist-nikah"
                  className="px-7 py-3 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors"
                >
                  Checklist Persiapan
                </Link>
                <Link
                  href="/customize"
                  className="px-7 py-3 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
                >
                  Lihat Harga Undangan
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <SeoFaq
        heading="Pertanyaan tentang Tanggal Baik & Weton"
        items={[
          {
            q: "Apa itu weton?",
            a: "Weton adalah kombinasi hari masehi (Senin–Minggu) dengan pasaran Jawa (Legi, Pahing, Pon, Wage, Kliwon) yang berputar tiap 5 hari. Tiap kombinasi punya nilai neptu.",
          },
          {
            q: "Bagaimana cara menghitung neptu?",
            a: "Jumlahkan neptu hari dan neptu pasaran — misalnya Jumat (6) Legi (5) = 11. Kalkulator di halaman ini menghitung otomatis dari tanggal yang Anda pilih.",
          },
          {
            q: "Apakah neptu menentukan tanggal baik?",
            a: "Neptu adalah salah satu pertimbangan tradisi Jawa; keputusan akhir biasanya musyawarah keluarga dengan sesepuh. Pastikan juga venue, katering, dan [undangan digital](/premium-web-invitation) siap tepat waktu.",
          },
        ]}
      />
    </main>
  )
}
