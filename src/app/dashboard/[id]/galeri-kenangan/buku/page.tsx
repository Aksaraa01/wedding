"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { displayCategory } from "@/lib/gallery-client"
import { ASSETS } from "@/lib/assets"

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" }
const BODY: React.CSSProperties = { fontFamily: "'EB Garamond', Georgia, serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

const INK = "#4f1519"
const MAROON = "#6b2b2d"
const GOLD = "#b89569"
const PAPER = "#fdfbf7"
const CREAM = "#f4ece3"

type Photo = { url: string; caption: string | null; created_at: string; source: string | null }

type Entry = {
  key: string
  name: string
  category: string | null
  message: string | null
  photos: Photo[]
}

type Couple = {
  coupleName: string
  dateLabel: string
  timeLabel: string
  venue: string
  coverUrl: string
}

function initialsOf(name: string): string {
  const parts = String(name || "").split("&").map((s) => s.trim()).filter(Boolean)
  const take = (s: string) => (s.trim()[0] || "").toUpperCase()
  if (parts.length >= 2) return take(parts[0]) + take(parts[1])
  return (String(name || "").trim()[0] || "A").toUpperCase()
}

// Explicit-fit photo: measures its frame and sets pixel dimensions from the
// natural size, so fit never depends on object-fit (unreliable in some print
// engines). The object-fit class stays as progressive enhancement.
function FitPhoto({ src, alt, mode, className }: { src: string; alt: string; mode: "cover" | "contain"; className?: string }) {
  const apply = (img: HTMLImageElement | null) => {
    if (!img) return
    const wrap = img.parentElement
    if (!wrap || !img.naturalWidth || !img.naturalHeight) return
    const bw = wrap.clientWidth
    const bh = wrap.clientHeight
    if (!bw || !bh) return
    const s = mode === "cover"
      ? Math.max(bw / img.naturalWidth, bh / img.naturalHeight)
      : Math.min(bw / img.naturalWidth, bh / img.naturalHeight)
    img.style.width = `${Math.max(1, Math.round(img.naturalWidth * s))}px`
    img.style.height = `${Math.max(1, Math.round(img.naturalHeight * s))}px`
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={apply}
      src={src}
      alt={alt}
      onLoad={(e) => apply(e.currentTarget)}
      className={`${className || ""} ${mode === "cover" ? "object-cover" : "object-contain"}`}
      loading="lazy"
    />
  )
}

function Folio({ right }: { right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e6dcce] pb-3">
      <span className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MAROON }} />
        <span className="text-[11px] tracking-[0.22em] uppercase" style={{ ...SANS, color: "#735955" }}>Aksaraa Official Wedding Keepsake</span>
      </span>
      <span className="flex items-center gap-1.5 font-medium text-[11px] tracking-[0.22em] uppercase" style={{ ...SANS, color: MAROON }}>{right}</span>
    </div>
  )
}

function Emblem({ size, mono }: { size: number; mono: string }) {
  return (
    <div className="relative rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: size, height: size, backgroundColor: CREAM, border: "1px solid #e4d7cb" }}>
      <span className="font-semibold" style={{ ...SERIF, fontSize: Math.round(size * 0.32), color: INK }}>{mono}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Aksaraa Wedding Emblem" src={ASSETS.galeriEnvelope.aksaraaMonogram} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).remove() }} />
    </div>
  )
}

function Divider({ width = 192 }: { width?: number }) {
  return (
    <div className="flex items-center justify-center gap-3 opacity-75 mx-auto" style={{ width }}>
      <span className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, transparent, #b89569)" }} />
      <span style={{ ...BODY, color: MAROON, fontSize: 19, lineHeight: 1 }}>❦</span>
      <span className="h-[1px] flex-1" style={{ background: "linear-gradient(to left, transparent, #b89569)" }} />
    </div>
  )
}

function BottomBar({ couple, right }: { couple: string; right?: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] tracking-[0.22em] uppercase border-t border-[#eee5dc] pt-3" style={{ ...SANS, color: "#85706c" }}>
      <span>Album Cetak Edisi Terbatas — {couple}</span>
      {right && <span className="font-semibold" style={{ color: MAROON }}>{right}</span>}
    </div>
  )
}

