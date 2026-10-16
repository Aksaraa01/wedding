import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ARTICLES, getArticle } from "@/data/artikel"
import Navigation from "@/components/Navigation"
import WetonChecker from "@/components/WetonChecker"
import ReadingProgress from "@/components/ReadingProgress"
import { formatIdDate } from "@/lib/formatDate"

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}
  const url = `https://wedding.aksaraa.com/artikel/${article.slug}`
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${article.title} | Aksaraa`,
      description: article.description,
      type: "article",
      url,
      publishedTime: article.date,
      authors: ["Aksaraa Wedding"],
      section: article.category,
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | Aksaraa`,
      description: article.description,
    },
  }
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .slice(0, 60)
}

// Inject anchor ids into <h2>s and collect a table of contents.
function withTocAnchors(body: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = []
  const seen = new Set<string>()
  const html = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_m, attrs, inner) => {
    let id = slugifyHeading(inner) || "bagian"
    let n = 2
    while (seen.has(id)) id = `${slugifyHeading(inner)}-${n++}`
    seen.add(id)
    toc.push({ id, text: inner.replace(/<[^>]*>/g, "") })
    if (/id=/.test(attrs)) return `<h2${attrs}>${inner}</h2>`
    return `<h2${attrs} id="${id}">${inner}</h2>`
  })
  return { html, toc }
}

function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const url = `https://wedding.aksaraa.com/artikel/${article.slug}`
  const { html: bodyHtml, toc } = withTocAnchors(article.body)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    inLanguage: "id-ID",
    wordCount: wordCount(article.body),
    author: { "@type": "Organization", name: "Aksaraa Wedding", url: "https://wedding.aksaraa.com" },
    publisher: {
      "@type": "Organization",
      name: "Aksaraa Wedding",
      logo: { "@type": "ImageObject", url: "https://wedding.aksaraa.com/icon.svg" },
    },
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

  const idx = ARTICLES.findIndex((a) => a.slug === article.slug)
  const prev = idx > 0 ? ARTICLES[idx - 1] : null
  const next = idx >= 0 && idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null
  const related = [
    ...ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category),
    ...ARTICLES.filter((a) => a.slug !== article.slug && a.category !== article.category),
  ].slice(0, 3)

  const shareText = encodeURIComponent(`${article.title} — ${article.description}`)
  const shareUrl = encodeURIComponent(url)

  return (
    <main className="bg-[#FAF7F2] min-h-screen pb-10">
      <Navigation />
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero */}
      <header className="pt-24 md:pt-32 pb-8 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold mb-4">
            <Link href="/hero" className="hover:text-[#B34E3F]">Beranda</Link>
            <span className="mx-2">/</span>
            <Link href="/artikel" className="hover:text-[#B34E3F]">Artikel</Link>
            <span className="mx-2">/</span>
            <span className="text-[#B34E3F]">{article.category}</span>
          </nav>
          <h1 className="font-headline-lg text-[30px] md:text-[44px] leading-[1.15] text-primary mb-4">
            {article.title}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-6">
            {article.description}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E2D9CF]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-full bg-[#B34E3F] text-white flex items-center justify-center font-headline-md text-lg shrink-0">
                A
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C2A29]">Tim Aksaraa</p>
                <p className="text-[12px] text-on-surface-variant whitespace-nowrap">
                  {formatIdDate(article.date)} • {article.readMinutes} mnt baca
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-[11px] uppercase tracking-widest text-on-surface-variant mr-1">Bagikan</span>
              <a
                href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                target="_blank"
                rel="noopener"
                aria-label="Bagikan ke WhatsApp"
                className="w-9 h-9 rounded-full bg-white border border-[#E2D9CF] flex items-center justify-center text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener"
                aria-label="Bagikan ke Facebook"
                className="w-9 h-9 rounded-full bg-white border border-[#E2D9CF] hidden sm:flex items-center justify-center text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">public</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener"
                aria-label="Bagikan ke X"
                className="w-9 h-9 rounded-full bg-white border border-[#E2D9CF] hidden sm:flex items-center justify-center text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="px-margin-mobile md:px-margin-desktop">
        <article className="max-w-3xl mx-auto">
          {toc.length > 1 && (
            <nav aria-label="Daftar isi" className="bg-white border border-[#E2D9CF] rounded-2xl p-5 md:p-6 mb-8">
              <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
                Daftar Isi
              </p>
              <ol className="space-y-2">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-sm text-[#2C2A29] hover:text-[#B34E3F] transition-colors">
                      <span className="text-on-surface-variant mr-2">{String(i + 1).padStart(2, "0")}</span>
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div
            className="artikel-body font-body-md text-[15px] md:text-base leading-[1.9] text-[#2C2A29] space-y-5 [&>h2]:font-headline-md [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:text-primary [&>h2]:pt-4 [&>h2]:scroll-mt-24 [&>p:first-of-type]:first-letter:font-headline-lg [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:md:text-6xl [&>p:first-of-type]:first-letter:text-[#B34E3F] [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:leading-[0.9] [&>p>a]:font-semibold [&>p>a]:text-[#B34E3F] [&>p>a]:underline [&>p>a]:underline-offset-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>blockquote]:border-l-4 [&>blockquote]:border-[#B34E3F] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
          {article.checker === "weton" && <WetonChecker />}

          {/* Prev / next */}
          {(prev || next) && (
            <nav className="grid sm:grid-cols-2 gap-4 mt-12" aria-label="Navigasi artikel">
              {prev ? (
                <Link href={`/artikel/${prev.slug}`} className="group bg-white border border-[#E2D9CF] rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">← Sebelumnya</p>
                  <p className="font-semibold text-[#2C2A29] text-sm leading-snug group-hover:text-[#B34E3F]">{prev.title}</p>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/artikel/${next.slug}`} className="group bg-white border border-[#E2D9CF] rounded-2xl p-5 hover:shadow-md transition-shadow text-right">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Berikutnya →</p>
                  <p className="font-semibold text-[#2C2A29] text-sm leading-snug group-hover:text-[#B34E3F]">{next.title}</p>
                </Link>
              ) : <span />}
            </nav>
          )}

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
                    className="group bg-white border border-[#E2D9CF] rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-1">
                      {r.category}
                    </p>
                    <p className="font-semibold text-[#2C2A29] text-sm leading-snug group-hover:text-[#B34E3F] flex-1">{r.title}</p>
                    <p className="text-[11px] text-on-surface-variant mt-2">{r.readMinutes} mnt baca</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </main>
  )
}
