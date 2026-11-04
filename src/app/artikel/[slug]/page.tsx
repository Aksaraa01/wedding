import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ARTICLES, getArticle } from "@/data/artikel"
import Navigation from "@/components/Navigation"
import WetonChecker from "@/components/WetonChecker"
import ReadingProgress from "@/components/ReadingProgress"
import { categoryStyle } from "@/lib/articleCategory"
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

  const shareText = encodeURIComponent(`${article.title} | ${article.description}`)
  const shareUrl = encodeURIComponent(url)

  return (
    <main className="bg-[#FAF7F2] min-h-screen pb-10">
      <Navigation />
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero */}
      <header className="pt-[88px] md:pt-32 pb-5 md:pb-8 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant md:mb-4 md:text-[11px]">
            <Link href="/hero" className="hover:text-[#B34E3F]">Beranda</Link>
            <span className="text-on-surface-variant/40">/</span>
            <Link href="/artikel" className="hover:text-[#B34E3F]">Artikel</Link>
            <span className="text-on-surface-variant/40">/</span>
            <span className="truncate text-[#B34E3F]">{article.category}</span>
          </nav>
          <h1 className="font-headline-lg text-[24px] leading-[1.22] text-primary mb-2.5 md:text-[44px] md:leading-[1.15] md:mb-4">
            {article.title}
          </h1>
          <p className="text-[13px] leading-relaxed text-on-surface-variant mb-4 md:font-body-lg md:text-body-lg md:mb-6">
            {article.description}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D9CF] pb-4 md:gap-4 md:pb-6">
            <div className="flex items-center gap-2.5 min-w-0 md:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B34E3F] font-headline-md text-[15px] text-white md:h-10 md:w-10 md:text-lg">
                A
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#2C2A29] md:text-sm">Tim Aksaraa</p>
                <p className="whitespace-nowrap text-[10.5px] text-on-surface-variant md:text-[12px]">
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
                className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-white border border-[#E2D9CF] flex items-center justify-center text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener"
                aria-label="Bagikan ke Facebook"
                className="flex h-8 w-8 md:h-9 md:w-9 rounded-full bg-white border border-[#E2D9CF] items-center justify-center text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">public</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener"
                aria-label="Bagikan ke X"
                className="flex h-8 w-8 md:h-9 md:w-9 rounded-full bg-white border border-[#E2D9CF] items-center justify-center text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
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
            <>
              <details className="group mb-5 rounded-2xl border border-[#E2D9CF] bg-white md:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F]">
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    Daftar Isi · {toc.length} bagian
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <ol className="space-y-2 border-t border-[#E2D9CF]/70 px-4 py-3">
                  {toc.map((t, i) => (
                    <li key={t.id} className="flex gap-2">
                      <span className="mt-px text-[10px] font-semibold text-[#B34E3F]/70">{String(i + 1).padStart(2, "0")}</span>
                      <a href={`#${t.id}`} className="text-[12.5px] leading-snug text-[#2C2A29] active:text-[#B34E3F]">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              <nav aria-label="Daftar isi" className="mb-8 hidden rounded-2xl border border-[#E2D9CF] bg-white p-5 md:block md:p-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#B34E3F]">Daftar Isi</p>
                <ol className="space-y-2">
                  {toc.map((t, i) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="text-sm text-[#2C2A29] transition-colors hover:text-[#B34E3F]">
                        <span className="mr-2 text-on-surface-variant">{String(i + 1).padStart(2, "0")}</span>
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </>
          )}

          <div
            className="artikel-body font-body-md text-[14px] leading-[1.85] text-[#2C2A29] space-y-4 md:text-base md:leading-[1.9] md:space-y-5 [&>h2]:font-headline-md [&>h2]:text-[17px] [&>h2]:md:text-2xl [&>h2]:text-primary [&>h2]:pt-3 [&>h2]:md:pt-4 [&>h2]:scroll-mt-24 [&>p:first-of-type]:first-letter:font-headline-lg [&>p:first-of-type]:first-letter:text-4xl [&>p:first-of-type]:first-letter:md:text-6xl [&>p:first-of-type]:first-letter:text-[#B34E3F] [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-2 [&>p:first-of-type]:first-letter:leading-[0.9] [&>p>a]:font-semibold [&>p>a]:text-[#B34E3F] [&>p>a]:underline [&>p>a]:underline-offset-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-4 [&>blockquote]:border-[#B34E3F] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
          {article.checker === "weton" && <WetonChecker />}

          {/* Prev / next */}
          {(prev || next) && (
            <nav className="mt-10 grid gap-2.5 sm:mt-12 sm:grid-cols-2 sm:gap-4" aria-label="Navigasi artikel">
              {prev ? (
                <Link href={`/artikel/${prev.slug}`} className="group flex items-start gap-2.5 rounded-xl border border-[#E2D9CF] bg-white px-4 py-3 transition-shadow active:scale-[0.995] sm:block sm:rounded-2xl sm:p-5 sm:hover:shadow-md">
                  <span className="material-symbols-outlined mt-0.5 text-[14px] text-on-surface-variant sm:hidden" aria-hidden>arrow_back</span>
                  <span className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-[0.16em] text-on-surface-variant sm:hidden">Sebelumnya</span>
                    <span className="hidden text-[10px] uppercase tracking-widest text-on-surface-variant sm:mb-1 sm:block">← Sebelumnya</span>
                    <span className="mt-0.5 block text-[12.5px] font-semibold leading-snug text-[#2C2A29] group-hover:text-[#B34E3F] sm:text-sm">{prev.title}</span>
                  </span>
                </Link>
              ) : <span className="hidden sm:block" />}
              {next ? (
                <Link href={`/artikel/${next.slug}`} className="group flex items-start gap-2.5 rounded-xl border border-[#E2D9CF] bg-white px-4 py-3 text-right transition-shadow active:scale-[0.995] sm:block sm:rounded-2xl sm:p-5 sm:hover:shadow-md">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9px] uppercase tracking-[0.16em] text-on-surface-variant sm:hidden">Berikutnya</span>
                    <span className="hidden text-[10px] uppercase tracking-widest text-on-surface-variant sm:mb-1 sm:block">Berikutnya →</span>
                    <span className="mt-0.5 block text-[12.5px] font-semibold leading-snug text-[#2C2A29] group-hover:text-[#B34E3F] sm:text-sm">{next.title}</span>
                  </span>
                  <span className="material-symbols-outlined mt-0.5 text-[14px] text-on-surface-variant sm:hidden" aria-hidden>arrow_forward</span>
                </Link>
              ) : <span className="hidden sm:block" />}
            </nav>
          )}

          <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#E2D9CF] bg-white p-5 text-center md:mt-10 md:p-8">
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-[0.07]"
              style={{ background: "radial-gradient(ellipse at 50% 0%, #B34E3F 0, transparent 70%)" }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-headline-md mb-1.5 text-[17px] text-[#2C2A29] md:text-xl">
                Siap membuat undangan digital Anda?
              </h2>
              <p className="mb-4 text-[12px] text-on-surface-variant md:text-sm">
                Pilih template, isi data, bagikan link. Jadi dalam 15 menit.
              </p>
              <div className="flex justify-center gap-2 md:gap-3">
                <Link
                  href="/templates"
                  className="rounded-full border border-[#B34E3F] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F] transition-colors hover:bg-[#B34E3F] hover:text-white md:px-7 md:py-3 md:text-xs"
                >
                  Lihat Template
                </Link>
                <Link
                  href="/customize"
                  className="rounded-full bg-[#B34E3F] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#9A3F32] md:px-7 md:py-3 md:text-xs"
                >
                  Lihat Harga
                </Link>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-9 md:mt-10">
              <div className="mb-3 flex items-baseline justify-between md:mb-4">
                <h2 className="font-headline-md text-[17px] text-[#2C2A29] md:text-xl">Artikel terkait</h2>
                <Link href="/artikel" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B34E3F] md:text-[11px]">
                  Semua
                </Link>
              </div>
              <div className="-mx-margin-mobile flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-margin-mobile pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
                {related.map((r) => {
                  const style = categoryStyle(r.category)
                  return (
                    <Link
                      key={r.slug}
                      href={`/artikel/${r.slug}`}
                      className="group flex w-[76%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#E2D9CF] bg-white active:scale-[0.99] sm:w-auto"
                    >
                      <span className="flex items-center justify-between px-4 py-2.5" style={{ background: `linear-gradient(140deg, ${style.from}, ${style.to})` }} aria-hidden>
                        <span className="material-symbols-outlined text-[18px] text-white/90">{style.icon}</span>
                        <span className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-white/80">{r.readMinutes} mnt</span>
                      </span>
                      <span className="flex flex-1 flex-col p-3.5">
                        <span className="mb-1 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F]">{r.category}</span>
                        <span className="flex-1 text-[12.5px] font-semibold leading-snug text-[#2C2A29] group-hover:text-[#B34E3F]">{r.title}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </article>
      </div>
    </main>
  )
}