function Art({ tl, br, tr }: { tl: string; br: string; tr: string }) {
  return (
    <>
      <div className="absolute pointer-events-none select-none" style={{ left: -28, top: -28, width: 224, opacity: 0.9, transform: "rotate(-8deg)", zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={tl} className="w-full h-auto object-contain" />
      </div>
      <div className="absolute pointer-events-none select-none" style={{ right: -32, bottom: -32, width: 208, opacity: 0.85, transform: "rotate(12deg)", zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={br} className="w-full h-auto object-contain" />
      </div>
      <div className="absolute pointer-events-none select-none" style={{ right: 8, top: 8, width: 144, opacity: 0.45, zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={tr} className="w-full h-auto object-contain" />
      </div>
    </>
  )
}

function CoverPage({ couple }: { couple: Couple }) {
  const [n1, n2] = couple.coupleName.split("&").map((s) => s.trim())
  return (
    <div className="kb-page relative overflow-hidden flex flex-col justify-between text-center" style={{ backgroundColor: PAPER, border: "1px solid #e8dfd5", padding: 56, minHeight: 1020 }}>
      <div className="absolute pointer-events-none border border-[#e4d7cb]/80 rounded-[2px]" style={{ inset: 14 }} />
      <div className="absolute pointer-events-none border border-[#b89569]/30 rounded-[1px]" style={{ inset: 22 }} />
      <Art tl={ASSETS.galeriEnvelope.botanicalTopLeft} br={ASSETS.galeriEnvelope.flowerBottomRight} tr={ASSETS.galeriEnvelope.previewFloralTopRight} />
      <div className="relative" style={{ zIndex: 10 }}>
        <Folio right={<span>Buku Kenangan Tamu</span>} />
      </div>
      <header className="relative flex flex-col items-center pt-5 pb-3" style={{ zIndex: 10 }}>
        <Emblem size={64} mono={initialsOf(couple.coupleName)} />
        <p className="text-[11px] tracking-[0.3em] uppercase font-semibold mt-2.5" style={{ ...SANS, color: MAROON }}>The Wedding of</p>
        <h1 className="mt-1 leading-tight" style={{ ...SERIF, fontSize: 44, color: INK }}>
          {n1 || couple.coupleName}{n1 && n2 && (<> <span className="italic font-normal" style={{ color: "#cea374" }}>&amp;</span> {n2}</>)}
        </h1>
        <div className="mt-3"><Divider /></div>
      </header>
      <section className="relative flex justify-center my-2" style={{ zIndex: 10 }}>
        <div className="relative bg-white p-3.5 w-full shadow-[0_12px_32px_rgba(79,21,25,0.14)] border border-[#ede3d8]" style={{ maxWidth: 512, borderRadius: 2 }}>
          <span className="absolute w-4 h-4 border-t-2 border-l-2 pointer-events-none" style={{ top: 8, left: 8, borderColor: GOLD }} />
          <span className="absolute w-4 h-4 border-t-2 border-r-2 pointer-events-none" style={{ top: 8, right: 8, borderColor: GOLD }} />
          <span className="absolute w-4 h-4 border-b-2 border-l-2 pointer-events-none" style={{ bottom: 8, left: 8, borderColor: GOLD }} />
          <span className="absolute w-4 h-4 border-b-2 border-r-2 pointer-events-none" style={{ bottom: 8, right: 8, borderColor: GOLD }} />
          <div className="relative overflow-hidden w-full bg-[#f4ece3] border border-[#e8ddcf] flex items-center justify-center" style={{ aspectRatio: "4 / 3" }}>
            {couple.coverUrl ? (
              <FitPhoto src={couple.coverUrl} alt={`Momen ${couple.coupleName}`} mode="contain" className="flex-shrink-0" />
            ) : (
              <div className="flex items-center justify-center h-full italic text-[17px]" style={{ ...BODY, color: MAROON }}>Foto menyusul</div>
            )}
          </div>
          {couple.coverUrl && (
            <div className="absolute text-white text-[11px] tracking-wider uppercase px-2.5 py-1" style={{ right: 24, bottom: 24, background: "rgba(0,0,0,0.55)", borderRadius: 2 }}>
              Aksaraa Moments
            </div>
          )}
        </div>
      </section>
      <section className="relative mx-auto w-full my-1 text-center" style={{ zIndex: 10, maxWidth: 560 }}>
        <div className="flex items-center justify-center mb-1" style={{ color: GOLD, fontSize: 11, letterSpacing: "0.3em" }}>✦ ✦ ✦</div>
        {couple.dateLabel && <p className="font-medium" style={{ ...SERIF, fontSize: 20, color: INK }}>{couple.dateLabel}</p>}
        {couple.timeLabel && <p className="text-[12px] tracking-[0.22em] uppercase font-semibold mt-0.5" style={{ ...SANS, color: MAROON }}>{couple.timeLabel}</p>}
        {couple.venue && (
          <div className="flex items-center justify-center gap-2 mx-auto mt-2 pt-2 border-t border-[#e8ddcf]" style={{ maxWidth: 340, color: "#735955" }}>
            <span style={{ color: GOLD, fontSize: 9 }}>◆</span>
            <span style={{ ...BODY, fontSize: 17 }}>{couple.venue}</span>
          </div>
        )}
      </section>
      <div className="relative" style={{ zIndex: 10 }}>
        <BottomBar couple={couple.coupleName || "Mempelai"} />
      </div>
    </div>
  )
}

function EntryChunk({ entry, pageNo, pageTotal, coupleName }: { entry: Entry; pageNo: number; pageTotal: number; coupleName: string }) {
  return (
    <div className="kb-page relative overflow-hidden flex flex-col text-center" style={{ backgroundColor: PAPER, border: "1px solid #e8dfd5", padding: "40px 40px", minHeight: 1020 }}>
      <div className="absolute pointer-events-none border border-[#e4d7cb]/80 rounded-[2px]" style={{ inset: 12 }} />
      <div className="absolute pointer-events-none border border-[#b89569]/30 rounded-[1px]" style={{ inset: 22 }} />
      <Art tl={ASSETS.galeriEnvelope.flowerTopLeft} br={ASSETS.galeriEnvelope.botanicalBottomRight} tr={ASSETS.galeriEnvelope.previewFloralTopRight} />
      <div className="relative" style={{ zIndex: 10 }}>
        <Folio right={<span>Halaman {String(pageNo).padStart(2, "0")} <span style={{ color: GOLD }}>•</span> Buku Kenangan Tamu</span>} />
      </div>
      <header className="relative flex flex-col items-center pt-[18px] pb-2.5" style={{ zIndex: 10 }}>
        <Emblem size={56} mono={initialsOf(coupleName)} />
        <div className="mt-1.5 mb-3"><Divider width={176} /></div>
        <div className="w-full flex items-center justify-between gap-3 text-left p-2.5 px-4" style={{ maxWidth: 600, backgroundColor: CREAM, border: "1px solid #ede3d8", borderRadius: 2 }}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-semibold" style={{ backgroundColor: MAROON, ...SERIF, fontSize: 15 }}>
              {(entry.name.trim()[0] || "T").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase font-semibold" style={{ ...SANS, color: "#85706c", letterSpacing: "0.2em" }}>Koleksi Kenangan Oleh</p>
              <p className="font-semibold leading-snug truncate" style={{ ...SERIF, fontSize: 16, color: INK }}>{entry.name}</p>
              {entry.message && (
                <p className="italic leading-snug line-clamp-3" style={{ ...BODY, fontSize: 12, color: "#665452" }}>&ldquo;{entry.message}&rdquo;</p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 border-l pl-3 ml-3" style={{ borderColor: "#e4d7cb" }}>
            <span className="block text-[9px] font-bold uppercase" style={{ ...SANS, color: GOLD }}>{displayCategory(entry.category) || "Tamu"}</span>
          </div>
        </div>
      </header>
      <section className="relative my-1" style={{ zIndex: 10 }}>
        <div className="grid gap-3.5 mx-auto items-start text-center" style={{ gridTemplateColumns: `repeat(${entry.photos.length <= 5 ? Math.max(entry.photos.length, 1) : 5}, minmax(0,1fr))` }}>
          {entry.photos.map((photo, i) => (
            <div key={i} className="bg-white p-2 border border-[#e4d7cb]" style={{ borderRadius: 2 }}>
              <div className="w-full overflow-hidden bg-[#f2efe9] border border-[#ede3d8] flex items-center justify-center relative" style={{ aspectRatio: "4 / 3", borderRadius: 1 }}>
                <FitPhoto src={photo.url} alt={`Kenangan ${entry.name}`} mode="contain" className="flex-shrink-0" />
                {photo.source === "selfie" && (
                  <span className="absolute top-1 left-1 px-1.5 py-px rounded-full text-[8px] uppercase tracking-wider font-bold text-white" style={{ backgroundColor: "#4f1519" }}>Check-in</span>
                )}
              </div>
              {photo.caption?.trim() && (
                <p className="mt-1.5 font-medium leading-snug line-clamp-3" style={{ ...SERIF, fontSize: 12, color: INK }}>{photo.caption.trim()}</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <div className="relative mt-auto pt-2" style={{ zIndex: 10 }}>
        <BottomBar couple={coupleName} right={`Halaman ${String(pageNo).padStart(2, "0")} dari ${String(pageTotal).padStart(2, "0")}`} />
      </div>
    </div>
  )
}

// Printable keepsake album: cover + one page per 10 guest photos. Opened in
// a tab from the dashboard ("Buku Kenangan"); the couple prints to PDF via
// the browser dialog — zero server cost, fully async, no frozen tab.
export default function BukuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [fontsReady, setFontsReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let dead = false
    try {
      const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts
      if (fonts?.ready) fonts.ready.then(() => { if (!dead) setFontsReady(true) }).catch(() => { if (!dead) setFontsReady(true) })
      else setFontsReady(true)
    } catch {
      setFontsReady(true)
    }
    ;(async () => {
      try {
        const all: { image_url: string; created_at: string; guest_id: string | null; device_id: string | null; uploader_name: string | null; category: string | null; caption: string | null; source: string | null; guests: { name: string; category: string; rsvp_message?: string | null } | null }[] = []
        let pageNo = 1
        for (;;) {
          const res = await fetch(`/api/guest-photos?wedding_profile_id=${id}&page=${pageNo}`)
          if (!res.ok) throw new Error("Gagal memuat foto")
          const data = await res.json()
          all.push(...(data.photos || []))
          if (!data.has_more) break
          pageNo += 1
        }
        const usable = all.filter((p) => p.image_url)
        const buckets = new Map<string, Entry & { photos: Photo[] }>()
        for (const p of usable) {
          const key = p.guest_id ? `g:${p.guest_id}` : `d:${p.device_id || ""}`
          const name = p.uploader_name || p.guests?.name || "Tamu"
          if (!buckets.has(key)) {
            buckets.set(key, { key, name, category: p.category || p.guests?.category || null, message: null, photos: [] })
          }
          const bk = buckets.get(key)!
          const rsvpMsg = (p.guests?.rsvp_message || "").trim()
          if (!bk.message && rsvpMsg) bk.message = rsvpMsg
          bk.photos.push({ url: p.image_url, caption: p.caption || null, created_at: p.created_at, source: p.source || null })
        }
        const list = [...buckets.values()]
          .map((b) => ({ ...b, photos: [...b.photos].sort((a, c) => a.created_at.localeCompare(c.created_at)) }))
          .sort((a, b) => (a.photos[0]?.created_at || "").localeCompare(b.photos[0]?.created_at || ""))
        if (dead) return
        if (list.length === 0) {
          setError("Belum ada foto untuk dibukukan")
          return
        }

        let setup: { gallery_couple_name?: string; date_label?: string; start_label?: string; end_label?: string; gallery_photo_url?: string } | null = null
        let dashProfile: { bride_name?: string; groom_name?: string; sessions?: { venue?: string }[] | null } | null = null
        try {
          const [sres, dres] = await Promise.all([
            fetch(`/api/dashboard/${id}/gallery-setup`),
            fetch(`/api/dashboard/${id}`),
          ])
          if (sres.ok) setup = (await sres.json()).setup || null
          if (dres.ok) dashProfile = (await dres.json()).profile || null
        } catch {}
        if (dead) return
        // Cover photo follows the same fallback as the invitation and the
        // dashboard box: stored upload, then editor cover, then the default
        // couple image (local public asset — never an empty frame).
        const prefillPhoto =
          !(setup as { gallery_photo_url?: string } | null)?.gallery_photo_url &&
          (setup as { prefill?: { photo_url?: string | null } } | null)?.prefill?.photo_url?.startsWith("http")
            ? (setup as { prefill?: { photo_url?: string } }).prefill!.photo_url as string
            : ""
        const coverUrl =
          (setup as { gallery_photo_url?: string } | null)?.gallery_photo_url ||
          prefillPhoto ||
          ASSETS.defaults.couple
        const coupleName =
          setup?.gallery_couple_name ||
          (dashProfile ? `${dashProfile.bride_name || ""} & ${dashProfile.groom_name || ""}`.replace(/^ & | & $/g, "").trim() : "") ||
          "Mempelai"
        const venue = dashProfile?.sessions?.[0]?.venue || ""
        setCouple({
          coupleName,
          dateLabel: (setup as { date_label?: string } | null)?.date_label || "",
          timeLabel:
            (setup as { start_label?: string; end_label?: string } | null)?.start_label && (setup as { start_label?: string; end_label?: string } | null)?.end_label
              ? `${(setup as { start_label?: string }).start_label!.replace(":", ".")} – ${(setup as { end_label?: string }).end_label!.replace(":", ".")} WIB`
              : (setup as { start_label?: string } | null)?.start_label
                ? `${(setup as { start_label?: string }).start_label!.replace(":", ".")} WIB`
                : "",
          venue,
          coverUrl,
        })
        setEntries(list)
      } catch (err) {
        if (!dead) setError(err instanceof Error ? err.message : "Gagal memuat data.")
      } finally {
        if (!dead) setLoading(false)
      }
    })()
    return () => { dead = true }
  }, [id])

  // One album page per guest per 10 photos (5-col grid × 2 rows).
  const chunks: { entry: Entry; photos: Photo[] }[] = []
  for (const entry of entries) {
    for (let i = 0; i < entry.photos.length; i += 10) {
      chunks.push({ entry, photos: entry.photos.slice(i, i + 10) })
    }
  }
  const pageTotal = chunks.length + 1

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2efe9] py-8" style={SANS}>
      <link
        href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .kb-page { box-shadow: none !important; margin: 0 auto !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4 portrait; margin: 10mm; }
      `}</style>

      <div className="no-print max-w-[820px] mx-auto px-6 mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-[#6b2b2d]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <div className="flex items-center gap-2">
          {couple && (
            <span className="text-[12px] text-[#444841]">
              {couple.coupleName} • {chunks.reduce((s, c) => s + c.photos.length, 0)} foto • {pageTotal} halaman
            </span>
          )}
          <button
            onClick={() => window.print()}
            disabled={loading || !fontsReady || chunks.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-[12px] font-semibold uppercase tracking-widest disabled:opacity-50"
            style={{ backgroundColor: "#4f1519" }}
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            {!fontsReady ? "Menyiapkan..." : "Cetak / Simpan PDF"}
          </button>
        </div>
      </div>

      {error || chunks.length === 0 ? (
        <p className="text-center text-sm text-[#444841] px-6">{error || "Belum ada foto untuk dibukukan"}</p>
      ) : (
        couple && (
          <div className="mx-auto flex flex-col gap-10 items-center px-6 pb-10" style={{ maxWidth: 820 }}>
            <div className="w-full" style={{ breakInside: "avoid", breakAfter: "page" }}>
              <CoverPage couple={couple} />
            </div>
            {chunks.map((c, i) => (
              <div key={`${c.entry.key}-${i}`} className="w-full" style={{ breakInside: "avoid", breakAfter: i === chunks.length - 1 ? "auto" : "page" }}>
                <EntryChunk entry={{ ...c.entry, photos: c.photos }} pageNo={i + 2} pageTotal={pageTotal} coupleName={couple.coupleName} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
