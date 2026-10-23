import type { Metadata } from "next"
import Link from "next/link"
import { ARTICLES } from "@/data/artikel"
import Navigation from "@/components/Navigation"
import ArticleGrid from "@/components/ArticleGrid"
import { formatIdDate } from "@/lib/formatDate"

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
  const [featured, ...rest] = ARTICLES
  const categories = [...new Set(ARTICLES.map((a) => a.category))]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Artikel Aksaraa Wedding",
    itemListElement: ARTICLES.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://wedding.aksaraa.com/artikel/${a.slug}`,
      name: a.title,
    })),
  }

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-10">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          Blog Aksaraa
        </p>
        <h1 className="font-headline-lg text-[26px] leading-[1.15] md:leading-normal md:text-headline-lg text-primary mb-4 md:mb-6">
          Artikel: Panduan Nikah &amp; Undangan Digital
        </h1>
        <p className="text-base md:text-body-lg leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
          Panduan praktis seputar undangan pernikahan digital, wedding planner, checklist persiapan,
          dan galeri foto tamu — ditulis untuk calon pengantin Indonesia.
        </p>
      </section>

      {featured && (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-10">
          <Link
            href={`/artikel/${featured.slug}`}
            className="group grid md:grid-cols-2 bg-[#2C2A29] rounded-3xl overflow-hidden hover:shadow-xl transition-shadow max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-[#B34E3F] to-[#6b2b2d] p-6 md:p-10 flex flex-col justify-center min-h-[180px] md:min-h-[220px]">
              <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#ffdea4] font-semibold mb-2 md:mb-3">
                Pilihan Editor • {featured.category}
              </p>
              <p className="font-headline-md text-xl md:text-[28px] leading-snug md:leading-tight text-white group-hover:underline underline-offset-4">
                {featured.title}
              </p>
            </div>
            <div className="bg-white p-6 md:p-10 flex flex-col justify-center">
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                {featured.description}
              </p>
              <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                {formatIdDate(featured.date)} • {featured.readMinutes} mnt baca
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[#B34E3F] text-xs font-semibold tracking-widest uppercase">
                Baca Artikel
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </span>
            </div>
          </Link>
        </section>
      )}

      <ArticleGrid articles={rest} categories={categories} />
    </main>
  )
}
