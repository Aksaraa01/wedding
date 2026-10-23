"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import { PageFlip } from "page-flip"
import { useVisiblePoll } from "@/lib/useVisiblePoll"
import { displayCategory } from "@/lib/gallery-client"
import { resolveCoupleName } from "@/lib/coupleName"
import { ASSETS } from "@/lib/assets"

// App self-hosted faces (fonts.css) — never fetch Google Fonts at runtime
// (Turbopack rejects the second identical Google Fonts query at build).
const playfair = { className: "font-[family-name:var(--font-playfair)]" }
const inter = { className: "font-[family-name:var(--font-inter)]" }
const cormorant = { className: "font-[family-name:var(--font-cormorant)]" }

const INK = "#4f1519"
const MAROON = "#6b2b2d"
const GOLD = "#b89569"
const PAPER = "#fdfbf7"
const CREAM = "#f4ece3"
const FAINT = "#735955"
const GRAY = "#85706c"

type Guest = {
  id: string
  name: string
  table_number: string | null
  category: string | null
  checkin_timestamp: string | null
  is_checked_in: boolean
  added_manually?: boolean
  is_vip?: boolean
}

type GuestPhoto = { url: string; source: string | null; created_at: string | null; caption?: string | null }

type Entry = Guest & { wish?: string; photos: { url: string; caption?: string | null; source?: string | null }[] }

type Profile = {
  slug: string
  bride_name: string
  groom_name: string
  bride_full_name?: string | null
  groom_full_name?: string | null
  estimated_wedding_date: string | null
  sessions?: { venue?: string; date?: string }[] | null
  cover_photos?: string[] | null
  couple_illustration_url?: string | null
}

function formatLongDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })
}


function initialsOf(groom: string, bride: string): string {
  const g = (groom.trim()[0] || "").toUpperCase()
  const b = (bride.trim()[0] || "").toUpperCase()
  return `${g}${b}` || "A"
}

function Folio({ right }: { right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e6dcce] pb-2 shrink-0">
      <span className="flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: MAROON }} />
        <span className={`${inter.className} text-[8px] tracking-[0.2em] uppercase`} style={{ color: FAINT }}>Aksaraa Official Wedding Keepsake</span>
      </span>
      <span className={`${inter.className} text-[8px] tracking-[0.14em] uppercase font-medium`} style={{ color: MAROON }}>{right}</span>
    </div>
  )
}

function Emblem({ size, mono }: { size: number; mono: string }) {
  return (
    <div className="relative rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ width: size, height: size, backgroundColor: CREAM, border: "1px solid #e4d7cb" }}>
      <span className={`${playfair.className} font-semibold`} style={{ fontSize: Math.round(size * 0.32), color: INK }}>{mono}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Aksaraa Wedding Emblem"
        src={ASSETS.galeriEnvelope.aksaraaMonogram}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).remove() }}
      />
    </div>
  )
}

function Divider({ width = 120 }: { width?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 opacity-75 mx-auto" style={{ width }}>
      <span className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, transparent, #b89569)" }} />
      <span className={`${cormorant.className} leading-none`} style={{ color: MAROON, fontSize: 13 }}>❦</span>
      <span className="h-[1px] flex-1" style={{ background: "linear-gradient(to left, transparent, #b89569)" }} />
    </div>
  )
}

