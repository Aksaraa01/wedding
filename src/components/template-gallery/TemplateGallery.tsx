"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { matchesCategory } from "@/lib/templateCategory"
import {
  PACKAGE_FILTERS,
  galleryRows,
  matchesPackage,
  matchesPhoto,
  matchesSearch,
  newestTemplates,
  popularTemplates,
  type GalleryTemplate,
  type PackageFilter,
  type PhotoFilter,
} from "@/lib/templateGallery"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"
import TemplateTile from "./TemplateTile"

// The catalogue seen under /templates, /premium-web-invitation and the couple's
// dashboard picker: Top 10 Populer, Top 10 Terbaru, then one shelf per category.
// Chips filter in place and collapse the shelves into a single result grid.

export interface TemplateGalleryProps {
  templates: GalleryTemplate[]
  initialCategory?: string
  showFilterBar?: boolean
  showSearch?: boolean
  showShelves?: boolean
  /** Public surfaces only: adds the "Paket" segmented filter. */
  showPackageFilter?: boolean
  /** Interactive picker (dashboard): selection + package gate are rendered. */
  /** Public surfaces: open the preview in the shared modal. */
  previewInModal?: boolean
  selectedId?: string | null
  isLocked?: (template: GalleryTemplate) => boolean
  onPreview?: (template: GalleryTemplate) => void
  onSelect?: (template: GalleryTemplate) => void
  /**
   * Base path for the "Pilih" CTA on each tile and in the preview modal.
   * Defaults to /register (wedding); Ceriavite passes /daftar. A string rather
   * than a callback so server components can pass it across the boundary.
   */
  selectHrefBase?: string
  saving?: boolean
  emptyMessage?: string
}

const PHOTO_FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "dengan", label: "Dengan Foto" },
  { id: "tanpa", label: "Tanpa Foto" },
]

