"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import "./imagine.css"
import type { TemplateProps } from "@/types/template"
import InvitationOverlay from "@/components/InvitationOverlay"
import ImagineWishes from "./ImagineWishes"

type Session = NonNullable<TemplateProps["sessions"]>[number]

/* Reference-faithful activity icons (REA aine). Fill is forced to
   var(--text-primary) by imagine.css (svg.activity-icon path), matching
   the reference's cream icons on the teal frame. */
const RINGS_SVG = <svg className="activity-icon ic-rings" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M322.656 180C318.656 180 314.736 180.24 310.896 180.48C316.684 187.936 321.848 195.856 326.336 204.16C359.969 205.08 391.885 219.212 415.174 243.494C438.464 267.776 451.251 300.254 450.767 333.896C450.283 367.538 436.567 399.635 412.589 423.238C388.611 446.84 356.301 460.047 322.656 460C288.719 459.964 256.183 446.467 232.186 422.47C208.189 398.473 194.692 365.937 194.656 332C194.763 307.79 201.686 284.099 214.632 263.641C227.578 243.182 246.023 226.783 267.856 216.32C262.787 209.693 256.99 203.655 250.576 198.32C215.726 217.068 189.57 248.678 177.676 286.421C165.783 324.164 169.09 365.059 186.896 400.4C199.641 425.478 219.059 446.552 243.013 461.302C266.966 476.052 294.525 483.907 322.656 484C362.969 484 401.63 467.986 430.136 439.48C458.642 410.975 474.656 372.313 474.656 332C474.656 291.687 458.642 253.025 430.136 224.52C401.63 196.014 362.969 180 322.656 180Z" fill="black"/> <path d="M326.336 204.16C321.848 195.856 316.684 187.936 310.896 180.48C301.929 180.427 277.311 183.92 250.576 198.32C256.99 203.655 262.787 209.693 267.856 216.32C291.656 204.914 295.656 204.16 326.336 204.16Z" fill="black"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M88.1948 193.539C64.1998 217.534 50.6999 250.066 50.6554 284C50.7034 317.286 63.7079 349.246 86.9137 373.108C110.12 396.971 141.704 410.863 174.975 411.84C179.463 420.144 190.415 435.52 190.415 435.52C190.415 435.52 182.655 436 178.655 436C139.887 435.912 102.618 421.014 74.4718 394.354C46.3258 367.693 29.4305 331.286 27.2425 292.579C25.0544 253.873 37.739 215.793 62.7011 186.13C87.6632 156.468 123.016 137.465 161.527 133.008C168.656 132.183 188.156 132.141 195.791 133C231.547 137.024 264.698 153.659 289.295 179.92C299.376 190.515 307.84 202.537 314.415 215.6C332.221 250.941 335.529 291.836 323.635 329.579C311.741 367.322 285.585 398.932 250.735 417.68C244.321 412.345 238.525 406.307 233.455 399.68C255.288 389.217 273.734 372.818 286.679 352.359C299.625 331.901 306.548 308.21 306.655 284C306.619 250.063 293.122 217.527 269.125 193.53C245.128 169.533 212.592 156.036 178.655 156C144.721 156.044 112.19 169.544 88.1948 193.539Z" fill="black"/> <path d="M250.735 417.68C244.321 412.345 238.525 406.307 233.455 399.68C224.735 404.513 200.831 413.712 174.975 411.84C179.463 420.144 190.415 435.52 190.415 435.52C223.656 432.5 228.156 429.827 250.735 417.68Z" fill="black"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M333.641 182.592L352.093 184.446L368.016 189.279L368.501 147.421L393.841 155.379L370.306 189.998L386.134 195.137L402.333 204.165L456.302 172.229C457.596 171.479 458.653 170.379 459.35 169.056C460.048 167.732 460.358 166.239 460.245 164.747L456.965 121.791C456.846 120.193 456.249 118.668 455.253 117.413C454.257 116.158 452.906 115.231 451.377 114.753L344.523 81.1935C342.995 80.7119 341.358 80.7003 339.823 81.1602C338.288 81.62 336.927 82.5301 335.915 83.7726L308.665 117.141C307.719 118.3 307.119 119.702 306.935 121.187C306.75 122.672 306.989 124.178 307.622 125.534L333.641 182.592ZM386.134 195.137L409.716 160.365L432.766 167.605L386.134 195.137ZM352.093 184.446L329.576 135.196L352.625 142.435L352.093 184.446ZM441.393 128.388L436.508 126.854L420.158 146.874L443.361 154.161L441.393 128.388ZM403.672 141.697L420.022 121.676L366.29 104.8L368.258 130.574L403.672 141.697ZM349.804 99.6225L344.919 98.0884L328.569 118.109L351.772 125.396L349.804 99.6225Z" fill="black"/> <path d="M418.763 71.8016L424.765 46.9105C426.059 41.5418 422.755 36.1381 417.389 34.8458C412.019 33.5515 406.618 36.8545 405.324 42.2227L399.322 67.1138C398.238 71.6104 400.378 76.1293 404.256 78.2398C405.008 78.649 405.826 78.9683 406.698 79.1785C412.068 80.4728 417.469 77.1711 418.763 71.8016Z" fill="black"/> <path d="M369.406 67.3112L362.091 39.0568C360.708 33.7114 355.251 30.498 349.905 31.8827C344.559 33.2666 341.347 38.7229 342.731 44.0688L350.046 72.3232C350.769 75.1142 352.601 77.3236 354.949 78.6014C357.097 79.7706 359.678 80.1589 362.233 79.4978C367.578 78.1143 370.789 72.6566 369.406 67.3112Z" fill="black"/> <path d="M477.463 66.9405C473.293 63.3221 466.976 63.7665 463.357 67.9378L444.67 89.467C441.049 93.6374 441.497 99.9527 445.667 103.573C446.227 104.059 446.824 104.47 447.45 104.81C451.484 107.006 456.639 106.186 459.773 102.576L478.46 81.0463C482.081 76.8759 481.633 70.5602 477.463 66.9405Z" fill="black"/> </svg>

