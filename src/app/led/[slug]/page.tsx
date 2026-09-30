"use client"

import { use, useEffect, useState, useRef, useCallback } from "react"
import { useVisiblePoll } from "@/lib/useVisiblePoll"

type Wish = {
  id: string
  name: string
  message: string
  is_pinned: boolean
  status: string
  created_at: string
  guest_id: string | null
  guests: { category: string } | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function LedDisplay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [profileId, setProfileId] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [dateLabel, setDateLabel] = useState("")
  const [pinned, setPinned] = useState<Wish[]>([])
  const [others, setOthers] = useState<Wish[]>([])
  const [error, setError] = useState("")
  const [spotPage, setSpotPage] = useState(0)

  const fetchWishes = useCallback(async (pid: string) => {
    try {
      const r = await fetch(`/api/wishes/led?wedding_profile_id=${pid}`)
      const data = await r.json()
      if (data) {
        setPinned(data.pinned || [])
        setOthers(data.others || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false
    let pid = ""
    fetch(`/api/scanner/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !data.wedding_profile_id) return
        pid = data.wedding_profile_id
        setProfileId(pid)
        const groom = (data.groom_name || "").trim()
        const bride = (data.bride_name || "").trim()
        setCoupleName(bride && groom ? `${groom} & ${bride}` : bride || groom || "Our Wedding")
        if (data.estimated_wedding_date) {
          try {
            const d = new Date(data.estimated_wedding_date)
            if (!isNaN(d.getTime())) {
              const dd = String(d.getDate()).padStart(2, "0")
              const mm = String(d.getMonth() + 1).padStart(2, "0")
              const yyyy = d.getFullYear()
              setDateLabel(`${dd}.${mm}.${yyyy}`)
            }
          } catch {}
        }
        fetchWishes(pid)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [slug, fetchWishes])

  // Poll wishes, paused while the tab is hidden (ballroom screens left open
  // in background must not generate traffic or Supabase log volume).
  useVisiblePoll(() => {
    if (profileId) fetchWishes(profileId)
  }, 10000, profileId !== "")

  // Pinned spotlight paging for row 1: max 2 static cards; when more than 2
  // wishes are pinned, rotate pages with a fade every 8s (paused in hidden
  // tabs, same rationale as the wish poll above).
  const pinnedIds = pinned.map((w) => w.id).join(",")
  const SPOT_SIZE = 2
  const spotPages = Math.max(1, Math.ceil(pinned.length / SPOT_SIZE))
  useEffect(() => {
    setSpotPage(0)
  }, [pinnedIds])
  useEffect(() => {
    if (spotPages <= 1) return
    const t = setInterval(() => {
      if (!document.hidden) setSpotPage((p) => (p + 1) % spotPages)
    }, 8000)
    return () => clearInterval(t)
  }, [spotPages, pinnedIds])
  const safeSpot = spotPage % spotPages
  const spotShown = pinned.slice(safeSpot * SPOT_SIZE, safeSpot * SPOT_SIZE + SPOT_SIZE)

  const allApproved = [...pinned, ...others]
  const hashtag = coupleName ? `#${coupleName.replace(/[^a-zA-Z0-9]/g, "")}` : ""

  const row1 = allApproved.length > 0 ? allApproved : []
  const row2 = allApproved.length > 0 ? [...allApproved].reverse() : []

  const renderCard = (wish: Wish) => (
    <div key={wish.id} className="wish-card w-[380px] md:w-[440px] min-h-[200px] md:min-h-[220px] rounded-2xl p-6 md:p-7 flex flex-col justify-between shrink-0 shadow-sm border border-[#E8DCDB]/80 bg-white/90">
      <div>
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FAF3EC] border border-[#E8DCDB] flex items-center justify-center text-[#5B242A] shrink-0 font-serif text-sm font-bold tracking-tight">
            {initials(wish.name)}
          </div>
          <h3 className="font-sans font-bold text-lg md:text-xl text-[#5B242A] tracking-tight truncate max-w-[220px]">{wish.name}</h3>
        </div>
        <p className="font-sans text-[15px] md:text-[17px] leading-relaxed text-[#382D29]/90 line-clamp-4">{wish.message}</p>
      </div>
      <div className="self-end pointer-events-none opacity-40 text-[#7E3B42] -mb-1 -mr-1">
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
          <path d="M12 22V12M12 12C12 7 7 6 7 6C7 11 12 12 12 12ZM12 12C12 7 17 6 17 6C17 11 12 12 12 12Z" />
        </svg>
      </div>
    </div>
  )

  const renderSpotCard = (wish: Wish) => (
    <div key={wish.id} className="relative shrink-0 pt-3">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-[#5B242A] text-[#FAF3EC] rounded-full pl-2.5 pr-3.5 py-1 shadow-md pointer-events-none">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
        </svg>
        <span className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase">Disematkan</span>
      </div>
      {renderCard(wish)}
    </div>
  )

  const renderMarqueeCard = (wish: Wish, idx: number) => (
    <div key={`${wish.id}-${idx}`} className="wish-card w-[380px] md:w-[440px] min-h-[200px] md:min-h-[220px] rounded-2xl p-6 md:p-7 flex flex-col justify-between shrink-0 shadow-sm border border-[#E8DCDB]/80 bg-white/90">
      <div>
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FAF3EC] border border-[#E8DCDB] flex items-center justify-center font-serif text-sm font-bold text-[#5B242A] shrink-0">
            {initials(wish.name)}
          </div>
          <h3 className="font-sans font-bold text-lg md:text-xl text-[#5B242A] tracking-tight truncate max-w-[200px]">{wish.name}</h3>
        </div>
        <p className="font-sans text-[15px] md:text-[17px] leading-relaxed text-[#382D29]/90 line-clamp-4">{wish.message}</p>
      </div>
      <div className="self-end pointer-events-none opacity-40 text-[#7E3B42] -mb-1 -mr-1">
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
          <path d="M12 22V12M12 12C12 7 7 6 7 6C7 11 12 12 12 12ZM12 12C12 7 17 6 17 6C17 11 12 12 12 12Z" />
        </svg>
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center champagne-gradient">
        <p className="text-[#5B242A]/60">{error}</p>
      </div>
    )
  }

  const names = coupleName.split("&").map((s) => s.trim())
  const groomDisplay = names[0] || coupleName
  const brideDisplay = names[1] || ""

  return (
    <div className="champagne-gradient h-screen w-screen overflow-hidden select-none flex flex-col justify-between relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Italianno&display=swap');
        .champagne-gradient { background: radial-gradient(circle at 50% 20%, #FFFDF9 0%, #FAF5EE 55%, #EFE7DA 100%); }
        .wish-card { background: rgba(255,255,255,0.78); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 8px 24px -6px rgba(100,75,55,0.05), 0 2px 6px -1px rgba(100,75,55,0.03); border: 1px solid rgba(229,221,208,0.65); transition: transform 0.4s ease, box-shadow 0.4s ease; }
        .wish-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -6px rgba(91,36,42,0.08); }
        @keyframes marqueeLeft { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
        @keyframes marqueeRight { 0% { transform: translateX(-100%); } 100% { transform: translateX(0%); } }
        @keyframes spotlightFade { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        .spotlight-fade { animation: spotlightFade 0.6s ease; }
        .marquee-row-wrapper:hover .marquee-track { animation-play-state: paused !important; }
        body { margin: 0; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <div className="absolute top-0 left-0 w-40 md:w-52 lg:w-64 h-auto pointer-events-none z-0 select-none">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPRK07053oiwkhlpBkhl9hOZoaT5yx3QfZ0FbMJ7piZSs08SVL-DU6NBWjW7SGUpdYTLdiNiYb3LUqU2A4Jb3GeFxVgYBTSOuqicTxHW56Ta6ofjTThXbhVGkEs9-gkGtC0FI1an_sedIh7R2A-V9M0dpau3KfFqOYlf5VOHNJ7okiTHIfSGFgvDS6Fb8QzizhHdn2BWcj1Qwm_GxwiOz18TaGxkTeQPZzZSq_PpinIJQD6XY5WLpIfXARfNRYm0ZfGQ" alt="" className="w-full h-auto object-contain opacity-85 scale-y-[-1] block" />
      </div>
      <div className="absolute top-0 right-0 w-40 md:w-52 lg:w-64 h-auto pointer-events-none z-0 select-none">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXWNVGteH8jXZSLxGqy2rRijQCS9Z1_R4FV2iuWKjYNemfqm8yAA3vj0Bk0vWSnT6gcjBaLMH5QGzp-BRoPdCYfRYpSeTB_norSEjpn7p5Dsh4R_HJstPM-kBYXs_3vV7ESZ6ydeceAV5qR7SzpnYcoN_VbfCWJgAWJOcqJxex6iM3GLlrJLhReVvMus0khnLqj_ke--5s1KuIhp25eifZOyBx5TQKd67NCWz_0Bk4VMXh3PDn0nehtg34DeAWXFs9LA" alt="" className="w-full h-auto object-contain opacity-85 rotate-180 block" />
      </div>
      <div className="absolute bottom-0 left-0 w-40 md:w-52 lg:w-64 h-auto pointer-events-none z-0 select-none">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBrJ58biniZYx2A8vlK0THpfP4fWkAMsyj3aQvwEo8jyZ0ui3KBQ5w-AUozhcV4W6zdWU2Llkbn8rPsQMc28JOEAY3sxppxNZVY53rsV4XYUzg9x7TE7ptunk9A_Ax6ZnKlsDkIgzaWJM_JmXGES6UJfe7cjCAlh5FMaJcKxd00SxM2FZqyVyBeHbWZvlDFRc0QGlPzWjcpTfT0g2xVuyIjY5pRzIqNuhM1J0CBcKAUkhYOO6ftl7lIIQ5neW4rgYnEA" alt="" className="w-full h-auto object-contain opacity-85 block" />
      </div>
      <div className="absolute bottom-0 right-0 w-40 md:w-52 lg:w-64 h-auto pointer-events-none z-0 select-none">
        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHD5nIXR4s8S0vYMAL6ApCI4g2f1akqNtzDSwwd4jeBVZ3V0AqRY6vA1XScQzW_ztS8pex-tcQGpqZ3bebC9qxRKui5pGfVDAsc3klmW1JdyySlYTCp6i5kfGFQHqkk5ZXsPUXUCI93wiHl245ttUheap4EK5SkptQnI0u3lkZb_QcjH7S1oLB7XIzeDno7cYOClN9iI9UzTUhwyKWfXfnlwZTzhSgPb36xlFTfA5LBRdXVj6lbwSxgx9jPfEUtrWmFw" alt="" className="w-full h-auto object-contain opacity-85 scale-x-[-1] block" />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#F7E7D2]/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-16 w-80 h-80 bg-[#EEDCCE]/35 rounded-full blur-2xl pointer-events-none -z-10" />

      <header className="relative z-10 pt-5 md:pt-7 px-6 md:px-14 flex items-center justify-between shrink-0">
        <div className="w-full text-center pointer-events-auto">
          <p className="font-serif italic text-lg md:text-2xl lg:text-3xl text-[#7E3B42] font-medium tracking-wide mb-0.5" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            The Wedding of
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-[4.2rem] leading-none text-[#5B242A] font-normal tracking-tight" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            {groomDisplay} {brideDisplay && <><span className="italic text-[#7E3B42] text-2xl md:text-4xl lg:text-5xl" style={{ fontFamily: '"Playfair Display", serif' }}>&amp;</span> {brideDisplay}</>}
          </h1>
        </div>
        <div className="absolute right-6 md:right-14 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end text-right select-none opacity-80 pointer-events-none">
          {hashtag && <span className="font-sans text-xs font-semibold tracking-[0.2em] text-[#5B242A] uppercase">{hashtag}</span>}
          {dateLabel && <span className="font-sans italic text-sm text-[#7E3B42] tracking-wider mt-0.5" style={{ fontFamily: '"Cormorant Garamond", serif' }}>{dateLabel}</span>}
        </div>
      </header>

      {allApproved.length === 0 ? (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <p className="text-[#9E9080] text-lg italic">Belum ada doa yang disetujui. Menunggu ucapan hangat dari tamu...</p>
        </div>
      ) : (
        <main className="relative z-10 flex-grow flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-16 my-auto overflow-hidden">
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-12 select-none pr-4">
            <div className="h-12 w-[1px] bg-[#5B242A]/25 mb-4" />
            <p className="text-xs font-semibold tracking-[0.35em] text-[#7E3B42] uppercase opacity-75" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: '"Cormorant Garamond", serif' }}>
              Good People Bring Beautiful Wishes
            </p>
            <div className="h-12 w-[1px] bg-[#5B242A]/25 mt-4" />
          </div>

          <div className="flex-1 max-w-[1440px] w-full mx-auto relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 z-20 pointer-events-none bg-gradient-to-r from-[#F8F4ED] via-[#F8F4ED]/80 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 z-20 pointer-events-none bg-gradient-to-l from-[#F8F4ED] via-[#F8F4ED]/80 to-transparent" />

            <div className="flex flex-col gap-4 md:gap-6 py-2">
              {pinned.length > 0 ? (
                <div className="overflow-hidden flex justify-center select-none" aria-live="polite">
                  <div key={safeSpot} className="spotlight-fade flex gap-4 md:gap-6 justify-center">
                    {spotShown.map((w) => renderSpotCard(w))}
                  </div>
                </div>
              ) : (
                <div className="marquee-row-wrapper overflow-hidden flex select-none">
                  <div className="marquee-track flex gap-4 md:gap-6 shrink-0" style={{ animation: "marqueeLeft 75s linear infinite" }}>
                    {row1.map((w, i) => renderMarqueeCard(w, i))}
                  </div>
                  <div className="marquee-track flex gap-4 md:gap-6 shrink-0 ml-4 md:ml-6" aria-hidden="true" style={{ animation: "marqueeLeft 75s linear infinite" }}>
                    {row1.map((w, i) => renderMarqueeCard(w, i + 1000))}
                  </div>
                </div>
              )}

              <div className="marquee-row-wrapper overflow-hidden flex select-none">
                <div className="marquee-track flex gap-4 md:gap-6 shrink-0" style={{ animation: "marqueeRight 80s linear infinite" }}>
                  {(row2.length > 0 ? row2 : row1).map((w, i) => renderMarqueeCard(w, i))}
                </div>
                <div className="marquee-track flex gap-4 md:gap-6 shrink-0 ml-4 md:ml-6" aria-hidden="true" style={{ animation: "marqueeRight 80s linear infinite" }}>
                  {(row2.length > 0 ? row2 : row1).map((w, i) => renderMarqueeCard(w, i + 2000))}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-12 select-none pl-4">
            <div className="h-12 w-[1px] bg-[#5B242A]/25 mb-4" />
            <p className="text-xs font-semibold tracking-[0.35em] text-[#7E3B42] uppercase opacity-75" style={{ writingMode: "vertical-rl", fontFamily: '"Cormorant Garamond", serif' }}>
              Different People Same Beautiful Prayers
            </p>
            <div className="h-12 w-[1px] bg-[#5B242A]/25 mt-4" />
          </div>
        </main>
      )}

      <footer className="relative z-10 pb-5 md:pb-7 pt-2 text-center shrink-0">
        <p className="italic text-lg md:text-xl lg:text-2xl text-[#5B242A]/85 tracking-wide font-normal" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
          Thank you for being a part of our story ♡
        </p>
      </footer>
    </div>
  )
}
