"use client"

import { use, useEffect, useRef, useState, useCallback } from "react"
import { Cinzel, Pinyon_Script, Cormorant_Garamond } from "next/font/google"
import { PageFlip } from "page-flip"
import { useVisiblePoll } from "@/lib/useVisiblePoll"

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"] })
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: ["400"] })
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] })

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

type GuestPhoto = { url: string; source: string | null; created_at: string | null }

type Entry = Guest & { wish?: string; photos: string[] }

type Profile = {
  slug: string
  bride_name: string
  groom_name: string
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


function initialsOf(bride: string, groom: string): string {
  const b = (bride.trim()[0] || "").toUpperCase()
  const g = (groom.trim()[0] || "").toUpperCase()
  return `${b}${g}` || "A"
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
            list.push({ url: item.image_url, source: item.source || null, created_at: item.created_at || null })
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
          photos: (photoByGuest.get(g.id) || []).map((x) => x.url),
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
  const mono = initialsOf(profile?.bride_name || "", profile?.groom_name || "")

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
        .bfb-paper {
          background-color: #FAF6EE;
          background-image:
            radial-gradient(#E8DFC9 0.75px, transparent 0.75px),
            radial-gradient(#DFD4BA 0.5px, #FAF6EE 0.5px);
          background-size: 24px 24px, 12px 12px;
          background-position: 0 0, 6px 6px;
        }
        .bfb-gold-text {
          background: linear-gradient(135deg, #ECC875 0%, #FAF0D7 25%, #C59B3F 50%, #FAF0D7 75%, #B38628 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bfb-page { background-color: #FAF6EE; overflow: hidden; }
      `}</style>

      <div className="w-full max-w-[880px]">
        <div className="flex items-center justify-between px-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={`${cinzel.className} text-[11px] tracking-[0.2em] uppercase text-[#8B6F2A]`}>Live Guestbook</span>
          </div>
          <span className={`${cormorant.className} italic text-xs text-[#8B6F2A]`}>{entries.length} tamu hadir</span>
        </div>

        <div key={buildKey} ref={bookRef} className="w-full rounded-lg overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-[#E2D8C3]">
          {/* COVER */}
          <div className="bfb-page" data-density="hard">
            <div className="bfb-paper h-full w-full flex flex-col items-center justify-between text-center px-6 py-8 relative">
              <div className="absolute inset-3 border border-[#C9A34E]/60 pointer-events-none" />
              <div className="pt-2">
                <div className="w-14 h-14 mx-auto rounded-full border border-dashed border-[#C9A34E] flex items-center justify-center mb-2">
                  <span className={`${cormorant.className} italic text-xl text-[#A98231]`}>{mono}</span>
                </div>
                <p className={`${cinzel.className} text-[9px] tracking-[0.28em] uppercase text-[#A98231]`}>The Wedding Guestbook</p>
                <p className={`${pinyon.className} text-2xl text-[#39332D] mt-1`}>Celebration of Eternal Love</p>
              </div>
              {coverPhoto ? (
                <div className="w-44 h-56 md:w-52 md:h-64 rounded-t-full overflow-hidden border-2 border-[#D8CEB8] shadow-lg my-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPhoto} alt="Foto pasangan" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-44 h-56 flex items-center justify-center border-2 border-dashed border-[#D8CEB8] rounded-t-full my-3">
                  <span className={`${cormorant.className} italic text-[#8B6F2A]`}>Foto menyusul</span>
                </div>
              )}
              <div>
                <h1 className={`${cormorant.className} text-3xl md:text-4xl text-[#231E1B]`}>
                  <span className="bfb-gold-text font-semibold">{profile?.groom_name || "Mempelai"}</span>
                  <span className={`${pinyon.className} text-3xl text-[#A98231] mx-2`}>&amp;</span>
                  <span className="bfb-gold-text font-semibold">{profile?.bride_name || "Mempelai"}</span>
                </h1>
                <p className={`${cinzel.className} text-[10px] tracking-[0.2em] uppercase text-[#39332D] mt-2`}>{formatLongDate(profile?.estimated_wedding_date || null)}</p>
                {venue && <p className={`${cormorant.className} italic text-sm text-[#8B6F2A]`}>{venue}</p>}
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#A98231] mt-4 animate-pulse">← Geser untuk membuka →</p>
              </div>
            </div>
          </div>

          {/* ENTRY PAGES */}
          {entries.map((e, i) => (
            <div className="bfb-page" key={e.id}>
              <EntryPage entry={e} index={i} />
            </div>
          ))}

          {entries.length === 0 && (
            <div className="bfb-page">
              <div className="bfb-paper h-full w-full flex flex-col items-center justify-center text-center px-8">
                <p className={`${cormorant.className} text-xl text-[#39332D]`}>Buku tamu digital ini akan terisi pada hari acara setelah ada tamu yang check-in.</p>
                <p className="text-xs tracking-[0.2em] uppercase text-[#A98231] mt-3">Menunggu kehadiran pertama</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] tracking-[0.2em] uppercase text-[#8B6F2A]/70 mt-3">
          {entries.length === 0 ? "Menunggu tamu" : `Halaman ${Math.min(pageRef.current + 1, entries.length + 1)} dari ${entries.length + 1}`}
        </p>
      </div>
    </div>
  )
}

function EntryPage({ entry, index }: { entry: Entry; index: number }) {
  const [sel, setSel] = useState(0)
  const active = entry.photos.length > 0 ? entry.photos[Math.min(sel, entry.photos.length - 1)] : ""
  return (
    <div className="bfb-paper h-full w-full flex flex-col px-5 md:px-7 py-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <span className={`${cinzel.className} text-[10px] tracking-[0.24em] uppercase text-[#8B6F2A]`}>✻ Registry No. {String(index + 1).padStart(3, "0")}</span>
        <span className="text-[11px] italic text-[#8B6F2A]">{formatTime(entry.checkin_timestamp)}</span>
      </div>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C9A34E]/60 to-transparent my-2 shrink-0" />
      <h2 className={`${cormorant.className} text-[22px] leading-tight text-[#231E1B] truncate shrink-0`}>{entry.name}</h2>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 shrink-0">
        {entry.table_number && (
          <span className="px-2 py-0.5 rounded-full bg-[#F4EFE6] border border-[#E2D9CF] text-[9px] uppercase tracking-wider text-[#39332D]">
            {entry.table_number}
          </span>
        )}
        {entry.category && (
          <span className="px-2 py-0.5 rounded-full bg-[#F4EFE6] border border-[#E2D9CF] text-[9px] uppercase tracking-wider text-[#39332D]">
            {entry.category}
          </span>
        )}
        {entry.is_vip && (
          <span className="px-2 py-0.5 rounded-full bg-[#C9A34E]/15 border border-[#C9A34E] text-[9px] uppercase tracking-wider text-[#7A5A2E] font-bold">
            ★ VIP
          </span>
        )}
        {entry.added_manually && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[9px] uppercase tracking-wider text-amber-700">
            Manual
          </span>
        )}
      </div>
      {active && (
        <div className="mt-2 mx-auto w-full max-w-[200px] shrink-0">
          <div className="bg-white p-1.5 pb-2 shadow-lg rotate-[-1deg]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active} alt={`Foto ${entry.name}`} className="w-full aspect-square object-cover" loading="lazy" />
          </div>
          {entry.photos.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-1.5">
              {entry.photos.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSel(i)}
                  aria-label={`Lihat foto ${i + 1}`}
                  className={`w-9 h-9 rounded overflow-hidden border-2 transition-all ${i === Math.min(sel, entry.photos.length - 1) ? "border-[#C9A34E] shadow" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto mt-2">
        {entry.wish ? (
          <p className={`${cormorant.className} italic text-[17px] leading-snug text-[#39332D]`}>&ldquo;{entry.wish}&rdquo;</p>
        ) : (
          <p className={`${cormorant.className} italic text-sm text-[#8B6F2A]/70`}>Hadir dengan sukacita.</p>
        )}
      </div>
      <div className="pt-1 text-right shrink-0">
        <span className="italic text-[11px] text-[#8B6F2A]">p. {index + 1}</span>
      </div>
    </div>
  )
}

function formatTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB"
}
