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

  useEffect(() => {
    fetch(`/api/dashboard/${id}/web-invitation`)
      .then(r => r.json())
      .then(data => {
        setProfile(data.profile)
        setTemplate(data.template)
      })
  }, [id])

  return (
    <>
      <PageTheme mode="light" />

      <header className="px-edge-margin-mobile pt-8 pb-12">
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:opacity-70 transition-opacity mb-8"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <h1 className="font-headline-md text-headline-md text-primary mb-4 leading-tight">Progres Undangan Digital Anda</h1>
      </header>

      <main className="min-h-screen pb-32">
        {template ? (
          <section className="px-edge-margin-mobile mb-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-full max-w-[400px] mx-auto mb-12 relative">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-lg shadow-2xl">
                  <img
                    alt={`Mockup ${template.name}`}
                    className="w-full h-full object-cover grayscale-[0.2] hover:scale-105 transition-transform duration-700 ease-out"
                    src={template.preview_image_url}
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-primary/20 pointer-events-none" />
                <div className="absolute -top-4 -left-4 w-24 h-24 border-l border-t border-primary/20 pointer-events-none" />
              </div>

              <div className="max-w-2xl mx-auto">
                <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary block mb-4">
                  Koleksi Pilihan Anda
                </span>
                <h2 className="font-headline-xl text-headline-xl text-primary mb-6">{template.name}</h2>

                <button
                  onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback`)}
                  className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                >
                  Lihat Riwayat Feedback
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="px-edge-margin-mobile mb-12">
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

        <section className="px-edge-margin-mobile mb-12">
          <a
            href={`/dashboard/${id}/web-invitation/editor`}
            className="group block p-8 bg-surface-container-low border border-outline-variant/30 rounded-lg hover:border-primary transition-all duration-700"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary block">
                  Konfigurasi Utama
                </span>
                <h3 className="font-headline-md text-headline-md text-primary">Atur Undangan Anda</h3>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full border border-primary/20 group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined text-[24px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </div>
            </div>
          </a>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full px-edge-margin-mobile pb-8 pt-4 bg-surface/90 backdrop-blur-sm z-50">
        <button className="w-full bg-primary text-white py-5 px-8 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Hubungi Konsultan Aksara
        </button>
      </div>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <WebInvitationInner id={id} />
}