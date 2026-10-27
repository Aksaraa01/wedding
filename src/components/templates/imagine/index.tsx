"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import "./imagine.css"
import type { TemplateProps } from "@/types/template"
import InvitationOverlay from "@/components/InvitationOverlay"
import ImagineWishes from "./ImagineWishes"

type Session = NonNullable<TemplateProps["sessions"]>[number]

const RINGS_SVG = (
  <svg className="activity-icon ic-rings" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M322.656 180C318.656 180 314.736 180.24 310.896 180.48C316.684 187.936 321.848 195.856 326.336 204.16C359.969 205.08 391.885 219.212 415.174 243.494C438.464 267.776 451.251 300.254 450.767 333.896C450.283 367.538 436.567 399.635 412.589 423.238C388.611 446.84 356.301 460.047 322.656 460C288.719 459.964 256.183 446.467 232.186 422.47C208.189 398.473 194.692 365.937 194.656 332C194.763 307.79 201.686 284.099 214.632 263.641C227.578 243.182 246.023 226.783 267.856 216.32C262.787 209.693 256.99 203.655 250.576 198.32C215.726 217.068 189.57 248.678 177.676 286.421C165.783 324.164 169.09 365.059 186.896 400.4C199.641 425.478 219.059 446.552 243.013 461.302C266.966 476.052 294.525 483.907 322.656 484C362.969 484 401.63 467.986 430.136 439.48C458.642 410.975 474.656 372.313 474.656 332C474.656 291.687 458.642 253.025 430.136 224.52C401.63 196.014 362.969 180 322.656 180Z" fill="#8F3B0C" />
    <path d="M326.336 204.16C321.848 195.856 316.684 187.936 310.896 180.48C301.929 180.427 277.311 183.92 250.576 198.32C256.99 203.655 262.787 209.693 267.856 216.32C291.656 204.914 295.656 204.16 326.336 204.16Z" fill="#8F3B0C" />
  </svg>
)

const WINE_SVG = (
  <svg className="activity-icon ic-wine" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 2h10l-1 7a4 4 0 0 1-8 0L7 2Zm4 11v7H9v2h6v-2h-2v-7M13 4l-.7 5H18l-.7-5" fill="#8F3B0C" />
  </svg>
)

const ASSET = (name: string) => `/templates/imagine/${name}`

function ornament(name: string, aos: string, duration = 1200, delay = 400) {
  return (
    <div className="image-wrap" data-aos={aos} data-aos-duration={String(duration)} data-aos-delay={String(delay)}>
      <img src={ASSET(name)} alt="Ornament" />
    </div>
  )
}

function OrnLampsFlower() {
  return (
    <>
      <div className="orn-primary--top-left--lamp-1">
        {ornament("orn-18-min.png", "fade-down", 3200, 3300)}
      </div>
      <div className="orn-primary--top-left--lamp-2">
        {ornament("orn-18-min.png", "fade-down", 3000, 3100)}
      </div>
      {ornament("orn-16-min.png", "fade-down", 3000, 2300)}
      <div className="orn-primary--top-left--flower-1">
        {ornament("orn-19-min.png", "fade-down", 3000, 2700)}
      </div>
    </>
  )
}

function OrnGateFlanks() {
  const flank = (side: "left" | "right") => (
    <div key={side} className={`orn-footnote--bottom ${side}`}>
      <div className="orn-footnote--bottom-flower left">
        {ornament("orn-11-min.png", "zoom-in-up", 3000, 2100)}
      </div>
      <div className="orn-footnote--bottom-leaf left">
        {ornament("orn-12-min.png", side === "left" ? "fade-up-right" : "fade-up-left", 3000, 1600)}
      </div>
      {ornament("orn-14-min.png", "zoom-in-up", 3000, 1200)}
    </div>
  )
  return (
    <>
      <div className="orn-footnote--bottom-center">
        {ornament("orn-13-min.png", "zoom-in-up", 3200, 2200)}
      </div>
      {flank("left")}
      {flank("right")}
      <div className="orn-topcover-gate--top-right">
        {ornament("orn-15-min.png", "zoom-in", 3000, 2450)}
      </div>
    </>
  )
}

/* Local-intro copilot comment lock: this file must not embed reference couple
   data. All strings below are structural layout labels or prop fallbacks. */

function useCountdown(target?: string) {
  const [remaining, setRemaining] = useState(() => diffFrom(target))
  useEffect(() => {
    setRemaining(diffFrom(target))
    if (!target) return
    const t = window.setInterval(() => setRemaining(diffFrom(target)), 1000)
    return () => window.clearInterval(t)
  }, [target])
  return remaining
}

function diffFrom(target?: string) {
  if (!target) return null
  const ms = new Date(target).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  return Math.max(0, ms)
}

function pads(ms: number) {
  const total = Math.floor(ms / 1000)
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

function formatDateParts(dateStr?: string) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return {
    day: d.toLocaleDateString("en-US", { weekday: "long" }),
    date: String(d.getDate()),
    month: d.toLocaleDateString("en-US", { month: "long" }),
    year: String(d.getFullYear()),
    full: d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  }
}

