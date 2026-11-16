"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, formatLongDate, gcalLink, groomPhoto, photoList } from "../shared/lib"
import { useWishes } from "../shared/kids/useWishes"
import { LOCKED_FIELD_STYLE, wishNameState } from "../shared/wishName"
import "./songket-marun.css"

const ART = (name: string) => `/templates/songket-marun/${name}.webp`

const DEFAULT_BASMALAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
const DEFAULT_DOA = "رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ"
const DEFAULT_SALAM = "Assalamu'alaikum Warahmatullahi Wabarakatuh"
const DEFAULT_OPENING =
  "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan Walimatul Khitan putra kami tercinta. Merupakan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."
const DEFAULT_BLESSING =
  "Semoga ananda tumbuh menjadi anak yang saleh, berbakti kepada orang tua, dan senantiasa dalam lindungan Allah SWT."
const DEFAULT_CLOSING =
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu untuk putra kami."
const DEFAULT_GIFT =
  "Doa restu Bapak/Ibu/Saudara/i adalah hadiah terindah bagi kami. Bila berkenan memberikan tanda kasih, dapat melalui tombol berikut."

const WISH_PAGE = 10
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]
const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

function reveal(delay = 0): CSSProperties {
  return { animationDelay: `${delay}s` }
}

/** Shrink a one-line name until it fits its plate (reference behaviour). */
function useFitOneLine<T extends HTMLElement>(text: string, maxScale = 0.55) {
  const cleanup = useRef<(() => void) | null>(null)
  return useCallback(
    (el: T | null) => {
      cleanup.current?.()
      cleanup.current = null
      if (!el) return
      const fit = () => {
        el.style.removeProperty("font-size")
        const cs = window.getComputedStyle(el)
        const box = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        if (!box) return
        const probe = document.createElement("span")
        probe.textContent = el.textContent || text
        probe.style.cssText = [
          "position:absolute",
          "left:-9999px",
          "top:0",
          "visibility:hidden",
          "white-space:nowrap",
          `font-family:${cs.fontFamily}`,
          `font-size:${cs.fontSize}`,
          `font-weight:${cs.fontWeight}`,
          `font-style:${cs.fontStyle}`,
          `letter-spacing:${cs.letterSpacing}`,
          `text-transform:${cs.textTransform}`,
        ].join(";")
        document.body.appendChild(probe)
        const width = probe.getBoundingClientRect().width
        probe.remove()
        if (width <= box) return
        const base = parseFloat(cs.fontSize)
        el.style.fontSize = `${Math.max(base * maxScale, (base * box) / width).toFixed(2)}px`
      }
      fit()
      if (document.fonts) void document.fonts.ready.then(fit).catch(() => {})
      window.addEventListener("resize", fit)
      cleanup.current = () => window.removeEventListener("resize", fit)
    },
    [text, maxScale]
  )
}

function timeLine(raw?: string): string {
  const value = (raw || "").trim()
  if (!value) return ""
  const normalized = value.replace(/(\d)\s*[-–]\s*(\d)/g, "$1 – $2")
  const withPrefix = /^pukul/i.test(normalized) ? normalized : `Pukul ${normalized}`
  return /wib/i.test(withPrefix) ? withPrefix : `${withPrefix} WIB`
}

function accountName(raw?: string): string {
  const name = (raw || "").trim()
  if (!name) return ""
  return /^(a\/n|atas nama)\b/i.test(name) ? name : `a/n ${name}`
}

