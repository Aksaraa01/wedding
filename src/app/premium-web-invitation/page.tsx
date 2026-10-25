"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import { ASSETS } from "@/lib/assets"
import SeoFaq from "@/components/SeoFaq"
import { normalizeTemplateTier, tierBadgeClass } from "@/lib/templateTier"
import { matchesCategory } from "@/lib/templateCategory"

const CATEGORY_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "adat", label: "Adat/Tradisional" },
  { id: "modern", label: "Modern Minimalis" },
  { id: "elegansi", label: "Elegant" },
  { id: "floral", label: "Floral" },
]

const FEATURES = [
  { icon: "event_available", title: "Reservasi (RSVP)", text: "Manajemen kehadiran digital yang terkurasi dengan elegan dan terorganisir." },
  { icon: "location_on", title: "Lokasi", text: "Google Maps untuk kemudahan akses tamu kehormatan." },
  { icon: "groups", title: "Turut Mengundang", text: "Menampilkan keluarga besar yang turut mengundang." },
  { icon: "schedule", title: "Countdown", text: "Penanda waktu visual yang memberi semangat menuju hari bahagia." },
  { icon: "favorite", title: "Love Story", text: "Kanvas digital untuk menarasikan perjalanan cinta Anda yang indah." },
  { icon: "photo_library", title: "Gallery", text: "Visual eksklusif dari momen-momen pra-pernikahan Anda." },
  { icon: "play_circle", title: "Video", text: "Video sinematik tentang perjalanan cinta Anda, dapat dilihat dan dipuji oleh para undangan." },
  { icon: "auto_awesome", title: "++ Fitur menarik lainnya", text: "" },
]

type Template = {
  id: string
  code: string
  name: string
  demo_url: string
  preview_image_url: string
  category?: string | null
  tier?: string | null
  // Tanpa-photo group: separate dimension from category/tier (never a badge).
  no_photo?: boolean | null
}

