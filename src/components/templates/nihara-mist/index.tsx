"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import { coverPhoto, photoList, initialsGlyphs } from "../shared/lib"
import AutoplayYouTube from "../shared/AutoplayYouTube"
import InvitationOverlay from "@/components/InvitationOverlay"
import { copyPlainText } from "@/lib/clipboard"
import Wishes from "./Wishes"
import "./nihara-mist.css"
import { normalizeLanguage, t } from "@/lib/i18n"

type SceneName = "cover" | "verse" | "couple" | "events" | "dresscode" | "finale"

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]
const DAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const DAYS_ID = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"]

function parseIso(iso?: string) {
  const m = (iso || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) }
}

function longDate(iso: string | undefined, lang: "id" | "en") {
  const p = parseIso(iso)
  if (!p) return ""
  const date = new Date(Date.UTC(p.y, p.m, p.d))
  const days = lang === "en" ? DAYS_EN : DAYS_ID
  const months = lang === "en" ? MONTHS_EN : MONTHS_ID
  return `${days[date.getUTCDay()]}, ${p.d} ${months[p.m]} ${p.y}`
}

function shortDate(iso?: string) {
  const p = parseIso(iso)
  return p ? `${String(p.d).padStart(2, "0")} . ${String(p.m + 1).padStart(2, "0")} . ${String(p.y).slice(2)}` : ""
}

function initialsOf(groom?: string, bride?: string) {
  const a = (groom || "").trim().charAt(0)
  const b = (bride || "").trim().charAt(0)
  return `${a}${b}`.toUpperCase() || "A"
}

// cover_photos can hold nested groups (e.g. a slideshow slot stored as an
// array). Flatten everything so indices always resolve to a single URL.
function flattenPhotos(value: unknown): string[] {
  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return []
    if (s.startsWith("[")) {
      try {
        return flattenPhotos(JSON.parse(s))
      } catch {
        return [s]
      }
    }
    return [s]
  }
  if (Array.isArray(value)) return value.flatMap(flattenPhotos)
  return []
}

function describePalette(colors: { hex?: string; name?: string }[] | undefined, lang: "id" | "en"): string {
  const names = (colors || []).map((c) => (c.name || "").trim()).filter(Boolean)
  if (!names.length) return ""
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} & ${names[1]}`
        : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`
  return lang === "en" ? `Elegant Attire in ${list}.` : `Busana elegan bernuansa ${list}.`
}

function useCountdown(iso?: string) {
  const target = useMemo(() => {
    const p = parseIso(iso)
    if (!p) return null
    return Date.UTC(p.y, p.m, p.d, 1, 0, 0)
  }, [iso])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  if (!target) return null
  const diff = Math.max(0, target - now)
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  }
}