export default function SongketMarun(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [now, setNow] = useState<number | null>(null)
  const [wishMessage, setWishMessage] = useState("")
  const [wishPage, setWishPage] = useState(0)

  // Design QA hook: ?opened=1 starts the invitation open so review tools can
  // screenshot every section without tapping. Harmless for real guests.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("opened") === "1") {
      setOpened(true)
      document.body.classList.remove("skm-locked")
    }
  }, [])

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const labels = profile.event_labels || eventLabels(profile.event_type, profile.subject_gender)

  const covers = useMemo(() => photoList(profile.cover_photos as string | string[] | undefined), [profile.cover_photos])
  const portrait = groomPhoto(profile.groom_photo_url) || covers[1] || ""
  const cover = covers[0] || portrait || ASSETS.defaults.couple
  const venuePhoto = covers[1] || ""
  const closingPhoto = covers[2] || cover

  const childName = (profile.groom_name || "").trim() || "Ananda"
  const childFull = (profile.groom_full_name || childName).trim()
  const parents = (profile.groom_parents || "").trim()
  // The reference prints "Bapak X" / "& Ibu Y" on two deliberate lines.
  const parentLines = parents.replace(/\s*&\s*/, "\n& ")
  const guestName = (profile.guest_name || "").trim() || labels.guestFallback
  const hasGuestName = guestName !== labels.guestFallback

  const events = useMemo(
    () => (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue || s.address)),
    [profile.sessions]
  )
  const eventDate = (profile.estimated_wedding_date || "").trim()
  const target = useMemo(() => countdownTarget(events, eventDate), [events, eventDate])
  const calendarUrl = useMemo(() => (events.length ? gcalLink(events[0], childFull) : ""), [events, childFull])

  const gallery = useMemo(
    () => (Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean).slice(0, 9) : []),
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
  const coverGuestLabel = (tc.cover_guest_label || "").trim() || "Kepada Yth. Bapak/Ibu/Saudara/i"
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const salam = (tc.opening_salam || "").trim() || DEFAULT_SALAM
  const basmalah = (tc.basmalah || "").trim() || DEFAULT_BASMALAH
  const openingText = (profile.opening_description || "").trim() || DEFAULT_OPENING
  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const doaTitle = (tc.doa_title || "").trim() || "Doa untuk Ananda"
  const doaArabic = (tc.doa_arabic || "").trim() || DEFAULT_DOA
  const doaBlessing = (tc.doa_blessing || "").trim() || DEFAULT_BLESSING
  const saveKicker = (tc.save_date_kicker || "").trim() || "Save the Date"
  const saveTitle = (tc.save_date_title || "").trim() || "Hari Bahagia"
  const saveLabel = (tc.save_date_label || "").trim() || "Simpan Tanggal"
  const eventsKicker = (tc.events_kicker || "").trim() || "Rangkaian Acara"
  const eventsTitle = (tc.events_title || "").trim() || "Waktu & Tempat"
  const eventsLead = (tc.events_intro || "").trim() || "Insya Allah acara akan diselenggarakan pada:"
  const mapsLabel = (tc.maps_label || "").trim() || "Lihat Lokasi"
  const galleryKicker = (tc.gallery_kicker || "").trim() || "Galeri"
  const galleryTitle = (tc.gallery_title || "").trim() || "Momen Bahagia"
  const galleryLead = (tc.gallery_intro || "").trim() || "Sepenggal cerita ananda menjelang hari istimewanya."
  const giftKicker = (tc.gift_kicker || "").trim() || "Amplop Digital"
  const giftTitle = (tc.gift_intro_title || "").trim() || "Tanda Kasih"
  const giftLead = (tc.gift_intro_description || "").trim() || DEFAULT_GIFT
  const copyAccountButton = (tc.copy_account_button || "").trim() || "Salin Nomor"
  const copyAddressButton = (tc.copy_address_button || "").trim() || "Salin Alamat"
  const giftSendLabel = (tc.gift_send_label || "").trim() || "Kirim Hadiah"
  const invitingKicker = (tc.inviting_kicker || "").trim() || "Turut Mengundang"
  const invitingTitle = (tc.inviting_title || "").trim() || "Keluarga & Kerabat"
  const wishesKicker = (tc.wishes_kicker || "").trim() || "Doa & Ucapan"
  const wishesTitle = (tc.wishes_title || "").trim() || "Titip Doa"
  const wishesLead =
    (tc.wishes_intro || "").trim() || "Tuliskan doa dan harapan terbaik untuk ananda di hari istimewanya."
  const wishNameLabel = (tc.wishes_name_label || "").trim() || "Nama Anda"
  const wishNamePlaceholder = (tc.wishes_name_placeholder || "").trim() || "Tulis nama Anda"
  const wishMessageLabel = (tc.wishes_message_label || "").trim() || "Doa dan ucapan"
  const wishMessagePlaceholder = (tc.wishes_message_placeholder || "").trim() || "Tulis doa dan ucapan"
  const wishSubmit = (tc.wishes_submit || "").trim() || "Kirim Ucapan"
  const wishEmpty = (tc.wishes_empty || "").trim() || "Belum ada ucapan. Jadilah yang pertama."
  const wishLoading = (tc.wishes_loading || "").trim() || "Memuat ucapan"
  const closingThanks = (tc.closing_thanks || "").trim() || "Terima Kasih"
  const closingText = (tc.closing_message || "").trim() || DEFAULT_CLOSING
  const closingSalam = (tc.closing_salam || "").trim() || "Wassalamu'alaikum Warahmatullahi Wabarakatuh"
  const closingKicker = (tc.closing_kicker || "").trim() || "Kami yang berbahagia"
  const closingFamily = (tc.closing_family || "").trim() || "Keluarga Besar"

  const parsedDate = eventDate ? new Date(eventDate) : null
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null
  const dayNum = validDate ? String(validDate.getDate()).padStart(2, "0") : "--"
  const monthName = validDate ? MONTHS[validDate.getMonth()] : ""
  const yearNum = validDate ? String(validDate.getFullYear()) : ""
  const weekday = validDate ? WEEKDAYS[validDate.getDay()] : ""

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.kidsMusic : "")
  const wishes = useWishes(profile.wedding_profile_id, profile.guest_id)
  const nameState = useMemo(
    () => wishNameState(profile.guest_name, profile.guest_id, profile.guest_link_strict),
    [profile.guest_name, profile.guest_id, profile.guest_link_strict]
  )
  const [wishName, setWishName] = useState(nameState.value)
  const [wishNameLocked] = useState(nameState.locked)

  const coverNameRef = useFitOneLine<HTMLParagraphElement>(childName)
  const guestRef = useFitOneLine<HTMLParagraphElement>(guestName)
  const putraNameRef = useFitOneLine<HTMLParagraphElement>(childFull)

  const wishPages = Math.max(1, Math.ceil(wishes.wishes.length / WISH_PAGE))
  const visibleWishes = wishes.wishes.slice(wishPage * WISH_PAGE, wishPage * WISH_PAGE + WISH_PAGE)
  const pagerPrevLabel = `${wishesTitle} sebelumnya`
  const pagerNextLabel = `${wishesTitle} berikutnya`

  const showDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    opened &&
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
    document.body.classList.toggle("skm-locked", !opened)
    return () => document.body.classList.remove("skm-locked")
  }, [opened])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-skm-reveal]"))
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
    <div ref={rootRef} className={`skm-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      <div className="skm-frame">
        {!opened && (
          <section className="skm-cover" aria-label={coverKicker}>
            <img className="skm-cover__photo" src={cover} alt="" aria-hidden="true" draggable={false} />
            <div className="skm-cover__veil" aria-hidden="true" />
            <div className="skm-cover__shade" aria-hidden="true" />
            <div className="skm-cover__tenun" aria-hidden="true" />
            <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
            <span className="skm-tepi skm-tepi--bottom" aria-hidden="true" />
            <img className="skm-cover__melur" src={ART("melur")} alt="" aria-hidden="true" draggable={false} />

            <div className="skm-cover__names skm-anim-up" style={reveal(0.2)}>
              <p className="skm-cover__kicker">{coverKicker}</p>
              <p ref={coverNameRef} className="skm-cover__name">{childName}</p>
            </div>

            <span className="skm-pita skm-cover__pita skm-anim-fade" style={reveal(0.3)} aria-hidden="true" />
            <p className="skm-cover__date skm-anim-fade" style={reveal(0.35)}>{validDate ? formatLongDate(eventDate) : ""}</p>
            <p className="skm-cover__guest skm-anim-fade" style={reveal(0.45)}>{coverGuestLabel}</p>
            {hasGuestName && (
              <p ref={guestRef} className="skm-cover__guestname skm-anim-fade" style={reveal(0.55)}>{guestName}</p>
            )}
            <button
              type="button"
              className="skm-open skm-anim-up"
              style={reveal(0.65)}
              onClick={openInvitation}
            >
              {openLabel}
            </button>
          </section>
        )}

        {opened && (
          <main>
            {/* Pembuka */}
            <section className="skm-section skm-section--cream skm-pembuka">
              <div className="skm-kain" aria-hidden="true" />
              <span className="skm-icon skm-icon--star skm-reveal skm-reveal--zoom" data-skm-reveal style={reveal(0)} aria-hidden="true" />
              <p className="skm-arabic skm-reveal skm-reveal--up" lang="ar" dir="rtl" data-skm-reveal style={reveal(0.06)}>{basmalah}</p>
              <p className="skm-pembuka__salam skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.1)}>{salam}</p>
              <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
              <p className="skm-pembuka__text skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.14)}>{openingText}</p>
            </section>

            {/* Putra Kami */}
            <section className="skm-section skm-section--dark skm-putra">
              <div className="skm-kain" aria-hidden="true" />
              <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
              <span className="skm-tepi skm-tepi--bottom" aria-hidden="true" />

              <p className="skm-kicker skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{labels.subjectPossessive}</p>

              <div className="skm-putra__stage skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.04)}>
                <img className="skm-putra__photo" src={portrait} alt={childFull} draggable={false} />
                <img className="skm-putra__frame" src={ART("bingkai-ukir-lak")} alt="" aria-hidden="true" draggable={false} />
                <img className="skm-putra__tanjak" src={ART("tanjak-songket")} alt="" aria-hidden="true" draggable={false} />
                <img className="skm-putra__melur" src={ART("melur")} alt="" aria-hidden="true" draggable={false} />
              </div>

              <p ref={putraNameRef} className="skm-putra__name skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{childFull}</p>
              {parents && (
                <>
                  <p className="skm-kicker skm-kicker--mt skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.09)}>{labels.subjectOf}</p>
                  <p className="skm-putra__parents skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.11)}>{parentLines}</p>
                </>
              )}
              {profile.groom_instagram && (
                <a
                  className="skm-putra__ig skm-reveal skm-reveal--up"
                  data-skm-reveal
                  style={reveal(0.12)}
                  href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @{profile.groom_instagram.replace(/^@/, "")}
                </a>
              )}
            </section>

            {/* Doa untuk Ananda */}
            <section className="skm-section skm-section--cream skm-doa">
              <div className="skm-kain" aria-hidden="true" />
              <span className="skm-icon skm-icon--star skm-icon--sm skm-reveal skm-reveal--zoom" data-skm-reveal style={reveal(0)} aria-hidden="true" />

              <div className="skm-doa__card skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>
                <p className="skm-kicker skm-kicker--maroon">{doaTitle}</p>
                <p className="skm-arabic skm-doa__arabic" lang="ar" dir="rtl">{doaArabic}</p>
                {quoteText && <p className="skm-doa__translate">&ldquo;{quoteText}&rdquo;</p>}
                {quoteSource && <p className="skm-doa__source">{quoteSource}</p>}
                <span className="skm-pita skm-pita--sm" aria-hidden="true" />
                <p className="skm-doa__blessing">{doaBlessing}</p>
              </div>
            </section>

            {/* Save the Date */}
            <section className="skm-section skm-section--dark skm-date">
              <div className="skm-kain" aria-hidden="true" />
              <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
              <span className="skm-tepi skm-tepi--bottom" aria-hidden="true" />

              <p className="skm-kicker skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{saveKicker}</p>
              <p className="skm-script skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{saveTitle}</p>
              <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />

              {validDate && (
                <>
                  <p className="skm-date__weekday skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{weekday}</p>
                  <div className="skm-date__big skm-reveal skm-reveal--zoom" data-skm-reveal style={reveal(0.06)}>
                    <span className="skm-date__rule" aria-hidden="true" />
                    <span className="skm-date__day">{dayNum}</span>
                    <span className="skm-date__rule" aria-hidden="true" />
                  </div>
                  <p className="skm-date__rest skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.1)}>{monthName} {yearNum}</p>
                </>
              )}

              {target && (
                <div className="skm-count skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.12)}>
                  {countdownCells.map((cell, index) => (
                    <span className="skm-count__group" key={cell.label}>
                      {index > 0 && <span className="skm-count__sep" aria-hidden="true">:</span>}
                      <span className="skm-count__cell">
                        <span className="skm-count__num">{now ? String(cell.value).padStart(2, "0") : "--"}</span>
                        <small>{cell.label}</small>
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {calendarUrl && (
                <a
                  className="skm-date__cta skm-reveal skm-reveal--up"
                  data-skm-reveal
                  style={reveal(0.14)}
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {saveLabel}
                </a>
              )}
            </section>

            {/* Acara */}
            {events.length > 0 && (
              <section className="skm-section skm-section--cream skm-acara">
                <div className="skm-kain" aria-hidden="true" />
                <span className="skm-icon skm-icon--pin skm-reveal skm-reveal--zoom" data-skm-reveal style={reveal(0)} aria-hidden="true" />
                <p className="skm-kicker skm-kicker--maroon skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{eventsKicker}</p>
                <p className="skm-script skm-script--maroon skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{eventsTitle}</p>
                <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
                <p className="skm-lead skm-lead--maroon skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{eventsLead}</p>

                {venuePhoto && (
                  <div className="skm-acara__venue skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0)}>
                    <span className="skm-acara__arc" aria-hidden="true" />
                    <img className="skm-acara__photo" src={venuePhoto} alt="" loading="lazy" draggable={false} />
                    <img className="skm-acara__tepak" src={ART("tepak-sirih")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                  </div>
                )}

                <div className="skm-events skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0)}>
                  {events.map((session, index) => (
                    <article className="skm-event" key={`${session.name || "acara"}-${index}`}>
                      <h3 className="skm-event__name">{session.name || labels.mainEventName}</h3>
                      {(session.date || validDate) && (
                        <p className="skm-event__date">{session.date ? formatLongDate(session.date) : formatLongDate(eventDate)}</p>
                      )}
                      {session.time && <p className="skm-event__time">{timeLine(session.time)}</p>}
                      {session.venue && <p className="skm-event__venue">{session.venue}</p>}
                      {session.address && <p className="skm-event__address">{session.address}</p>}
                      {session.maps_url && (
                        <a className="skm-pill" href={session.maps_url} target="_blank" rel="noreferrer noopener">
                          {mapsLabel}
                        </a>
                      )}
                      {index < events.length - 1 && <span className="skm-pita skm-pita--divider" aria-hidden="true" />}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Galeri */}
            {gallery.length > 0 && (
              <section className="skm-section skm-section--dark skm-galeri">
                <div className="skm-kain" aria-hidden="true" />
                <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
                <span className="skm-tepi skm-tepi--bottom" aria-hidden="true" />
                <p className="skm-kicker skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{galleryKicker}</p>
                <p className="skm-script skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{galleryTitle}</p>
                <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
                <p className="skm-lead skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{galleryLead}</p>

                <div className={`skm-galeri__grid${gallery.length === 1 ? " is-single" : ""} skm-reveal skm-reveal--in`} data-skm-reveal style={reveal(0)}>
                  {gallery.map((src, index) => (
                    <figure key={`${src}-${index}`}>
                      <img src={src} alt="" loading="lazy" draggable={false} />
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* Tanda Kasih */}
            {hasGift && (
              <section className="skm-section skm-section--dark skm-gift">
                <div className="skm-kain" aria-hidden="true" />
                <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
                <span className="skm-tepi skm-tepi--bottom" aria-hidden="true" />

                <div className="skm-gift__stage skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>
                  <img className="skm-gift__orn" src={ART("songket-terlipat")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                </div>
                <p className="skm-kicker skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{giftKicker}</p>
                <p className="skm-script skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{giftTitle}</p>
                <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
                <p className="skm-lead skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{giftLead}</p>

                <div className="skm-gift__list skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.09)}>
                  {accounts.map((account, index) => (
                    <div className="skm-gift__card" key={`${account.account_number || account.provider_name || "acc"}-${index}`}>
                      <p className="skm-gift__bank">{account.provider_name}</p>
                      <p className="skm-gift__number">{account.account_number}</p>
                      <p className="skm-gift__owner">{accountName(account.account_name)}</p>
                      <button
                        type="button"
                        className="skm-gift__copy"
                        onClick={() => copyText(account.account_number || "", "Nomor rekening disalin")}
                        aria-label={copyAccountButton}
                      >
                        {copyAccountButton}
                      </button>
                    </div>
                  ))}
                  {giftAddress && (
                    <div className="skm-gift__card">
                      <p className="skm-gift__bank">{giftSendLabel}</p>
                      {profile.gift_address_name && <p className="skm-gift__owner skm-gift__owner--top">{profile.gift_address_name}</p>}
                      <p className="skm-gift__address">{giftAddress}</p>
                      <button
                        type="button"
                        className="skm-gift__copy"
                        onClick={() => copyText(giftAddress, "Alamat disalin")}
                        aria-label={copyAddressButton}
                      >
                        {copyAddressButton}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Doa & Ucapan */}
            <section className="skm-section skm-section--cream skm-ucapan">
              <div className="skm-kain" aria-hidden="true" />
              <span className="skm-icon skm-icon--pen skm-reveal skm-reveal--zoom" data-skm-reveal style={reveal(0)} aria-hidden="true" />
              <p className="skm-kicker skm-kicker--maroon skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{wishesKicker}</p>
              <p className="skm-script skm-script--maroon skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{wishesTitle}</p>
              <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
              <p className="skm-lead skm-lead--maroon skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{wishesLead}</p>

              <div className="skm-wish-form skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.09)}>
                <label className="skm-field">
                  <span className="skm-field__label">{wishNameLabel}</span>
                  <input
                    value={wishName}
                    onChange={(event) => setWishName(event.target.value)}
                    placeholder={wishNamePlaceholder}
                    readOnly={wishNameLocked}
                    aria-label={wishNameLabel}
                    style={wishNameLocked ? LOCKED_FIELD_STYLE : undefined}
                  />
                </label>
                <label className="skm-field">
                  <span className="skm-field__label">{wishMessageLabel}</span>
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
                  className="skm-wish-send"
                  onClick={submitWish}
                  disabled={wishes.state === "sending" || !wishMessage.trim()}
                >
                  {wishSubmit}
                </button>
                <p className="skm-note" role="status">{wishes.feedback}</p>
              </div>

              <div className="skm-wish-list">
                {!wishes.loaded ? (
                  <p className="skm-wish-empty">{wishLoading}</p>
                ) : wishes.wishes.length === 0 ? (
                  <p className="skm-wish-empty">{wishEmpty}</p>
                ) : (
                  visibleWishes.map((wish) => (
                    <article className="skm-wish" key={wish.id}>
                      <p className="skm-wish__name">{wish.name || labels.guestFallback}</p>
                      <p className="skm-wish__text">{wish.message}</p>
                      <span className="skm-wish__time">{formatDotDate(wish.created_at)}</span>
                    </article>
                  ))
                )}
                {wishes.loaded && wishPages > 1 && (
                  <div className="skm-wish-pager">
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

            {/* Turut Mengundang */}
            {honored.length > 0 && (
              <section className="skm-section skm-section--dark skm-inviting">
                <div className="skm-kain" aria-hidden="true" />
                <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
                <p className="skm-kicker skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{invitingKicker}</p>
                <p className="skm-script skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{invitingTitle}</p>
                <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
                <ul className="skm-inviting__list skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.1)}>
                  {honored.map((family, index) => (
                    <li key={`${family}-${index}`}>{family}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Penutup */}
            <section className="skm-section skm-section--dark skm-penutup">
              <div className="skm-kain" aria-hidden="true" />
              <span className="skm-tepi skm-tepi--top" aria-hidden="true" />
              <span className="skm-tepi skm-tepi--bottom" aria-hidden="true" />

              <div className="skm-penutup__stage skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0)}>
                <span className="skm-penutup__line" aria-hidden="true" />
                <span className="skm-penutup__weave" aria-hidden="true" />
                <img className="skm-penutup__photo" src={closingPhoto} alt="" loading="lazy" draggable={false} />
                <img className="skm-penutup__melur" src={ART("melur")} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              </div>

              <p className="skm-script skm-script--lg skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{closingThanks}</p>
              <p className="skm-penutup__text skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{closingText}</p>
              <p className="skm-penutup__salam skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.08)}>{closingSalam}</p>
              <span className="skm-pita skm-reveal skm-reveal--in" data-skm-reveal style={reveal(0.06)} aria-hidden="true" />
              <p className="skm-kicker skm-penutup__kicker skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0)}>{closingKicker}</p>
              <p className="skm-script skm-script--md skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.04)}>{closingFamily}</p>
              {parents && <p className="skm-penutup__parents skm-reveal skm-reveal--up" data-skm-reveal style={reveal(0.06)}>{parentLines}</p>}
            </section>

            <div className="skm-footer">
              <a className="skm-footer__link" href="https://wa.me/6281161613071" target="_blank" rel="noopener noreferrer">
                <span className="skm-footer__badge">
                  <img className="skm-footer__logo" src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa" loading="lazy" />
                </span>
                <span className="skm-footer__cta">{labels.brand} by Aksaraa</span>
              </a>
            </div>
          </main>
        )}
      </div>

      {trackUrl && (
        <button
          type="button"
          className={`skm-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <span className="material-symbols-outlined" aria-hidden="true">music_note</span>
        </button>
      )}

      {toast && <div className="skm-toast" role="status">{toast}</div>}

      {showDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={guestName}
          coupleName={childFull}
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
