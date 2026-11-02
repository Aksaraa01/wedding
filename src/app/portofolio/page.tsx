import type { Metadata } from "next"
import Link from "next/link"
import { getPortfolioEntries, portfolioIndexEntries } from "@/lib/portfolio"
import Navigation from "@/components/Navigation"

export const metadata: Metadata = {
  title: "Portofolio Pernikahan: Kisah Nyata Pasangan Aksaraa",
  description:
    "Lihat pernikahan nyata yang memakai undangan digital Aksaraa: galeri foto, jadwal acara, dan kisah bahagia para pasangan.",
  alternates: { canonical: "https://wedding.aksaraa.com/portofolio" },
  openGraph: {
    title: "Portofolio Pernikahan Pasangan Aksaraa",
    description:
      "Undangan digital nyata untuk hari bahagia nyata, jelajahi kisah dan galeri para pasangan.",
  },
}

export const revalidate = 600

export default async function PortofolioIndexPage() {
  const entries = portfolioIndexEntries(await getPortfolioEntries())

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-12">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Portofolio Pernikahan Pasangan Aksaraa
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Undangan digital nyata untuk hari bahagia nyata, jelajahi kisah, foto, dan detail acara
          para pasangan yang merayakan bersama Aksaraa.
        </p>
      </section>

      {entries.length === 0 ? (
        <p className="text-center text-on-surface-variant">Portofolio segera hadir.</p>
      ) : (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {entries.map((e) => (
              <Link
                key={e.slug}
                href={`/portofolio/${encodeURIComponent(e.slug)}`}
                className="group bg-white border border-[#E2D9CF] rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.covers[0] || e.illustration || ""}
                  alt={`Foto pernikahan ${e.groom} dan ${e.bride}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-5">
                  <h2 className="font-headline-md text-lg text-[#2C2A29] group-hover:text-[#B34E3F] leading-snug">
                    {e.groom} &amp; {e.bride}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Paket {e.packageLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto text-center mb-10">
        <h2 className="font-headline-md text-xl md:text-2xl text-[#2C2A29] mb-3">
          Jadikan hari bahagia Anda berikutnya
        </h2>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Link
            href="/templates"
            className="px-8 py-3.5 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors"
          >
            Lihat Template
          </Link>
          <Link
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Lihat Harga
          </Link>
        </div>
      </section>
    </main>
  )
}