function calendarUrl(title: string, iso: string | undefined, location: string) {
  const p = parseIso(iso)
  if (!p) return ""
  const stamp = (day: number) => `${p.y}${String(p.m + 1).padStart(2, "0")}${String(day).padStart(2, "0")}T010000Z`
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(p.d)}/${stamp(p.d + 1)}`,
    location,
    details: title,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function youtubeId(url?: string) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v")
      const m = /^\/(?:embed|shorts|live)\/([^/?]+)/.exec(u.pathname)
      return m ? m[1] : null
    }
    return null
  } catch {
    return null
  }
}


export default function NiharaMist(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const tc = (profile.template_content || {}) as Record<string, string>
  const gates = profile.feature_gates || {}
  const dresscode = profile.dresscode
  const hasDresscode = profile.dresscode_visible !== false && !!dresscode && (dresscode.colors?.length ?? 0) > 0
  const dressDescription = describePalette(dresscode?.colors, lang)
  const livestream = profile.livestream
  const hasLivestream = profile.livestream_visible !== false && !!livestream?.url

  const scenes = useMemo<SceneName[]>(() => {
    const list: SceneName[] = ["cover", "verse", "couple", "events"]
    if (hasDresscode) list.push("dresscode")
    list.push("finale")
    return list
  }, [hasDresscode])
  const finaleIndex = scenes.length - 1
  const events = (profile.sessions || []).filter(Boolean)
  const eventCount = Math.max(events.length + (hasLivestream ? 1 : 0), 1)
  const stepsOf = useCallback((name: SceneName) => (name === "couple" ? 2 : name === "events" ? eventCount : 1), [eventCount])

  const [preloadDone, setPreloadDone] = useState(false)
  const [preloadLeaving, setPreloadLeaving] = useState(false)
  const [opened, setOpened] = useState(false)
  const [scene, setScene] = useState<SceneName>("cover")
  const [step, setStep] = useState(0)
  const [leavingScene, setLeavingScene] = useState<SceneName | null>(null)
  const [dirBack, setDirBack] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [toast, setToast] = useState("")
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [videoModal, setVideoModal] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const finaleVideoRef = useRef<HTMLVideoElement | null>(null)
  const finaleMediaRef = useRef<HTMLDivElement | null>(null)
  const finaleIframeRef = useRef<HTMLIFrameElement | null>(null)
  const finaleScrollRef = useRef<HTMLDivElement | null>(null)
  const lockRef = useRef(false)
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sceneRef = useRef(scene)

  useEffect(() => { sceneRef.current = scene }, [scene])

  const coupleLabel = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ") || t("theWeddingOf", lang)
  const groomShort = profile.groom_name || ""
  const brideShort = profile.bride_name || ""
  const groomFull = profile.groom_full_name || ""
  const brideFull = profile.bride_full_name || ""
  const initials = (profile.couple_initials || "").trim() || initialsOf(groomShort, brideShort)
  const initialsList = initialsGlyphs(initials)
  const monogramClass = initialsList.length > 4 ? " is-longer" : initialsList.length > 2 ? " is-long" : ""
  const cover = coverPhoto(profile)
  const gallery = flattenPhotos(profile.gallery_photos)
  const coverList = flattenPhotos(profile.cover_photos)
  const bgVerse = coverList[1] || gallery[0] || cover
  const bgEvents = coverList[2] || gallery[1] || bgVerse
  const bgDress = coverList[3] || gallery[2] || bgEvents
  const bgDesk = coverList[1] || gallery[0] || cover
  const stories = gates.story !== false && profile.story_visible !== false ? (profile.stories || []).filter((s) => s && (s.title || s.description || s.image_url)) : []
  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress = gates.gift_address !== false ? (profile.gift_address || "") : ""
  const honored = gates.inviting_families !== false && profile.inviting_families_visible !== false
    ? (profile.inviting_families || []).filter(Boolean)
    : []
  const guestName = profile.guest_name || t("honoredGuest", lang)
  const dateLong = longDate(profile.estimated_wedding_date, lang)
  const dateShort = shortDate(profile.estimated_wedding_date)
  const countdown = useCountdown(profile.estimated_wedding_date)
  const hasTrack = !!profile.track_url
  const groomPhoto = photoList(profile.groom_photo_url)[0]
  const bridePhoto = photoList(profile.bride_photo_url)[0]
  const couplePhoto = step === 0
    ? (groomPhoto || bridePhoto || cover)
    : (bridePhoto || groomPhoto || cover)
// Gallery now flows as a single continuous strip
  const galleryItems = gallery
  const videoId = youtubeId(profile.video_url)
  const hasVideo = !!videoId && gates.video !== false && profile.video_section_visible !== false
  const calUrl = calendarUrl(`${t("theWeddingOf", lang)} ${coupleLabel}`, profile.estimated_wedding_date, events[0]?.venue || events[0]?.address || "")
  const showGuestDock =
    opened &&
    lightbox === null &&
    !videoModal &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(""), 2500)
  }, [])

  // Preloader: hold for 4.5s, then fade out (reference minDuration).
  useEffect(() => {
    const min = window.setTimeout(() => setPreloadLeaving(true), 4500)
    const done = window.setTimeout(() => setPreloadDone(true), 5400)
    return () => { window.clearTimeout(min); window.clearTimeout(done) }
  }, [])

  // Lock page scroll like the reference (html/body.nihara-active).
  useEffect(() => {
    const doc = rootRef.current?.ownerDocument || document
    doc.documentElement.classList.add("nihara-mist-active")
    doc.body.classList.add("nihara-mist-active")
    return () => {
      doc.documentElement.classList.remove("nihara-mist-active")
      doc.body.classList.remove("nihara-mist-active")
    }
  }, [])

  useEffect(() => {
    if (!hasVideo) return
    const el = finaleIframeRef.current
    if (!el) return
    let tries = 0
    const disableCaptions = () => {
      try {
        const win = el.contentWindow
        if (!win) return
        win.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*")
        win.postMessage(JSON.stringify({ event: "command", func: "unloadModule", args: ["captions"] }), "*")
        win.postMessage(JSON.stringify({ event: "command", func: "unloadModule", args: ["cc"] }), "*")
      } catch {
        /* ignore */
      }
    }
    el.addEventListener("load", disableCaptions)
    const id = window.setInterval(() => {
      disableCaptions()
      tries += 1
      if (tries >= 10) window.clearInterval(id)
    }, 1000)
    return () => {
      el.removeEventListener("load", disableCaptions)
      window.clearInterval(id)
    }
  }, [hasVideo, videoId])

  const lock = useCallback((ms: number) => {
    lockRef.current = true
    if (lockTimer.current) clearTimeout(lockTimer.current)
    lockTimer.current = setTimeout(() => { lockRef.current = false }, ms)
  }, [])

  const enterFinale = useCallback(() => {
    const v = finaleVideoRef.current
    if (v) {
      v.style.visibility = "visible"
      v.play().catch(() => undefined)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (v.paused) v.play().catch(() => undefined)
      }))
    }
    const el = finaleScrollRef.current
    if (el) {
      el.scrollTop = 0
      el.style.overflowY = "hidden"
      setTimeout(() => { el.style.overflowY = "auto" }, 750)
    }
  }, [])

  const leaveFinale = useCallback(() => {
    const v = finaleVideoRef.current
    if (v) { v.pause(); v.style.visibility = "" }
  }, [])

  const go = useCallback((next: SceneName, forward: boolean) => {
    const current = sceneRef.current
    if (current === next) return
    setLeavingScene(current)
    setDirBack(!forward)
    setStep(0)
    setHintVisible(false)
    lock(2900)
    if (scenes.indexOf(next) === finaleIndex) enterFinale()
    if (scenes.indexOf(current) === finaleIndex) leaveFinale()
    setScene(next)
    window.setTimeout(() => setLeavingScene(null), 2900)
  }, [scenes, finaleIndex, enterFinale, leaveFinale, lock])

  const advance = useCallback(() => {
    if (!opened || lockRef.current) return
    const current = sceneRef.current
    const idx = scenes.indexOf(current)
    const max = stepsOf(current)
    if (step < max - 1) { setStep((v) => v + 1); lock(900); return }
    if (idx < scenes.length - 1) go(scenes[idx + 1], true)
  }, [opened, scenes, step, stepsOf, go, lock])

  const retreat = useCallback(() => {
    if (!opened || lockRef.current) return
    const current = sceneRef.current
    const idx = scenes.indexOf(current)
    if (step > 0) { setStep((v) => v - 1); lock(900); return }
    if (idx > 0) go(scenes[idx - 1], false)
  }, [opened, scenes, step, go, lock])

  // Deck interaction: wheel, touch, keyboard (reference behaviour).
  useEffect(() => {
    if (!opened) return
    const stage = rootRef.current?.querySelector(".nihara-stage")
    if (!(stage instanceof HTMLElement)) return
    const isFinale = () => sceneRef.current === "finale"
    let startY: number | null = null
    let lastWheel = 0

    const onWheel = (e: WheelEvent) => {
      if (isFinale()) {
        if (e.deltaY < -30 && (finaleScrollRef.current?.scrollTop ?? 0) <= 0) retreat()
        return
      }
      if (e.cancelable) e.preventDefault()
      if (!opened) return
      const now = Date.now()
      if (now - lastWheel < 900 || Math.abs(e.deltaY) < 24) return
      lastWheel = now
      if (e.deltaY > 0) advance(); else retreat()
    }
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0]?.clientY ?? null }
    const onTouchMove = (e: TouchEvent) => {
      if (!isFinale() && e.cancelable) e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (startY === null) return
      const endY = e.changedTouches[0]?.clientY ?? startY
      const dy = startY - endY
      startY = null
      if (isFinale()) {
        if (dy < -55 && (finaleScrollRef.current?.scrollTop ?? 0) <= 0) retreat()
        return
      }
      if (dy > 55) advance()
      else if (dy < -55) retreat()
    }
    const onKey = (e: KeyboardEvent) => {
      if (!opened) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); advance() }
      else if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); retreat() }
      else if (e.key === "Escape") setLightbox(null)
    }

    stage.addEventListener("wheel", onWheel, { passive: false })
    stage.addEventListener("touchstart", onTouchStart, { passive: true })
    stage.addEventListener("touchmove", onTouchMove, { passive: false })
    stage.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => {
      stage.removeEventListener("wheel", onWheel)
      stage.removeEventListener("touchstart", onTouchStart)
      stage.removeEventListener("touchmove", onTouchMove)
      stage.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("keydown", onKey)
    }
  }, [opened, advance, retreat])

  // Finale reveal + video parallax (reference IntersectionObserver setup).
  useEffect(() => {
    if (!opened || scene !== "finale") return
    const scroller = finaleScrollRef.current
    if (!scroller) return
    const observers: IntersectionObserver[] = []
    scroller.classList.add("io-armed")
    const bind = (cls: string, selector: string, rootMargin: string) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add(cls)
          else if (entry.boundingClientRect.top > (entry.rootBounds?.top ?? 0)) entry.target.classList.remove(cls)
        })
      }, { root: scroller, rootMargin, threshold: 0 })
      scroller.querySelectorAll(selector).forEach((el) => io.observe(el))
      observers.push(io)
    }
    bind("io-in", "[data-io]", "-25% 0px -25% 0px")
    bind("is-in", ".chapter, .mist-tile", "0px 0px -22% 0px")

    const onScroll = () => {
      const y = scroller.scrollTop
      const media = finaleMediaRef.current
      if (media) {
        const ty = Math.min(0.06 * y, 36)
        media.style.transform = `translateY(${ty}px) scale(${(1.04 + Math.min(y / 5000, 0.06)).toFixed(3)})`
      }
    }
    scroller.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      observers.forEach((o) => o.disconnect())
      scroller.classList.remove("io-armed")
      scroller.removeEventListener("scroll", onScroll)
    }
  }, [opened, scene])

  const openInvitation = useCallback(() => {
    setOpened(true)
    setStep(0)
    // Enter straight into the first content frame — no extra swipe needed after
    // "Open Invitation". The cover still plays its leave transition.
    go(scenes[1] || "verse", true)
    window.setTimeout(() => setHintVisible(true), 2000)
    window.setTimeout(() => setHintVisible(false), 11000)
    if (hasTrack && profile.auto_play !== false) {
      setPlaying(false)
      window.setTimeout(() => {
        const el = audioRef.current
        if (!el) return
        el.play().then(() => setPlaying(true), () => setPlaying(false))
      }, 80)
    }
  }, [go, scenes, hasTrack, profile.auto_play])

  const toggleMusic = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { el.play().then(() => setPlaying(true), () => undefined) }
    else { el.pause(); setPlaying(false) }
  }, [])

  const copy = useCallback(async (text: string) => {
    showToast((await copyPlainText(text)) ? t("copiedToClipboard", lang) : t("failedToCopy", lang))
  }, [showToast, lang])

  const isActive = (name: SceneName) => scene === name
  const isLeaving = (name: SceneName) => leavingScene === name
  const sceneClass = (name: SceneName) => {
    const cls = ["scene", `scene--${name}`]
    if (isActive(name)) cls.push("is-active")
    if (isLeaving(name)) cls.push("is-leaving")
    if (dirBack && (isActive(name) || isLeaving(name))) cls.push("dir-back")
    if (name === "cover" && preloadDone) cls.push("is-ready")
    return cls.join(" ")
  }
  const stageClass = [
    "nihara-stage",
    scene === "events" && !dirBack ? "stage--punch" : "",
    scene === "events" && leavingScene ? "stage--punch-enter" : "",
    scene === "couple" && !dirBack ? "stage--verse-out" : "",
    leavingScene ? "stage--transit" : "",
  ].filter(Boolean).join(" ")

  const A = ASSETS.galeriEnvelope.aksaraaLogo
  const waHref = `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`

  return (
    <div ref={rootRef} className="nihara-mist">
      {hasTrack && (
        <audio ref={audioRef} loop preload="metadata" data-warm-audio="">
          <source src={profile.track_url} type="audio/mpeg" />
        </audio>
      )}

      {!preloadDone && (
        <div
          className={`tpl-preload-root${preloadLeaving ? " is-leaving" : ""}`}
          role="status"
          aria-live="polite"
          aria-label={lang === "en" ? "Loading invitation" : "Memuat undangan"}
          style={{ "--tpl-preload-font-display": "var(--nihara-font-heading)", "--tpl-preload-accent": "var(--warm)" } as React.CSSProperties}
        >
          <div className="tpl-preload-vignette" aria-hidden="true" />
          <div className="tpl-preload-stage">
            <p className="tpl-preload-eyebrow">{t("theWeddingOf", lang)}</p>
            <p className="tpl-preload-names" style={{ "--names-len": Math.max(8, groomShort.length + brideShort.length + 3) } as React.CSSProperties}>
              <em>{groomShort}</em>
              <span className="tpl-preload-names__amp" aria-hidden="true">&amp;</span>
              <em>{brideShort}</em>
            </p>
            <div className="tpl-preload-monogram-mask" aria-hidden="true">
              <span className={`tpl-preload-monogram${monogramClass}`}>
                {initialsList.map((char, index) => (
                  <em key={index} className="tpl-preload-monogram__letter">{char}</em>
                ))}
              </span>
            </div>
          </div>
          <div className="tpl-preload-brand">
            <img src={A} alt="Aksaraa Wedding" className="tpl-preload-brand__logo" />
          </div>
        </div>
      )}

      <aside className="deskcover" aria-hidden="true">
        <div className="deskcover__bg">{bgDesk && <img src={bgDesk} alt="" decoding="async" />}</div>
        <div className="deskcover__veil" />
        <div className="deskcover__names">
          <p className="label">{t("theWeddingOf", lang)}</p>
          <h2 className="deskcover-sig">{coupleLabel}</h2>
        </div>
      </aside>

      <div className={stageClass} aria-live="polite">
        {/* COVER */}
        <section className={sceneClass("cover")} style={{ "--focus-x": profile.template_demo ? "58%" : "50%", "--focus-y": "34%" } as React.CSSProperties}>
          <div className="scene__bg"><div className="scene__zoom">{cover && <img src={cover} alt="" decoding="async" />}</div></div>
          <div className="scene__veil" />
          <div className="scene__content cover">
            <header className="cover__top">
              <p className="label reveal" style={{ "--d": ".2s" } as React.CSSProperties}>{t("theWeddingOf", lang)}</p>
              <h1 className="cover__names display reveal" style={{ "--d": ".45s" } as React.CSSProperties}>
                {groomShort} <em aria-hidden="true">&amp;</em><br />{brideShort}
              </h1>
              {dateLong && <p className="meta cover__date reveal" style={{ "--d": ".7s" } as React.CSSProperties}>{dateLong}</p>}
            </header>
            <footer className="cover__bottom">
              <div className="cover__guest reveal" style={{ "--d": "1s" } as React.CSSProperties}>
                <p className="label cover__greeting">{lang === "en" ? "Dear," : "Kepada Yth.,"}</p>
                <p className="cover__guest-name">{guestName}</p>
                <p className="cover__apology">{tc.cover_apology || (lang === "en" ? "We apologize for any error in the writing of names & titles" : "Mohon maaf apabila terdapat kesalahan penulisan nama dan gelar")}</p>
              </div>
              <button type="button" className="btn-open reveal" style={{ "--d": "1.25s" } as React.CSSProperties} onClick={openInvitation}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="2.5" y="5.5" width="19" height="13" rx="1.5" />
                  <path d="M3 6.5l9 7 9-7" />
                </svg>
                <span>{t("openInvitation", lang)}</span>
              </button>
            </footer>
          </div>
        </section>

        {/* VERSE */}
        <section className={sceneClass("verse")} style={{ "--focus-x": "50%", "--focus-y": "30%" } as React.CSSProperties} aria-hidden={!isActive("verse")}>
          <div className="scene__bg"><div className="scene__zoom">{bgVerse && <img src={bgVerse} alt="" decoding="async" />}</div></div>
          <div className="scene__veil scene__veil--deep" />
          <div className="scene__content verse">
            {profile.display_name && (
              <p className="verse__hashtag hand reveal" style={{ "--d": ".3s" } as React.CSSProperties}>{profile.display_name}</p>
            )}
            {profile.quote_text && (
              <blockquote className="verse__text serif-i reveal" style={{ "--d": ".6s" } as React.CSSProperties}>{profile.quote_text}</blockquote>
            )}
            {profile.quote_source && (
              <p className="label verse__attr reveal" style={{ "--d": ".9s" } as React.CSSProperties}>{profile.quote_source}</p>
            )}
          </div>
        </section>

        {/* COUPLE */}
        <section
          className={sceneClass("couple")}
          data-step={isActive("couple") ? step : 0}
          style={{ "--focus-x": "50%", "--focus-y": "100%" } as React.CSSProperties}
          aria-hidden={!isActive("couple")}
        >
          <div className="scene__bg">
            <div className="scene__zoom">
              {couplePhoto && (
                <img
                  src={couplePhoto}
                  alt=""
                  decoding="async"
                  style={{ objectPosition: "center 25%" }}
                />
              )}
            </div>
          </div>
          <div className="scene__veil scene__veil--couple" />
          <div className="scene__content couple">
            <article className={`couple-card${isActive("couple") && step === 0 ? " is-current" : ""}`}>
              <h2>{groomShort}</h2>
              {groomFull && groomFull !== groomShort && <p className="couple-card__full">{groomFull}</p>}
              {profile.groom_parents && <p className="couple-card__parents serif">{profile.groom_parents}</p>}
              {profile.groom_instagram && (
                <a className="btn-ig" href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  <span>{profile.groom_instagram.replace(/^@/, "")}</span>
                </a>
              )}
            </article>
            <article className={`couple-card${isActive("couple") && step === 1 ? " is-current" : ""}`}>
              <h2>{brideShort}</h2>
              {brideFull && brideFull !== brideShort && <p className="couple-card__full">{brideFull}</p>}
              {profile.bride_parents && <p className="couple-card__parents serif">{profile.bride_parents}</p>}
              {profile.bride_instagram && (
                <a className="btn-ig" href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  <span>{profile.bride_instagram.replace(/^@/, "")}</span>
                </a>
              )}
            </article>
          </div>
        </section>

        {/* EVENTS */}
        <section
          className={sceneClass("events")}
          data-step={isActive("events") ? step : 0}
          style={{ "--focus-x": "64%", "--focus-y": "40%" } as React.CSSProperties}
          aria-hidden={!isActive("events")}
        >
          <div className="scene__bg"><div className="scene__zoom">{bgEvents && <img src={bgEvents} alt="" decoding="async" />}</div></div>
          <div className="scene__veil scene__veil--events" />
          <div className="scene__content events">
            <div className="events__deck">
              {events.map((s, i) => (
                <article key={i} className={`event-card event-card--pos${i % 3}${isActive("events") && step === i ? " is-current" : ""}`}>
                  <h3 className="event-card__title">{s.name}</h3>
                  <p className="event-card__line">{longDate(s.date || profile.estimated_wedding_date)}</p>
                  {s.time && <p className="event-card__line event-card__line--dim">{s.time}</p>}
                  {s.venue && <p className="event-card__venue serif-i">{s.venue}</p>}
                  {s.address && <p className="event-card__addr">{s.address}</p>}
                  {s.maps_url && (
                    <a className="btn-map" href={s.maps_url} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <span>{t("viewLocation", lang).toUpperCase()}</span>
                    </a>
                  )}
                </article>
              ))}
              {hasLivestream && (
                <article className={`event-card event-card--pos${events.length % 3}${isActive("events") && step === events.length ? " is-current" : ""}`}>
                  <h3 className="event-card__title">{t("secLivestream", lang)}</h3>
                  <p className="event-card__venue serif-i">{lang === "en" ? "Join us virtually as we exchange our vows, for beloved family and friends who cannot be with us in person." : "Bergabunglah secara virtual saat kami mengucapkan janji suci, bagi keluarga dan sahabat yang belum dapat hadir."}</p>
                  <a className="btn-map" href={livestream.url} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
                      <path d="M10 9.2l5 2.8-5 2.8z" fill="currentColor" stroke="none" />
                    </svg>
                    <span>{t("watchLivestream", lang)}</span>
                  </a>
                </article>
              )}
            </div>
          </div>
        </section>

        {/* DRESS CODE */}
        {hasDresscode && (
          <section className={sceneClass("dresscode")} style={{ "--focus-x": "50%", "--focus-y": "36%" } as React.CSSProperties} aria-hidden={!isActive("dresscode")}>
            <div className="scene__bg"><div className="scene__zoom">{bgDress && <img src={bgDress} alt="" decoding="async" />}</div></div>
            <div className="scene__veil scene__veil--top" />
            <div className="scene__content dresscode">
              <h3 className="dresscode__title reveal" style={{ "--d": ".45s" } as React.CSSProperties}>{tc.dresscode_title || t("secDresscode", lang)}</h3>
              {dressDescription && (
                <p className="dresscode__desc serif-i reveal" style={{ "--d": ".65s" } as React.CSSProperties}>{dressDescription}</p>
              )}
              {(dresscode?.colors?.length ?? 0) > 0 && (
                <div className="dresscode__swatches reveal" style={{ "--d": ".85s" } as React.CSSProperties}>
                  {dresscode!.colors!.map((c, i) => (
                    <span key={i} className="dresscode__swatch">
                      <i style={{ "--c": c.hex || "#ccc" } as React.CSSProperties} title={c.name || c.hex} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* FINALE */}
        <section className={sceneClass("finale")} aria-hidden={!isActive("finale")}>
          <div className="finale__bg">
            <div className="finale__media" ref={finaleMediaRef}>
              {hasVideo ? (
                <iframe
                  ref={finaleIframeRef}
                  id="niharaFinaleVideo"
                  src={"https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&mute=1&loop=1&playlist=" + videoId + "&controls=0&modestbranding=1&showinfo=0&cc_load_policy=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1"}
                  title={lang === "en" ? "Wedding video" : "Video pernikahan"}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  style={{ position: "absolute", top: "50%", left: "50%", width: "177.78vh", height: "100vh", minWidth: "100%", minHeight: "100%", transform: "translate(-50%, -50%) scale(1.18)", border: 0, pointerEvents: "none", filter: "contrast(1.03) brightness(.86) saturate(.88)" }}
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <img src={cover || ""} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          </div>          <div className="scene__veil scene__veil--deep" />
          <div className="finale__scroll" id="niharaFinaleScroll" ref={finaleScrollRef}>
            <div className="finale__hero">
              <h2 className="display finale__std reveal">{tc.countdown_title || t("secCountdown", lang)}</h2>
              <div className="countdown reveal">
                <div className="countdown__cell"><b>{countdown?.d ?? "00"}</b><span>{tc.countdown_days || t("days", lang)}</span></div>
                <i />
                <div className="countdown__cell"><b>{countdown?.h ?? "00"}</b><span>{tc.countdown_hours || t("hours", lang)}</span></div>
                <i />
                <div className="countdown__cell"><b>{countdown?.m ?? "00"}</b><span>{tc.countdown_minutes || t("minutes", lang)}</span></div>
                <i />
                <div className="countdown__cell"><b>{countdown?.s ?? "00"}</b><span>{tc.countdown_seconds || t("seconds", lang)}</span></div>
              </div>
              {calUrl && (
                <a className="btn-open finale__cal reveal" href={calUrl} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="4.5" width="18" height="16" rx="2" />
                    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
                  </svg>
                  <span>{(tc.save_date_label || t("saveTheDate", lang)).toUpperCase()}</span>
                </a>
              )}
            </div>

            <div className="sheet">
              {stories.length > 0 && (
                <section className="sheet__section sheet__section--story" data-io>
                  <h3 className="display story__heading">{tc.love_story_title || t("secStory", lang)}</h3>
                  <div className="chapters">
                    {stories.map((s, i) => (
                      <article key={i} className={`chapter${i % 2 === 1 ? " chapter--alt" : ""}`}>
                        {s.image_url && (
                          <figure className="chapter__photo">
                            <img src={s.image_url} alt="" loading="lazy" />
                          </figure>
                        )}
                        <div className="chapter__plate">
                          <h4 className="serif chapter__title">{s.title}</h4>
                          <p className="chapter__text serif-i">{s.description}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {gallery.length > 0 && (
                <section className="sheet__section sheet__section--gallery" data-io>
                  <h3 className="display gallery__title">{tc.gallery_title || t("secGallery", lang)}</h3>
                  {hasVideo && (
                    <div className="nihara-video">
                      <AutoplayYouTube
                        videoId={videoId}
                        title={lang === "en" ? "Wedding video" : "Video pernikahan"}
                        signal={opened ? 1 : 0}
                      />
                      <button
                        type="button"
                        className="nihara-video__hit"
                        onClick={() => setVideoModal(true)}
                        aria-label={lang === "en" ? "Open couple video" : "Buka video pasangan"}
                      />
                    </div>
                  )}
                  <div className="mist-strip">
                    {gallery.map((url: string, i: number) => (
                      <figure key={i} className="mist-tile">
                        <button type="button" aria-label={lang === "en" ? `View photo ${i + 1}` : `Lihat foto ${i + 1}`} onClick={() => setLightbox(i)}>
                          <img src={url} alt="" loading="lazy" />
                          <span className="mist-tile__haze" aria-hidden="true" />
                        </button>
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              {accounts.length > 0 && (
                <section className="sheet__section sheet__section--gift" data-io>
                  <h3 className="display story__heading">{tc.gift_intro_title || t("secGift", lang)}</h3>
                  <p className="gift__intro serif-i">
                    {tc.gift_intro_description || (lang === "en" ? "Your presence is the greatest gift. If you would like to send a token of love, you can find the details below." : "Kehadiran Anda adalah hadiah terindah bagi kami. Namun jika Anda ingin memberikan tanda kasih, detailnya tersedia di bawah ini.")}
                  </p>
                  {!giftOpen ? (
                    <button type="button" className="btn-open gift__open" onClick={() => setGiftOpen(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{t("openEnvelope", lang)}</span>
                    </button>
                  ) : (
                    <div className="tpl-gift">
                      <div className="tpl-gift__accounts">
                        {accounts.map((a, i) => (
                          <div key={i} className="tpl-gift__account">
                            <p className="tpl-gift__heading">{a.provider_name || "Bank"}</p>
                            <p className="tpl-gift__account-number">{a.account_number}</p>
                            <p className="tpl-gift__account-name">{a.account_name}</p>
                            <button type="button" className="tpl-gift__copy-btn" onClick={() => copy(String(a.account_number || ""))}>
                              {t("copyNumber", lang)}
                            </button>
                          </div>
                        ))}
                      </div>
                      {giftAddress && (
                        <div className="tpl-gift__address">
                          <p className="tpl-gift__address-label">{t("sendGift", lang)}</p>
                          <p className="tpl-gift__address-text">{giftAddress}</p>
                          {profile.gift_address_name && <p className="tpl-gift__account-name">{profile.gift_address_name}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {honored.length > 0 && (
                <section className="sheet__section sheet__section--honored" data-io>
                  <h3 className="display story__heading">{t("secInviting", lang)}</h3>
                  <div className="honored__grid">
                    <div className="honored__col">
                      <ul className="honored__names">
                        {honored.map((n, i) => (
                          <li key={i} className="honored__name serif">{n}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              <Wishes
                weddingProfileId={profile.wedding_profile_id}
                guestId={profile.guest_id}
                guestName={profile.guest_name}
                guestLinkStrict={profile.guest_link_strict}
                language={profile.language}
                title={tc.wishes_title || t("secWishes", lang)}
                intro={tc.wishes_intro || (lang === "en" ? "Leave your best wishes and prayers for us here." : "Berikan harapan dan doa terbaikmu di sini untuk kami berdua.")}
              />

              <section className="sheet__section sheet__closing" data-io>
                <div className="closing-portrait">
                  {(cover || groomPhoto || bridePhoto) && (
                    <figure className="gilded">
                      <img src={cover || groomPhoto || bridePhoto} alt={coupleLabel} loading="lazy" />
                    </figure>
                  )}
                  <p className="closing-names">
                    {groomShort} <em aria-hidden="true">&amp;</em> {brideShort}
                  </p>
                </div>
                <p className="serif-i sheet__pray">
                  {tc.closing_message || (lang === "en" ? "It would be an honor and a joy for us to have you present and to receive your blessing on our wedding day." : "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.")}
                </p>
                {profile.display_name && <p className="hand sheet__tag">{profile.display_name}</p>}
              </section>

              <footer className="sheet__footer" data-io>
                <footer className="tpl-footer">
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={lang === "en" ? "Contact Aksaraa Wedding via WhatsApp" : "Hubungi Aksaraa Wedding via WhatsApp"}
                    className="tpl-footer__link"
                  >
                    <span className="tpl-footer__badge">
                      <img src={A} alt="Aksaraa Wedding" className="tpl-footer__logo" draggable={false} />
                    </span>
                    <span className="tpl-footer__cta">Wedding by Aksaraa</span>
                  </a>
                  <p className="tpl-footer__text">© {new Date().getFullYear()} {coupleLabel}. All rights reserved.</p>
                </footer>
              </footer>
            </div>
          </div>
        </section>

        <div className="fogsweep" aria-hidden="true" />
        <div className="fog" aria-hidden="true">
          <span className="fog__blob fog__blob--a" />
          <span className="fog__blob fog__blob--b" />
        </div>
        <div className="grain" aria-hidden="true" />
        <div className={`hint${opened && hintVisible && scene !== "finale" ? " is-show" : ""}`} aria-hidden="true">
          <span className="hint__line" />
          <p className="label label--dim">{lang === "en" ? "Swipe up" : "Geser ke atas"}</p>
        </div>

        {hasTrack && (
          <button type="button" className={`tpl-music-btn${opened ? " visible" : ""}${playing ? "" : " paused"}`} aria-label={lang === "en" ? "Toggle music" : "Putar atau jeda musik"} onClick={toggleMusic}>
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

        <div className={`nihara-toast${toast ? " show" : ""}`}>{toast}</div>

        {showGuestDock && (
          <InvitationOverlay
            guestId={profile.guest_id}
            guestSlug={profile.guest_slug}
            allowFlexibleRsvp={profile.guest_link_strict === false}
            guestName={profile.guest_name || t("honoredGuest", lang)}
            coupleName={coupleLabel}
            weddingProfileId={profile.wedding_profile_id!}
            guestQrUrl={profile.guest_qr_url}
            guestTableNumber={profile.guest_table_number}
            guestRsvpStatus={profile.guest_rsvp_status}
            guestRsvpMessage={profile.guest_rsvp_message || undefined}
            rsvpMaxPax={profile.rsvp_max_pax ?? 2}
            qrEnabled={profile.feature_gates?.qr_code_book === true}
            anchor="center"
            language={lang}
          />
        )}

        {lightbox !== null && gallery[lightbox] && (
          <div className="fixed inset-0 z-[10000] flex cursor-pointer items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white" onClick={(e) => e.stopPropagation()}>
              {lightbox + 1} / {gallery.length}
            </div>
            <button type="button" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox(null) }} aria-label={t("close", lang)}>✕</button>
            {gallery.length > 1 && (
              <button type="button" className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length) }} aria-label={t("prevPhoto", lang)}>‹</button>
            )}
            <img src={gallery[lightbox]} alt="" draggable={false} className="max-h-[90vh] max-w-[95vw] select-none rounded-md object-contain" onClick={(e) => e.stopPropagation()} />
            {gallery.length > 1 && (
              <button type="button" className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length) }} aria-label={t("nextPhoto", lang)}>›</button>
            )}
          </div>
        )}


        {videoModal && videoId && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4" onClick={() => setVideoModal(false)}>
            <div className="aspect-video w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&playsinline=1&modestbranding=1`}
                title={lang === "en" ? "Couple video" : "Video pasangan"}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              />
            </div>
            <button
              type="button"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setVideoModal(false)}
              aria-label={t("close", lang)}
            >✕</button>
          </div>
        )}
      </div>
    </div>
  )
}
