"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import {
  flattenPhotos,
  gcalLink,
  groomPhoto as groomPhotoOf,
  bridePhoto as bridePhotoOf,
  normalizeVideoUrl,
  photoList,
} from "../shared/lib"
import InvitationOverlay from "@/components/InvitationOverlay"
import Wishes from "./Wishes"
import "./evermore.css"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const ASSET = (name: string) => `/templates/evermore/assets/${name}`

function parseIso(iso?: string) {
  const m = (iso || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) }
}

function longDate(iso?: string) {
  const p = parseIso(iso)
  if (!p) return ""
  const date = new Date(Date.UTC(p.y, p.m, p.d))
  return `${DAYS[date.getUTCDay()]}, ${p.d} ${MONTHS[p.m]} ${p.y}`
}

function useCountdown(iso?: string) {
  const target = useMemo(() => {
    const p = parseIso(iso)
    return p ? new Date(p.y, p.m, p.d, 0, 0, 0).getTime() : null
  }, [iso])
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!target) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  if (!target || now === null) return null
  const diff = Math.max(0, target - now)
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  }
}

function calendarDays(iso?: string) {
  const p = parseIso(iso)
  if (!p) return [18, 19, 20, 21, 22]
  return [-2, -1, 0, 1, 2].map((offset) => {
    const date = new Date(Date.UTC(p.y, p.m, p.d + offset))
    return date.getUTCDate()
  })
}

function describePalette(colors?: { hex?: string; name?: string }[]) {
  const names = (colors || []).map((c) => (c.name || c.hex || "").trim()).filter(Boolean)
  if (!names.length) return ""
  const list = names.length === 1
    ? names[0]
    : names.length === 2
      ? `${names[0]} & ${names[1]}`
      : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`
  return `We would be delighted if you could dress in ${list}.`
}

function cssUrl(url?: string) {
  return url ? `url("${url.replace(/"/g, "%22")}")` : undefined
}

function galleryPosition(index: number, total: number) {
  const rows = Math.max(1, Math.ceil(total / 3))
  const row = Math.floor(index / 3)
  const col = index % 3
  const inRow = Math.min(3, total - row * 3)
  const x = inRow === 1 ? 0 : inRow === 2 ? [-62, 62][col] : [-124, 0, 124][col]
  const y = (row - (rows - 1) / 2) * 145
  const rotation = ((index % 5) - 2) * 2.4
  return { x, y, rotation }
}

