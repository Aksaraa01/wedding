import type { Metadata } from "next"
import Link from "next/link"
import { ARTICLES } from "@/data/artikel"
import Navigation from "@/components/Navigation"

export const metadata: Metadata = {
  title: "Artikel: Panduan Undangan Digital & Persiapan Nikah",
  description:
    "Artikel seputar undangan pernikahan digital, biaya wedding organizer, checklist persiapan nikah, dan ide disposable camera untuk resepsi.",
  alternates: { canonical: "https://wedding.aksaraa.com/artikel" },
  openGraph: {
    title: "Artikel Undangan Digital & Persiapan Nikah | Aksaraa",
    description:
      "Panduan praktis: membuat undangan digital, memilih WO, checklist nikah, dan galeri foto tamu.",
  },
}

export default function ArtikelIndexPage() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-12">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Artikel: Panduan Nikah &amp; Undangan Digital
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Panduan praktis seputar undangan pernikahan digital, wedding planner, checklist persiapan,
          dan galeri foto tamu — ditulis untuk calon pengantin Indonesia.
        </p>
      </section>
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              href={`/artikel/${a.slug}`}
              className="group bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow"
            >
              <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-2">
                {a.category} • {a.readMinutes} mnt baca
              </p>
              <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] group-hover:text-[#B34E3F] leading-snug">
                {a.title}
              </h2>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{a.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
