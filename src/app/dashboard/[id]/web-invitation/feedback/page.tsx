"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

type Submission = {
  id: string
  template_name: string
  area: string | null
  description: string
  image_url: string | null
  round_number: number
  status: string
  created_at: string
}

function parseImages(imageUrl: string | null): string[] {
  if (!imageUrl) return []
  try {
    const parsed = JSON.parse(imageUrl)
    return Array.isArray(parsed) ? parsed : [imageUrl]
  } catch {
    return [imageUrl]
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function FeedbackInner({ id }: { id: string }) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [limit, setLimit] = useState({ max_revisions: 0, used_revisions: 0, remaining_revisions: 0, is_locked: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/feedback-submissions?wedding_profile_id=${id}`),
      fetch(`/api/feedback-submissions/limit?wedding_profile_id=${id}`),
    ])
      .then(([subRes, limitRes]) =>
        Promise.all([subRes.json(), limitRes.json()])
      )
      .then(([subData, limitData]) => {
        setSubmissions(subData.submissions || [])
        setLimit(limitData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const items = submissions

  return (
    <>
      <PageTheme mode="light" />

      <main className="min-h-screen pb-40 bg-[#FAF7F2]">
        <nav className="px-edge-margin-mobile pt-8 mb-8">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) router.back()
              else router.push(`/dashboard/${id}/web-invitation/editor?section=feedback`)
            }}
            className="flex items-center text-on-surface-variant hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-[18px] mr-2 transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span className="font-label-md text-label-md uppercase tracking-widest">Kembali</span>
          </button>
        </nav>

        <section className="px-edge-margin-mobile mb-12">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-[#2C2A29] mb-4">Riwayat Draf</h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed opacity-80">
            Pantau evolusi narasi pernikahan Anda dari versi awal hingga draf terbaru yang sedang dikerjakan oleh tim kami.
          </p>
        </section>

        <section className="px-edge-margin-mobile relative">
          <div className="absolute left-4 top-0 bottom-0 w-[0.5px] bg-[#E2D9CF]" />

          <div className="space-y-8">
            {submissions.length === 0 ? (
              <div className="relative pl-12 pt-4">
                <div className="absolute left-[13px] top-4 w-2 h-2 rounded-full bg-[#D1C7BD] ring-4 ring-[#FAF7F2]" />
                <div className="flex flex-col items-center justify-center py-12 opacity-40 bg-white border border-[#E2D9CF] rounded-2xl">
                  <span className="material-symbols-outlined text-[48px] mb-4 text-outline font-light">auto_stories</span>
                  <p className="font-label-md text-label-md uppercase tracking-widest text-center">Belum ada riwayat feedback</p>
                </div>
              </div>
            ) : (
              items.map((sub, i) => {
                const isLatest = i === items.length - 1
                const images = parseImages(sub.image_url)
                const areaLabel = sub.area === "Tipografi & Huruf" ? "Tipografi & Huruf"
                  : sub.area === "Foto & Visual" ? "Foto & Visual"
                  : sub.area === "Informasi Acara" ? "Informasi Acara"
                  : sub.area === "Tata Letak (Layout)" ? "Layout"
                  : sub.area || ""

                return (
                  <div key={sub.id} className="relative pl-12">
                    <div className={`absolute left-[13px] top-2 w-2 h-2 rounded-full ring-4 ring-[#FAF7F2] ${isLatest ? "bg-[#B34E3F]" : "bg-[#D1C7BD]"}`} />

                    {i > 0 && (
                      <div className="absolute -top-8 left-[14.5px] w-[1px] h-8 bg-[#E2D9CF]" />
                    )}

                    <div className="bg-white border border-[#E2D9CF] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="font-headline-md text-headline-md text-[#2C2A29] mb-1">{sub.template_name || "Draf Undangan"}</h3>
                          <p className="font-label-md text-label-md text-on-surface-variant/60 uppercase tracking-tighter">{formatDate(sub.created_at)}</p>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase px-3 py-1 rounded-full border ${sub.status === "resolved" ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]" : sub.status === "in_progress" ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          {sub.status === "resolved" ? "Selesai" : sub.status === "in_progress" ? "Dalam Proses" : "Menunggu"}
                        </span>
                      </div>

                      {isLatest ? (
                        <div className="bg-[#FAF7F2] p-5 border-l-4 border-[#B34E3F] rounded-r-xl overflow-hidden">
                          <p className="font-body-md text-body-md italic text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words min-w-0">
                            &ldquo;{sub.description}&rdquo;
                          </p>
                          {areaLabel && (
                            <p className="font-label-md text-label-md text-on-surface-variant/60 mt-3">Area: {areaLabel}</p>
                          )}
                          {images.length > 0 && (
                            <div className="grid grid-cols-5 gap-2 max-w-lg">
                              {images.map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="aspect-square bg-surface-container-highest overflow-hidden rounded mt-3 border border-[#E2D9CF]">
                                  <img src={imgUrl} alt={`Referensi ${imgIdx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap break-words min-w-0">{sub.description}</p>
                          {areaLabel && (
                            <p className="font-label-md text-label-md text-outline uppercase tracking-tighter">Area: {areaLabel}</p>
                          )}
                          {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                              {images.map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="aspect-[4/5] bg-surface-container-highest overflow-hidden rounded-lg border border-[#E2D9CF]">
                                  <img src={imgUrl} alt={`Referensi ${imgIdx + 1}`} className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E2D9CF] px-6 pt-4 pb-8 flex flex-col gap-4">
        {limit.is_locked ? (
          <div className="text-center">
            <p className="font-body-md text-body-md text-rose-700 mb-2">
              Batas revisi ({limit.max_revisions} putaran) telah tercapai.
            </p>
            <p className="font-label-md text-label-md text-on-surface-variant">
              Hubungi konsultan Aksaraa untuk opsi penambahan revisi.
            </p>
          </div>
        ) : (
          <div className="text-center mb-2">
            <p className="font-label-md text-label-md text-on-surface-variant">
              Sisa revisi: <span className="font-semibold text-primary">{limit.remaining_revisions}</span> dari {limit.max_revisions} putaran
            </p>
          </div>
        )}
        <button
          onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback/new`)}
          disabled={limit.is_locked}
          className="w-full bg-[#B34E3F] text-white py-5 rounded-full font-label-md text-label-md font-bold uppercase tracking-[0.3em] active:scale-[0.98] transition-all hover:bg-[#9E3B2D] duration-300 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Beri Masukan Baru
        </button>
      </footer>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FeedbackInner id={id} />
}
