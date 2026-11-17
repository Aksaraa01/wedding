"use client"

import { useMemo, useRef, useState } from "react"
import { matchesCategory } from "@/lib/templateCategory"
import {
  galleryRows,
  newestTemplates,
  popularTemplates,
} from "@/lib/templateGallery"
import type { DesignTemplate } from "@/lib/designCatalogue"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import DesignCard from "./DesignCard"
import DesignSoonModal from "./DesignSoonModal"

type Tab = "wedding" | "kids"

interface DesignCatalogueProps {
  wedding: DesignTemplate[]
  kids: DesignTemplate[]
}

type Chip = { id: string; label: string; soon?: boolean }

const KIDS_CHIPS: Chip[] = [
  { id: "semua", label: "Semua" },
  { id: "khitanan", label: "Khitanan" },
  { id: "aqiqah", label: "Aqiqah", soon: true },
  { id: "birthday", label: "Ulang Tahun", soon: true },
]

const KIDS_SOON_LABEL: Record<string, string> = {
  aqiqah: "Aqiqah",
  birthday: "Ulang Tahun",
}

function Shelf({
  title,
  templates,
  ranked = false,
  onOpen,
  onSeeAll,
}: {
  title: string
  templates: DesignTemplate[]
  ranked?: boolean
  onOpen: (t: DesignTemplate) => void
  onSeeAll?: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (templates.length === 0) return null

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  return (
    <section className="group/shelf relative py-3 md:py-4">
      <div className="mb-2.5 flex items-baseline gap-3 px-4 sm:px-6 md:mb-3.5 md:px-10 lg:px-16">
        <h2 className="text-[15px] font-extrabold leading-tight tracking-[-0.02em] text-[#1A1817] md:text-[19px]">{title}</h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#B34E3F] transition-opacity hover:opacity-80"
          >
            Lihat semua
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 scroll-pl-4 sm:px-6 sm:scroll-pl-6 md:gap-4 md:px-10 md:scroll-pl-10 lg:px-16 lg:scroll-pl-16"
        >
          {templates.map((t, i) => (
            <div
              key={t.id}
              className={`shrink-0 snap-start ${
                ranked
                  ? "w-[64%] sm:w-[42%] md:w-[30%] lg:w-[23%] xl:w-[19%]"
                  : "w-[46%] sm:w-[31%] md:w-[23%] lg:w-[18%] xl:w-[15.5%]"
              }`}
            >
              <DesignCard template={t} rank={ranked ? i + 1 : null} onOpen={() => onOpen(t)} />
            </div>
          ))}
        </div>

        {templates.length > 2 && (
          <>
            <button
              type="button"
              aria-label={`Geser ${title} ke kiri`}
              onClick={() => scroll(-1)}
              className="absolute left-0 top-0 bottom-0 hidden w-12 items-center justify-center bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/85 to-transparent text-[#1A1817] opacity-0 transition-opacity duration-200 hover:opacity-100 group-hover/shelf:opacity-100 lg:flex"
            >
              <span className="material-symbols-outlined text-[30px]">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label={`Geser ${title} ke kanan`}
              onClick={() => scroll(1)}
              className="absolute right-0 top-0 bottom-0 hidden w-12 items-center justify-center bg-gradient-to-l from-[#FAF7F2] via-[#FAF7F2]/85 to-transparent text-[#1A1817] opacity-0 transition-opacity duration-200 hover:opacity-100 group-hover/shelf:opacity-100 lg:flex"
            >
              <span className="material-symbols-outlined text-[30px]">chevron_right</span>
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export default function DesignCatalogue({ wedding, kids }: DesignCatalogueProps) {
  const [tab, setTab] = useState<Tab>("wedding")
  const [category, setCategory] = useState("semua")
  const [search, setSearch] = useState("")
  const [preview, setPreview] = useState<DesignTemplate | null>(null)
  const [soon, setSoon] = useState<string | null>(null)

  const rows = useMemo(() => galleryRows(wedding), [wedding])
  const popular = useMemo(() => popularTemplates(wedding, 10) as DesignTemplate[], [wedding])
  const newest = useMemo(() => newestTemplates(wedding, 10) as DesignTemplate[], [wedding])

  const chips = useMemo<Chip[]>(() => {
    const seen = new Set<string>()
    const categories = rows
      .filter((r) => r.filterId)
      .map((r) => ({ id: r.filterId as string, label: r.label }))
      .filter((chip) => {
        const key = chip.id.trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    return [{ id: "semua", label: "Semua" }, ...categories, { id: "tanpa-foto", label: "Tanpa Foto" }]
  }, [rows])

  const query = search.trim().toLowerCase()

  const weddingFiltered = useMemo(
    () =>
      wedding.filter((t) => {
        const byCategory =
          category === "semua"
            ? true
            : category === "tanpa-foto"
              ? t.no_photo === true
              : matchesCategory(t.category, category)
        if (!byCategory) return false
        if (!query) return true
        return [t.name, t.category, t.description, t.code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      }),
    [wedding, category, query],
  )

  const kidsFiltered = useMemo(() => {
    if (!query) return kids
    return kids.filter((t) =>
      [t.name, t.category, t.description, t.code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
  }, [kids, query])

  const filterActive = tab === "wedding" && (category !== "semua" || query !== "")

  const reset = () => {
    setCategory("semua")
    setSearch("")
  }

  const scrollToCustom = () => {
    document.getElementById("custom")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setCategory("semua")
    setSearch("")
  }

  const pickChip = (chip: Chip) => {
    if (chip.soon) {
      setSoon(KIDS_SOON_LABEL[chip.id] || chip.label)
      return
    }
    setCategory(chip.id)
  }

  const openPreview = (t: DesignTemplate) => setPreview(t)

  const renderGrid = (items: DesignTemplate[]) => (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4 md:gap-y-9 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((t) => (
        <DesignCard key={t.id} template={t} onOpen={() => openPreview(t)} />
      ))}
    </div>
  )

  return (
    <div id="katalog">
      <div className="sticky top-14 z-40 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2] to-[#FAF7F2]/0 pb-2 pt-2 md:pt-3">
        <div className="mx-auto max-w-[1760px] px-4 sm:px-6 md:px-10 lg:px-16">
          <div className="rounded-[20px] border border-[#EFE9DD] bg-white/92 p-2.5 shadow-[0_18px_40px_-30px_rgba(120,30,50,0.4)] backdrop-blur-xl md:rounded-3xl md:p-3">
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-4">
              <h1 className="shrink-0 pl-1 font-[family-name:var(--font-playfair)] text-[19px] font-semibold leading-none tracking-tight text-[#1A1817] md:text-[26px]">
                Desain{" "}
                <span className="font-[family-name:var(--font-cormorant)] italic text-[#8D4D39]">undangan</span>
              </h1>

              <div
                role="group"
                aria-label="Jenis acara"
                className="flex w-full shrink-0 rounded-full bg-[#F1EBE3] p-1 sm:w-auto"
              >
                {[
                  { id: "wedding" as Tab, label: "Pernikahan" },
                  { id: "kids" as Tab, label: "Acara lain" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => switchTab(opt.id)}
                    aria-pressed={tab === opt.id}
                    className={`h-9 flex-1 rounded-full px-4 text-[12px] font-bold transition-all duration-300 sm:flex-none md:h-10 md:px-5 md:text-[13px] ${
                      tab === opt.id
                        ? "bg-white text-[#1A1817] shadow-[0_0_0_1px_#EFE9DD,0_6px_14px_-8px_rgba(120,30,50,0.4)]"
                        : "text-[#6E6A63] hover:text-[#1A1817]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex h-10 w-full min-w-0 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-[#E5DCD0] transition-shadow focus-within:ring-2 focus-within:ring-[#8D4D39] md:ml-auto md:h-11 md:w-[17rem] md:px-4">
                <span className="material-symbols-outlined text-[18px] text-[#A39B8E] md:text-[19px]">search</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari: jawa, floral, minimalis"
                  aria-label="Cari desain"
                  className="min-w-0 flex-1 appearance-none border-0 bg-transparent text-[12.5px] text-[#1A1817] outline-none placeholder:text-[#A39B8E] [&::-webkit-search-cancel-button]:hidden"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Hapus pencarian"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#6E6A63] transition-colors hover:bg-[#F5EFE6]"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            <div
              role="group"
              aria-label={tab === "wedding" ? "Saring gaya desain" : "Saring jenis acara"}
              className="no-scrollbar mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 md:mt-2.5"
            >
              {(tab === "wedding" ? chips : KIDS_CHIPS).map((chip) => {
                const active = category === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => pickChip(chip)}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors md:px-3.5 md:text-[11.5px] ${
                      chip.soon
                        ? "border-[#EFE4D2] bg-[#FCF8F1] text-[#A39B8E]"
                        : active
                          ? "border-[#1A1817] bg-[#1A1817] text-white"
                          : "border-[#E5DCD0] bg-white text-[#3B3833] hover:border-[#1A1817]"
                    }`}
                  >
                    {chip.label}
                    {chip.soon && (
                      <span className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#B08A4A]">Segera</span>
                    )}
                  </button>
                )
              })}

              {tab === "wedding" && (
                <>
                  <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-[#E5DCD0]" />
                  <button
                    type="button"
                    onClick={scrollToCustom}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-[#E5DCD0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#3B3833] transition-colors hover:border-[#1A1817] md:px-3.5 md:text-[11.5px]"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#B34E3F]">auto_awesome</span>
                    Desain custom
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1760px] pb-10">
        {tab === "wedding" ? (
          filterActive ? (
            <section className="px-4 pt-3 sm:px-6 md:px-10 lg:px-16">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3 pt-2">
                <div>
                  <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-semibold text-[#1A1817] md:text-[30px]">
                    Hasil
                  </h2>
                  <p className="mt-1 text-[12px] text-[#8B857C]">
                    <b className="text-[#1A1817]">{weddingFiltered.length}</b> desain ditemukan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded-full border border-[#E5DCD0] bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1A1817] transition-colors hover:border-[#1A1817]"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                  Kembali ke katalog
                </button>
              </div>

              {weddingFiltered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <h3 className="font-[family-name:var(--font-playfair)] text-[24px] font-semibold text-[#1A1817]">
                    Belum ada yang cocok
                  </h3>
                  <p className="max-w-[46ch] text-[13px] leading-relaxed text-[#6E6A63]">
                    Coba kata kunci lain, atau konsultasikan desain custom dengan tim kami.
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-full bg-[#1A1817] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white"
                    >
                      Tampilkan semua
                    </button>
                    <button
                      type="button"
                      onClick={scrollToCustom}
                      className="rounded-full border border-[#E5DCD0] bg-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1A1817]"
                    >
                      Desain custom
                    </button>
                  </div>
                </div>
              ) : (
                renderGrid(weddingFiltered)
              )}
            </section>
          ) : (
            <>
              <Shelf title="Top 10 Populer" templates={popular} ranked onOpen={openPreview} />
              <Shelf title="Baru rilis" templates={newest} onOpen={openPreview} />              {rows.map((row) => (
                <Shelf
                  key={row.id}
                  title={row.label}
                  templates={row.templates as DesignTemplate[]}
                  onOpen={openPreview}
                  onSeeAll={row.filterId ? () => setCategory(row.filterId as string) : undefined}
                />
              ))}
            </>
          )
        ) : (
          <section className="px-4 pt-3 sm:px-6 md:px-10 lg:px-16">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 pt-2">
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-semibold text-[#1A1817] md:text-[30px]">
                  Ceriavite
                </h2>
                <p className="mt-1 text-[12px] text-[#8B857C]">
                  <b className="text-[#1A1817]">{kidsFiltered.length}</b> desain untuk khitanan, aqiqah, dan ulang tahun
                </p>
              </div>
              <a
                href="https://ceriavite.aksaraa.com"
                className="inline-flex items-center gap-1 rounded-full border border-[#E5DCD0] bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1A1817] transition-colors hover:border-[#1A1817]"
              >
                Kunjungi Ceriavite
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>

            {kidsFiltered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[13px] text-[#6E6A63]">Belum ada desain yang cocok dengan pencarian.</p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-full bg-[#1A1817] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white"
                >
                  Tampilkan semua
                </button>
              </div>
            ) : (
              renderGrid(kidsFiltered)
            )}

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#EFE4D2] bg-[#FCF8F1] p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#B08A4A]">schedule</span>
                <div>
                  <p className="text-[13px] font-bold text-[#1A1817]">Aqiqah &amp; ulang tahun segera hadir</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#6E6A63]">
                    Untuk saat ini pendaftaran baru tersedia untuk acara khitanan. Desain aqiqah dan ulang tahun sedang kami siapkan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoon("Aqiqah & Ulang Tahun")}
                className="shrink-0 rounded-full bg-[#1A1817] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#8D4D39]"
              >
                Beri tahu saya
              </button>
            </div>
          </section>
        )}
      </div>

      {preview && (
        <TemplatePreviewModal
          name={preview.name}
          demoUrl={preview.preview_url}
          selectHref={preview.select_href}
          layout="phone"
          onClose={() => setPreview(null)}
        />
      )}

      {soon && <DesignSoonModal event={soon} onClose={() => setSoon(null)} />}
    </div>
  )
}