function BottomBar({ couple, right }: { couple: string; right?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[#eee5dc] pt-1.5 shrink-0">
      <span className={`${inter.className} text-[7px] tracking-[0.18em] uppercase truncate`} style={{ color: GRAY }}>Album Cetak Edisi Terbatas — {couple}</span>
      {right && <span className={`${inter.className} text-[7px] tracking-[0.14em] uppercase font-semibold shrink-0 ml-2`} style={{ color: MAROON }}>{right}</span>}
    </div>
  )
}

function BrassFrame({ children, ratio }: { children: React.ReactNode; ratio: string }) {
  return (
    <div className="relative bg-white p-1.5 border border-[#ede3d8] w-full" style={{ borderRadius: 2 }}>
      <span className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l pointer-events-none" style={{ borderColor: GOLD }} />
      <span className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r pointer-events-none" style={{ borderColor: GOLD }} />
      <span className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l pointer-events-none" style={{ borderColor: GOLD }} />
      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r pointer-events-none" style={{ borderColor: GOLD }} />
      <div className={`relative overflow-hidden w-full bg-[#f2efe9] border border-[#ede3d8] ${ratio}`}>
        {children}
      </div>
    </div>
  )
}

export function BookCover({ profile, mono, venue }: { profile: Profile | null; mono: string; venue: string }) {
  const coverPhoto =
    (Array.isArray(profile?.cover_photos) && profile.cover_photos.find(Boolean)) ||
    profile?.couple_illustration_url ||
    ""
  const coupleName = resolveCoupleName(profile || {}) || "Mempelai"
  const coverTitleSize = coupleName.length > 28 ? 24 : 30
  return (
    <div className="h-full w-full flex flex-col px-5 py-4 relative" style={{ backgroundColor: PAPER }}>
      <div className="absolute inset-2 border border-[#e4d7cb]/80 pointer-events-none" style={{ borderRadius: 2 }} />
      <div className="absolute pointer-events-none opacity-70" style={{ left: -18, top: -18, width: 110 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={ASSETS.galeriEnvelope.flowerTopLeft} className="w-full h-auto object-contain" />
      </div>
      <div className="relative z-10 flex flex-col items-center pt-1">
        <Emblem size={52} mono={mono} />
        <p className={`${inter.className} text-[8px] tracking-[0.28em] uppercase font-semibold mt-2`} style={{ color: MAROON }}>The Wedding of</p>
        <h1 className={`${playfair.className} leading-tight mt-0.5`} style={{ fontSize: coverTitleSize, color: INK }}>{coupleName}</h1>
        <div className="mt-1.5"><Divider width={130} /></div>
      </div>
      <div className="relative z-10 my-2">
        {coverPhoto ? (
          <BrassFrame ratio="aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPhoto} alt="Foto pasangan" className="w-full h-full object-contain bg-[#f2efe9]" loading="lazy" />
          </BrassFrame>
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center border border-dashed border-[#D8CEB8]">
            <span className={`${cormorant.className} italic`} style={{ color: MAROON }}>Foto menyusul</span>
          </div>
        )}
      </div>
      <div className="relative z-10 text-center">
        <p className={`${playfair.className} font-medium`} style={{ fontSize: 15, color: INK }}>{formatLongDate(profile?.estimated_wedding_date || null)}</p>
        {venue && <p className={`${cormorant.className} italic text-[13px]`} style={{ color: MAROON }}>{venue}</p>}
      </div>
      <div className="relative z-10 mt-auto pt-2">
        <BottomBar couple={coupleName} />
      </div>
    </div>
  )
}

export default function LiveBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const bookRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<InstanceType<typeof PageFlip> | null>(null)
  const pageRef = useRef(0)
  const entriesKey = entries.map((e) => e.id).join(",")

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, guestsRes, wishRes, photoRes] = await Promise.all([
        fetch(`/api/dashboard/${id}`),
        fetch(`/api/dashboard/${id}/qr-guestbook`),
        fetch(`/api/wishes?wedding_profile_id=${id}`),
        fetch(`/api/guest-photos?wedding_profile_id=${id}`),
      ])
      if (dashRes.ok) {
        const d = await dashRes.json()
        if (d.profile) setProfile(d.profile)
      }
      let guests: Guest[] = []
      if (guestsRes.ok) {
        const g = await guestsRes.json()
        guests = ((g.guests || []) as Guest[]).filter((x) => x.is_checked_in)
      }
      const wishByGuest = new Map<string, string>()
      if (wishRes.ok) {
        const w = await wishRes.json()
        for (const item of w.wishes || []) {
          if (item.guest_id && item.message && !wishByGuest.has(item.guest_id)) {
            wishByGuest.set(item.guest_id, item.message)
          }
        }
      }
      const photoByGuest = new Map<string, GuestPhoto[]>()
      if (photoRes.ok) {
        const p = await photoRes.json()
        for (const item of p.photos || []) {
          if (item.guest_id && item.image_url) {
            const list = photoByGuest.get(item.guest_id) || []
            list.push({ url: item.image_url, source: item.source || null, created_at: item.created_at || null, caption: item.caption || null })
            photoByGuest.set(item.guest_id, list)
          }
        }
        // Selfie check-in first, then gallery uploads newest-first.
        for (const [gid, list] of photoByGuest) {
          list.sort((a, b) => {
            const as = a.source === "selfie" ? 0 : 1
            const bs = b.source === "selfie" ? 0 : 1
            if (as !== bs) return as - bs
            return (b.created_at || "").localeCompare(a.created_at || "")
          })
          photoByGuest.set(gid, list.slice(0, 4))
        }
      }
      // Guests with photos first, then newest check-in first.
      const withPhoto = (g: Guest) => (photoByGuest.get(g.id) || []).length > 0
      guests.sort((a, b) => {
        const pa = withPhoto(a) ? 0 : 1
        const pb = withPhoto(b) ? 0 : 1
        if (pa !== pb) return pa - pb
        const ta = a.checkin_timestamp ? new Date(a.checkin_timestamp).getTime() : 0
        const tb = b.checkin_timestamp ? new Date(b.checkin_timestamp).getTime() : 0
        return tb - ta
      })
      setEntries(
        guests.map((g) => ({
          ...g,
          wish: wishByGuest.get(g.id),
          photos: (photoByGuest.get(g.id) || []).map((x) => ({ url: x.url, caption: x.caption || null, source: x.source || null })),
        }))
      )
    } catch {}
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  useVisiblePoll(fetchAll, 15000, !loading)

  // Viewport bucket: remount the flip book when orientation/size meaningfully
  // changes (resize, entering/exiting fullscreen). Debounced to avoid thrash.
  function sizeBucket() {
    if (typeof window === "undefined") return "l-0-0"
    const w = window.innerWidth
    const h = window.innerHeight
    return `${w < 768 ? "p" : "l"}-${Math.round(w / 100)}-${Math.round(h / 100)}`
  }
  const [bucket, setBucket] = useState(sizeBucket)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const update = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => setBucket(sizeBucket()), 350)
    }
    window.addEventListener("resize", update)
    document.addEventListener("fullscreenchange", update)
    update()
    return () => {
      if (t) clearTimeout(t)
      window.removeEventListener("resize", update)
      document.removeEventListener("fullscreenchange", update)
    }
  }, [])
  const buildKey = `${bucket}|${entriesKey}`

  // Flip lifecycle. NOTE: PageFlip.destroy() removes its own container block
  // from the DOM, so the flip root must be a fresh React-remounted node on
  // every rebuild (keyed container below) — never re-init on a node a
  // previous instance owned, or the book renders blank.
  useEffect(() => {
    const el = bookRef.current
    if (!el || loading) return
    const pages = el.querySelectorAll(".bfb-page")
    if (pages.length === 0) return
    const containerW = el.clientWidth || window.innerWidth
    const availH = Math.max(320, window.innerHeight - 132)
    const portrait = window.innerWidth < 768
    const maxPageW = portrait ? containerW : Math.floor(containerW / 2)
    const pageW = Math.max(200, Math.min(maxPageW, Math.floor(availH / 1.42)))
    const pageH = Math.floor(pageW * 1.42)
    el.style.height = `${pageH}px`
    el.style.maxWidth = portrait ? `${pageW}px` : `${pageW * 2}px`
    el.style.margin = "0 auto"
    let flip: InstanceType<typeof PageFlip> | null = null
    try {
      flip = new PageFlip(el, {
        width: pageW,
        height: pageH,
        showCover: true,
        usePortrait: portrait,
        maxShadowOpacity: 0.4,
        mobileScrollSupport: true,
        // Clicks must never turn pages (photo taps open nothing).
        // Page turns stay available via drag / swipe / corner curl.
        disableFlipByClick: true,
      })
      flip.loadFromHTML(pages)
      flip.on("flip", (e: any) => {
        pageRef.current = typeof e?.data === "number" ? e.data : pageRef.current
      })
      flipRef.current = flip
      const maxPage = Math.max(0, pages.length - 1)
      if (pageRef.current > maxPage) pageRef.current = maxPage
      if (pageRef.current > 0) {
        try { flip.turnToPage(pageRef.current) } catch {}
      }
    } catch {
      flipRef.current = null
    }
    return () => {
      try { flip?.destroy() } catch {}
      if (flipRef.current === flip) flipRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey, loading])

  const coverPhoto =
    (Array.isArray(profile?.cover_photos) && profile.cover_photos.find(Boolean)) ||
    profile?.couple_illustration_url ||
    ""
  const venue = profile?.sessions?.[0]?.venue || ""
  const mono = initialsOf(profile?.groom_name || "", profile?.bride_name || "")
  const coupleName = resolveCoupleName(profile || {}) || "Mempelai"
  const total = entries.length + 1
  const pad = (n: number) => String(n).padStart(2, "0")

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F4EFE6" }}>
        <div className="w-8 h-8 border-2 border-[#B34E3F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-3 py-6 md:p-8" style={{ backgroundColor: "#F4EFE6" }}>
      <style>{`
        .bfb-page { background-color: ${PAPER}; overflow: hidden; }
      `}</style>

      <div className="w-full max-w-[880px]">
        <div className="flex items-center justify-between px-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`${inter.className} text-[11px] tracking-[0.2em] uppercase font-semibold`} style={{ color: "#8B6F2A" }}>Live Guestbook</span>
          </div>
          <span className={`${cormorant.className} italic text-xs`} style={{ color: "#8B6F2A" }}>{entries.length} tamu hadir</span>
        </div>

        <div key={buildKey} ref={bookRef} className="w-full rounded-lg overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-[#E2D8C3]">
          {/* COVER */}
          <div className="bfb-page" data-density="hard">
            <BookCover profile={profile} mono={mono} venue={venue} />
          </div>

          {/* ENTRY PAGES */}
          {entries.map((e, i) => (
            <div className="bfb-page" key={e.id}>
              <EntryPage entry={e} index={i} pageNo={i + 2} pageTotal={total} coupleName={coupleName} />
            </div>
          ))}

          {entries.length === 0 && (
            <div className="bfb-page">
              <div className="h-full w-full flex flex-col items-center justify-center text-center px-8" style={{ backgroundColor: PAPER }}>
                <p className={`${cormorant.className} text-xl`} style={{ color: INK }}>Buku tamu digital ini akan terisi pada hari acara setelah ada tamu yang check-in.</p>
                <p className={`${inter.className} text-[9px] tracking-[0.2em] uppercase mt-3`} style={{ color: MAROON }}>Menunggu kehadiran pertama</p>
              </div>
            </div>
          )}
        </div>

        <p className={`${inter.className} text-center text-[10px] tracking-[0.2em] uppercase mt-3`} style={{ color: "rgba(139,111,42,0.7)" }}>
          {entries.length === 0 ? "Menunggu tamu" : `Halaman ${Math.min(pageRef.current + 1, entries.length + 1)} dari ${entries.length + 1}`}
        </p>
      </div>
    </div>
  )
}

