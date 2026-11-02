"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import SeoFaq from "@/components/SeoFaq"
import TemplateGallery from "@/components/template-gallery/TemplateGallery"
import type { GalleryTemplate } from "@/lib/templateGallery"

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

type Template = GalleryTemplate

export default function PremiumWebInvitationPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null)

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
      "section h1, section h2, section p, .feature-item"
    )
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <PageTheme mode="light" />
      <style>{`
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
        <section className="bg-[#FAF7F2] py-8 md:py-20 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto">
            <p className="font-headline-lg text-[20px] leading-tight md:text-headline-lg text-[#2C2A29] mb-5 md:mb-16 text-center transition-all duration-700 opacity-100 translate-y-0">
              Buat Undangan Cepat &amp; Lengkap
            </p>
            <div className="mb-7 md:mb-20 flex flex-col items-center">
              <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#E2D9CF] shadow-xl transition-all duration-700 opacity-100 translate-y-0 bg-white">
                <img
                  src="/dashboard.png"
                  alt="Dashboard Preview"
                  className="w-full h-[170px] sm:h-[260px] md:h-auto object-cover object-top"
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
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-7 md:mb-16 text-center">
          <h1 className="font-headline-lg text-[21px] leading-tight md:text-headline-lg text-primary mb-3 md:mb-6 transition-all duration-700 opacity-100 translate-y-0">
            Template Undangan Pernikahan Digital Premium
          </h1>
          <p className="text-[13px] leading-relaxed md:font-body-lg md:text-body-lg max-w-2xl mx-auto transition-all duration-700 text-on-surface-variant opacity-100 translate-y-0">
            Pilih dari 100+ template undangan website pernikahan — adat, modern, floral, hingga tanpa foto.
            Setiap desain sudah lengkap dengan RSVP online, amplop digital, dan galeri foto.
          </p>
        </section>

        {/* Template gallery: Top 10 Populer, Top 10 Terbaru, per-category shelves */}
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
          <TemplateGallery
            templates={templates}
            onPreview={(tpl) => setPreviewTpl(tpl as Template)}
          />
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
          demoUrl={previewTpl.demo_url || ""}
          selectHref={`/register?template=${encodeURIComponent(previewTpl.code)}`}
          onClose={() => setPreviewTpl(null)}
        />
      )}
    </>
  )
}