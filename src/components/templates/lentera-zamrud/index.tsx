"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"
import { childFullName, childInitials, resolveChildren } from "@/lib/children"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, formatLongDate, gcalLink, groomPhoto, photoList } from "../shared/lib"
import { useWishes } from "../shared/kids/useWishes"
import { LOCKED_FIELD_STYLE, wishNameState } from "../shared/wishName"
import "./lentera-zamrud.css"

const ART = (name: string) => `/templates/lentera-zamrud/${name}.webp`

const DEFAULT_BASMALAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
const DEFAULT_SALAM = "Assalamu'alaikum Warahmatullahi Wabarakatuh"
const DEFAULT_OPENING =
  "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan tasyakuran khitanan putra kami. Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."
const DEFAULT_CLOSING =
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu untuk putra kami."
const DEFAULT_GIFT =
  "Doa restu Bapak/Ibu/Saudara/i sudah lebih dari cukup bagi kami. Namun bila ingin memberikan tanda kasih, dapat melalui:"

const WISH_PAGE = 10

/** Reveal spec, mirroring the reference's animate.css delays (1s, fill both). */
function reveal(delay = 0): CSSProperties {
  return { animationDelay: `${delay}s` }
}

/**
 * The reference renderer shrinks a one-line name until it fits its plate
 * (24px payload renders at 17.28px for a 25-character name). Reproduce that
 * instead of letting a long name spill over the arch or the screen edge.
 */
function useFitOneLine<T extends HTMLElement>(text: string, maxScale = 0.5, wrapAtFloor = false) {
  const cleanup = useRef<(() => void) | null>(null)
  return useCallback(
    (el: T | null) => {
      cleanup.current?.()
      cleanup.current = null
      if (!el) return
      const fit = () => {
        el.style.removeProperty("font-size")
        el.style.removeProperty("white-space")
        const cs = window.getComputedStyle(el)
        const padL = parseFloat(cs.paddingLeft) || 0
        const padR = parseFloat(cs.paddingRight) || 0
        const box = el.clientWidth - padL - padR
        if (!box) return
        // Measure the element itself instead of a detached probe: a probe that
        // renders with the fallback face underestimates the webfont width (it
        // once came in 15% short) and the name then spilled past the plate.
        const width = el.scrollWidth - padL - padR
        if (width <= box) return
        const base = parseFloat(cs.fontSize)
        // letter-spacing (and text-indent) are fixed px, not em: they do not
        // shrink with the font, so subtract them before scaling.
        const fixed =
          (parseFloat(cs.letterSpacing) || 0) * Math.max(0, (el.textContent || "").length - 1) +
          (parseFloat(cs.textIndent) || 0)
        const target = (base * Math.max(1, box - fixed)) / Math.max(1, width - fixed)
        if (target < base * maxScale) {
          // floor reached: keep the floor size and, where the block is in flow
          // (the Putra name), let it wrap instead of spilling past the plate
          el.style.fontSize = `${(base * maxScale).toFixed(2)}px`
          if (wrapAtFloor) el.style.whiteSpace = "normal"
        } else {
          el.style.fontSize = `${target.toFixed(2)}px`
        }
      }
      fit()
      if (document.fonts) void document.fonts.ready.then(fit).catch(() => {})
      window.addEventListener("resize", fit)
      cleanup.current = () => window.removeEventListener("resize", fit)
    },
    [text, maxScale, wrapAtFloor]
  )
}

function timeLine(raw?: string): string {
  const value = (raw || "").trim()
  if (!value) return ""
  const normalized = value.replace(/(\d)\s*-\s*(\d)/g, "$1 – $2")
  const withPrefix = /^pukul/i.test(normalized) ? normalized : `Pukul ${normalized}`
  return /wib/i.test(withPrefix) ? withPrefix : `${withPrefix} WIB`
}

function accountName(raw?: string): string {
  const name = (raw || "").trim()
  if (!name) return ""
  return /^(a\/n|atas nama)\b/i.test(name) ? name : `a/n ${name}`
}

