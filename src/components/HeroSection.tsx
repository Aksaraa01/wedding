"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { waLink } from "@/lib/contact"
import { toTransformedUrl } from "@/lib/storageUrl"

// Template screenshots live in the media bucket's `templates/` folder.
// Env-relative (never hardcoded to prod) + pre-generated WebP thumbnails at
// ~2x display size: arch cards render at 130-156px, mobile carousel at 150px,
// avatars at 32px — serving full originals here cost ~8-12MB per view.
const MEDIA_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/media`

function thumb(name: string, width = 400): string {
  return toTransformedUrl(`${MEDIA_BASE}/templates/${name}`, { width })
}

// Keep the original alongside the thumbnail so a missing/failed derivative
// still renders instead of leaving a broken frame.
type HeroPhoto = { src: string; original: string }

function frame(name: string): HeroPhoto {
  const original = `${MEDIA_BASE}/templates/${name}`
  return { src: thumb(name), original }
}

function handleImageError(img: HTMLImageElement) {
  if (img.dataset.fellBack) return
  img.dataset.fellBack = "1"
  if (img.dataset.original) img.src = img.dataset.original
}

// Fallback when the template API is unreachable/empty — same frames as before.
const FALLBACK_PHOTOS: HeroPhoto[] = [
  frame("Template%201.png"),
  frame("Template%202.png"),
  frame("Template%203.png"),
  frame("Template%204.png"),
  frame("Template%205.png"),
  frame("Template%206.png"),
  frame("Template%207.png"),
  frame("Template%209.png"),
  frame("Template%201.png"),
  frame("Template%202.png"),
]

type ArchSlot = { left: string; top: string; size: number; rotate: number; z: number }

// 8 square cards in a top arch, mirroring the reference layout.
// Sizes ladder: edges 130px → center 156px. Rotations ∓36° → ∓4°.
const ARCH_SLOTS: ArchSlot[] = [
  { left: "4%", top: "72%", size: 130, rotate: -36, z: 10 },
  { left: "13%", top: "42%", size: 140, rotate: -24, z: 20 },
  { left: "24%", top: "16%", size: 148, rotate: -13, z: 30 },
  { left: "37%", top: "4%", size: 156, rotate: -4, z: 40 },
  { left: "51%", top: "4%", size: 156, rotate: 4, z: 35 },
  { left: "64%", top: "16%", size: 148, rotate: 13, z: 30 },
  { left: "76%", top: "42%", size: 140, rotate: 24, z: 20 },
  { left: "85%", top: "72%", size: 130, rotate: 36, z: 10 },
]

const ROTATE_MS = 4000
const SCROLL_MS = 3000
const RESUME_MS = 6000

const SOCIAL_AVATARS = [
  thumb("Template%201.png", 96),
  thumb("Template%202.png", 96),
  thumb("Template%203.png", 96),
  thumb("Template%204.png", 96),
]

export default function HeroSection() {
  // Real template previews (first 10 active). Falls back to the hardcoded
  // frames when the API is unreachable or returns too few.
  const [photos, setPhotos] = useState<HeroPhoto[]>(FALLBACK_PHOTOS)
  const [offset, setOffset] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/web-templates?event=wedding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const urls = Array.isArray(data?.templates)
          ? data.templates
              .map((t: any) => {
                const original = typeof t?.preview_image_url === "string" ? t.preview_image_url.trim() : ""
                if (!original) return null
                return { src: toTransformedUrl(original, { width: 400 }), original }
              })
              .filter((photo: HeroPhoto | null): photo is HeroPhoto => photo !== null)
              .slice(0, 10)
          : []
        if (urls.length >= 8) setPhotos(urls)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Desktop arch: slide the 8-slot window through the photo list.
  useEffect(() => {
    if (photos.length <= ARCH_SLOTS.length) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => {
      setOffset((o) => (o + 1) % photos.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [photos])

  // Mobile carousel: seamless infinite loop. The list is rendered 3x;
  // the view rests in the middle copy and wraps instantly (invisible, the
  // content is identical) whenever it drifts into an outer copy.
  const loopPhotos = [...photos, ...photos, ...photos]

  // Mobile carousel: auto-advance one card at a time inside the middle copy.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const copyWidth = () => track.scrollWidth / 3
    // Start inside the middle copy so both directions can wrap.
    track.scrollLeft = copyWidth()
    const step = () => {
      if (pausedRef.current) return
      const max = track.scrollWidth - track.clientWidth
      if (max <= 0) return
      const card = track.querySelector<HTMLElement>(":scope > div")
      const w = (card?.offsetWidth || 150) + 16
      if (track.scrollLeft + 1 >= max) return // wrap handler recenters below
      track.scrollBy({ left: w, behavior: "smooth" })
    }
    const id = setInterval(step, SCROLL_MS)
    return () => clearInterval(id)
  }, [photos])

  // Seamless wrap (auto + manual swipe): jump by exactly one copy width.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let ticking = false
    const wrap = () => {
      ticking = false
      const copyWidth = track.scrollWidth / 3
      if (copyWidth <= 0) return
      if (track.scrollLeft >= copyWidth * 2) {
        track.scrollLeft -= copyWidth
      } else if (track.scrollLeft <= 0) {
        track.scrollLeft += copyWidth
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(wrap)
      }
    }
    // Position inside the middle copy on mount / photo change.
    const copyWidth = track.scrollWidth / 3
    if (copyWidth > 0) track.scrollLeft = copyWidth
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => track.removeEventListener("scroll", onScroll)
  }, [photos])

  const pauseAutoScroll = () => {
    pausedRef.current = true
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false
    }, RESUME_MS)
  }

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current)
    }
  }, [])

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-[#EFEAE1] [font-family:var(--font-inter)] antialiased overflow-hidden bg-[radial-gradient(circle_at_center,#592259_0%,#3A153A_100%)]">
      <style>{`
        .arch-photo { position: absolute; }
        .arch-photo:hover { z-index: 50 !important; }
        .arch-photo img {
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 24px 48px -16px rgba(0, 0, 0, 0.55);
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.7s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .arch-photo:hover img {
          transform: scale(1.06) translateY(-8px);
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.65);
          border-color: rgba(255, 255, 255, 0.4);
        }
        .arch-crossfade { animation: arch-fade-in 1.1s ease forwards; }
        @keyframes arch-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .arch-crossfade { animation: none; }
        }
      `}</style>

      {/* Top arch gallery (mirrors reference positioning) — desktop only.
          Layout identical; each slot crossfades through the template list. */}
      <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[380px] pointer-events-none px-4 z-5">
        {ARCH_SLOTS.map((slot, i) => {
          const current = photos[(offset + i) % photos.length]
          const incoming = photos[(offset + i + 1) % photos.length]
          const animate = photos.length > ARCH_SLOTS.length
          return (
            <div
              key={i}
              className="arch-photo pointer-events-auto"
              style={{
                left: slot.left,
                top: slot.top,
                width: slot.size,
                height: slot.size,
                transform: `rotate(${slot.rotate}deg)`,
                zIndex: slot.z,
              }}
            >
              <img
                src={current.src}
                alt="Galeri"
                width={slot.size}
                height={slot.size}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover rounded-2xl"
                data-original={current.original}
                onError={(e) => handleImageError(e.currentTarget)}
              />
              {animate && incoming !== current && (
                <img
                  key={offset}
                  src={incoming.src}
                  alt=""
                  aria-hidden
                  width={slot.size}
                  height={slot.size}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl arch-crossfade"
                  data-original={incoming.original}
                  onError={(e) => handleImageError(e.currentTarget)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: horizontal snap carousel of the template frames.
          pt-24 clears the fixed h-20 header; cards 150px. Auto-scrolls. */}
      <div className="md:hidden w-full max-w-[1100px] mx-auto mb-6 pt-24">
        <div
          ref={trackRef}
          onTouchStart={pauseAutoScroll}
          onPointerDown={pauseAutoScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar px-4"
        >
          {loopPhotos.map((photo, i) => (
              <div key={i} className="shrink-0 snap-start w-[150px]">
                <img
                  src={photo.src}
                  alt="Galeri"
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[9/19] object-cover rounded-2xl border border-white/20 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)]"
                  data-original={photo.original}
                  onError={(e) => handleImageError(e.currentTarget)}
                />
              </div>
          ))}
        </div>
      </div>

      {/* Hero content below the arch */}
      <div className="relative z-10 max-w-4xl mx-auto text-center mt-6 md:mt-[200px] px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 text-[11px] sm:text-xs font-bold tracking-widest uppercase bg-[#C5A85D]/15 border border-[#C5A85D]/40 text-[#C5A85D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A85D] animate-pulse" />
          100+ Animated Designs
        </div>

        <h1 className="[font-family:var(--font-playfair)] text-[clamp(2rem,5.5vw,4.2rem)] font-bold leading-[1.08] tracking-tight text-[#FAF7F2] mb-6 drop-shadow-xl">
          Undangan Pernikahan
          <br />
          Digital untuk
          <br />
          <span className="italic">Hari Bahagia Anda.</span>
        </h1>

        <p className="text-base md:text-lg text-[#B09BA6] max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-light drop-shadow-md">
          Buat undangan website pernikahan dengan 100+ desain menawan, lengkap dengan RSVP online,
          buku tamu digital QR, galeri foto tamu, dan reminder WhatsApp otomatis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-[#C5A85D] hover:bg-[#D4B86A] text-black font-semibold py-3.5 px-8 rounded-full transition-colors text-center"
          >
            Mulai Cerita Anda
          </Link>
          <a
            href={waLink("Halo Aksaraa Wedding Saya perlu konsultasi mengenai..")}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-[#FAF7F2] hover:text-[#C5A85D] transition-colors font-medium flex items-center justify-center gap-2 py-3.5 border-b border-transparent hover:border-[#C5A85D]"
          >
            Konsultasi Gratis
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <div className="flex -space-x-2">
            {SOCIAL_AVATARS.map((src, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#3A153A] overflow-hidden">
                <img src={src} alt="Tamu" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#3A153A] bg-[#592259] flex items-center justify-center text-xs text-white">
              +
            </div>
          </div>
          <p className="text-sm text-[#B09BA6]">
            <span className="text-[#C5A85D] font-bold">1000+</span> undangan terkirim minggu ini
          </p>
        </div>
      </div>
    </section>
  )
}
