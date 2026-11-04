import type { Metadata } from "next"
import Link from "next/link"
import { ARTICLES } from "@/data/artikel"
import Navigation from "@/components/Navigation"
import ArticleGrid from "@/components/ArticleGrid"
import { categoryStyle } from "@/lib/articleCategory"
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
  const featuredStyle = featured ? categoryStyle(featured.category) : categoryStyle("")

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-[88px] md:pt-32 pb-16">
      <Navigation />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Compact app-style header: left aligned on mobile, editorial on desktop */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-4 md:mb-10">
        <div className="md:text-center md:max-w-3xl md:mx-auto">
          <div className="mb-2 flex items-center gap-1.5 md:justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B34E3F]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B34E3F]">
              Blog Aksaraa
            </p>
            <span className="text-[10px] text-on-surface-variant/60">• {ARTICLES.length} artikel</span>
          </div>
          <h1 className="font-headline-lg text-[23px] leading-[1.2] md:leading-normal md:text-headline-lg text-primary mb-2 md:mb-5">
            Artikel: Panduan Nikah &amp; Undangan Digital
          </h1>
          <p className="text-[13px] md:text-base leading-relaxed text-on-surface-variant md:max-w-2xl md:mx-auto">
            Panduan praktis seputar undangan pernikahan digital, wedding planner, checklist persiapan,
            dan galeri foto tamu, ditulis untuk calon pengantin Indonesia.
          </p>
        </div>
      </section>

      {featured && (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-5 md:mb-10">
          <Link
            href={`/artikel/${featured.slug}`}
            className="group block overflow-hidden rounded-2xl border border-[#E2D9CF] bg-white transition-shadow active:scale-[0.995] hover:shadow-xl md:grid md:max-w-4xl md:mx-auto md:grid-cols-2 md:rounded-3xl md:border-0"
          >
            <div
              className="relative flex flex-col justify-center p-5 md:min-h-[220px] md:p-10"
              style={{ background: `linear-gradient(140deg, ${featuredStyle.from}, ${featuredStyle.to})` }}
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{ backgroundImage: "radial-gradient(circle at 88% 8%, #ffdea4 0, transparent 60%)" }}
                aria-hidden
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#ffdfae] backdrop-blur-sm md:text-[10px]">
                  <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                  Pilihan Editor
                </span>
                <p className="mt-2.5 font-headline-md text-[18px] leading-snug text-white md:mt-4 md:text-[28px] md:leading-tight">
                  {featured.title}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/70 md:mt-3 md:text-[10px]">
                  <span>{featured.category}</span>
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    {featured.readMinutes} mnt
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center p-5 md:p-10">
              <p className="text-[12.5px] leading-relaxed text-on-surface-variant md:text-sm">{featured.description}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[9.5px] uppercase tracking-[0.14em] text-on-surface-variant/80 md:text-[11px]">
                  {formatIdDate(featured.date)}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F] md:text-xs">
                  Baca
                  <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1 md:text-[16px]">
                    arrow_forward
                  </span>
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      <ArticleGrid articles={rest} categories={categories} />
    </main>
  )
}