const WINE_SVG = <svg className="activity-icon ic-wine" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"> <g clip-path="url(#clip0_3167_46)"> <path d="M291.89 66.15C292.629 66.317 293.367 66.397 294.094 66.397C298.66 66.397 302.782 63.241 303.827 58.592L313.485 15.664C314.697 10.276 311.318 4.92399 305.937 3.70999C300.556 2.49299 295.212 5.87999 293.999 11.268L284.341 54.196C283.13 59.584 286.51 64.936 291.89 66.15Z" fill="black"/> <path d="M244.82 52.527C246.72 55.538 249.96 57.186 253.272 57.186C255.096 57.186 256.943 56.685 258.598 55.638C263.26 52.687 264.652 46.51 261.705 41.841L238.239 4.65899C235.293 -0.0100131 229.124 -1.40101 224.461 1.54699C219.799 4.49799 218.407 10.675 221.354 15.344L244.82 52.527Z" fill="black"/> <path d="M334.915 75.605C336.74 75.605 338.586 75.104 340.243 74.056L377.404 50.528C382.066 47.576 383.456 41.399 380.508 36.731C377.561 32.064 371.392 30.671 366.73 33.623L329.569 57.15C324.907 60.102 323.517 66.279 326.465 70.947C328.365 73.957 331.604 75.605 334.915 75.605Z" fill="black"/> <path d="M458.873 433.94L395.627 406.67L375.351 330.873C401.52 321.084 423.744 300.848 435.942 275.231C447.87 250.18 448.672 222.818 438.271 197.916C438.196 197.732 437.583 196.296 437.345 195.764L393.87 98.387C391.867 93.901 386.905 91.537 382.168 92.809L286.61 118.444L288.076 104.279C288.579 99.418 285.5 94.905 280.795 93.607L249.515 84.975C249.451 84.9575 249.388 84.9406 249.324 84.9244C244.067 83.582 238.681 86.6976 237.234 91.959C235.769 97.284 238.892 102.79 244.209 104.257L267.336 110.639L263.067 151.886C234.703 138.863 197.465 140.254 171.788 156.755C150.985 170.124 117.919 170.342 95.5626 158.187L132.89 74.612L158.106 81.381C158.124 81.386 158.143 81.391 158.162 81.3959C163.469 82.7898 168.915 79.6283 170.338 74.311C171.766 68.976 168.605 63.493 163.278 62.062L129.836 53.084C125.099 51.811 120.136 54.175 118.133 58.66L74.6266 156.069C63.2726 181.526 63.7746 209.736 76.0406 235.503C88.2396 261.129 110.476 281.378 136.65 291.174L116.375 366.97L53.1226 394.216C41.8566 399.082 34.7956 410.324 35.5536 422.191C36.3096 434.042 44.7606 443.7 57.6086 447.394C57.6666 447.411 57.7246 447.427 57.7826 447.442L146.202 471.144C146.254 471.158 146.307 471.172 146.36 471.185C149.299 471.922 152.194 472.281 154.992 472.281C164.558 472.281 172.985 468.085 178.074 460.439C184.661 450.543 184.161 437.274 176.827 427.416L135.67 372.15L155.944 296.358C161.798 297.341 167.732 297.831 173.674 297.831C195.711 297.83 217.838 291.161 236.234 278.49C237.849 277.378 239.417 276.224 240.946 275.038C248.337 293.661 261.721 309.558 279.739 320.794C297.299 331.745 318.045 337.48 338.547 337.48C344.431 337.48 350.294 337.003 356.056 336.046L376.332 411.845L335.174 467.114C327.836 476.969 327.325 490.239 333.903 500.135C338.995 507.796 347.43 512 357.008 512C359.794 512 362.679 511.644 365.604 510.914C365.661 510.9 365.717 510.885 365.774 510.87L454.193 487.14C454.249 487.125 454.305 487.109 454.36 487.094C467.233 483.398 475.695 473.731 476.445 461.867C477.195 450.004 470.129 438.78 458.873 433.94ZM284.406 139.742L379.111 114.336L416.419 197.9C394.072 210.057 361.008 209.833 340.189 196.454C323.826 185.928 301.644 181.293 279.882 183.444L284.406 139.742ZM161.455 449.348C158.993 453.048 154.056 452.486 151.281 451.802L63.0446 428.15C60.3076 427.351 55.7716 425.36 55.4876 420.919C55.3096 418.136 56.9696 414.341 61.0256 412.588L121.476 386.549L160.812 439.371C163.454 442.92 162.997 447.031 161.455 449.348ZM224.916 262.011C203.851 276.52 175.667 281.466 151.343 274.916L151.341 274.915C151.341 274.915 151.339 274.915 151.337 274.914L151.334 274.913C127.016 268.407 105.074 250.009 94.0716 226.897C86.3976 210.776 84.5466 193.494 88.5086 177.071C101.839 183.799 117.367 187.214 132.846 187.213C150.652 187.212 168.384 182.709 182.577 173.588C204.023 159.804 238.499 159.988 260.853 173.289L257.225 208.343C254.974 230.152 243.5 249.211 224.916 262.011ZM290.299 303.816C273.397 293.276 261.669 277.672 256.853 259.528C268.189 245.571 275.197 228.766 277.093 210.402L277.771 203.851C296.429 201.048 315.693 204.467 329.398 213.284C343.608 222.416 361.346 226.923 379.161 226.923C394.633 226.923 410.153 223.509 423.474 216.785C427.439 233.215 425.59 250.5 417.913 266.622C406.913 289.725 384.986 308.109 360.664 314.61H360.662L360.659 314.611C360.656 314.612 360.653 314.613 360.65 314.614C337.463 320.864 311.163 316.828 290.299 303.816ZM448.929 467.845L360.697 491.525C357.923 492.205 352.992 492.758 350.531 489.054C348.991 486.737 348.54 482.625 351.187 479.07L390.524 426.247L450.981 452.315C455.03 454.056 456.685 457.832 456.51 460.604C456.231 465.051 451.676 467.044 448.929 467.845Z" fill="black"/> <path d="M237.234 91.959C238.681 86.6976 244.067 83.582 249.324 84.9244L163.278 62.062C168.605 63.493 171.766 68.976 170.338 74.311C168.915 79.6283 163.469 82.7898 158.162 81.3959L244.209 104.257C238.892 102.79 235.769 97.284 237.234 91.959Z" fill="black"/> </g> <defs> <clipPath id="clip0_3167_46"> <rect width="512" height="512" fill="white"/> </clipPath> </defs> </svg>

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
    preview_mode,
  } = props

  const gates = feature_gates || {}
  const tc = template_content || {}

  const [opened, setOpened] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // AOS-like reveal: rAF + scroll driven (robust across browsers/tabs).
  // Honors reference AOS semantics: duration/delay attrs, `.aos-animate`
  // class (required by base css `.bg-tc.aos-animate` scaleAnimate).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const reveal = () => {
      raf = 0
      root.querySelectorAll<HTMLElement>("[data-aos]:not(.aos-animate)").forEach((el) => {
        const gate = el.closest(".top-cover")
        const fire = () => {
          el.style.transitionDuration = `${el.dataset.aosDuration || 400}ms`
          el.style.transitionDelay = `${el.dataset.aosDelay || 0}ms`
          el.classList.add("aos-animate")
        }
        if (gate) {
          // Gate elements run their intro timeline while the gate is up;
          // skip once the gate is closed (post-open) — nothing is visible there.
          if (!gate.classList.contains("is-hidden")) fire()
          return
        }
        const r = el.getBoundingClientRect()
        // AOS reveals once the element is beneath the trigger line, even
        // after the user has scrolled past it (bottom may be negative).
        if (r.top < window.innerHeight - 120) fire()
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

  // Reference shows no gate overlay on desktop (top-cover is display:none
  // above 960px — the invitation sits immediately in the secondary pane).
  // Auto-reveal there; mobile keeps the gate.
  useEffect(() => {
    if (window.matchMedia("(min-width: 961px)").matches) setOpened(true)
  }, [])

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

  // Guest dock (QR + RSVP) is a per-guest affair: only real invitation links
  // render it — template previews simulate no guest context.
  const showGuestDock =
    !preview_mode &&
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
                  // `.save-date` is the absolutely-centered overlay inside the
                  // orn-23 frame (reference .save-date-wrap .save-date rule).
                  <div className="save-date">
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
          />
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