export function EntryPage({ entry, pageNo, pageTotal, coupleName }: { entry: Entry; index: number; pageNo: number; pageTotal: number; coupleName: string }) {
  const n = entry.photos.length
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    <div className="h-full w-full flex flex-col px-4 py-3 overflow-hidden relative" style={{ backgroundColor: PAPER }}>
      <div className="absolute inset-1.5 border border-[#e4d7cb]/70 pointer-events-none" style={{ borderRadius: 2 }} />
      <div className="relative z-10">
        <Folio right={<>Halaman {pad(pageNo)} <span style={{ color: GOLD }}>•</span> Buku Kenangan Tamu</>} />
      </div>
      <div className="relative z-10 mt-2 bg-[#f4ece3] border border-[#ede3d8] rounded-[2px] px-2.5 py-2 flex items-center justify-between gap-2 text-left" style={{ borderRadius: 2 }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: MAROON }}>
            <span className={`${playfair.className} font-semibold text-[12px] text-[#ffdad9]`}>{(entry.name.trim()[0] || "T").toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`${inter.className} text-[7px] uppercase font-semibold`} style={{ color: GRAY, letterSpacing: "0.18em" }}>Koleksi Kenangan Oleh</p>
            <p className={`${playfair.className} font-semibold leading-tight truncate`} style={{ fontSize: 14, color: INK }}>{entry.name}</p>
            {entry.wish ? (
              <p className={`${cormorant.className} italic leading-snug truncate`} style={{ fontSize: 12, color: "#665452" }}>&ldquo;{entry.wish}&rdquo;</p>
            ) : null}
          </div>
        </div>
        <div className="text-right shrink-0 border-l pl-2 ml-1" style={{ borderColor: "#e4d7cb" }}>
          <span className="block text-[8px] font-bold uppercase" style={{ color: GOLD }}>{displayCategory(entry.category) || "Tamu"}</span>
          {entry.table_number && <span className="block text-[8px] mt-0.5" style={{ color: GRAY }}>{entry.table_number}</span>}
        </div>
      </div>
      {(entry.is_vip || entry.added_manually) && (
        <div className="relative z-10 flex gap-1 mt-1">
          {entry.is_vip && <span className="px-1.5 py-px rounded-full text-[7px] uppercase tracking-wider font-bold" style={{ backgroundColor: "rgba(201,163,78,0.15)", border: "1px solid #C9A34E", color: "#7A5A2E" }}>★ VIP</span>}
          {entry.added_manually && <span className="px-1.5 py-px rounded-full text-[7px] uppercase tracking-wider" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e" }}>Manual</span>}
        </div>
      )}
      {entry.photos.length > 0 && (
        <div className="relative z-10 mt-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(entry.photos.length, 1), 4)}, minmax(0,1fr))` }}>
          {entry.photos.map((p, i) => (
            <div key={i} className="bg-white p-1 border border-[#e4d7cb]" style={{ borderRadius: 2 }}>
              <div className="relative w-full overflow-hidden bg-[#f2efe9] border border-[#ede3d8]" style={{ aspectRatio: "4 / 3", borderRadius: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Kenangan ${entry.name}`} className="w-full h-full object-contain" loading="lazy" />
                {p.source === "selfie" && (
                  <span className="absolute top-1 left-1 px-1.5 py-px rounded-full text-[7px] uppercase tracking-wider font-bold text-white" style={{ backgroundColor: MAROON }}>Check-in</span>
                )}
              </div>
              {p.caption?.trim() && (
                <p className={`${playfair.className} font-medium text-center mt-1`} style={{ fontSize: 11, lineHeight: 1.4, color: INK, maxHeight: 32, overflow: "hidden" }}>{p.caption.trim()}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {entry.photos.length === 0 && entry.wish && (
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto mt-2">
          <p className={`${cormorant.className} italic leading-snug`} style={{ fontSize: 16, color: INK }}>&ldquo;{entry.wish}&rdquo;</p>
        </div>
      )}
      <div className="relative z-10 mt-auto pt-1">
        <BottomBar couple={coupleName} right={`Halaman ${pad(pageNo)} dari ${pad(pageTotal)}`} />
      </div>
    </div>
  )
}
