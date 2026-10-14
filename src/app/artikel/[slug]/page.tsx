import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ARTICLES, getArticle } from "@/data/artikel"

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `https://wedding.aksaraa.com/artikel/${article.slug}` },
    openGraph: { title: `${article.title} | Aksaraa`, description: article.description },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const url = `https://wedding.aksaraa.com/artikel/${article.slug}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { "@type": "Organization", name: "Aksaraa Wedding" },
    publisher: { "@type": "Organization", name: "Aksaraa Wedding" },
    mainEntityOfPage: url,
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://wedding.aksaraa.com/hero" },
      { "@type": "ListItem", position: 2, name: "Artikel", item: "https://wedding.aksaraa.com/artikel" },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  }
  const related = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3)

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <article className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <Link href="/artikel" className="hover:underline">Artikel</Link>
          {" • "}
          {article.category} • {article.readMinutes} mnt baca
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-4">
          {article.title}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{article.description}</p>
        <div
          className="artikel-body font-body-md text-[15px] md:text-base leading-[1.9] text-[#2C2A29] space-y-5 [&>h2]:font-headline-md [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:text-primary [&>h2]:pt-4 [&>p>a]:font-semibold [&>p>a]:text-[#B34E3F] [&>p>a]:underline [&>p>a]:underline-offset-2"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
        <div className="mt-10 rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 text-center">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-2">
            Siap membuat undangan digital Anda?
          </h2>
          <p className="text-sm text-on-surface-variant mb-5">
            Pilih template, isi data, bagikan link — jadi dalam 15 menit.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/templates"
              className="px-7 py-3 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors"
            >
              Lihat Template
            </Link>
            <Link
              href="/customize"
              className="px-7 py-3 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
            >
              Lihat Harga
            </Link>
          </div>
        </div>
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-4">Artikel terkait</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/artikel/${r.slug}`}
                  className="bg-white border border-[#E2D9CF] rounded-2xl p-5 hover:shadow-md transition-shadow"
                >
                  <p className="text-[10px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-1">
                    {r.category}
                  </p>
                  <p className="font-semibold text-[#2C2A29] text-sm leading-snug">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  )
}
