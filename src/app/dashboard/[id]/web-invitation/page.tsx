"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

type Profile = {
  id: string
  bride_name: string
  groom_name: string
  slug: string
  couple_illustration_url: string | null
  grayscale: boolean
  is_published: boolean
  invitation_url: string
  estimated_wedding_date?: string | null
  sessions?: { date: string }[] | null
}

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
}

function WebInvitationInner({ id }: { id: string }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [showH30Reminder, setShowH3Reminder] = useState(false)

  useEffect(() => {
    fetch(`/api/dashboard/${id}/web-invitation`)
      .then(r => r.json())
      .then(data => {
        setProfile(data.profile)
        setTemplate(data.template)
        const p = data.profile
const sessions = Array.isArray(p.sessions) ? p.sessions.map((s: any) => s?.date).filter(Boolean) : []
        const weddingDate = sessions[0] || p.estimated_wedding_date || ""
        if (weddingDate && p.is_published !== true) {
          const days = Math.ceil((new Date(`${weddingDate}T00:00:00`).getTime() - Date.now()) / 86400000)
          if (days >= 0 && days <= 30) setShowH3Reminder(true)
        }
      })
  }, [id])

  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector("header")
      if (!header) return
      if (window.scrollY > 10) {
        header.classList.add("shadow-sm", "bg-surface/95")
      } else {
        header.classList.remove("shadow-sm", "bg-surface/95")
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <PageTheme mode="light" />
      <div className="min-h-screen flex flex-col relative pb-32">
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface flex items-center w-full px-6 md:px-12 h-16 border-b border-outline-variant/30 transition-all">
          <button
            onClick={() => router.push(`/dashboard/${id}`)}
            className="flex items-center gap-2 text-primary hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="font-label-md text-label-md uppercase">Kembali</span>
          </button>
        </header>

        <main className="flex-1 w-full max-w-[500px] mx-auto px-6 pt-24">
          <h1 className="font-headline-md text-headline-md mb-10 leading-tight">
            Undangan Digital Anda
          </h1>

          {template ? (
            <>
              <section className="relative mb-12">
                <div className="relative w-full aspect-[4/5] max-w-[340px] mx-auto">
                  <div className="absolute w-10 h-10 z-10 border-[#C5A059] -top-2 -left-2 border-t border-l" />
                  <div className="absolute w-10 h-10 z-10 border-[#C5A059] -bottom-2 -right-2 border-b border-r" />
                  <div className="w-full h-full overflow-hidden border border-outline-variant/50 shadow-[0_20px_40px_rgba(26,24,23,0.08)] bg-surface-container">
                    <img
                      alt="Visualisasi Undangan Digital Aksara"
                      className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                      src={template.preview_image_url}
                    />
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <span className="font-label-md text-label-md text-secondary uppercase block mb-2 tracking-widest">
                    Koleksi Pilihan Anda
                  </span>
                  <h2 className="font-headline-md text-headline-md text-primary mb-4">{template.name}</h2>
                  <button
                    onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback`)}
                    className="inline-block font-label-md text-label-md text-primary border-b border-primary/30 pb-1 hover:border-primary transition-colors"
                  >
                    Lihat Riwayat Feedback →
                  </button>
                </div>
              </section>

              <section className="mb-8">
                <a
                  href={`/dashboard/${id}/web-invitation/editor`}
                  className="block p-6 border border-[#E2D7CB] bg-white/40 hover:bg-white/80 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-label-md text-label-md text-on-surface-variant uppercase block mb-1">
                        Konfigurasi Utama
                      </span>
                      <h3 className="font-headline-md text-[24px] leading-tight">Atur Undangan Anda</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center group-hover:bg-primary group-hover:text-surface transition-all duration-300">
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </div>
                  </div>
                </a>
              </section>
            </>
          ) : (
            <section className="mb-12">
              <div className="py-16 flex flex-col items-center text-center max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-outline/40 mb-6" style={{ fontVariationSettings: "'wght' 200" }}>
                  diamond
                </span>
                <h2 className="font-headline-md text-headline-md text-primary mb-2">Belum Memilih Template</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                  Pilih template undangan digital untuk memulai.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/${id}/web-invitation/templates`)}
                  className="bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest py-4 px-12 hover:bg-secondary transition-colors"
                >
                  Pilih Template
                </button>
              </div>
            </section>
          )}
        </main>

        {showH30Reminder && (
          <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowH3Reminder(false)}>
            <div className="bg-white w-full max-w-md rounded-2xl border border-outline-variant shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined text-4xl text-amber-500 mb-4 block">schedule</span>
              <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Undangan Mendekati Hari H</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Acara pernikahan Anda tinggal <span className="font-semibold text-primary">H-30 atau kurang</span>.
                Pastikan seluruh konten undangan sudah <span className="font-semibold">final dan dikonfirmasi</span> agar dapat
                dieksekusi oleh sistem Aksaraa tepat waktu.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/dashboard/${id}/web-invitation/editor`)}
                  className="w-full py-3.5 bg-secondary text-on-secondary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
                >
                  OK, Ke Editor
                </button>
                <button
                  onClick={() => setShowH3Reminder(false)}
                  className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <WebInvitationInner id={id} />
}