export default function PremiumWebInvitationPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [categoryFilter, setCategoryFilter] = useState("semua")
  const [photoFilter, setPhotoFilter] = useState<"semua" | "tanpa">("semua")
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)
  const allFilters = useMemo(() => {
    const distinct = [...new Set(templates.map((t) => (t.category || "").trim()).filter(Boolean))]
    const extra = distinct
      .filter((c) => {
        const lower = c.toLowerCase()
        if (["nasional", "budaya"].includes(lower)) return false
        // Skip any category a built-in filter already covers (e.g. "Elegant"
        // is matched by the base "elegansi" chip).
        return !CATEGORY_FILTERS.some((f) => f.id !== "semua" && matchesCategory(c, f.id))
      })
      .map((c) => ({ id: c.toLowerCase(), label: c }))
    return [...CATEGORY_FILTERS, ...extra]
  }, [templates])

  useEffect(() => {
    fetch("/api/web-templates")
      .then((r) => r.json())
      .then((d) => {
        const list = d.templates || []
        setTemplates(list)
        // Deep link from /templates gallery: ?template=CODE auto-opens preview.
        try {
          const code = new URLSearchParams(window.location.search).get("template")?.trim().toLowerCase()
          if (code) {
            const hit = list.find((t: Template) => (t.code || "").toLowerCase() === code)
            if (hit) setPreviewTpl(hit)
          }
        } catch {}
      })
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

  // Same predicate drives filtering and zero-count hiding, so chips never lie.
  // (Shared with /templates/[category]; see src/lib/templateCategory.ts.)

  const visibleTemplates =
    templates.filter((t) => {
      const catOk = categoryFilter === "semua" || matchesCategory(t.category, categoryFilter)
      const photoOk = photoFilter !== "tanpa" || t.no_photo === true
      return catOk && photoOk
    })

  // Hide filters with no matching templates (e.g. "Elegansi Dark" with 0 rows).
  const shownFilters = allFilters.filter(
    (f) => f.id === "semua" || f.id === categoryFilter || templates.some((t) => matchesCategory(t.category, f.id))
  )

  useEffect(() => {
    if (categoryFilter !== "semua" && !templates.some((t) => matchesCategory(t.category, categoryFilter))) {
      setCategoryFilter("semua")
    }
  }, [templates, categoryFilter])

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

      <main className="pt-24 md:pt-32 pb-40 bg-[#FAF7F2]" ref={mainRef}>
        {/* The Aksara Experience */}
        <section className="bg-[#FAF7F2] py-12 md:py-20 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto">
            <p className="font-headline-lg text-[28px] md:text-headline-lg text-[#2C2A29] mb-8 md:mb-16 text-center transition-all duration-700 opacity-100 translate-y-0">
              Buat Undangan Cepat &amp; Lengkap
            </p>
            <div className="mb-10 md:mb-20 flex flex-col items-center">
              <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#E2D9CF] shadow-xl transition-all duration-700 opacity-100 translate-y-0 bg-white">
                <img
                  src="/dashboard.png"
                  alt="Dashboard Preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="bg-white border border-[#E2D9CF] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 feature-item opacity-100 translate-y-0 flex flex-col items-center md:items-start text-center md:text-left"
                  style={{ transitionDelay: `${(i % 4) * 100}ms` }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFE6] border border-[#E2D9CF] text-[#B34E3F]">
                    <span className="material-symbols-outlined text-[22px]">{f.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-[16px] md:text-lg text-[#2C2A29] mb-2">{f.title}</h3>
                  {f.text && (
                    <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">{f.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Editorial Header */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16 text-center">
          <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6 transition-all duration-700 opacity-100 translate-y-0">
            Template Undangan Pernikahan Digital Premium
          </h1>
          <p className="font-body-lg text-body-lg max-w-2xl mx-auto transition-all duration-700 text-on-surface-variant opacity-100 translate-y-0">
            Pilih dari 100+ template undangan website pernikahan — adat, modern, floral, hingga tanpa foto.
            Setiap desain sudah lengkap dengan RSVP online, amplop digital, dan galeri foto.
          </p>
        </section>

        {/* Category Navigation */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-10">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center">
            {shownFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`shrink-0 rounded-full border px-5 py-2 font-label-md text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                  categoryFilter === f.id
                    ? "bg-[#B34E3F] border-[#B34E3F] text-white"
                    : "bg-white border-[#E2D9CF] text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center mt-2">
            <span className="shrink-0 font-label-md text-[11px] uppercase tracking-widest text-on-surface-variant self-center">Foto:</span>
            {([
              { id: "semua", label: "Semua" },
              { id: "tanpa", label: "Tanpa Photo" },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setPhotoFilter(f.id)}
                className={`shrink-0 rounded-full border px-5 py-2 font-label-md text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                  photoFilter === f.id
                    ? "bg-[#2C2A29] border-[#2C2A29] text-white"
                    : "bg-white border-[#E2D9CF] text-[#2C2A29] hover:border-[#2C2A29] hover:text-[#2C2A29]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {visibleTemplates.length === 0 && (
          <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
            <div className="py-12 text-center">
              <p className="font-body-md text-sm text-on-surface-variant mb-4">
                {photoFilter === "tanpa" ? "Belum ada template Tanpa Photo yang cocok." : "Tidak ada template yang cocok dengan filter."}
              </p>
              <button
                onClick={() => { setPhotoFilter("semua"); setCategoryFilter("semua") }}
                className="rounded-full border border-[#B34E3F] text-[#B34E3F] px-5 py-2 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#B34E3F] hover:text-white transition-colors"
              >
                Tampilkan Semua
              </button>
            </div>
          </section>
        )}

        {/* Template Grid */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-4 lg:gap-y-10 lg:overflow-visible">
            {visibleTemplates.map((tpl) => {
              const styleTag = (tpl.category || "Modern").toUpperCase()
              const tierTag = normalizeTemplateTier(tpl.tier)?.toUpperCase() ?? null
              return (
              <article key={tpl.id} className="template-card group flex flex-col shrink-0 snap-start w-[72vw] max-w-[300px] lg:w-auto lg:max-w-none bg-white border border-[#E2D9CF] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div
                  className="relative overflow-hidden aspect-[9/19] bg-[#FAF7F2] cursor-pointer"
                  onClick={() => setPreviewTpl(tpl)}
                >
                  <img
                    alt={tpl.name}
                    className="w-full h-full object-cover object-top transition-transform duration-[1.5s] group-hover:scale-105"
                    src={tpl.preview_image_url}
                  />
                  {tierTag && (
                    <span className={`absolute top-3 left-3 text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm ${tierBadgeClass(tpl.tier)}`}>{tierTag}</span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline-md text-[14px] leading-tight text-[#2C2A29] flex-1">{tpl.name}</h2>
                    <span className="shrink-0 px-2 py-0.5 bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] text-[9px] font-bold tracking-widest uppercase rounded-full">{styleTag}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setPreviewTpl(tpl)}
                      className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] hover:bg-[#E2D9CF] transition-colors"
                    >
                      Lihat Template
                    </button>
                    <button
                      onClick={() => router.push(`/register?template=${tpl.code}`)}
                      className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#B34E3F] border border-[#B34E3F] text-white hover:bg-[#9E3B2D] transition-colors"
                    >
                      Pilih
                    </button>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        </section>

        {/* Final CTA / Sticky Bar */}
        <section className="fixed bottom-0 w-full z-40 bg-[#F5EFE6] border-t border-[#E2D9CF] py-3 md:py-6 px-margin-mobile md:px-margin-desktop shadow-[0_-10px_40px_rgba(26,24,23,0.05)]">
          <div className="max-w-container-max mx-auto flex flex-row justify-between items-center gap-3 md:gap-6">
            <h4 className="font-headline-md text-[#2C2A29] text-[14px] md:text-lg leading-tight">Menginginkan sentuhan personal?</h4>
            <button
              onClick={() => router.push("/register")}
              className="bg-[#B34E3F] text-white px-5 md:px-8 py-3 md:py-4 rounded-full font-label-md text-[10px] md:text-[11px] tracking-[0.2em] uppercase hover:bg-[#9E3B2D] transition-all shrink-0 shadow-sm whitespace-nowrap"
            >
              Konsultasi
            </button>
          </div>
        </section>

        <SeoFaq
          heading="Pertanyaan tentang Undangan Pernikahan Digital"
          items={[
            {
              q: "Apa itu undangan pernikahan digital?",
              a: "Undangan pernikahan digital adalah undangan website yang dibagikan lewat link WhatsApp — berisi profil mempelai, jadwal acara, RSVP online, amplop digital, galeri foto, dan peta lokasi dalam satu halaman.",
            },
            {
              q: "Berapa harga undangan digital di Aksaraa?",
              a: "Harga tergantung paket dan fitur yang dipilih. Lihat [halaman harga](/customize) untuk daftar paket undangan website, buku tamu digital, galeri foto tamu, dan add-on lainnya.",
            },
            {
              q: "Apakah tersedia template adat dan tanpa foto?",
              a: "Ya. Tersedia kategori Adat/Tradisional, Modern Minimalis, Elegansi Dark, Floral, hingga desain tanpa foto untuk privasi maksimal.",
            },
            {
              q: "Apakah tamu perlu menginstal aplikasi?",
              a: "Tidak. Tamu cukup membuka tautan undangan di browser HP — RSVP, amplop digital, dan galeri langsung bisa digunakan.",
            },
          ]}
        />
      </main>

      {previewTpl && (
        <TemplatePreviewModal
          name={previewTpl.name}
          demoUrl={previewTpl.demo_url}
          onClose={() => setPreviewTpl(null)}
        />
      )}
    </>
  )
}