"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import { ASSETS } from "@/lib/assets"

const CATEGORY_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "nasional", label: "Nasional" },
  { id: "budaya", label: "Budaya" },
]

const FEATURES = [
  { title: "Reservasi (RSVP)", text: "Manajemen kehadiran digital yang terkurasi dengan elegan dan terorganisir." },
  { title: "Lokasi", text: "Google Maps untuk kemudahan akses tamu kehormatan." },
  { title: "Turut Mengundang", text: "Menampilkan keluarga besar yang turut mengundang." },
  { title: "Countdown", text: "Penanda waktu visual yang memberi semangat menuju hari bahagia." },
  { title: "Love Story", text: "Kanvas digital untuk menarasikan perjalanan cinta Anda yang indah." },
  { title: "Gallery", text: "Visual eksklusif dari momen-momen pra-pernikahan Anda." },
  { title: "Video", text: "Video sinematik tentang perjalanan cinta Anda, dapat dilihat dan dipuji oleh para undangan." },
  { title: "++ Fitur menarik lainnya", text: "" },
]

type Template = {
  id: string
  code: string
  name: string
  demo_url: string
  preview_image_url: string
  category?: string | null
}

export default function PremiumWebInvitationPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [categoryFilter, setCategoryFilter] = useState("semua")
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)

  useEffect(() => {
    fetch("/api/web-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => setTemplates([]))
  }, [])

  useEffect(() => {
    const opts = { threshold: 0.1 }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0")
          entry.target.classList.remove("opacity-0", "translate-y-10")
        }
      })
    }, opts)
    const els = mainRef.current?.querySelectorAll(
      ".template-card, section h1, section h2, section p, .feature-item"
    )
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const visibleTemplates =
    categoryFilter === "semua"
      ? templates
      : templates.filter((t) => (t.category || "").toLowerCase() === categoryFilter)

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
        .template-card { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .template-card:hover { transform: translateY(-4px); box-shadow: 0px 15px 40px rgba(26, 24, 23, 0.06); }
        .filter-btn.active { border-bottom: 2px solid #8d4d39; color: #1a1a1a; }
      `}</style>

      <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b-[0.5px] border-outline-variant">
        <div className="flex items-center gap-4 px-margin-mobile md:px-margin-desktop py-6 w-full max-w-container-max mx-auto">
          <button onClick={() => router.back()}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="font-headline-md text-[24px] md:text-headline-md text-primary tracking-tight">
            Aksaraa
          </div>
        </div>
      </nav>

      <main className="pt-24 md:pt-32 pb-40" ref={mainRef}>
        {/* The Aksara Experience */}
        <section className="bg-surface-container-low py-20 px-margin-mobile md:px-margin-desktop border-b border-outline-variant/30">
          <div className="max-w-container-max mx-auto">
            <h2 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-16 text-center transition-all duration-700 opacity-100 translate-y-0">
              Buat Undangan Cepat &amp; Lengkap
            </h2>
            <div className="mb-20 flex flex-col items-center">
              <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-outline-variant/30 shadow-xl transition-all duration-700 opacity-100 translate-y-0">
                <img
                  src={ASSETS.premiumWeb.dashboard}
                  alt="Dashboard Preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="border-t border-outline-variant/50 pt-6 transition-all duration-700 feature-item opacity-100 translate-y-0"
                  style={{ transitionDelay: `${(i % 4) * 100}ms` }}
                >
                  <h3 className="font-headline-md text-xl text-primary mb-3">{f.title}</h3>
                  {f.text && (
                    <p className="font-body-md text-on-surface-variant leading-relaxed opacity-100 translate-y-0">{f.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial Header */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16 text-center">
          <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6 transition-all duration-700 opacity-100 translate-y-0">
            Template Undangan
          </h1>
          <p className="font-body-lg text-body-lg max-w-2xl mx-auto transition-all duration-700 text-on-surface-variant opacity-100 translate-y-0">
            Pilih kanvas untuk kisah cinta Anda. Setiap desain dirancang dengan indah untuk mencerminkan perjalanan cinta Anda.
          </p>
        </section>

        {/* Category Navigation */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16 border-b border-outline-variant/30">
          <div className="flex gap-8 overflow-x-auto pb-4 no-scrollbar font-label-caps text-label-caps justify-start md:justify-center transition-all duration-700 opacity-0 translate-y-10 text-primary">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`filter-btn whitespace-nowrap pb-2 uppercase tracking-widest transition-colors ${
                  categoryFilter === f.id
                    ? "active text-primary"
                    : "text-on-surface-variant hover:text-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Template Grid */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-4 lg:gap-y-10 lg:overflow-visible">
            {visibleTemplates.map((tpl, idx) => (
              <article key={tpl.id} className="template-card group flex flex-col shrink-0 snap-start w-[72vw] max-w-[300px] lg:w-auto lg:max-w-none">
                <div
                  className="relative mb-4 overflow-hidden rounded-2xl border-2 border-brand-charcoal aspect-[9/19] bg-surface-container shadow-sm cursor-pointer"
                  onClick={() => setPreviewTpl(tpl)}
                >
                  <img
                    alt={tpl.name}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                    src={tpl.preview_image_url}
                  />
                </div>
                <div className="flex flex-col flex-grow">
                  <h2 className="font-headline-md text-[16px] leading-tight mb-3">{tpl.name}</h2>
                  <button
                    onClick={() => setPreviewTpl(tpl)}
                    className="mt-auto w-full py-3 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-brand-charcoal border border-brand-charcoal text-brand-cream hover:bg-secondary hover:border-secondary hover:text-white transition-colors"
                  >
                    Lihat Template
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Final CTA / Sticky Bar */}
        <section className="fixed bottom-0 w-full z-40 bg-surface/95 backdrop-blur-md border-t border-outline-variant/30 py-6 px-margin-mobile md:px-margin-desktop shadow-[0_-10px_40px_rgba(26,24,23,0.05)]">
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="font-headline-md text-primary text-lg mb-1">Menginginkan sentuhan personal?</h4>
            </div>
            <button
              onClick={() => router.push("/register")}
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-secondary transition-all w-full md:w-auto"
            >
              Konsultasi Desain Khusus
            </button>
          </div>
        </section>
      </main>

      {previewTpl && (
        <TemplatePreviewModal
          name={previewTpl.name}
          demoUrl={previewTpl.demo_url}
          code={previewTpl.code}
          onClose={() => setPreviewTpl(null)}
        />
      )}
    </>
  )
}