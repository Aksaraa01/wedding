import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPortfolioEntries } from "@/lib/portfolio"

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
    description: `Kisah dan galeri foto pernikahan ${names} — undangan digital Aksaraa${entry.venue ? ` di ${entry.venue}` : ""}.`,
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
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-3">
          <Link href="/portofolio" className="hover:underline">Portofolio</Link>
          {" • Kisah Nyata"}
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-[40px] leading-tight text-primary mb-3">
          Pernikahan {entry.groom} &amp; {entry.bride}
        </h1>
        <p className="font-body-md text-on-surface-variant mb-8">
          {[entry.venue, `Paket ${entry.packageLabel}`].filter(Boolean).join(" • ")}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <span className="rounded-full bg-[#B34E3F] text-white text-[11px] font-bold tracking-widest uppercase px-4 py-1.5">
            Paket {entry.packageLabel}
          </span>
          {entry.features.map((f) => (
            <span
              key={f}
              className="rounded-full border border-[#E2D9CF] bg-white px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase text-[#2C2A29]"
            >
              {f}
            </span>
          ))}
        </div>

        {entry.templatePreview && (
          <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 mb-10 flex flex-col sm:flex-row items-center gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.templatePreview}
              alt={`Template undangan ${entry.templateName || ""} dipakai ${names}`}
              loading="lazy"
              decoding="async"
              className="w-40 sm:w-48 shrink-0 aspect-[9/19] object-cover object-top rounded-xl border border-[#E2D9CF]"
            />
            <div className="text-center sm:text-left">
              <p className="text-[11px] uppercase tracking-widest text-[#B34E3F] font-semibold mb-1">
                Template yang dipakai
              </p>
              <p className="font-headline-md text-xl text-[#2C2A29]">
                {entry.templateName || "Desain premium Aksaraa"}
              </p>
              <p className="text-sm text-on-surface-variant mt-2">
                Suka tampilannya? Pakai desain yang sama untuk undangan Anda.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {entry.covers.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={i === 0 ? `Foto pernikahan ${names}` : `Momen pernikahan ${names} ${i + 1}`}
              loading={i === 0 ? undefined : "lazy"}
              decoding="async"
              className="w-full aspect-[4/3] object-cover rounded-2xl border border-[#E2D9CF]"
            />
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-[#E2D9CF] p-6 md:p-8 text-center">
          <h2 className="font-headline-md text-lg md:text-xl text-[#2C2A29] mb-2">
            Wujudkan undangan seperti ini
          </h2>
          <p className="text-sm text-on-surface-variant mb-5">
            Pilih template favorit dan buat undangan digital Anda dalam 15 menit.
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
      </article>
    </main>
  )
}