export default function LenteraZamrud(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [now, setNow] = useState<number | null>(null)
  const [wishMessage, setWishMessage] = useState("")
  const [wishPage, setWishPage] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Design QA hook: ?opened=1 starts the invitation open so review tools can
  // screenshot every section without tapping.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("opened") === "1") {
      setOpened(true)
      document.body.classList.remove("lz-locked")
    }
  }, [])

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const labels = profile.event_labels || eventLabels(profile.event_type, profile.subject_gender)

  const covers = useMemo(() => photoList(profile.cover_photos as string | string[] | undefined), [profile.cover_photos])
  // One ceremony can introduce several ananda; the legacy single slot remains
  // the fallback so invitations made before the column existed never change.
  const ananda = useMemo(() => resolveChildren(profile), [profile])
  const primary = ananda[0]
  const portrait = primary?.photo_url || groomPhoto(profile.groom_photo_url) || covers[1] || ""
  const cover = covers[0] || portrait || ASSETS.defaults.couple
  const closingPhoto = covers[2] || cover

  const childName = primary ? (primary.name || primary.full_name) : "Ananda"
  const childFull = primary ? childFullName(primary) : childName
  // Several ananda share one ceremony: the cover and the RSVP dock name them all,
  // comma separated ("Raka, Rizky"), instead of silently showing only the first.
  const childNames =
    ananda.length > 1
      ? ananda.map((child) => child.name || child.full_name).filter(Boolean).join(", ")
      : childName
  const groupFullName =
    ananda.length > 1
      ? ananda.map((child) => childFullName(child)).filter(Boolean).join(", ")
      : childFull
  const parents = (profile.groom_parents || "").trim()
  const guestName = (profile.guest_name || "").trim() || labels.guestFallback
  const hasGuestName = guestName !== labels.guestFallback

  const events = useMemo(
    () => (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue || s.address)),
    [profile.sessions]
  )
  const eventDate = (profile.estimated_wedding_date || "").trim()
  const target = useMemo(() => countdownTarget(events, eventDate), [events, eventDate])
  const calendarUrl = useMemo(() => (events.length ? gcalLink(events[0], groupFullName) : ""), [events, groupFullName])

  const gallery = useMemo(
    () => (Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean).slice(0, 8) : []),
    [profile.gallery_photos]
  )

  const honored = useMemo(
    () =>
      gates.inviting_families !== false && profile.inviting_families_visible !== false
        ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
        : [],
    [profile.inviting_families, profile.inviting_families_visible, gates.inviting_families]
  )

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const coverKicker = (tc.cover_kicker || "").trim() || labels.eventKicker
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const guestLabel = (tc.cover_guest_label || "").trim() || "Kepada Yth. Bapak/Ibu/Saudara/i"
  const basmalah = (tc.basmalah || "").trim() || DEFAULT_BASMALAH
  const salam = (tc.opening_salam || "").trim() || DEFAULT_SALAM
  const openingText = (profile.opening_description || "").trim() || DEFAULT_OPENING
  const countdownTitle = (tc.countdown_intro || "").trim() || labels.countdownLabel
  const saveDateLabel = (tc.save_date_label || "").trim() || "Simpan Tanggal"
  const eventsTitle = (tc.events_title || "").trim() || "Waktu & Tempat"
  const eventsIntro = (tc.events_intro || "").trim() || "Insya Allah acara akan diselenggarakan pada:"
  const mapsLabel = (tc.maps_label || "").trim() || "Lihat Lokasi"
  const galleryTitle = (tc.gallery_title || "").trim() || "Galeri"
  const galleryIntro = (tc.gallery_intro || "").trim() || "Momen kecil yang ingin kami bagikan."
  const wishesTitle = (tc.wishes_title || "").trim() || labels.wishesTitle
  const wishesIntro = (tc.wishes_intro || "").trim() || "Kirimkan doa dan harapan terbaik untuk putra kami."
  const wishNameLabel = (tc.wishes_name_label || "").trim() || "Nama Anda"
  const wishNamePlaceholder = (tc.wishes_name_placeholder || "").trim() || "Tulis nama Anda"
  const wishMessageLabel = (tc.wishes_message_label || "").trim() || "Doa dan ucapan"
  const wishMessagePlaceholder = (tc.wishes_message_placeholder || "").trim() || "Tulis doa dan ucapan"
  const wishSubmit = (tc.wishes_submit || "").trim() || "Kirim Ucapan"
  const wishEmpty = (tc.wishes_empty || "").trim() || "Belum ada ucapan. Jadilah yang pertama."
  const wishLoading = (tc.wishes_loading || "").trim() || "Memuat ucapan"
  const giftTitle = (tc.gift_intro_title || "").trim() || labels.giftTitle
  const giftLead = (tc.gift_intro_description || "").trim() || DEFAULT_GIFT
  const giftNote = (tc.gift_transfer_note || "").trim() || "transfer ke rekening di bawah ini:"
  const copyAccountButton = (tc.copy_account_button || "").trim() || "Salin Nomor"
  const copyAddressButton = (tc.copy_address_button || "").trim() || "Salin Alamat"
  const sendGiftLabel = (tc.gift_send_label || "").trim() || "Kirim Hadiah"
  const invitingKicker = (tc.inviting_kicker || "").trim() || "Turut Mengundang"
  const invitingTitle = (tc.inviting_title || "").trim() || "Keluarga & Kerabat"
  const closingKicker = (tc.closing_kicker || "").trim() || labels.closingHeadline
  const closingFamily = (tc.closing_family || "").trim() || "Keluarga Besar"
  const closingText = (tc.closing_message || "").trim() || DEFAULT_CLOSING
  const closingSalam = (tc.closing_salam || "").trim() || "Wassalamu'alaikum Warahmatullahi Wabarakatuh"

  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()

  const parsedDate = eventDate ? new Date(eventDate) : null
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null
  const dateLine = validDate ? formatLongDate(eventDate) : ""

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.kidsMusic : "")
  const wishes = useWishes(profile.wedding_profile_id, profile.guest_id)
  const nameState = useMemo(
    () => wishNameState(profile.guest_name, profile.guest_id, profile.guest_link_strict),
    [profile.guest_name, profile.guest_id, profile.guest_link_strict]
  )
  const [wishName, setWishName] = useState(nameState.value)
  const [wishNameLocked] = useState(nameState.locked)

  const coverNameRef = useFitOneLine<HTMLHeadingElement>(childNames, 0.5, true)
  const guestRef = useFitOneLine<HTMLParagraphElement>(guestName, 0.42, true)
  const putraNameRef = useFitOneLine<HTMLParagraphElement>(childFull, 0.5, true)

  const wishPages = Math.max(1, Math.ceil(wishes.wishes.length / WISH_PAGE))
  const visibleWishes = wishes.wishes.slice(wishPage * WISH_PAGE, wishPage * WISH_PAGE + WISH_PAGE)
  // Structural a11y labels (WCAG), not couple copy.
  const pagerPrevLabel = `${wishesTitle} sebelumnya`
  const pagerNextLabel = `${wishesTitle} berikutnya`
  const lightboxCloseLabel = `Tutup ${galleryTitle}`
  const lightboxPrevLabel = `${galleryTitle} sebelumnya`
  const lightboxNextLabel = `${galleryTitle} berikutnya`

  const showDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
    lightbox === null &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2400)
  }, [])

  const playMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    )
  }, [])

  const openInvitation = useCallback(() => {
    setOpened(true)
    window.scrollTo(0, 0)
    playMusic()
  }, [playMusic])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) playMusic()
    else {
      audio.pause()
      setPlaying(false)
    }
  }, [playMusic])

  const copyText = useCallback(
    async (value: string, message: string) => {
      if (!value) return
      await copyPlainText(value)
      showToast(message)
    },
    [showToast]
  )

  const submitWish = useCallback(async () => {
    const ok = await wishes.send(wishName || guestName, wishMessage)
    if (ok) {
      setWishMessage("")
      setWishPage(0)
    }
  }, [wishes, wishName, guestName, wishMessage])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    document.body.classList.toggle("lz-locked", !opened)
    return () => document.body.classList.remove("lz-locked")
  }, [opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-lz-reveal]"))
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          io.unobserve(entry.target)
        }
        // A fast swipe can jump an element clean over the viewport between two
        // observer ticks; it must never stay invisible once it is above us.
        for (const el of targets) {
          if (el.getBoundingClientRect().bottom < 0) {
            el.classList.add("is-in")
            io.unobserve(el)
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [opened, gallery.length, accounts.length, wishes.wishes.length, honored.length, events.length])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (event.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % gallery.length))
      if (event.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length])

  const countdownCells = (() => {
    const ms = target && now ? Math.max(0, target.getTime() - now) : 0
    return [
      { value: Math.floor(ms / 86400000), label: "Hari" },
      { value: Math.floor((ms % 86400000) / 3600000), label: "Jam" },
      { value: Math.floor((ms % 3600000) / 60000), label: "Menit" },
      { value: Math.floor((ms % 60000) / 1000), label: "Detik" },
    ]
  })()

  return (
    <div ref={rootRef} className={`lz-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className="lz-frame">
        {!opened && (
          <section className={`lz-cover${hasGuestName ? " has-guest" : ""}`} aria-label={coverKicker}>
            <div className="lz-cover__paper" aria-hidden="true" />
            <div className="lz-cover__pattern" aria-hidden="true" />

            <div className="lz-lantern lz-lantern--a lz-anim-fade">
              <img src={ART("lentera-1")} alt="" aria-hidden="true" draggable={false} />
            </div>
            <div className="lz-lantern lz-lantern--b lz-anim-fade">
              <img src={ART("lentera-2")} alt="" aria-hidden="true" draggable={false} />
            </div>
            <div className="lz-lantern lz-lantern--c lz-anim-fade">
              <img src={ART("lentera-3")} alt="" aria-hidden="true" draggable={false} />
            </div>

            <img className="lz-cover__skyline lz-anim-fade" src={ART("kubah-masjid")} alt="" aria-hidden="true" draggable={false} />

            <p className="lz-cover__kicker lz-anim-down" style={reveal(0.15)}>{coverKicker}</p>

            <div className="lz-cover__photo lz-anim-zoom" style={reveal(0.3)}>
              <div className="lz-arch">
                <img src={cover} alt={childFull} draggable={false} />
              </div>
              <img className="lz-arch__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" draggable={false} />
              <div className="lz-sprig lz-sprig--l lz-anim-fade">
                <img src={ART("melati-kiri")} alt="" aria-hidden="true" draggable={false} />
              </div>
              <div className="lz-sprig lz-sprig--r lz-anim-fade">
                <img src={ART("melati-kanan")} alt="" aria-hidden="true" draggable={false} />
              </div>
            </div>

            <h1 ref={coverNameRef} className="lz-cover__name lz-anim-up" style={reveal(0.4)}>{childNames}</h1>

            <img className="lz-divider lz-anim-fade" src={ART("pemisah-emas")} alt="" aria-hidden="true" style={reveal(0.45)} />
            <p className="lz-cover__guest-label lz-anim-fade" style={reveal(0.5)}>{guestLabel}</p>
            {hasGuestName && (
              <p ref={guestRef} className="lz-cover__guest lz-anim-fade" style={reveal(0.55)}>{guestName}</p>
            )}

            <div className="lz-cover__cta lz-anim-up" style={reveal(0.65)}>
              <button type="button" className="lz-open" onClick={openInvitation}>
                <span className="material-symbols-outlined" aria-hidden="true">mail</span>
                {openLabel}
              </button>
            </div>
          </section>
        )}

        {opened && (
          <main>
            {/* Pembuka */}
            <section className="lz-section lz-section--dark lz-pembuka">
              <div className="lz-pattern" aria-hidden="true" />
              <img className="lz-crescent lz-reveal lz-reveal--zoom" src={ART("bulan-sabit")} alt="" aria-hidden="true" draggable={false} data-lz-reveal style={reveal(0)} />
              <p className="lz-arabic lz-reveal lz-reveal--up" lang="ar" dir="rtl" data-lz-reveal style={reveal(0.06)}>{basmalah}</p>
              <p className="lz-pembuka__salam lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.09)}>{salam}</p>
              <p className="lz-pembuka__text lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.12)}>{openingText}</p>
              <img className="lz-divider lz-divider--lg lz-reveal lz-reveal--in" src={ART("pemisah-emas-2")} alt="" aria-hidden="true" data-lz-reveal style={reveal(0.06)} />
            </section>

            {/* Putra / Putri Kami */}
            <section className="lz-section lz-section--cream lz-putra">
              <div className="lz-paper" aria-hidden="true" />
              <p className="lz-kicker lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{labels.subjectPossessive}</p>

              {ananda.length > 1 ? (
                <div className="lz-ananda lz-reveal lz-reveal--in" data-lz-reveal style={reveal(0.04)}>
                  {ananda.map((child, index) => (
                    <article className="lz-ananda__item" key={`${child.full_name || child.name}-${index}`}>
                      <div className="lz-putra__stage">
                        <div className="lz-putra__arch">
                          {child.photo_url ? (
                            <img src={child.photo_url} alt={childFullName(child)} loading="lazy" draggable={false} />
                          ) : (
                            <span className="lz-ananda__monogram" aria-hidden="true">{childInitials(child)}</span>
                          )}
                        </div>
                        <img className="lz-arch__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                        <div className="lz-sprig lz-sprig--l">
                          <img src={ART("ranting-daun")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                        </div>
                        <div className="lz-sprig lz-sprig--r">
                          <img src={ART("ranting-zaitun")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                        </div>
                      </div>
                      <p className="lz-ananda__name">{childFullName(child)}</p>
                      {child.instagram && (
                        <a
                          className="lz-putra__ig lz-ananda__ig"
                          href={`https://instagram.com/${child.instagram}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          @{child.instagram}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <>
                  <div className="lz-putra__stage lz-reveal lz-reveal--in" data-lz-reveal style={reveal(0.04)}>
                    <div className="lz-putra__arch">
                      <img src={portrait} alt={childFull} loading="lazy" draggable={false} />
                    </div>
                    <img className="lz-arch__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" draggable={false} />
                    <div className="lz-sprig lz-sprig--l">
                      <img src={ART("ranting-daun")} alt="" aria-hidden="true" draggable={false} />
                    </div>
                    <div className="lz-sprig lz-sprig--r">
                      <img src={ART("ranting-zaitun")} alt="" aria-hidden="true" draggable={false} />
                    </div>
                  </div>

                  <p ref={putraNameRef} className="lz-putra__name lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.06)}>{childFull}</p>
                </>
              )}
              {parents && (
                <>
                  <p className="lz-kicker lz-kicker--sm lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.08)}>{labels.subjectOf}</p>
                  <p className="lz-putra__parents lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.09)}>{parents}</p>
                </>
              )}
              {ananda.length <= 1 && primary?.instagram && (
                <a
                  className="lz-putra__ig lz-reveal lz-reveal--up"
                  data-lz-reveal
                  style={reveal(0.1)}
                  href={`https://instagram.com/${primary.instagram}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @{primary.instagram}
                </a>
              )}

              {quoteText && (
                <>
                  <img className="lz-divider lz-reveal lz-reveal--in" src={ART("pemisah-emas")} alt="" aria-hidden="true" data-lz-reveal style={reveal(0.06)} />
                  <p className="lz-putra__quote lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.1)}>&ldquo;{quoteText}&rdquo;</p>
                  {quoteSource && (
                    <p className="lz-putra__source lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.11)}>{quoteSource}</p>
                  )}
                </>
              )}
            </section>

            {/* Menuju Hari Bahagia */}
            {target && (
              <section className="lz-section lz-section--dark lz-countdown">
                <div className="lz-pattern" aria-hidden="true" />
                <div className="lz-lantern lz-lantern--d">
                  <img src={ART("lentera-1")} alt="" aria-hidden="true" draggable={false} />
                </div>
                <div className="lz-lantern lz-lantern--e">
                  <img src={ART("lentera-2")} alt="" aria-hidden="true" draggable={false} />
                </div>

                <p className="lz-script-title lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{countdownTitle}</p>
                {dateLine && (
                  <p className="lz-countdown__date lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{dateLine}</p>
                )}

                <div className="lz-count lz-reveal lz-reveal--zoom" data-lz-reveal style={reveal(0.08)}>
                  {countdownCells.map((cell, index) => (
                    <span className="lz-count__group" key={cell.label}>
                      {index > 0 && <span className="lz-count__sep" aria-hidden="true">:</span>}
                      <span className="lz-count__cell">
                        <span className="lz-count__num">{now ? String(cell.value).padStart(2, "0") : "--"}</span>
                        <small>{cell.label}</small>
                      </span>
                    </span>
                  ))}
                </div>

                {calendarUrl && (
                  <div className="lz-countdown__cta">
                    <a className="lz-pill lz-pill--calendar" href={calendarUrl} target="_blank" rel="noreferrer noopener">
                      <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                      {saveDateLabel}
                    </a>
                  </div>
                )}

                <img className="lz-skyline lz-skyline--md" src={ART("kubah-masjid")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              </section>
            )}

            {/* Waktu & Tempat */}
            {events.length > 0 && (
              <section className="lz-section lz-section--cream lz-events">
                <div className="lz-paper" aria-hidden="true" />
                <img className="lz-corner lz-corner--l" src={ART("sudut-emas-1")} alt="" aria-hidden="true" draggable={false} />
                <img className="lz-corner lz-corner--r" src={ART("sudut-emas-2")} alt="" aria-hidden="true" draggable={false} />

                <h2 className="lz-script-title lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{eventsTitle}</h2>
                <p className="lz-lead lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{eventsIntro}</p>

                <div className="lz-events__list lz-reveal lz-reveal--in" data-lz-reveal style={reveal(0.06)}>
                  {events.map((session, index) => (
                    <article className="lz-event" key={`${session.name || "acara"}-${index}`}>
                      <h3 className="lz-event__name">{session.name || labels.mainEventName}</h3>
                      {(session.date || dateLine) && (
                        <p className="lz-event__date">{formatLongDate(session.date || eventDate)}</p>
                      )}
                      {session.time && <p className="lz-event__time">{timeLine(session.time)}</p>}
                      {(session.venue || session.address) && (
                        <p className="lz-event__place">
                          {session.venue && session.address
                            ? `${session.venue} · ${session.address}`
                            : session.venue || session.address}
                        </p>
                      )}
                      {session.maps_url && (
                        <a className="lz-pill" href={session.maps_url} target="_blank" rel="noreferrer noopener">
                          <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
                          {mapsLabel}
                        </a>
                      )}
                      {index < events.length - 1 && (
                        <img className="lz-divider lz-divider--sm" src={ART("pemisah-emas-3")} alt="" aria-hidden="true" />
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Galeri */}
            {gallery.length > 0 && (
              <section className="lz-section lz-section--cream lz-gallery">
                <div className="lz-paper" aria-hidden="true" />
                <h2 className="lz-script-title lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{galleryTitle}</h2>
                <p className="lz-lead lz-lead--sm lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{galleryIntro}</p>

                <div className={`lz-gallery__grid${gallery.length === 1 ? " is-single" : ""} lz-reveal lz-reveal--up`} data-lz-reveal style={reveal(0.08)}>
                  {gallery.map((src, index) => (
                    <button
                      type="button"
                      className="lz-gallery__item"
                      key={`${src}-${index}`}
                      onClick={() => setLightbox(index)}
                      aria-label={`${galleryTitle} ${index + 1}`}
                    >
                      <img src={src} alt="" loading="lazy" draggable={false} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Doa & Ucapan */}
            <section className="lz-section lz-section--cream lz-wishes">
              <div className="lz-paper" aria-hidden="true" />
              <img className="lz-crescent lz-crescent--sm lz-reveal lz-reveal--zoom" src={ART("bulan-sabit")} alt="" aria-hidden="true" draggable={false} data-lz-reveal style={reveal(0)} />
              <h2 className="lz-script-title lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{wishesTitle}</h2>
              <p className="lz-lead lz-lead--sm lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{wishesIntro}</p>

              <div className="lz-wish-form lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.08)}>
                <label className="lz-field">
                  <span className="lz-field__label">{wishNameLabel}</span>
                  <input
                    value={wishName}
                    onChange={(event) => setWishName(event.target.value)}
                    placeholder={wishNamePlaceholder}
                    readOnly={wishNameLocked}
                    aria-label={wishNameLabel}
                    style={wishNameLocked ? LOCKED_FIELD_STYLE : undefined}
                  />
                </label>
                <label className="lz-field">
                  <span className="lz-field__label">{wishMessageLabel}</span>
                  <textarea
                    value={wishMessage}
                    onChange={(event) => setWishMessage(event.target.value)}
                    placeholder={wishMessagePlaceholder}
                    maxLength={500}
                    rows={4}
                    aria-label={wishMessageLabel}
                  />
                </label>
                <button
                  type="button"
                  className="lz-wish-send"
                  onClick={submitWish}
                  disabled={wishes.state === "sending" || !wishMessage.trim()}
                >
                  {wishSubmit}
                </button>
                <p className="lz-note" role="status">{wishes.feedback}</p>
              </div>

              <div className="lz-wish-list">
                {!wishes.loaded ? (
                  <p className="lz-wish-empty">{wishLoading}</p>
                ) : wishes.wishes.length === 0 ? (
                  <p className="lz-wish-empty">{wishEmpty}</p>
                ) : (
                  visibleWishes.map((wish) => (
                    <article className="lz-wish" key={wish.id}>
                      <p className="lz-wish__name">{wish.name || labels.guestFallback}</p>
                      <p className="lz-wish__text">{wish.message}</p>
                      <span className="lz-wish__time">{formatDotDate(wish.created_at)}</span>
                    </article>
                  ))
                )}
                {wishes.loaded && wishPages > 1 && (
                  <div className="lz-wish-pager">
                    <button
                      type="button"
                      onClick={() => setWishPage((page) => Math.max(0, page - 1))}
                      disabled={wishPage === 0}
                      aria-label={pagerPrevLabel}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                    </button>
                    <span>{`${wishPage + 1} / ${wishPages}`}</span>
                    <button
                      type="button"
                      onClick={() => setWishPage((page) => Math.min(wishPages - 1, page + 1))}
                      disabled={wishPage >= wishPages - 1}
                      aria-label={pagerNextLabel}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Tanda Kasih */}
            {hasGift && (
              <section className="lz-section lz-section--cream lz-gift">
                <div className="lz-paper" aria-hidden="true" />
                <h2 className="lz-script-title lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{giftTitle}</h2>
                <p className="lz-lead lz-lead--sm lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{giftLead}</p>

                <div className="lz-gift__wrap lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.08)}>
                  {accounts.length > 0 && <p className="lz-gift__lead">{giftNote}</p>}
                  {accounts.map((account, index) => (
                    <div className="lz-gift-card" key={`${account.account_number || account.provider_name || "acc"}-${index}`}>
                      <p className="lz-gift-card__bank">{account.provider_name}</p>
                      <p className="lz-gift-card__row">
                        <span className="lz-gift-card__number">{account.account_number}</span>
                        <button
                          type="button"
                          className="lz-gift-card__copy"
                          onClick={() => copyText(account.account_number || "", "Nomor rekening disalin")}
                          aria-label={copyAccountButton}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                        </button>
                      </p>
                      <p className="lz-gift-card__owner">{accountName(account.account_name)}</p>
                    </div>
                  ))}

                  {giftAddress && (
                    <div className="lz-gift-card">
                      <p className="lz-gift-card__bank">{sendGiftLabel}</p>
                      {profile.gift_address_name && <p className="lz-gift-card__name">{profile.gift_address_name}</p>}
                      <p className="lz-gift-card__address">{giftAddress}</p>
                      <button
                        type="button"
                        className="lz-gift-card__copy lz-gift-card__copy--wide"
                        onClick={() => copyText(giftAddress, "Alamat disalin")}
                        aria-label={copyAddressButton}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                        {copyAddressButton}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Turut Mengundang */}
            {honored.length > 0 && (
              <section className="lz-section lz-section--cream lz-inviting">
                <div className="lz-paper" aria-hidden="true" />
                <p className="lz-kicker lz-kicker--sm lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0)}>{invitingKicker}</p>
                <h2 className="lz-script-title lz-script-title--md lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{invitingTitle}</h2>
                <ul className="lz-inviting__list lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.08)}>
                  {honored.map((family, index) => (
                    <li key={`${family}-${index}`}>{family}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Penutup */}
            <section className="lz-section lz-section--dark lz-closing">
              <div className="lz-pattern" aria-hidden="true" />
              <div className="lz-lantern lz-lantern--f">
                <img src={ART("lentera-3")} alt="" aria-hidden="true" draggable={false} />
              </div>
              <div className="lz-lantern lz-lantern--g">
                <img src={ART("lentera-1")} alt="" aria-hidden="true" draggable={false} />
              </div>

              <div className="lz-closing__photo lz-reveal lz-reveal--in" data-lz-reveal style={reveal(0)}>
                <div className="lz-closing__arch">
                  <img src={closingPhoto} alt="" loading="lazy" draggable={false} />
                </div>
                <img className="lz-arch__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              </div>

              <p className="lz-closing__text lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.04)}>{closingText}</p>
              <p className="lz-closing__salam lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.06)}>{closingSalam}</p>
              <img className="lz-divider lz-divider--lg lz-reveal lz-reveal--in" src={ART("pemisah-emas-2")} alt="" aria-hidden="true" data-lz-reveal style={reveal(0.06)} />
              <p className="lz-kicker lz-kicker--sm lz-closing__kicker lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.08)}>{closingKicker}</p>
              <p className="lz-closing__family lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.09)}>{closingFamily}</p>
              {parents && (
                <p className="lz-closing__parents lz-reveal lz-reveal--up" data-lz-reveal style={reveal(0.1)}>{parents}</p>
              )}

              <img className="lz-skyline lz-skyline--lg" src={ART("kubah-masjid")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            </section>

            <div className="lz-footer">
              <a className="lz-footer__link" href="https://wa.me/6281161613071" target="_blank" rel="noopener noreferrer">
                <span className="lz-footer__badge">
                  <img className="lz-footer__logo" src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa" loading="lazy" />
                </span>
                <span className="lz-footer__cta">{labels.brand} by Aksaraa</span>
              </a>
            </div>
          </main>
        )}
      </div>

      {trackUrl && (
        <button
          type="button"
          className={`lz-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <span className="material-symbols-outlined" aria-hidden="true">music_note</span>
        </button>
      )}

      {toast && <div className="lz-toast" role="status">{toast}</div>}

      {lightbox !== null && gallery[lightbox] && (
        <div className="lz-lightbox" role="dialog" aria-modal="true">
          <button type="button" className="lz-lightbox__backdrop" onClick={() => setLightbox(null)} aria-label={lightboxCloseLabel} />
          <img className="lz-lightbox__img" src={gallery[lightbox]} alt="" />
          <button type="button" className="lz-lightbox__close" onClick={() => setLightbox(null)} aria-label={lightboxCloseLabel}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                className="lz-lightbox__nav lz-lightbox__nav--prev"
                onClick={() => setLightbox((index) => (index === null ? null : (index - 1 + gallery.length) % gallery.length))}
                aria-label={lightboxPrevLabel}
              >
                <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </button>
              <button
                type="button"
                className="lz-lightbox__nav lz-lightbox__nav--next"
                onClick={() => setLightbox((index) => (index === null ? null : (index + 1) % gallery.length))}
                aria-label={lightboxNextLabel}
              >
                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </>
          )}
        </div>
      )}

      {showDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestName}
          coupleName={groupFullName}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message}
          rsvpMaxPax={profile.rsvp_max_pax}
          qrEnabled={Boolean(gates.qr_code_book)}
        />
      )}
    </div>
  )
}
