"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StandeeBack, StandeeFront, hashtagOf, type StandeeData } from "@/components/galeri/StandeeCards"

type Setup = {
  gallery_couple_name: string
  gallery_token: string | null
  gallery_start_at: string | null
  date_label: string
  payment_status: string
}

function dotDateOf(iso: string | null): string {
  if (!iso) return ""
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).formatToParts(new Date(iso))
    const get = (t: string) => parts.find((p) => p.type === t)?.value || ""
    const [d, m, y] = [get("day"), get("month"), get("year")]
    if (!d || !m || !y) return ""
    return `${d}.${m}.${y}`
  } catch {
    return ""
  }
}

// Printable table standee (front + back). Screen shows one side at a time;
// print outputs both (front page 1, back page 2).
export default function CetakQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [setup, setSetup] = useState<Setup | null>(null)
  const [qrPng, setQrPng] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState("")
  const [venue, setVenue] = useState("")
  const [side, setSide] = useState<"front" | "back">("front")
  const [format, setFormat] = useState<"4r" | "a5" | "a4">("a5")
  const [fontsReady, setFontsReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let dead = false
    try {
      const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts
      if (fonts?.ready) fonts.ready.then(() => { if (!dead) setFontsReady(true) }).catch(() => { if (!dead) setFontsReady(true) })
      else setFontsReady(true)
    } catch {
      setFontsReady(true)
    }
    ;(async () => {
      try {
        const [setupRes, qrRes, dashRes] = await Promise.all([
          fetch(`/api/dashboard/${id}/gallery-setup`),
          fetch(`/api/dashboard/${id}/gallery-qr`),
          fetch(`/api/dashboard/${id}`),
        ])
        if (dead) return
        if (setupRes.ok) {
          const data = await setupRes.json()
          if (data.setup) setSetup(data.setup)
        }
        if (qrRes.ok) {
          const data = await qrRes.json()
          if (data.qr_png) setQrPng(data.qr_png)
          if (data.gallery_url) setQrUrl(data.gallery_url)
        }
        if (dashRes.ok) {
          const data = await dashRes.json()
          const sessions = data.profile?.sessions
          if (Array.isArray(sessions) && sessions[0]?.venue) setVenue(String(sessions[0].venue))
        }
      } finally {
        if (!dead) setLoading(false)
      }
    })()
    return () => { dead = true }
  }, [id])

  const couple = setup?.gallery_couple_name || ""
  const dateLine = [setup?.date_label || "", venue].filter(Boolean).join(" • ")
  const ready = !loading && !!setup?.gallery_token && !!qrPng && fontsReady
  const maxW = format === "4r" ? 460 : format === "a5" ? 530 : 600

  const data: StandeeData = {
    couple,
    dateLine,
    qrPng: qrPng || "",
    qrUrl,
    hashtag: hashtagOf(couple),
    sigDate: dotDateOf(setup?.gallery_start_at || null),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] py-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-sheet { box-shadow: none !important; margin: 0 auto !important; }
        }
        @media screen {
          .screen-hide { display: none !important; }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>

      <div className="no-print max-w-3xl mx-auto px-6 mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push(`/dashboard/${id}/galeri-kenangan`)}
          className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-[#6b2b2d]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-[#d9c1c0] p-1 text-[11px] font-semibold uppercase tracking-widest">
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`px-4 py-1.5 rounded-full transition-colors ${side === s ? "bg-[#6b2b2d] text-white shadow-sm" : "text-[#534342]"}`}
              >
                {s === "front" ? "Depan" : "Belakang"}
              </button>
            ))}
          </div>
          <div className="flex items-center rounded-full border border-[#d9c1c0] p-1 text-[11px] font-semibold uppercase tracking-widest">
            {(["4r", "a5", "a4"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 rounded-full transition-colors ${format === f ? "bg-[#6b2b2d] text-white shadow-sm" : "text-[#534342]"}`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            disabled={!ready}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-[12px] font-semibold uppercase tracking-widest disabled:opacity-50"
            style={{ backgroundColor: "#4f1519" }}
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Cetak Standee
          </button>
        </div>
      </div>

      {!setup?.gallery_token || !qrPng ? (
        <p className="text-center text-sm text-[#444841] px-6">
          {!setup?.gallery_token
            ? "Simpan detail acara dulu untuk menerbitkan QR."
            : "QR belum tersedia. Coba muat ulang halaman."}
        </p>
      ) : (
        <div className="mx-auto px-6" style={{ maxWidth: maxW + 48 }}>
          <div className={side === "front" ? "" : "screen-hide"}>
            <StandeeFront data={data} style={{ maxWidth: maxW, margin: "0 auto 24px" }} />
          </div>
          <div className={side === "back" ? "" : "screen-hide"} style={{ breakBefore: "page" }}>
            <StandeeBack data={data} style={{ maxWidth: maxW, margin: "0 auto" }} />
          </div>
        </div>
      )}
    </div>
  )
}
