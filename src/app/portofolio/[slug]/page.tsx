import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPortfolioEntries } from "@/lib/portfolio"
import Navigation from "@/components/Navigation"
import { formatIdDate } from "@/lib/formatDate"

export async function generateStaticParams() {
  const entries = await getPortfolioEntries()
  return entries.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const entries = await getPortfolioEntries()
  const entry = entries.find((e) => e.slug.toLowerCase() === slug.toLowerCase())
  if (!entry) return {}
  const names = `${entry.groom} & ${entry.bride}`
  return {
    title: `Pernikahan ${names}`,
    description: `Kisah dan galeri foto pernikahan ${names} di undangan digital Aksaraa.`,
    alternates: { canonical: `https://wedding.aksaraa.com/portofolio/${entry.slug}` },
    openGraph: {
      title: `Pernikahan ${names} | Aksaraa`,
      description: `Foto dan kisah bahagia ${names} dengan undangan digital Aksaraa.`,
      images: entry.covers[0] ? [{ url: entry.covers[0] }] : undefined,
    },
  }
}

export const revalidate = 3600

export default async function PortofolioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entries = await getPortfolioEntries()
  const entry = entries.find((e) => e.slug.toLowerCase() === slug.toLowerCase())
  if (!entry) notFound()

  const names = `${entry.groom} & ${entry.bride}`
  const url = `https://wedding.aksaraa.com/portofolio/${entry.slug}`
  const hero = entry.covers[0] || entry.illustration || ""
  const gallery = entry.covers.slice(1)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Pernikahan ${names}`,
    description: `Kisah dan galeri foto pernikahan ${names}.`,
    datePublished: entry.date,
    author: { "@type": "Organization", name: "Aksaraa Wedding" },
    mainEntityOfPage: url,
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] pb-16 pt-[88px] md:pt-32">
      <Navigation />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-4xl px-margin-mobile md:px-margin-desktop">
        {/* Hero cover */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2D9CF] bg-[#2C2A29] md:rounded-3xl">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt={`Foto pernikahan ${names}`}
              decoding="async"
              className="aspect-[4/5] w-full object-cover object-center sm:aspect-[4/3] sm:object-[center_35%]"
            />
          ) : (
            <div className="aspect-[4/5] w-full sm:aspect-[16/10]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1817]/95 via-[#1A1817]/25 to-[#1A1817]/10" />

          <nav aria-label="Breadcrumb" className="absolute inset-x-0 top-0 flex items-center gap-1.5 p-4 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/75 md:p-5 md:text-[10px]">
            <Link href="/portofolio" className="transition-colors hover:text-white">Portofolio</Link>
            <span className="text-white/40">/</span>
            <span className="text-white/60">Kisah nyata</span>
          </nav>

          <div className="absolute inset-x-0 bottom-0 p-4 md:p-7">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#1A1817] shadow-sm backdrop-blur-md md:text-[9.5px]">
              <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
              Paket {entry.packageLabel}
            </span>
            <h1 className="mt-2 font-headline-lg text-[26px] leading-[1.15] text-white md:mt-3 md:text-[44px]">
              {names}
            </h1>
            <p className="mt-1.5 text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/75 md:flex md:flex-wrap md:items-center md:gap-x-2 md:text-[11px]">
              {entry.date && <span className="block md:inline">{formatIdDate(entry.date)}</span>}
              {entry.date && entry.venue && <span className="hidden h-1 w-1 rounded-full bg-white/40 md:inline-block" />}
              {entry.venue && <span className="block md:inline">{entry.venue}</span>}
            </p>
          </div>
        </div>

        {/* Feature chips */}
        {entry.features.length > 0 && (
          <div className="-mx-margin-mobile mt-3 flex gap-1.5 overflow-x-auto px-margin-mobile pb-1 no-scrollbar md:mx-0 md:flex-wrap md:px-0 md:mt-5">
            {entry.features.map((f) => (
              <span
                key={f}
                className="shrink-0 rounded-full border border-[#E2D9CF] bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#2C2A29] md:px-4 md:text-[10.5px]"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Template used */}
        {entry.templatePreview && (
          <div className="mt-5 flex items-center gap-3.5 rounded-2xl border border-[#E2D9CF] bg-white p-3.5 md:mt-7 md:gap-6 md:p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.templatePreview}
              alt={`Template undangan ${entry.templateName || ""} dipakai ${names}`}
              loading="lazy"
              decoding="async"
              className="aspect-[9/19] w-[76px] shrink-0 rounded-lg border border-[#E2D9CF] object-cover object-top md:w-36 md:rounded-xl"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#B34E3F] md:text-[11px]">
                Template yang dipakai
              </p>
              <p className="mt-1 font-headline-md text-[15px] leading-tight text-[#2C2A29] md:text-xl">
                {entry.templateName || "Desain premium Aksaraa"}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-on-surface-variant md:mt-2 md:text-sm">
                Suka tampilannya? Pakai desain yang sama untuk undangan Anda.
              </p>
              <Link
                href="/templates"
                className="mt-2.5 inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#B34E3F] md:mt-3 md:text-[11px]"
              >
                Lihat template
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="mt-7 md:mt-10">
            <div className="mb-3 flex items-baseline justify-between md:mb-4">
              <h2 className="font-headline-md text-[17px] text-[#2C2A29] md:text-xl">Momen mereka</h2>
              <span className="text-[9.5px] uppercase tracking-[0.14em] text-on-surface-variant/70">
                {gallery.length} foto
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              {gallery.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Momen pernikahan ${names} ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-xl border border-[#E2D9CF] object-cover md:rounded-2xl"
                />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="relative mt-7 overflow-hidden rounded-2xl border border-[#E2D9CF] bg-white p-5 text-center md:mt-10 md:p-8">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-[0.07]"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #B34E3F 0, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="font-headline-md text-[17px] text-[#2C2A29] md:text-xl">
              Wujudkan undangan seperti ini
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-on-surface-variant md:text-sm">
              Pilih template favorit dan buat undangan digital Anda dalam 15 menit.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
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
      </article>
    </main>
  )
}