function calendarLink(dateStr?: string, title?: string, venue?: string, hours?: { start: string; end?: string }) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const stamp = (time?: string) => {
    const [h, m] = (time || "").split(/[.:]/).map((v) => parseInt(v, 10))
    const dur = new Date(d)
    if (!Number.isNaN(h) && h < 24) {
      dur.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0)
    } else {
      dur.setHours(0, 0, 0, 0)
    }
    return dur.toISOString().replace(/[-:]|\.\d{3}/g, "")
  }
  const range = `${stamp(hours?.start) || d.toISOString().replace(/[-:]|\.\d{3}/g, "")}/${stamp(hours?.end)}`
  const params = new URLSearchParams()
  params.set("action", "TEMPLATE")
  params.set("text", title || "Wedding")
  params.set("dates", range)
  if (venue) params.set("location", venue)
  return `https://www.google.com/calendar/render?${params.toString()}`
}

function youTubeId(url?: string) {
  if (!url) return null
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return url.length >= 6 && /^[A-Za-z0-9_-]+$/.test(url) ? url : null
}

export default function Imagine(props: TemplateProps) {
  const {
    groom_name, bride_name, estimated_wedding_date, cover_photos,
    groom_photo_url, bride_photo_url,
    groom_full_name, bride_full_name,
    groom_parents, bride_parents,
    groom_instagram, bride_instagram,
    quote_text, quote_source,
    sessions, stories, gallery_photos,
    video_url, dresscode, dresscode_visible,
    livestream, livestream_visible,
    gift_accounts, gift_address, gift_address_name, gift_section_visible,
    inviting_families, inviting_families_visible,
    track_url, auto_play,
    slug, display_name,
    template_content,
    wedding_profile_id, guest_id, guest_slug, guest_link_strict, guest_name,
    guest_qr_url, guest_table_number, guest_rsvp_status, guest_rsvp_message,
    rsvp_max_pax, feature_gates,
  } = props

  const gates = feature_gates || {}
  const tc = template_content || {}

  const [opened, setOpened] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // AOS-like reveal: rAF + scroll driven (robust across browsers/tabs)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const reveal = () => {
      raf = 0
      root.querySelectorAll<HTMLElement>("[data-aos]:not(.aos-in)").forEach((el) => {
        const gate = el.closest(".top-cover")
        if (gate) {
          // Gate elements run their intro timeline while the gate is up;
          // skip once the gate is closed (post-open) — nothing is visible there.
          if (!gate.classList.contains("is-hidden")) {
            const delay = parseInt(el.dataset.aosDelay || "0", 10)
            el.style.transitionDelay = `${delay}ms`
            el.classList.add("aos-in")
          }
          return
        }
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
          const delay = parseInt(el.dataset.aosDelay || "0", 10)
          el.style.transitionDelay = `${delay}ms`
          el.classList.add("aos-in")
        }
      })
    }
    const schedule = () => {
      // rAF is throttled/unavailable in inactive tabs — always run a direct pass too
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(reveal)
      reveal()
    }
    reveal()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    const t = window.setInterval(schedule, 700)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.clearInterval(t)
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle("has-imagine-locked", !opened)
    return () => document.documentElement.classList.remove("has-imagine-locked")
  }, [opened])

  const openInvitation = () => {
    setOpened(true)
    window.scrollTo(0, 0)
    if (audioRef.current) {
      audioRef.current.play().catch(() => { /* gesture-race — user can use the music button */ })
      setMusicOn(true)
    }
  }

  const toggleMusic = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play().catch(() => {}); setMusicOn(true) }
    else { a.pause(); setMusicOn(false) }
  }

  const showGift = gift_section_visible !== false && (gift_accounts?.length || gift_address || tc.gift_intro_title)
  const showLivestream = livestream_visible !== false && !!livestream?.url && gates.video !== false
  const showVideo = !!video_url && gates.video !== false && props.video_section_visible !== false
  const showStory = gates.story !== false && props.story_visible !== false && !!stories?.length
  const families = gates.inviting_families !== false && inviting_families_visible !== false ? inviting_families || [] : []

  const groomPhoto = Array.isArray(groom_photo_url) ? groom_photo_url[0] : groom_photo_url
  const bridePhoto = Array.isArray(bride_photo_url) ? bride_photo_url[0] : bride_photo_url
  const cover = cover_photos?.[0] || ""
  const dateParts = formatDateParts(estimated_wedding_date)
  const remaining = useCountdown(estimated_wedding_date)
  const count = remaining ? pads(remaining) : null
  const ytId = youTubeId(video_url)

  const coupleLabel = `${groom_name || ""} & ${bride_name || ""}`.trim()

  const showGuestDock =
    opened &&
    (!!guest_id || (guest_link_strict === false && !!guest_slug)) &&
    !!wedding_profile_id

  const firstSession = sessions?.[0]
  const calHref = useMemo(
    () => calendarLink(estimated_wedding_date, `${coupleLabel} Wedding`, firstSession?.venue),
    [estimated_wedding_date, coupleLabel, firstSession?.venue]
  )

  const instagramLink = (handle?: string) =>
    handle?.trim() ? `https://instagram.com/${handle.replace(/^@/, "").trim()}` : null

  const groomIg = instagramLink(groom_instagram)
  const brideIg = instagramLink(bride_instagram)

  return (
    <div
      ref={rootRef}
      className={`imagine-root${opened ? " is-open" : " is-pre-open"}`}
    >
      {track_url && (
        <audio
          ref={audioRef}
          src={track_url}
          loop
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {/* ===== Opening gate (overlay until opened) ===== */}
      <section className={`top-cover${opened ? " is-hidden" : ""}`} data-section-order="opening_cover">
        <div className="bg-tc" data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="100" />
        <div className="top-cover-inner">
          <div className="ornaments-wrapper">
            <div className="orn-footnote--top-left">
              <div className="orn-footnote--top-left--lamp-1">{ornament("orn-18-min.png", "fade-down", 3200, 3300)}</div>
              <div className="orn-footnote--top-left--lamp-2">{ornament("orn-18-min.png", "fade-down", 3000, 3100)}</div>
              {ornament("orn-16-min.png", "fade-down", 3000, 2300)}
              <div className="orn-footnote--top-left--flower-1">{ornament("orn-19-min.png", "fade-down", 3000, 2700)}</div>
            </div>
            <div className="orn-footnote--top-right">
              {ornament("orn-17-min.png", "fade-down", 3000, 2450)}
            </div>
          </div>
          <div className="top-cover-garden">
            <div className="top-cover-gate">
              <div className="image-wrap" data-aos="zoom-out" data-aos-duration="2500" data-aos-delay="800">
                <img src={ASSET("orn-10-min.png")} alt="Ornament" />
              </div>
              <div className="ornaments-wrapper">
                <OrnGateFlanks />
              </div>
            </div>
            <div className="top-cover-details">
              <div className="top-cover-details--content">
                <h1 className="top-cover-title" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="3000">
                  {coupleLabel || "The Wedding"}
                </h1>
                <div className="link-wrap" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="3000">
                  <p>{guest_name ? `Hai ${guest_name}` : "You Are Invited"}</p>
                  <button type="button" className="link" onClick={openInvitation}>
                    Open Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Side-by-side scroll content ===== */}
      <section className="kat-page__side-to-side">

        <section className="primary-pane">
          <div className="inner">
            <div className="ornaments-wrapper">
              <div className="orn-primary--top-left">
                <OrnLampsFlower />
              </div>
              <div className="orn-primary--top-right">
                {ornament("orn-16-min.png", "fade-down", 3000, 2450)}
                <div className="orn-primary--bird">{ornament("orn-17-min.png", "fade-down", 3000, 2450)}</div>
              </div>
            </div>
            <div className="primary-pane-garden">
              <div className="primary-pane-gate">
                <div className="image-wrap" data-aos="zoom-out" data-aos-duration="2500" data-aos-delay="800">
                  <img src={ASSET("orn-10-min.png")} alt="Ornament" />
                </div>
                <div className="ornaments-wrapper">
                  <OrnGateFlanks />
                </div>
              </div>
              <div className="primary-pane-details">
                <div className="primary-pane-details--content">
                  <h1 className="primary-pane-title" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                    {coupleLabel || "The Wedding"}
                  </h1>
                  <div className="link-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="1200">
                    <p>{guest_name ? `Hai ${guest_name}` : "You Are Invited"}</p>
                    {slug && <p className="primary-pane-hint">w/{slug}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="secondary-pane">

          {/* COVER (main cover photo) */}
          <section className="cover-wrap" data-section-order="cover">
            <div data-aos="zoom-in" data-aos-duration="3100" data-aos-delay="700">
              <div className="cover-inner">
                <div className="cover-illustration">
                  <div className="ornaments-wrapper">
                    <div className="orn-cover--top-left">
                      <div className="orn-cover--top-left--lamp-1">{ornament("orn-18-min.png", "zoom-in-down", 3000, 1500)}</div>
                      <div className="orn-cover--top-left--lamp-2">{ornament("orn-18-min.png", "zoom-in-down", 3000, 1700)}</div>
                      <div className="orn-cover--top-left--flower-1">{ornament("orn-22-min.png", "zoom-in-down", 3000, 1450)}</div>
                      {ornament("orn-16-min.png", "zoom-in-down", 3000, 1200)}
                    </div>
                    <div className="orn-cover--top-right">
                      {ornament("orn-17-min.png", "fade-down", 3500, 1950)}
                    </div>
                    <div className="orn-cover--bottom-left">
                      <div className="orn-cover--bottom-left--flower-2">{ornament("orn-11-min.png", "zoom-in-up", 3500, 1900)}</div>
                      <div className="orn-cover--bottom-left--flower-1">{ornament("orn-12-min.png", "zoom-in-up", 3000, 1500)}</div>
                      {ornament("orn-14-min.png", "zoom-in-up", 3000, 1200)}
                    </div>
                  </div>
    </div>
                <div className="cover-highlight">
                  {cover && (
                    <div className="cover-preview-wrap" data-aos="zoom-in" data-aos-duration="3000" data-aos-delay="1400">
                      <div className="cover-preview cover-show">
                        <img src={cover} alt="" />
                        <div className="cover-img-overlay" />
                      </div>
                    </div>
                  )}
                  <div className="cover-details">
                    <p className="top-text" data-aos="fade-down" data-aos-duration="3500" data-aos-delay="1400">
                      Wedding Invitation
                    </p>
                    <div className="prime-title-lines">
                      <h1 className="prime-title" data-aos="zoom-in" data-aos-duration="3500" data-aos-delay="1700">
                        {groom_name || ""}<br />&amp;<br />{bride_name || ""}
                      </h1>
                    </div>
                    <p className="bottom-text" data-aos="fade-up" data-aos-duration="3500" data-aos-delay="1400">
                      {display_name || ""}
                    </p>
                    <div className="direction-arrow" data-aos="fade-up" data-aos-duration="3500" data-aos-delay="1900">
                      <span className="arrow-chevron">▾</span>
                      <span className="arrow-chevron">▾</span>
                      <span className="arrow-chevron">▾</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {quote_text && (
            <section className="quote-wrap" data-section-order="quote">
              <div className="quote-inner">
                <div className="ornaments-wrapper">
                  <div className="orn-quote--top-right">
                    {ornament("orn-06-min.png", "fade-down", 1200, 400)}
                    <div className="orn-quote--top-right--flower-1">{ornament("orn-05-min.png", "fade-down", 1200, 600)}</div>
                    <div className="orn-quote--top-right--flower-2">{ornament("orn-07-min.png", "fade-down", 1200, 700)}</div>
                  </div>
                  <div className="orn-quote--top-right bottom-left">
                    {ornament("orn-06-min.png", "fade-down", 1200, 400)}
                    <div className="orn-quote--top-right--flower-1">{ornament("orn-05-min.png", "fade-down", 1200, 600)}</div>
                    <div className="orn-quote--top-right--flower-2">{ornament("orn-07-min.png", "fade-down", 1200, 700)}</div>
                  </div>
                  <div className="orn-quote--bottom-right">
                    <div className="orn-quote--bottom-right--flower-1">{ornament("orn-11-min.png", "fade-down", 1200, 600)}</div>
                    {ornament("orn-08-min.png", "fade-down", 1200, 400)}
                  </div>
                  <div className="orn-quote--bottom-right top-left">
                    <div className="orn-quote--bottom-right--flower-1">{ornament("orn-11-min.png", "fade-down", 1200, 600)}</div>
                    {ornament("orn-08-min.png", "fade-down", 1200, 400)}
                  </div>
                </div>
                <div className="quote">
                  <p className="quote-caption" data-aos="fade-up" data-aos-duration="1000">
                    {quote_text}
                    {quote_source ? <><br /><br />({quote_source})</> : null}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* COUPLE */}
          <section className="couple-wrap" data-section-order="couple">
            <div className="ornaments-wrapper">
              <div className="orn-couple--top">
                <div className="orn-couple--top--lamp left">{ornament("orn-18-min.png", "fade-down", 1200, 600)}</div>
                <div className="orn-couple--top--lamp right">{ornament("orn-18-min.png", "fade-down", 1200, 700)}</div>
                {ornament("orn-16-min.png", "fade-down", 1200, 400)}
                <div className="orn-couple--top-left--flower-1">{ornament("orn-22-min.png", "fade-down", 1200, 450)}</div>
                <div className="orn-couple--top-right">{ornament("orn-17-min.png", "fade-down", 1200, 450)}</div>
              </div>
            </div>
            <div className="couple">
              <div className="couple-head">
                <h1 className="couple-title" data-aos="zoom-in" data-aos-duration="1000">The Wedding Of</h1>
                <p className="couple-description" data-aos="fade-up" data-aos-duration="1000">
                  {tc.couple_description || "With the blessing of our families, we cordially invite you to the wedding of"}
                </p>
              </div>
              <div className="couple-body show-picture">
                <div className="couple-info groom">
                  <div className="couple-preview">
                    <div className="couple-frame">
                      <div className="orn-couple-frame--bottom left">
                        <div className="orn-couple-frame--bottom-flower-left">{ornament("orn-11-min.png", "fade-up-right", 1200, 700)}</div>
                        <div className="orn-couple-frame--bottom-leaf left">{ornament("orn-04-min.png", "fade-left", 1200, 700)}</div>
                        {ornament("orn-07-min.png", "fade-right", 1200, 700)}
                      </div>
                      <div className="orn-couple-frame--bottom right">
                        <div className="orn-couple-frame--bottom-leaf right">{ornament("orn-04-min.png", "fade-left", 1200, 700)}</div>
                        {ornament("orn-07-min.png", "fade-right", 1200, 700)}
                        <div className="orn-couple-frame--bottom-leaf-2">{ornament("orn-15-min.png", "fade-up-left", 1200, 700)}</div>
                        <div className="orn-couple-frame--bottom-flower-right">{ornament("orn-21-min.png", "fade-up-right", 1200, 700)}</div>
                      </div>
                      <div className="orn-couple-frame--top-left">{ornament("orn-22-min.png", "fade-up", 1200, 700)}</div>
                      <div className="couple-picture-wrap">
                        <div className="couple-picture" data-aos="zoom-out" data-aos-duration="1000">
                          <div className="img-wrap">
                            {groomPhoto && <img className="img" src={groomPhoto} alt={groom_name || "Groom"} />}
                          </div>
                        </div>
                      </div>
                      <div className="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                        <img src={ASSET("orn-2-min.png")} alt="Ornament" />
                      </div>
                    </div>
                  </div>
                  <div className="couple-details">
                    <h2 className="couple-name" data-aos="fade-up" data-aos-duration="1000">
                      {groom_full_name || groom_name || "The Groom"}
                    </h2>
                    {groom_parents && (
                      <p className="couple-parents" data-aos="fade-up" data-aos-duration="1000">{groom_parents}</p>
                    )}
                    {groomIg && (
                      <div className="couple-link-wrap" data-aos="fade-up" data-aos-duration="1000">
                        <a href={groomIg} target="_blank" rel="noreferrer" className="couple-link">{groom_instagram}</a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="separator-wrap">
                  <div className="separator" data-aos="zoom-in" data-aos-duration="1500">
                    <div className="divider" />
                    <h2 className="couple-separator">&amp;</h2>
                    <div className="divider" />
                  </div>
                </div>

                <div className="couple-info bride">
                  <div className="couple-preview">
                    <div className="couple-frame">
                      <div className="orn-couple-frame--bottom left">
                        <div className="orn-couple-frame--bottom-flower-left">{ornament("orn-11-min.png", "fade-up-right", 1200, 700)}</div>
                        <div className="orn-couple-frame--bottom-leaf left">{ornament("orn-04-min.png", "fade-left", 1200, 700)}</div>
                        {ornament("orn-07-min.png", "fade-right", 1200, 700)}
                      </div>
                      <div className="orn-couple-frame--bottom right">
                        <div className="orn-couple-frame--bottom-leaf right">{ornament("orn-04-min.png", "fade-left", 1200, 700)}</div>
                        {ornament("orn-07-min.png", "fade-right", 1200, 700)}
                        <div className="orn-couple-frame--bottom-leaf-2">{ornament("orn-15-min.png", "fade-up-left", 1200, 700)}</div>
                        <div className="orn-couple-frame--bottom-flower-right">{ornament("orn-21-min.png", "fade-up-right", 1200, 700)}</div>
                      </div>
                      <div className="orn-couple-frame--top-left">{ornament("orn-22-min.png", "fade-up", 1200, 700)}</div>
                      <div className="couple-picture-wrap">
                        <div className="couple-picture" data-aos="zoom-out" data-aos-duration="1000">
                          <div className="img-wrap">
                            {bridePhoto && <img className="img" src={bridePhoto} alt={bride_name || "Bride"} />}
                          </div>
                        </div>
                      </div>
                      <div className="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                        <img src={ASSET("orn-2-min.png")} alt="Ornament" />
                      </div>
                    </div>
                  </div>
                  <div className="couple-details">
                    <h2 className="couple-name" data-aos="fade-up" data-aos-duration="1000">
                      {bride_full_name || bride_name || "The Bride"}
                    </h2>
                    {bride_parents && (
                      <p className="couple-parents" data-aos="fade-up" data-aos-duration="1000">{bride_parents}</p>
                    )}
                    {brideIg && (
                      <div className="couple-link-wrap" data-aos="fade-up" data-aos-duration="1000">
                        <a href={brideIg} target="_blank" rel="noreferrer" className="couple-link">{bride_instagram}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {families.length > 0 && (
            <section className="invite-wrap" data-section-order="inviting">
              <div className="invite-inner">
                <div className="invite-title" data-aos="zoom-in" data-aos-duration="1000">Turut Mengundang</div>
                <ul className="invite-list" data-aos="fade-up" data-aos-duration="1000">
                  {families.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* SAVE THE DATE + countdown */}
          <section className="savedate-agenda-wrapper" data-section-order="save_the_date">
            <section className="save-date-wrap">
              <div className="save-date-head">
                <h1 className="save-date-title" data-aos="zoom-in" data-aos-duration="1000">Save The Date</h1>
              </div>
              <div className="save-date-frame">
                <div className="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                  <img src={ASSET("orn-23-min.png")} alt="Ornament" />
                </div>
                <div className="ornaments-wrapper">
                  <div className="orn-save-date-bottom left">{ornament("orn-01-min.png", "zoom-in", 1200, 100)}</div>
                  <div className="orn-save-date-bottom right">{ornament("orn-01-min.png", "zoom-in", 1200, 100)}</div>
                  <div className="orn-save-date-top left">
                    <div className="orn-save-date-leaf left">{ornament("orn-22-min.png", "zoom-in", 1200, 100)}</div>
                    {ornament("orn-05-min.png", "zoom-in", 1200, 150)}
                  </div>
                  <div className="orn-save-date-top right">
                    <div className="orn-save-date-leaf right">{ornament("orn-22-min.png", "zoom-in", 1200, 100)}</div>
                    {ornament("orn-05-min.png", "zoom-in", 1200, 150)}
                  </div>
                </div>
                {count && (
                  <div className="save-date-body">
                    <div className="countdown">
                      {[
                        { n: count.d, t: "Days", cls: "count-day", aos: "fade-down-right", delay: 100 },
                        { n: count.h, t: "Hours", cls: "count-hour", aos: "fade-down-left", delay: 300 },
                        { n: count.m, t: "Minutes", cls: "count-minute", aos: "fade-up-right", delay: 500 },
                        { n: count.s, t: "Seconds", cls: "count-second", aos: "fade-up-left", delay: 700 },
                      ].map((it) => (
                        <div key={it.cls} className="count-item" data-aos={it.aos} data-aos-duration="1200" data-aos-delay={String(it.delay)}>
                          <h2 className={`count-num ${it.cls}`}>{String(it.n).padStart(2, "0")}</h2>
                          <small className="count-text">{it.t}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {dateParts && (
                  <div className="save-date-date" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="900">
                    {dateParts.day}, {dateParts.date} {dateParts.month} {dateParts.year}
                  </div>
                )}
              </div>
              {calHref && (
                <div className="add-to-calendar-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="1100">
                  <a className="add-to-calendar" href={calHref} target="_blank" rel="noreferrer">Add to Calendar</a>
                </div>
              )}
            </section>
          </section>

          {/* EVENTS */}
          {sessions && sessions.length > 0 && (
            <section className="savedate-agenda-wrapper" data-section-order="event">
              <section className="agenda-wrap">
                <div className="agenda-inner">
                  <div className="agenda-head">
                    <h2 className="agenda-title" data-aos="zoom-in" data-aos-duration="1500">It&rsquo;s Wedding Day</h2>
                    <p className="agenda-description" data-aos="fade-up" data-aos-duration="1200">
                      We cordially invite you to attend our wedding
                    </p>
                  </div>
                  <div className="agenda-body">
                    {sessions.map((s, i) => (
                      <div className="event-item" key={i}>
                        {(() => {
                          const d = new Date(s.date || estimated_wedding_date || "")
                          const parts = formatDateParts(s.date || estimated_wedding_date)
                          if (!parts) return null
                          return (
                            <div className="event-head">
                              <div className="event-schedule-wrapper">
                                <p className="event-day" data-aos="fade-up" data-aos-duration="1000">{parts.day}</p>
                                <div className="event-schedule-inner">
                                  <h1 className="event-date" data-aos="fade-up" data-aos-duration="1000">{
                                    String(isNaN(d.getTime()) ? "" : d.getDate())
                                  }</h1>
                                  <p className="event-year" data-aos="fade-up" data-aos-duration="1000">{
                                    isNaN(d.getTime()) ? "" : String(d.getFullYear())
                                  }</p>
                                </div>
                                <p className="event-month" data-aos="fade-up" data-aos-duration="1000">{parts.month}</p>
                              </div>
                            </div>
                          )
                        })()}
                        <div className="activity-wrap">
                          <div className="activity-item">
                            <div className="ornaments-wrapper">
                              <div className="activity-frame--top-left-back">{ornament("orn-11-min.png", "fade-up", 1200, 400)}</div>
                            </div>
                            <div className={`activity-frame ${i % 2 === 1 ? "second" : "first"}`}>
                              <div className="image-wrap" data-aos="zoom-out" data-aos-duration="2000">
                                <img src={ASSET("orn-10-min.png")} alt="Ornament" />
                              </div>
                              <div className="ornaments-wrapper">
                                <div className="activity-frame--bottom-left">
                                  <div className="activity-frame--bottom-left--flower-3">{ornament("orn-05-min.png", "fade-up", 1200, 600)}</div>
                                  <div className="activity-frame--bottom-left--flower-2">{ornament("orn-04-min.png", "fade-up", 1200, 600)}</div>
                                  <div className="activity-frame--bottom-left--flower-1">{ornament("orn-07-min.png", "fade-up", 1200, 400)}</div>
                                  {ornament("orn-14-min.png", "fade-up", 1200, 200)}
                                </div>
                                <div className="activity-frame--bottom-right">
                                  <div className="activity-frame--bottom-right--flower-4">{ornament("orn-22-min.png", "fade-up", 1200, 700)}</div>
                                  <div className="activity-frame--bottom-right--flower-3">{ornament("orn-05-min.png", "fade-up", 1200, 700)}</div>
                                  <div className="activity-frame--bottom-right--flower-2">{ornament("orn-04-min.png", "fade-up", 1200, 500)}</div>
                                  <div className="activity-frame--bottom-right--flower-1">{ornament("orn-07-min.png", "fade-up", 1200, 300)}</div>
                                  {ornament("orn-14-min.png", "fade-up", 1200, 100)}
                                </div>
                                <div className="activity-frame--top-left">{ornament("orn-17-min.png", "fade-up", 1200, 600)}</div>
                                <div className="activity-frame--top-right">{ornament("orn-18-min.png", "fade-right", 1200, 600)}</div>
                              </div>
                            </div>
                            <div className="activity-content">
                              <div className="activity-head">
                                <div data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">
                                  {i % 2 === 0 ? RINGS_SVG : WINE_SVG}
                                </div>
                                {s.name && (
                                  <h3 className="activity-title" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="400">{s.name}</h3>
                                )}
                                {s.time && (
                                  <p className="activity-time" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="400">{s.time}</p>
                                )}
                              </div>
                              <div className="event-details">
                                {s.venue && (
                                  <p className="event-hall" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">{s.venue}</p>
                                )}
                                {s.address && (
                                  <p className="event-address" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">{s.address}</p>
                                )}
                                {s.maps_url && (
                                  <div className="event-link-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">
                                    <a href={s.maps_url} className="event-link" target="_blank" rel="noreferrer">View Maps</a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* DRESSCODE inside agenda body (as reference) */}
              {dresscode_visible !== false && (dresscode?.title || dresscode?.description || dresscode?.colors?.length) && (
                <div className="dress-wrapper">
                  <div className="dress-inner">
                    <div className="dress-header" data-aos="fade-up" data-aos-duration="1000">
                      <h2 className="dress-title">{dresscode?.title || "Dresscode"}</h2>
                      {dresscode?.description && <p className="dress-desc">{dresscode.description}</p>}
                    </div>
                    {dresscode?.colors && dresscode.colors.length > 0 && (
                      <div className="dress-body">
                        <div className="dress-list" data-aos="fade-up" data-aos-duration="1000">
                          {dresscode.colors.map((c, i) => (
                            <div className="dress-item" key={i}>
                              <p className="dress-item-title">{c.name || `Color ${i + 1}`}</p>
                              <div className="dress-preview">
                                <div className="dress-swatch" style={{ background: c.hex || "transparent" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* LIVESTREAM */}
          {showLivestream && (
            <section className="live-streaming" data-section-order="livestream">
              <div className="inner">
                <div className="title" data-aos="zoom-out" data-aos-duration="1000">
                  <h1 data-aos="zoom-out-up" data-aos-duration="1000">{livestream?.title || "Live Streaming"}</h1>
                  {livestream?.description && (
                    <p data-aos="fade-up" data-aos-duration="1000">{livestream.description}</p>
                  )}
                </div>
                <div className="video-outer">
                  <div className="video">
                    <div className="preview" data-aos="zoom-in" data-aos-duration="1000">
                      <a href={livestream?.url} target="_blank" rel="noreferrer" className="play-btn">
                        {livestream?.buttonLabel || "Watch Live"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* GALLERY */}
          {gallery_photos && gallery_photos.length > 0 && (
            <section className="photo-wrap" data-section-order="gallery_photo">
              <div className="ornaments-wrapper">
                <div className="orn-couple--top">
                  <div className="orn-couple--top--lamp left">{ornament("orn-18-min.png", "fade-down", 1200, 600)}</div>
                  <div className="orn-couple--top--lamp right">{ornament("orn-18-min.png", "fade-down", 1200, 700)}</div>
                  {ornament("orn-16-min.png", "fade-down", 1200, 400)}
                  <div className="orn-couple--top-left--flower-1">{ornament("orn-22-min.png", "fade-down", 1200, 450)}</div>
                  <div className="orn-couple--top-right">{ornament("orn-17-min.png", "fade-down", 1200, 450)}</div>
                </div>
              </div>
              <div className="photo-inner">
                <div className="photo-head">
                  <h1 className="photo-title" data-aos="fade-up" data-aos-duration="1000">
                    {tc.gallery_title || "Gallery Of Us"}
                  </h1>
                  {tc.gallery_quote && (
                    <p className="photo-quote" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="150">{tc.gallery_quote}</p>
                  )}
                </div>
                <div className="photo-body">
                  <div className="photo-box">
                    <div className="aine-photos" data-num="5">
                      {gallery_photos.map((p, i) => (
                        <a key={i} data-aos="zoom-in" data-aos-duration="1000" href={p} target="_blank" rel="noreferrer">
                          <img src={p} alt={`Gallery ${i + 1}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIDEO GALLERY */}
          {ytId && (
            <section className="video-gallery" data-section-order="gallery_video">
              <div className="inner">
                <div className="title" data-aos="zoom-out" data-aos-duration="1000">
                  <h1 data-aos="zoom-out-up" data-aos-duration="1000">Our Footage</h1>
                </div>
                <div className="video-outer">
                  <div className="video">
                    <div className="preview" data-aos="zoom-in" data-aos-duration="1000">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="Footage"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* LOVE STORY */}
          {showStory && (
            <section className="love-story" data-section-order="love_story">
              <div className="story-inner">
                <div className="story-head">
                  <h1 className="story-title" data-aos="zoom-in" data-aos-duration="1000">
                    {tc.love_story_title || "Our Love Story"}
                  </h1>
                </div>
                <div className="story-body">
                  <div className="story__slider-preview">
                    {stories.map((s, i) => (
                      <div key={i}>
                        <div className="story-preview">
                          <div className="story-picture">
                            {s.image_url && (
                              <a href={s.image_url} target="_blank" rel="noreferrer">
                                <img src={s.image_url} alt={s.title || `Story ${i + 1}`} />
                              </a>
                            )}
                          </div>
                          {s.title && (
                            <h3 className="story-sub-title" data-aos="fade-up" data-aos-duration="1000">{s.title}</h3>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="story__slider-caption-wrap">
                    <div className="orn-story">
                      <div className="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                        <svg className="orn-story-svg" viewBox="0 0 108 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M54 0L58 5H50L54 0ZM0 7.5H44M64 7.5H108" stroke="#8F3B0C" strokeWidth="0.6" />
                          <circle cx="46" cy="7.5" r="1" fill="#8F3B0C" />
                          <circle cx="62" cy="7.5" r="1" fill="#8F3B0C" />
                        </svg>
                      </div>
                    </div>
                    <div className="story__slider-caption">
                      {stories.map((s, i) => (
                        <div key={i}>
                          <div className="story-details">
                            <p className="story-caption" data-aos="fade-up" data-aos-duration="1000">{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* WEDDING GIFT */}
          {showGift && (
            <div data-section-order="wedding_gift">
              <section className="wedding-gift-wrap">
                <div className="wedding-gift-inner">
                  <div className="wedding-gift-head">
                    <h1 className="wedding-gift-title" data-aos="zoom-in" data-aos-duration="1500">
                      {tc.gift_intro_title || "Wedding Gift"}
                    </h1>
                    <p className="wedding-gift-description" data-aos="fade-up" data-aos-duration="1000">
                      {tc.gift_intro_description ||
                        "Your presence is the greatest gift to us. If you would like to send another token of love, please use the details below:"}
                    </p>
                  </div>
                  <div className="wedding-gift-body">
                    <div className="ornaments-wrapper">
                      <div className="orn-gift--back-top right">{ornament("orn-07-min.png", "fade-up-left", 1200, 200)}</div>
                      <div className="orn-gift--back-top left">{ornament("orn-07-min.png", "fade-up-left", 1200, 200)}</div>
                      <div className="orn-gift--back-top-2 right">{ornament("orn-22-min.png", "fade-up", 1200, 200)}</div>
                      <div className="orn-gift--back-top-2 left">{ornament("orn-22-min.png", "fade-up", 1200, 200)}</div>
                    </div>
                    <div className="wedding-gift-body-inner">
                      <div className="ornaments-wrapper">
                        <div className="orn-gift--front-top right">{ornament("orn-17-min.png", "fade-up", 1200, 200)}</div>
                        <div className="orn-gift--front-top-2 right">{ornament("orn-01-min.png", "fade-up", 1200, 200)}</div>
                        <div className="orn-gift--front-top-2 left">{ornament("orn-01-min.png", "fade-up", 1200, 200)}</div>
                      </div>
                      <div className="wedding-gift-cards">
                        {(gift_accounts || []).length > 0 && (
                          <div className="hadiah-cards">
                            {(gift_accounts || []).map((acc, i) => (
                              <div className="hadiah-card" key={i} data-aos="fade-up" data-aos-duration="1000" data-aos-delay={String(i * 150)}>
                                <div className="hadiah-card-inner">
                                  <h3 className="bank-name">{acc.provider_name}</h3>
                                  <div>
                                    <small className="bank-account-number-label">Account Number</small>
                                    <h4 className="bank-account-number" data-copy={acc.account_number}>
                                      {acc.account_number}
                                    </h4>
                                  </div>
                                  <div>
                                    <small className="bank-account-name-label">Account Name</small>
                                    <h4 className="bank-account-name">{acc.account_name}</h4>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {gates.gift_address !== false && gift_address && (
                          <div className="wedding-gift-address-wrap" data-aos="fade-up" data-aos-duration="1000">
                            <div className="gift-address-box">
                              {gift_address_name && (
                                <h3 className="gift-address-name">{gift_address_name}</h3>
                              )}
                              <small className="bank-account-name-label">Alamat Hadiah</small>
                              <p className="gift-address-text">{gift_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* WEDDING WISH */}
          <section className="wedding-wish-wrap" data-section-order="wedding_wish">
            <div className="ornaments-wrapper">
              <div className="orn-wish--bottom-center">{ornament("orn-13-min.png", "fade-up", 1200, 200)}</div>
              <div className="orn-wish--bottom left">{ornament("orn-14-min.png", "fade-up", 1200, 200)}</div>
              <div className="orn-wish--bottom right">{ornament("orn-14-min.png", "fade-up", 1200, 200)}</div>
            </div>
            <div className="wedding-wish-inner">
              <div className="wedding-wish-head">
                <h1 className="wedding-wish-title" data-aos="fade-up" data-aos-duration="1200">Best Wishes</h1>
                {tc.wishes_intro && (
                  <p className="wedding-wish-description" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                    {tc.wishes_intro}
                  </p>
                )}
              </div>
              <div className="wedding-wish-body">
                <ImagineWishes
                  weddingProfileId={wedding_profile_id}
                  guestId={guest_id}
                  guestName={guest_name}
                  coupleName={coupleLabel}
                />
              </div>
            </div>
          </section>

          {/* THANK YOU NOTE */}
          <section className="notes-container" data-section-order="greet_thanks">
            <div className="note">
              <h4 className="note-title" data-aos="fade-up" data-aos-duration="1200">Thank You</h4>
              <p className="note-description" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                {tc.closing_message ||
                  "From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives and honored you could be here with us."}
              </p>
            </div>
          </section>

          {/* FOOTNOTE */}
          <section className="footnote-wrap" data-section-order="footnote">
            <div className="footnote-inner">
              <div className="ornaments-wrapper">
                <div className="orn-footnote--top-left">
                  <div className="orn-footnote--top-left--lamp-1">{ornament("orn-18-min.png", "fade-down", 1200, 600)}</div>
                  <div className="orn-footnote--top-left--lamp-2">{ornament("orn-18-min.png", "fade-down", 1200, 700)}</div>
                  {ornament("orn-16-min.png", "fade-down", 1200, 400)}
                  <div className="orn-footnote--top-left--flower-1">{ornament("orn-19-min.png", "fade-down", 1200, 450)}</div>
                </div>
                <div className="orn-footnote--top-right">{ornament("orn-17-min.png", "fade-down", 1200, 450)}</div>
              </div>
              <div className="footnote-garden">
                <div className="footnote-gate">
                  <div className="image-wrap" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="600">
                    <img src={ASSET("orn-10-min.png")} alt="Ornament" />
                  </div>
                  <div className="ornaments-wrapper">
                    <OrnGateFlanks />
                  </div>
                </div>
                <div className="footnote-details">
                  <div className="footnote-details--content">
                    <p className="top-text" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">Wedding Invitation</p>
                    <h2 className="footnote-title" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="800">
                      {coupleLabel || "The Wedding"}
                    </h2>
                    {display_name && (
                      <p className="bottom-text" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="1000">{display_name}</p>
                    )}
                    {tc.cover_apology && (
                      <p className="cover-apology" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="1100">{tc.cover_apology}</p>
                    )}
                  </div>
                </div>
              </div>
</div>
          </section>
        </section>
      </section>

      {/* FOOTER + MUSIC */}
      <section className="footer">
        <div className="footer-inner">
          <a
            className="tpl-footer__link"
            href="https://wedding.aksaraa.com"
            target="_blank"
            rel="noreferrer"
          >
            <span className="tpl-footer__badge">
              <img src="/templates/imagine/aksaraa-logo.jpg" alt="Aksaraa" />
            </span>
            <span className="tpl-footer__cta">Wedding by Aksaraa</span>
          </a>
        </div>
      </section>

      <section className="music-outer">
        {track_url && (
          <button
            type="button"
            className={`tpl-music-btn visible${musicOn ? " playing" : ""}`}
            onClick={toggleMusic}
            aria-label={musicOn ? "Pause music" : "Play music"}
          >
            {musicOn ? "❮❮" : "▶"}
          </button>
        )}
      </section>

      {showGuestDock && (
        <InvitationOverlay
          guestId={guest_id}
          guestSlug={guest_slug}
          allowFlexibleRsvp={guest_link_strict === false}
          guestName={guest_name || "Tamu Undangan"}
          coupleName={coupleLabel}
          weddingProfileId={wedding_profile_id!}
          guestQrUrl={guest_qr_url}
          guestTableNumber={guest_table_number}
          guestRsvpStatus={guest_rsvp_status}
          guestRsvpMessage={guest_rsvp_message || undefined}
          rsvpMaxPax={rsvp_max_pax ?? 2}
          qrEnabled={gates.qr_code_book === true}
          anchor="center"
        />
      )}
    </div>
  )
}