function SegmentedFilter<T extends string>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  label: string
  ariaLabel: string
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="shrink-0 font-label-md text-[10px] uppercase tracking-widest text-[#8A827B]">{label}</span>
      <div
        role="group"
        aria-label={ariaLabel}
        className="inline-flex rounded-full border border-[#E2D9CF] bg-[#F2EDE5] p-0.5"
      >
        {options.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            aria-pressed={value === f.id}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 font-label-md text-[9px] uppercase tracking-[0.08em] transition-colors sm:px-3.5 sm:text-[10px] sm:tracking-widest ${
              value === f.id
                ? "bg-white text-[#2C2A29] shadow-[0_1px_3px_rgba(44,42,41,0.12)]"
                : "text-[#8A827B] hover:text-[#2C2A29]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TemplateGallery({
  templates,
  initialCategory,
  previewInModal = false,
  showFilterBar = true,
  showSearch = false,
  showShelves = true,
  showPackageFilter = false,
  selectedId = null,
  isLocked,
  onPreview,
  onSelect,
  selectHrefBase = "/register",
  saving = false,
  emptyMessage,
}: TemplateGalleryProps) {
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || "semua")
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("semua")
  const [packageFilter, setPackageFilter] = useState<PackageFilter>("semua")
  const [searchQuery, setSearchQuery] = useState("")
  const [modalTemplate, setModalTemplate] = useState<GalleryTemplate | null>(null)

  const rows = useMemo(() => galleryRows(templates), [templates])
  const popular = useMemo(() => popularTemplates(templates), [templates])
  const newest = useMemo(() => newestTemplates(templates), [templates])

  const chips = useMemo(
    () => [{ id: "semua", label: "Semua" }, ...rows.filter((r) => r.filterId).map((r) => ({ id: r.filterId as string, label: r.label }))],
    [rows],
  )

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          matchesCategory(t.category, categoryFilter) &&
          matchesPhoto(t, photoFilter) &&
          matchesPackage(t, packageFilter) &&
          matchesSearch(t, searchQuery),
      ),
    [templates, categoryFilter, photoFilter, packageFilter, searchQuery],
  )

  const filterActive =
    categoryFilter !== "semua" || photoFilter !== "semua" || packageFilter !== "semua" || searchQuery.trim() !== ""

  const resetFilters = () => {
    setCategoryFilter(initialCategory || "semua")
    setPhotoFilter("semua")
    setPackageFilter("semua")
    setSearchQuery("")
  }

  const openPreview = onPreview ?? (previewInModal ? (t: GalleryTemplate) => setModalTemplate(t) : undefined)

  const selectLabel = (t: GalleryTemplate) =>
    saving ? "Menyimpan..." : selectedId === t.id ? "Terpilih" : "Pilih"

  const renderTile = (t: GalleryTemplate, opts: { rank?: number; eager?: boolean; fluid?: boolean; tour?: boolean } = {}) => (
    <TemplateTile
      key={`${opts.rank ?? "t"}-${t.id}`}
      template={t}
      rank={opts.rank ?? null}
      fluid={opts.fluid}
      eager={opts.eager}
      href={openPreview ? null : `/premium-web-invitation?template=${encodeURIComponent(t.code)}`}
      selectHref={
        onSelect ? null : `${selectHrefBase}?template=${encodeURIComponent(t.code)}`
      }
      onOpen={openPreview ? () => openPreview(t) : undefined}
      onSelect={onSelect ? () => onSelect(t) : undefined}
      selectLabel={selectLabel(t)}
      selectDisabled={saving}
      active={selectedId === t.id}
      locked={isLocked ? isLocked(t) : false}
      showActions={!!onSelect}
      tourOpen={opts.tour ? "template-preview" : undefined}
      tourSelect={opts.tour ? "pilih-koleksi" : undefined}
    />
  )

  const shelf = (
    title: string,
    items: GalleryTemplate[],
    opts: { ranked?: boolean; href?: string; filterId?: string } = {},
  ) => {
    if (items.length === 0) return null
    return (
      <section key={title} className="mb-12 lg:mb-16">
        <div className="mb-4 flex items-baseline justify-between gap-4 lg:mb-6">
          <h2 className="font-headline-lg text-[19px] leading-tight text-[#2C2A29] lg:text-[24px]">{title}</h2>
          {onSelect && opts.filterId ? (
            <button
              type="button"
              onClick={() => setCategoryFilter(opts.filterId as string)}
              className="shrink-0 font-label-md text-[10px] uppercase tracking-widest text-[#B34E3F] hover:underline lg:text-[11px]"
            >
              Lihat semua
            </button>
          ) : opts.href ? (
            <Link
              href={opts.href}
              className="shrink-0 font-label-md text-[10px] uppercase tracking-widest text-[#B34E3F] hover:underline lg:text-[11px]"
            >
              Lihat semua
            </Link>
          ) : null}
        </div>
        <div className="no-scrollbar -mx-margin-mobile flex snap-x snap-mandatory scroll-pl-margin-mobile gap-4 overflow-x-auto px-margin-mobile pb-3 md:-mx-2 md:scroll-pl-2 md:px-2 lg:gap-7">
          {items.map((t, i) =>
            renderTile(t, {
              rank: opts.ranked ? i + 1 : undefined,
              eager: opts.ranked && i < 2,
              tour: opts.ranked && i === 0,
            }),
          )}
        </div>
      </section>
    )
  }

  return (
    <div>
      {(showFilterBar || showSearch) && (
        <div className="mb-8 lg:mb-10">
          {showSearch && (
            <div className="relative mb-4 w-full max-w-xl">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari desain, kategori…"
                aria-label="Cari template"
                className="w-full rounded-full border border-[#E2D9CF] bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-on-surface-variant/60 focus:border-[#2C2A29] focus:outline-none focus:ring-1 focus:ring-[#2C2A29] [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-brand-charcoal"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          )}

          {showFilterBar && (
            <>
              <div className="no-scrollbar -mx-margin-mobile flex snap-x scroll-pl-margin-mobile gap-2 overflow-x-auto px-margin-mobile pb-3 md:mx-0 md:flex-wrap md:scroll-pl-0 md:px-0 md:overflow-visible">
                {chips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryFilter(c.id)}
                    aria-pressed={categoryFilter === c.id}
                    className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 font-label-md text-[10px] uppercase tracking-widest transition-colors lg:px-5 lg:text-[11px] ${
                      categoryFilter === c.id
                        ? "border-[#8D4D39] bg-[#8D4D39] text-white"
                        : "border-[#E2D9CF] bg-white text-[#2C2A29] hover:border-[#1A1817]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <SegmentedFilter
                label="Foto"
                ariaLabel="Filter foto"
                options={PHOTO_FILTERS}
                value={photoFilter}
                onChange={setPhotoFilter}
              />
              {showPackageFilter && (
                <SegmentedFilter
                  label="Paket"
                  ariaLabel="Filter paket"
                  options={PACKAGE_FILTERS}
                  value={packageFilter}
                  onChange={setPackageFilter}
                />
              )}
            </>
          )}
        </div>
      )}

      {filterActive || !showShelves ? (
        filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="mb-4 font-body-md text-sm text-on-surface-variant">
              {emptyMessage ||
                (packageFilter !== "semua"
                  ? `Belum ada template untuk paket ${PACKAGE_FILTERS.find((f) => f.id === packageFilter)?.label}.`
                  : photoFilter === "tanpa"
                    ? "Belum ada template Tanpa Foto yang cocok."
                    : searchQuery.trim()
                      ? `Tidak ada template untuk “${searchQuery.trim()}”.`
                      : "Tidak ada template yang cocok dengan filter.")}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-[#B34E3F] px-5 py-2 font-label-md text-[11px] uppercase tracking-widest text-[#B34E3F] transition-colors hover:bg-[#B34E3F] hover:text-white"
            >
              Tampilkan Semua
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-10">
            {filtered.map((t) => renderTile(t, { fluid: true }))}
          </div>
        )
      ) : (
        <>
          {shelf("Top 10 Populer", popular, { ranked: true })}
          {shelf("Top 10 Terbaru", newest)}
          {rows.map((r) => shelf(r.label, r.templates, { href: r.href, filterId: r.filterId }))}
        </>
      )}

      {modalTemplate && (
        <TemplatePreviewModal
          name={modalTemplate.name}
          demoUrl={modalTemplate.demo_url || ""}
          selectHref={`${selectHrefBase}?template=${encodeURIComponent(modalTemplate.code)}`}
          onClose={() => setModalTemplate(null)}
        />
      )}
    </div>
  )
}