export default function Evermore(profile: TemplateProps) {
  const gates = profile.feature_gates || {}
  const tc = profile.template_content || {}
  const [loading, setLoading] = useState(true)
  const [preloaderLeaving, setPreloaderLeaving] = useState(false)
  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [coverScale, setCoverScale] = useState(1)
  const [layoutScale, setLayoutScale] = useState(1)
  const [spread, setSpread] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [toast, setToast] = useState("")

  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const groomShort = profile.groom_name || ""
  const brideShort = profile.bride_name || ""
  const coupleLabel = [groomShort, brideShort].filter(Boolean).join(" & ") || "The Wedding"
  const coupleInitials = (profile.couple_initials || "").trim()
  const groomFull = profile.groom_full_name || groomShort
  const brideFull = profile.bride_full_name || brideShort
  const guestName = profile.guest_name || "Our Beloved Guest"
  const dateLong = longDate(profile.estimated_wedding_date)
  const countdown = useCountdown(profile.estimated_wedding_date)
  const days = calendarDays(profile.estimated_wedding_date)
  const events = (profile.sessions || []).filter(Boolean)
  const photos = flattenPhotos(profile.gallery_photos)
  const coverSlices = flattenPhotos(profile.cover_photos)
  const groomPhoto = groomPhotoOf(profile.groom_photo_url)
  const bridePhoto = bridePhotoOf(profile.bride_photo_url)
  const brideChild = coverSlices[0] || ASSET("bride-kid.png")
  const groomChild = coverSlices[1] || ASSET("groom-kid.png")
  const hasBrideChild = !!coverSlices[0]
  const hasGroomChild = !!coverSlices[1]
  const desktopPhoto = photos[0] || ASSET("love-story-1.webp")
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const hasVideo = gates.video !== false && profile.video_section_visible !== false && !!videoEmbed
  const hasGallery = photos.length > 0 || hasVideo
  const stories = gates.story !== false && profile.story_visible !== false
    ? (profile.stories || []).filter((s) => s && (s.title || s.description || s.image_url))
    : []
  const hasStory = stories.length > 0
  const hasDresscode = profile.dresscode_visible !== false && !!profile.dresscode && (profile.dresscode.colors?.length ?? 0) > 0
  const hasLivestream = profile.livestream_visible !== false && !!profile.livestream?.url
  const hasEvents = events.length > 0 || hasLivestream
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "") : ""
  const hasGift = profile.gift_section_visible !== false && (accounts.length > 0 || !!giftAddress)
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false
    ? (profile.inviting_families || []).filter(Boolean)
    : []
  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
  const hasTrack = !!trackUrl
  const calendarUrl = gcalLink(events[0], groomShort, brideShort)
  const showGuestDock =
    opened &&
    !profile.template_demo &&
    lightbox === null &&
    !videoOpen &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const coverKicker = tc.cover_kicker || "Dua Insan Ini\nAkan Menikah"
  const profilesIntro = tc.profiles_intro || "Dua hati, satu playlist, dan nol kesepakatan soal mau makan apa."
  const storyIntro = tc.story_intro || "Dari pertemuan tak sengaja hingga seumur hidup saling memilih."
  const galleryIntro = tc.gallery_intro || "Beberapa bingkai yang telah kami lalui bersama, tersimpan seperti foto lama di album keluarga."
  const galleryQuote = tc.gallery_quote || "Di antara sapaan pertama dan setiap hari esok, kami menemukan selamanya."
  const giftIntroTitle = tc.gift_intro_title || "Hadiah Pernikahan"
  const giftIntroDescription = tc.gift_intro_description || "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya dapat ditemukan di bawah ini."
  const wishesIntro = tc.wishes_intro || "Tinggalkan beberapa harapan dan doa untuk kedua mempelai."
  const closingMessage = tc.closing_message || "Merupakan suatu kehormatan dapat berbagi hari ini dengan Anda, dan terus menulis kisah kami dikelilingi orang-orang yang kami cintai."
  const displayName = profile.display_name || `#${`${groomShort}${brideShort}`.replace(/\s+/g, "") || "OurWedding"}`
  const dressDescription = profile.dresscode?.description || describePalette(profile.dresscode?.colors)
  const storyFallbacks = [
    ASSET("love-story-1.webp"),
    ASSET("love-story-2.webp"),
    ASSET("love-story-3.webp"),
  ]
  const storyPhotos = stories.length
    ? stories.slice(0, 3).map((s, index) => s.image_url || storyFallbacks[index] || storyFallbacks[0])
    : storyFallbacks
  const thankYouPhoto = photos[1] || photos[0] || groomPhoto || bridePhoto || ASSET("love-story-2.webp")
  const videoPoster = photos[0] || coverSlices[0] || groomPhoto || bridePhoto || ASSET("love-story-1.webp")
  const galleryItems = photos.slice(0, 12)
  const galleryRows = Math.max(1, Math.ceil(galleryItems.length / 3))
  const A = ASSETS.galeriEnvelope.aksaraaLogo
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`
  const rootStyle = {
    "--primary-color": "#820e03",
    "--secondary-color": "#f5f2f0",
    "--cover-scale": String(coverScale),
    "--layout-scale": String(layoutScale),
  } as CSSProperties

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(""), 2400)
  }, [])

  useEffect(() => {
    const leave = window.setTimeout(() => setPreloaderLeaving(true), 3000)
    const done = window.setTimeout(() => setLoading(false), 3700)
    return () => {
      window.clearTimeout(leave)
      window.clearTimeout(done)
    }
  }, [])

  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const widthScale = Math.min(1, w / 430)
      setLayoutScale(widthScale)
      setCoverScale(Math.max(0.55, Math.min(1, h / (932 * widthScale))))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  useEffect(() => {
    const locked = loading || !opened
    const previous = document.body.style.overflow
    document.body.style.overflow = locked ? "hidden" : previous || ""
    return () => { document.body.style.overflow = previous }
  }, [loading, opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const sections = Array.from(root.querySelectorAll<HTMLElement>(".invitation > section:not(.cover)"))
    sections.forEach((section) => {
      const revealClass = section.classList.contains("verse")
        ? "verse-reveal-enabled"
        : section.classList.contains("profiles")
          ? "profiles-reveal-enabled"
          : "section-reveal-enabled"
      section.classList.add(revealClass)
    })
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: "0px 0px -14% 0px", threshold: 0.08 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [opened])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    if (hasTrack && profile.auto_play !== false) {
      const audio = audioRef.current
      if (audio) {
        audio.play().then(() => setPlaying(true), () => setPlaying(false))
      }
    }
  }, [hasTrack, profile.auto_play])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => setPlaying(true), () => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }, [])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast("Copied")
    } catch {
      showToast("Could not copy")
    }
  }, [showToast])

  const openGallery = useCallback((index: number) => {
    if (!spread) {
      setSpread(true)
      return
    }
    setLightbox(index)
  }, [spread])

  return (
    <div ref={rootRef} className={`evermore-root${loading ? " is-loading" : ""}${opened ? "" : " invitation-locked"}`} style={rootStyle}>
      {!loading && null}
      {loading && (
        <div className={`evermore-preload${preloaderLeaving ? " is-leaving" : ""}`} role="status" aria-live="polite" aria-label="Loading invitation" style={{ "--fill": "100%" } as CSSProperties}>
          <div className="evermore-preload__assets" aria-hidden="true">
            <img src={ASSET("bride-kid.png")} alt="" />
            <img src={ASSET("groom-kid.png")} alt="" />
            <img src={ASSET("mask-photo-small.svg")} alt="" />
            <img src={ASSET("mask-photo-large.svg")} alt="" />
            <img src={ASSET("solid-heart.svg")} alt="" />
          </div>
          <div className="evermore-preload__heart-mask">
            <span className="evermore-ornament evermore-preload__heart" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("solid-heart.svg")) } as CSSProperties} />
          </div>
          <div className="evermore-preload__stack">
            <p className="evermore-preload__love">love</p>
            <p className="evermore-preload__names">{coupleLabel}</p>
            {coupleInitials && <p className="evermore-preload__initials">{coupleInitials}</p>}
          </div>
          <img className="evermore-preload__brand" src={A} alt="Aksaraa Wedding" />
        </div>
      )}

      {hasTrack && (
        <audio ref={audioRef} loop preload="metadata">
          <source src={trackUrl} type="audio/mpeg" />
        </audio>
      )}

      {hasTrack && (
        <button className={`tpl-music-btn${opened ? " visible" : ""}${playing ? "" : " paused"}`} type="button" aria-label="Toggle music" onClick={toggleMusic}>
          <span className="tpl-vinyl">
            <span className="tpl-vinyl-groove tpl-vinyl-groove-1" />
            <span className="tpl-vinyl-groove tpl-vinyl-groove-2" />
            <span className="tpl-vinyl-label" />
            <span className="tpl-vinyl-hole" />
          </span>
          <span className="tpl-tonearm">
            <span className="tpl-tonearm-pivot" />
            <span className="tpl-tonearm-arm" />
            <span className="tpl-tonearm-head" />
          </span>
        </button>
      )}

      <div className="desktop-layout">
        <aside className="desktop-cover" aria-hidden="true" style={{ backgroundImage: `linear-gradient(180deg, rgb(245 242 240 / 76%), rgb(245 242 240 / 84%)), ${cssUrl(desktopPhoto)}`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="desktop-cover__content">
            <p className="desktop-cover__label">The Wedding Of</p>
            <h1>{groomShort} &amp;<br />{brideShort}</h1>
            {dateLong && <p className="desktop-cover__date">{dateLong}</p>}
          </div>
        </aside>

        <main className="invitation" aria-label="Wedding invitation">
          <section className={`cover${opened ? " is-open" : ""}`} aria-label="Wedding invitation cover">
            <div className="artboard">
              <span className="evermore-ornament ring" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("diamond-ring.svg")) } as CSSProperties} />
              <span className="evermore-ornament disco-ball" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("disco-ball.svg")) } as CSSProperties} />
              <span className="evermore-ornament sparkle sparkle-top" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
              <span className="evermore-ornament sparkle sparkle-left" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
              <header className="hero-copy">
                <h1>
                  {coverKicker.split(/\n|\|/).map((line, index) => (
                    <span key={index}>{line}{index < coverKicker.split(/\n|\|/).length - 1 && <br />}</span>
                  ))}
                </h1>
                {dateLong && <p>{dateLong}</p>}
              </header>
              <span className="evermore-ornament rays" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("celebration-rays.svg")) } as CSSProperties} />
              <div className={`photo photo-girl${hasBrideChild ? " has-photo" : ""}`} aria-hidden="true" style={{ backgroundImage: cssUrl(brideChild) }} />
              <div className={`photo photo-boy${hasGroomChild ? " has-photo" : ""}`} aria-hidden="true" style={{ backgroundImage: cssUrl(groomChild) }} />
              <span className="evermore-ornament couple" role="img" aria-label="Illustration of the couple" style={{ "--ornament-mask": cssUrl(ASSET("couple-holding-signs.svg")) } as CSSProperties} />
              <section className="invitation-copy">
                <p className="dear">Dear,</p>
                <h2>{guestName}</h2>
              </section>
              <button className="open-button" type="button" onClick={openInvitation}>
                <span className="envelope" aria-hidden="true" />
                <span>Open Invitation</span>
              </button>
            </div>
          </section>

          <section className="verse" aria-labelledby="verse-title">
            <div className="verse-content">
              <div className="verse-hashtag">
                <span className="evermore-ornament verse-rays" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("celebration-rays.svg")) } as CSSProperties} />
                <h2 id="verse-title">{displayName}</h2>
                <span className="evermore-ornament verse-sparkle" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
              </div>
              {profile.quote_text && (
                <p className="verse-copy">
                  {profile.quote_text.split(/\s+/).filter(Boolean).map((word, index) => (
                    <span key={`${word}-${index}`} className="verse-word" style={{ "--word-index": index } as CSSProperties}>{word}{" "}</span>
                  ))}
                </p>
              )}
              {profile.quote_source && <p className="verse-reference">{profile.quote_source}</p>}
              <span className="evermore-ornament verse-heart" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("heart-string-hands.svg")) } as CSSProperties} />
            </div>
          </section>

          <section className="profiles" aria-label="Bride and groom">
            <header className="profiles-intro">
              <h2>Bride &amp; Groom</h2>
              <p>{profilesIntro}</p>
            </header>
            <article className="profile-card profile-card-groom">
              <div className="profile-art" aria-hidden="true">
                <div className="profile-photo profile-groom" style={{ backgroundImage: cssUrl(groomPhoto) }} />
                <span className="evermore-ornament profile-frame" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("scalloped-bow-frame.svg")) } as CSSProperties} />
              </div>
              <div className="profile-copy">
                <h2>{groomShort}</h2>
                {groomFull && groomFull !== groomShort && <p className="profile-fullname">{groomFull}</p>}
                {profile.groom_parents && <strong><span>{profile.groom_parents}</span></strong>}
                {profile.groom_instagram && (
                  <a className="profile-instagram" href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                    <span>@{profile.groom_instagram.replace(/^@/, "")}</span>
                  </a>
                )}
              </div>
            </article>
            <span className="evermore-ornament profile-heart" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("solid-heart.svg")) } as CSSProperties} />
            <article className="profile-card profile-card-bride">
              <div className="profile-art" aria-hidden="true">
                <div className="profile-photo profile-bride" style={{ backgroundImage: cssUrl(bridePhoto) }} />
                <span className="evermore-ornament profile-frame" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("scalloped-bow-frame.svg")) } as CSSProperties} />
              </div>
              <div className="profile-copy">
                <h2>{brideShort}</h2>
                {brideFull && brideFull !== brideShort && <p className="profile-fullname">{brideFull}</p>}
                {profile.bride_parents && <strong><span>{profile.bride_parents}</span></strong>}
                {profile.bride_instagram && (
                  <a className="profile-instagram" href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                    <span>@{profile.bride_instagram.replace(/^@/, "")}</span>
                  </a>
                )}
              </div>
            </article>
          </section>

          {hasStory && (
            <section className="love-story" aria-labelledby="love-story-title">
              <header className="love-story-intro">
                <h2 id="love-story-title">Love Story</h2>
                <p>{storyIntro}</p>
              </header>
              <div className="love-story-layout">
                <div className="story-timeline">
                  {stories.map((story, index) => (
                    <article className="story-entry" key={`${story.title || "story"}-${index}`}>
                      <h3>{story.title || `Chapter ${index + 1}`}</h3>
                      <p>{story.description}</p>
                    </article>
                  ))}
                </div>
                <div className="love-story-gallery" aria-label="Love story photos">
                  {storyPhotos.map((src, index) => (
                    <figure key={`${src}-${index}`} className={`story-photo story-photo-${["one", "two", "three"][index]}`}>
                      <img src={src} alt={`${coupleLabel} story photo ${index + 1}`} loading="lazy" decoding="async" />
                    </figure>
                  ))}
                  <span className="evermore-ornament story-shoes" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("bridal-shoes-with-bows.svg")) } as CSSProperties} />
                </div>
              </div>
            </section>
          )}

          <section className="countdown" aria-labelledby="countdown-title">
            <div className="countdown-calendar" aria-label={dateLong || "Wedding date"}>
              <ol className="countdown-dates">
                {days.map((day, index) => (
                  <li key={`${day}-${index}`} className={`countdown-date countdown-date-${18 + index}`}>
                    <span>{day}</span>
                    {index === 2 && (
                      <svg className="countdown-dday-circle" viewBox="0 0 160 140" aria-hidden="true" focusable="false">
                        <path pathLength="1" d="M 18 69 C 16 42 38 19 73 15 C 109 11 139 28 143 57 C 147 87 122 113 86 119 C 52 124 23 106 18 78 C 17 75 17 72 18 69 Z" />
                        <path pathLength="1" opacity=".68" d="M 22 65 C 22 38 48 16 80 17 C 114 18 140 38 139 66 C 138 94 111 116 78 117 C 45 118 20 98 21 71 C 21 69 21 67 22 65 Z" />
                        <path pathLength="1" opacity=".48" d="M 27 70 C 28 47 48 25 78 23 C 108 21 132 38 134 61 C 136 86 111 105 82 110 C 52 112 28 96 26 74 C 26 73 26 71 27 70 Z" />
                      </svg>
                    )}
                  </li>
                ))}
              </ol>
              <span className="countdown-dday">D-day</span>
            </div>
            <div className="countdown-heading"><h2 id="countdown-title">Counting Down To Forever</h2></div>
            <div className="countdown-timer" aria-live="polite">
              <span className="evermore-ornament countdown-sparkle countdown-sparkle-left" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
              <span className="evermore-ornament countdown-sparkle countdown-sparkle-right" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
              <div className="countdown-time-grid">
                <div className="countdown-time-part"><span>{countdown?.d ?? "00"}</span><small>Days</small></div>
                <div className="countdown-time-part"><span>{countdown?.h ?? "00"}</span><small>Hours</small></div>
                <div className="countdown-time-part"><span>{countdown?.m ?? "00"}</span><small>Minutes</small></div>
                <div className="countdown-time-part"><span>{countdown?.s ?? "00"}</span><small>Seconds</small></div>
              </div>
            </div>
            {calendarUrl && (
              <a className="save-date" href={calendarUrl} target="_blank" rel="noopener noreferrer">
                <span className="save-date-icon" aria-hidden="true" />
                <span>SAVE THE DATE</span>
              </a>
            )}
          </section>

          {hasEvents && (
            <section className="events" aria-label="Wedding events">
              <div className="events-intro" aria-hidden="true">
                <span className="evermore-ornament event-candles" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("vintage-candles.svg")) } as CSSProperties} />
              </div>
              {events.map((event, index) => (
                <article key={`${event.name || "event"}-${index}`} className={`event-block ${index === 0 ? "event-akad" : "event-extra"}`}>
                  <h2>{event.name || "Wedding Event"}</h2>
                  <div className="event-details">
                    <p className="event-detail-row">
                      <span className="event-detail-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7 3.5v3M17 3.5v3M3.5 9h17" /></svg></span>
                      <span>{longDate(event.date || profile.estimated_wedding_date)}</span>
                    </p>
                    {event.time && (
                      <p className="event-detail-row">
                        <span className="event-detail-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg></span>
                        <span>{event.time}</span>
                      </p>
                    )}
                    {event.venue && (
                      <p className="event-detail-row event-venue">
                        <span className="event-detail-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.25" /></svg></span>
                        <span>{event.venue}</span>
                      </p>
                    )}
                    {event.address && (
                      <p className="event-detail-row event-address">
                        <span>{event.address}</span>
                      </p>
                    )}
                  </div>
                  {event.maps_url && (
                    <a className="event-button" href={event.maps_url} target="_blank" rel="noopener noreferrer">
                      <span className="event-button-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.25" /></svg></span>
                      <span>OPEN MAPS</span>
                    </a>
                  )}
                </article>
              ))}
              {hasLivestream && (
                <article className="event-block event-streaming">
                  <h2>{profile.livestream?.title || "Join Us Online"}</h2>
                  <p className="event-streaming-copy">{profile.livestream?.description || "Can't make it in person? Join the live stream and celebrate this lovely day with us from wherever you are."}</p>
                  <a className="event-button" href={profile.livestream!.url} target="_blank" rel="noopener noreferrer">
                    <span className="event-button-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3V9Z" /></svg></span>
                    <span>{profile.livestream?.buttonLabel || "Watch Live Stream"}</span>
                  </a>
                </article>
              )}
              <span className="evermore-ornament events-dinner events-dinner-right" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("romantic-dinner-table.svg")) } as CSSProperties} />
              <span className="evermore-ornament events-dinner events-dinner-left" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("romantic-dinner-table.svg")) } as CSSProperties} />
            </section>
          )}

          {hasDresscode && (
            <section className="dress-code" aria-labelledby="dress-code-title">
              <header className="dress-code-intro">
                <h2 id="dress-code-title">{profile.dresscode?.title || "Dress Code"}</h2>
                {dressDescription && <p>{dressDescription}</p>}
              </header>
              <div className="dress-code-swatches" role="list" aria-label="Dress code colors">
                {profile.dresscode!.colors!.map((color, index) => (
                  <span key={`${color.hex || color.name}-${index}`} className="dress-swatch" role="listitem" aria-label={color.name || color.hex || `Color ${index + 1}`} style={{ background: color.hex || "#ccc", borderColor: color.hex || "#ccc" }} />
                ))}
              </div>
              <span className="evermore-ornament dress-code-bow" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("ribbon-bow.svg")) } as CSSProperties} />
            </section>
          )}

          {hasGallery && (
            <section className="gallery" aria-labelledby="gallery-title">
              <header className="gallery-intro">
                <span className="evermore-ornament gallery-title-sparkle gallery-title-sparkle-left" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
                <span className="evermore-ornament gallery-title-sparkle gallery-title-sparkle-right" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("four-point-sparkles.svg")) } as CSSProperties} />
                <h2 id="gallery-title">Captured Moments</h2>
                <p>{galleryIntro}</p>
              </header>
              {galleryItems.length > 0 && (
                <>
                  <div className={`gallery-stack${spread ? " is-spread" : ""}`} style={spread ? { height: `${galleryRows * 145 + 24}px` } : undefined} aria-describedby="gallery-hint">
                    {galleryItems.map((src, index) => {
                      const pos = galleryPosition(index, galleryItems.length)
                      return (
                        <button
                          key={`${src}-${index}`}
                          className="gallery-polaroid"
                          type="button"
                          aria-label={spread ? `View gallery photo ${index + 1}` : "Spread gallery"}
                          onClick={() => openGallery(index)}
                          style={spread ? { "--gallery-x": `${pos.x}px`, "--gallery-y": `${pos.y}px`, "--gallery-rotation": `${pos.rotation}deg`, "--gallery-scale": "0.58" } as CSSProperties : undefined}
                        >
                          <span className="gallery-polaroid-paper">
                            <img src={src} alt={`${coupleLabel} gallery photo ${index + 1}`} loading="lazy" decoding="async" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="gallery-hint" id="gallery-hint">{spread ? "Tap a photo to view it larger" : "Tap the stack to spread our memories"}</p>
                </>
              )}
              <blockquote className="gallery-quote">
                <p>{galleryQuote}</p>
                <cite>~ {coupleLabel}</cite>
              </blockquote>
              {hasVideo && (
                <div className="gallery-video-card">
                  <span className="gallery-video-cover" style={{ backgroundImage: cssUrl(videoPoster) }} aria-hidden="true" />
                  <span className="gallery-video-play" aria-hidden="true"><span /></span>
                  <button className="gallery-video-hitarea" type="button" aria-label="Play video with sound" onClick={() => setVideoOpen(true)} />
                </div>
              )}
            </section>
          )}

          <section className="rsvp" aria-labelledby="rsvp-title">
            <header className="rsvp-intro">
              <h2 id="rsvp-title">Wishes &amp; Prayers</h2>
              <p>{wishesIntro}</p>
            </header>
            <Wishes
              weddingProfileId={profile.wedding_profile_id}
              guestId={profile.guest_id}
              guestName={profile.guest_name}
              guestLinkStrict={profile.guest_link_strict}
              coupleName={coupleLabel}
            />
          </section>

          {hasGift && (
            <section className="gift" aria-labelledby="gift-title">
              <header className="gift-intro">
                <h2 id="gift-title">{giftIntroTitle}</h2>
                <p>{giftIntroDescription}</p>
              </header>
              <div className="gift-panel">
                {accounts.map((account, index) => (
                  <article className="gift-bank-card" key={`${account.account_number || "account"}-${index}`}>
                    <div className="gift-bank-content">
                      <p className="gift-bank-provider">{account.provider_name || "Bank Transfer"}</p>
                      <p className="gift-bank-number">{account.account_number}</p>
                      <p className="gift-bank-holder">{account.account_name}</p>
                      <button className="gift-copy-button" type="button" onClick={() => copy(account.account_number || "")}>
                        <svg className="gift-copy-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
                        <span>Copy</span>
                      </button>
                    </div>
                  </article>
                ))}
                {giftAddress && (
                  <article className="gift-bank-card gift-address-card">
                    <div className="gift-bank-content">
                      <p className="gift-address-label">Send a Gift</p>
                      <p className="gift-address-text">{giftAddress}</p>
                      {profile.gift_address_name && <p className="gift-bank-holder">{profile.gift_address_name}</p>}
                      <button className="gift-copy-button" type="button" onClick={() => copy(giftAddress)}>
                        <svg className="gift-copy-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
                        <span>Copy</span>
                      </button>
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}

          {honored.length > 0 && (
            <section className="honored-guests" aria-label="Turut Mengundang">
              {/* No heading: the ornament and the list carry the block on their
                  own, as the reference does. The label survives for a11y. */}
              <div className="honored-guests-intro">
                <span className="evermore-ornament honored-guests-heart" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("solid-heart.svg")) } as CSSProperties} />
              </div>
              <div className="honored-guests-grid">
                <div className="honored-guests-column">
                  <p className="honored-guests-label">Keluarga &amp; Sahabat</p>
                  <ul className="honored-guests-names">
                    {honored.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
                  </ul>
                </div>
              </div>
            </section>
          )}

          <section className="thank-you" aria-labelledby="thank-you-title">
            <header className="thank-you-copy">
              <p className="thank-you-label">Thank You,</p>
              <h2 id="thank-you-title">{groomShort} &amp;<br />{brideShort}</h2>
              <p className="thank-you-message">{closingMessage}</p>
            </header>
            <figure className="thank-you-polaroid">
              <span className="evermore-ornament thank-you-camera" aria-hidden="true" style={{ "--ornament-mask": cssUrl(ASSET("polaroid.svg")) } as CSSProperties} />
              <span className="thank-you-photo-strip">
                <img src={thankYouPhoto} alt={`${coupleLabel} together`} loading="lazy" decoding="async" />
              </span>
            </figure>
            <footer className="thank-you-footer">
              <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Hubungi Aksaraa Wedding via WhatsApp">
                <img className="thank-you-footer-logo" src={A} alt="Aksaraa Wedding" />
              </a>
              <p>© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
              <nav className="thank-you-footer-socials" aria-label="Aksaraa links">
                <a href={waHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.2-5.4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 9.5c.4 2 2 3.7 4 4.1l1.2-1.2 1.8.8c-.2 1.2-1.2 2-2.6 2-2.8 0-5.3-2.5-5.3-5.3 0-1.4.8-2.4 2-2.6l.8 1.8-1.9.4Z" /></svg>
                </a>
              </nav>
            </footer>
          </section>
        </main>
      </div>

      {toast && <div className="evermore-toast">{toast}</div>}

      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-[10000] flex cursor-pointer items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white" onClick={(event) => event.stopPropagation()}>
            {lightbox + 1} / {photos.length}
          </div>
          <button type="button" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(event) => { event.stopPropagation(); setLightbox(null) }} aria-label="Close">✕</button>
          {photos.length > 1 && (
            <button type="button" className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(event) => { event.stopPropagation(); setLightbox((lightbox - 1 + photos.length) % photos.length) }} aria-label="Previous">‹</button>
          )}
          <img src={photos[lightbox]} alt="" draggable="false" className="max-h-[90vh] max-w-[95vw] select-none rounded-md object-contain" onClick={(event) => event.stopPropagation()} />
          {photos.length > 1 && (
            <button type="button" className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(event) => { event.stopPropagation(); setLightbox((lightbox + 1) % photos.length) }} aria-label="Next">›</button>
          )}
        </div>
      )}

      {videoOpen && videoEmbed && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "clamp(12px, 4vw, 48px)" }} onClick={() => setVideoOpen(false)} role="dialog" aria-modal="true" aria-label="Wedding film">
          <button type="button" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-[26px] leading-none text-white" onClick={() => setVideoOpen(false)} aria-label="Close">×</button>
          <div className="relative aspect-video w-full max-w-[1100px] overflow-hidden rounded-lg" style={{ maxHeight: "85vh" }} onClick={(event) => event.stopPropagation()}>
            <iframe
              src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=1`}
              title="Wedding film"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>,
        document.body
      )}

      {showGuestDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestName}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          bottom={80}
        />
      )}
    </div>
  )
}
