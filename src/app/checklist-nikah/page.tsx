"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import SeoFaq from "@/components/SeoFaq"

type Task = { id: string; text: string }
type Phase = { id: string; title: string; tasks: Task[] }

const PHASES: Phase[] = [
  {
    id: "p12",
    title: "12–9 Bulan: Fondasi",
    tasks: [
      { id: "p12-1", text: "Tetapkan tanggal, budget, dan estimasi tamu" },
      { id: "p12-2", text: "Amankan gedung/venue dan fotografer" },
      { id: "p12-3", text: "Riset desain undangan digital" },
      { id: "p12-4", text: "Hitung estimasi dengan kalkulator budget" },
    ],
  },
  {
    id: "p8",
    title: "8–5 Bulan: Vendor Inti",
    tasks: [
      { id: "p8-1", text: "Booking MUA, dekorasi, dan katering" },
      { id: "p8-2", text: "Booking hiburan (band / organ tunggal)" },
      { id: "p8-3", text: "Susun guest list: nama, WA, kategori, meja" },
      { id: "p8-4", text: "Tentukan WO atau koordinator hari-H" },
    ],
  },
  {
    id: "p4",
    title: "4–2 Bulan: Undangan & RSVP",
    tasks: [
      { id: "p4-1", text: "Finalisasi desain undangan website" },
      { id: "p4-2", text: "Isi data mempelai, acara, dan galeri" },
      { id: "p4-3", text: "Sebarkan tautan unik per tamu via WhatsApp" },
      { id: "p4-4", text: "Buka RSVP online (minimal H-8 minggu)" },
    ],
  },
  {
    id: "p1",
    title: "1 Bulan–1 Minggu: Eksekusi",
    tasks: [
      { id: "p1-1", text: "Kirim reminder WhatsApp H-7 dan H-1" },
      { id: "p1-2", text: "Finalisasi seating dari data check-in" },
      { id: "p1-3", text: "Siapkan buku tamu digital + galeri foto" },
      { id: "p1-4", text: "Gladi resik bersama WO dan vendor" },
    ],
  },
  {
    id: "p0",
    title: "Hari-H",
    tasks: [
      { id: "p0-1", text: "QR check-in aktif di pintu masuk" },
      { id: "p0-2", text: "Layar sapa + slideshow galeri tayang" },
      { id: "p0-3", text: "Wish wall dibuka untuk ucapan tamu" },
      { id: "p0-4", text: "Unduh rekap tamu, foto, dan ucapan" },
    ],
  },
]

const STORE_KEY = "aksaraa-checklist-nikah-v1"

export default function ChecklistNikahPage() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setDone(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(done))
    } catch {}
  }, [done, loaded])

  const total = useMemo(() => PHASES.reduce((n, p) => n + p.tasks.length, 0), [])
  const doneCount = useMemo(() => Object.values(done).filter(Boolean).length, [done])
  const pct = Math.round((doneCount / total) * 100)

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto text-center mb-8">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Checklist Persiapan Pernikahan
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Daftar persiapan nikah dari 12 bulan hingga hari-H. Centang yang sudah beres —
          progres tersimpan otomatis di HP Anda dan bisa dicetak.
        </p>
        <div className="mt-6 bg-white border border-[#E2D9CF] rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
            <span>Progres persiapan</span>
            <span>{doneCount}/{total} • {pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#F5EFE6] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#B34E3F] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors"
            >
              Cetak / Simpan PDF
            </button>
            <Link
              href="/kalkulator-budget"
              className="px-6 py-2.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
            >
              Hitung Budget
            </Link>
          </div>
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto space-y-4 mb-8">
        {PHASES.map((phase) => (
          <div key={phase.id} className="bg-white border border-[#E2D9CF] rounded-2xl p-6">
            <h2 className="font-headline-md text-lg text-[#2C2A29] mb-4">{phase.title}</h2>
            <div className="space-y-2">
              {phase.tasks.map((t) => {
                const checked = !!done[t.id]
                return (
                  <button
                    key={t.id}
                    onClick={() => setDone((s) => ({ ...s, [t.id]: !s[t.id] }))}
                    className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF7F2] transition-colors"
                  >
                    <span
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "bg-[#B34E3F] border-[#B34E3F] text-white" : "border-[#E2D9CF] text-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </span>
                    <span className={`text-sm ${checked ? "line-through text-on-surface-variant" : "text-[#2C2A29]"}`}>
                      {t.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <SeoFaq
        heading="Pertanyaan tentang Persiapan Nikah"
        items={[
          {
            q: "Kapan mulai menyiapkan pernikahan?",
            a: "Idealnya 12 bulan sebelumnya: gedung dan fotografer penuh paling cepat. [Undangan digital](/premium-web-invitation) bisa menyusul 2–3 bulan sebelum hari-H.",
          },
          {
            q: "Bagaimana agar tidak ada yang terlewat?",
            a: "Gunakan checklist bertahap di halaman ini — centang tiap tahap dan progres tersimpan otomatis di HP Anda.",
          },
          {
            q: "Berapa budget yang perlu disiapkan?",
            a: "Tergantung tamu dan vendor. Hitung estimasi dengan [kalkulator budget](/kalkulator-budget) lalu sesuaikan tiap posnya.",
          },
        ]}
      />
    </main>
  )
}
