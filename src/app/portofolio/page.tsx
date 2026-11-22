import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"
import Link from "next/link"
import { getPortfolioEntries, portfolioIndexEntries } from "@/lib/portfolio"
import Navigation from "@/components/Navigation"
import { formatIdDate } from "@/lib/formatDate"

export const metadata: Metadata = {
  title: "Portofolio Pernikahan: Kisah Nyata Pasangan Aksaraa",
  description:
    "Lihat pernikahan nyata yang memakai undangan digital Aksaraa: galeri foto, jadwal acara, dan kisah bahagia para pasangan.",
  alternates: { canonical: `${siteOrigin()}/portofolio` },
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
    <main className="min-h-screen bg-[#FAF7F2] pb-16 pt-[88px] md:pt-32">
      <Navigation />

      {/* Compact app-style header */}
      <section className="mx-auto mb-4 max-w-container-max px-margin-mobile md:mb-10 md:px-margin-desktop">
        <div className="md:mx-auto md:max-w-3xl md:text-center">
          <div className="mb-2 flex items-center gap-1.5 md:justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B34E3F]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B34E3F]">
              Portofolio
            </p>
            {entries.length > 0 && (
              <span className="text-[10px] text-on-surface-variant/60">{entries.length} kisah nyata</span>
            )}
          </div>
          <h1 className="font-headline-lg text-[23px] leading-[1.2] text-primary md:text-headline-lg md:leading-normal">
            Pernikahan nyata pasangan Aksaraa
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-on-surface-variant md:mx-auto md:text-base">
            Jelajahi kisah, foto, dan detail acara para pasangan yang merayakan hari bahagianya
            bersama Aksaraa.
          </p>
        </div>
      </section>

      {entries.length === 0 ? (
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="mx-auto max-w-md rounded-2xl border border-[#E2D9CF] bg-white px-6 py-10 text-center">
            <span className="material-symbols-outlined text-[30px] text-[#B34E3F]">photo_library</span>
            <p className="mt-3 font-headline-md text-[17px] text-[#2C2A29]">Portofolio segera hadir</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-on-surface-variant">
              Kami sedang menyiapkan galeri pasangan. Sementara itu, jelajahi koleksi template kami.
            </p>
            <Link
              href="/templates"
              className="mt-4 inline-flex rounded-full bg-[#B34E3F] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
            >
              Lihat Template
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto mb-12 max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {entries.map((e) => {
              const photo = e.covers[0] || e.illustration || ""
              const names = `${e.groom} & ${e.bride}`
              return (
                <Link
                  key={e.slug}
                  href={`/portofolio/${encodeURIComponent(e.slug)}`}
                  className="group relative block overflow-hidden rounded-2xl border border-[#E2D9CF] bg-[#2C2A29] shadow-sm transition-shadow active:scale-[0.995] hover:shadow-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Foto pernikahan ${names}`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:aspect-[5/6]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1817]/95 via-[#1A1817]/35 to-transparent" />

                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-[#1A1817] shadow-sm backdrop-blur-md md:left-4 md:top-4 md:text-[9.5px]">
                    <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                    {e.packageLabel}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
                    <div className="min-w-0">
                      <h2 className="font-headline-md text-[18px] leading-tight text-white line-clamp-2 md:text-[21px]">
                        {names}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-white/75 md:text-[10.5px]">
                        {e.date && <span className="shrink-0">{formatIdDate(e.date)}</span>}
                        {e.date && e.venue && <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-white/40" />}
                        {e.venue && <span className="truncate">{e.venue}</span>}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#1A1817] transition-transform group-hover:translate-x-0.5 md:h-9 md:w-9">
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-margin-mobile text-center md:px-margin-desktop">
        <div className="rounded-2xl border border-[#E2D9CF] bg-white px-5 py-7 md:px-8 md:py-8">
          <h2 className="font-headline-md text-[17px] text-[#2C2A29] md:text-2xl">
            Jadikan hari bahagia Anda berikutnya
          </h2>
          <p className="mt-1 text-[12px] text-on-surface-variant md:text-sm">
            Pilih template, isi data, bagikan link. Jadi dalam 15 menit.
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
      </section>
    </main>
  )
}
