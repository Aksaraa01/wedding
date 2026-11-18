"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { AKSARAA_WA_NUMBER } from "@/lib/contact"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import {
  countdownTarget,
  formatLongDate,
  gcalLink,
  groomPhoto,
  bridePhoto,
  photoList,
  videoSource,
  type SessionData,
} from "../shared/lib"
import { LOCKED_FIELD_STYLE, wishNameState } from "../shared/wishName"
import "./majestic.css"

// Art shipped with the template. Decorative surfaces only — couple data always
// comes from TemplateProps.
const ART = (name: string) => `/templates/majestic/${name}`
const GATE_FILM = ART("gate-film.mp4")
const GATE_POSTER = ART("gate-poster.webp")
const COVER_FILM = ART("cover-film.mp4")
const COVER_POSTER = ART("cover-poster.webp")
const STRING_LIGHTS = ART("string-lights.webp")
const ORNATE_BADGE = ART("ornate-badge.webp")
const GRAMOPHONE = ART("gramophone.webp")
const DRESS_CROWD = ART("dress-crowd.webp")
const GIFT_ENVELOPE = ART("gift-envelope.webp")
const BOUQUET = ART("flower-bouquet.webp")
const CLOSING_ARCH = ART("closing-arch.webp")
const RINGS = ART("rings.webp")

const ID_MONTHS = [
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

const WISH_PAGE = 5
const WISH_MAX = 500

const DEFAULT_STORY_INTRO = "Bab-bab kecil yang membawa kami sampai ke hari ini."
const DEFAULT_GIFT =
  "Doa restu Bapak/Ibu/Saudara/i adalah hadiah terindah bagi kami. Bila berkenan memberikan tanda kasih, dapat melalui kanal berikut."
const DEFAULT_CLOSING =
  "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."

const DEMO_ID = "demo-wedding-profile-id"

const DEMO_WISHES: { id: string; name: string | null; message: string; created_at: string }[] = [
  {
    id: "demo-1",
    name: "Keluarga Albarn",
    message: "Selamat menempuh hidup baru. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "demo-2",
    name: "Sahabat Kami",
    message: "Akhirnya! Kami menantikan hari ini sejak lama. Bahagia selalu untuk kalian berdua.",
    created_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: "demo-3",
    name: "Rekan Kerja",
    message: "Semoga perjalanan kalian dipenuhi cinta, tawa, dan keberkahan di setiap langkah.",
    created_at: new Date(Date.now() - 259_200_000).toISOString(),
  },
  {
    id: "demo-4",
    name: "Keluarga Reed",
    message: "Dengan penuh cinta dan doa, kami turut berbahagia menyambut hari istimewa kalian.",
    created_at: new Date(Date.now() - 345_600_000).toISOString(),
  },
  {
    id: "demo-5",
    name: "Kerabat",
    message: "Semoga menjadi keluarga yang saling menguatkan, saling menjaga, dan saling mencintai.",
    created_at: new Date(Date.now() - 432_000_000).toISOString(),
  },
  {
    id: "demo-6",
    name: "Sahabat Kecil",
    message: "Dari kecil kami menyaksikan kalian bertumbuh. Selamat menemukan rumah satu sama lain.",
    created_at: new Date(Date.now() - 518_400_000).toISOString(),
  },
]

function revealStyle(delay: number, distance = 20): CSSProperties {
  return { ["--mj-delay" as string]: `${delay}s`, ["--mj-from" as string]: `${distance}px` } as CSSProperties
}

function timeLine(raw?: string): string {
  const value = (raw || "").trim()
  if (!value) return ""
  return /wib/i.test(value) ? value : `${value} WIB`
}

function accountOwner(raw?: string): string {
  const name = (raw || "").trim()
  if (!name) return ""
  return /^(a\/n|atas nama)\b/i.test(name) ? name : `a/n ${name}`
}

function shortUpperDate(value?: string | null): string {
  const raw = String(value || "").trim()
  if (!raw) return ""
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw)
  if (isNaN(d.getTime())) return ""
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`.toUpperCase()
}

function ago(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "Baru saja"
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export default function Majestic(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const gateVideoRef = useRef<HTMLVideoElement | null>(null)
  const sealRef = useRef<HTMLSpanElement | null>(null)
  const sealRaf = useRef<number | null>(null)
  const gateTimer = useRef<number | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [phase, setPhase] = useState<"idle" | "playing" | "fading" | "done">("idle")
  const [playing, setPlaying] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [openAccount, setOpenAccount] = useState(-1)
  const [toast, setToast] = useState("")
  const [now, setNow] = useState<number | null>(null)
  const [wishMessage, setWishMessage] = useState("")
  const [wishPage, setWishPage] = useState(0)
  const [wishList, setWishList] = useState<{ id: string; name: string | null; message: string; created_at: string }[]>([])
  const [wishesLoaded, setWishesLoaded] = useState(false)
  const [wishStatus, setWishStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [wishFeedback, setWishFeedback] = useState("")

  const opened = phase === "fading" || phase === "done"

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}

  const groom = (profile.groom_name || "").trim()
  const bride = (profile.bride_name || "").trim()
  const groomFull = (profile.groom_full_name || groom || "Mempelai").trim()
  const brideFull = (profile.bride_full_name || bride || "Mempelai").trim()
  const coupleLabel = [groom || "Mempelai", bride || "Mempelai"].join(" & ")

  const covers = useMemo(() => photoList(profile.cover_photos), [profile.cover_photos])
  const venuePhoto = covers[0] || ""
  const closingPhoto = covers[1] || covers[0] || ""

  const monogram =
    (profile.couple_initials || "").trim() ||
    [groom, bride].map((n) => n.trim().charAt(0).toUpperCase()).filter(Boolean).join(" & ")

  const guestName = (profile.guest_name || "").trim()
  const hasGuestName = !!guestName && guestName !== "Tamu Undangan"

  const sessions = useMemo(
    () => (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue || s.address)),
    [profile.sessions]
  )
  const mainSession = sessions[0]
  const eventDate = (profile.estimated_wedding_date || mainSession?.date || "").trim()
  const target = useMemo(() => countdownTarget(sessions, eventDate), [sessions, eventDate])
  const calendarUrl = useMemo(
    () => (mainSession ? gcalLink(mainSession, groom, bride) : ""),
    [mainSession, groom, bride]
  )

  const stories = useMemo(
    () =>
      gates.story !== false && profile.story_visible !== false
        ? (profile.stories || []).filter((s) => s && (s.title || s.description))
        : [],
    [profile.stories, profile.story_visible, gates.story]
  )

  const gallery = useMemo(
    () => (Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean) : photoList(profile.gallery_photos)),
    [profile.gallery_photos]
  )

  const honored = useMemo(
    () =>
      gates.inviting_families !== false && profile.inviting_families_visible !== false
        ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
        : [],
    [profile.inviting_families, profile.inviting_families_visible, gates.inviting_families]
  )

  const rundown = useMemo(
    () =>
      profile.rundown_visible !== false
        ? (profile.rundown || []).filter((i) => i && (i.time || i.description))
        : [],
    [profile.rundown, profile.rundown_visible]
  )

  const dressColors = (profile.dresscode?.colors || []).filter((c) => c && (c.hex || c.name))
  const hasDresscode =
    profile.dresscode_visible !== false &&
    (dressColors.length > 0 || !!(profile.dresscode?.title || profile.dresscode?.description))

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const film = videoSource(profile.video_url)
  const hasVideo = !!film && gates.video !== false && profile.video_section_visible !== false

  // Copy — every visible string is reachable from the editor (EKSTRA) or ops.
  const coverKicker = (tc.cover_kicker || "").trim() || "Kami Akan Menikah"
  const guestLabel = (tc.cover_guest_label || "").trim() || "Kepada Yth. Bapak/Ibu/Saudara/i"
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const gateHint = (tc.gate_hint || "").trim() || "Ketuk untuk Membuka"
  const mempelaiTitle = (tc.mempelai_title || "").trim() || "Mempelai"
  const parentsLabel = (tc.parents_label || "").trim() || "Putra/Putri dari"
  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const personOneLabel = (tc.person_one_label || "").trim()
  const personTwoLabel = (tc.person_two_label || "").trim()
  const storyTitle = (tc.love_story_title || "").trim() || "Kisah Cinta"
  const storyIntro = (tc.story_intro || "").trim() || DEFAULT_STORY_INTRO
  const eventsTitle = (tc.events_title || "").trim() || "The Wedding Day"
  const eventsNote = (tc.events_note || "").trim()
  const mapsLabel = (tc.maps_label || "").trim() || "Lihat Lokasi"
  const calendarLabel = (tc.calendar_button || "").trim() || "Simpan Tanggal"
  const countdownTitle = (tc.countdown_title || "").trim() || "Menghitung Hari"
  const countdownIntro = (tc.countdown_intro || "").trim()
  const countdownLabels = [
    (tc.countdown_days || "").trim() || "Hari",
    (tc.countdown_hours || "").trim() || "Jam",
    (tc.countdown_minutes || "").trim() || "Menit",
    (tc.countdown_seconds || "").trim() || "Detik",
  ]
  const invitingTitle = (tc.inviting_title || "").trim() || "Keluarga & Kerabat"
  const invitingIntro = (tc.inviting_intro || "").trim()
  const rundownTitle = (tc.rundown_title || "").trim() || "Rangkaian Hari"
  const rundownIntro = (tc.rundown_intro || "").trim()
  const galleryTitle = (tc.gallery_title || "").trim() || "Gallery of Us"
  const galleryIntro = (tc.gallery_intro || "").trim()
  const galleryQuote = (tc.gallery_quote || "").trim()
  const videoTitle = (tc.video_title || "").trim() || "Film Kami"
  const videoIntro = (tc.video_intro || "").trim()
  const giftTitle = (tc.gift_intro_title || "").trim() || "The Wedding Gift"
  const giftIntro = (tc.gift_intro_description || "").trim() || DEFAULT_GIFT
  const giftSendLabel = (tc.gift_send_label || "").trim() || "Kirim Hadiah"
  const copyAccount = (tc.copy_account_button || "").trim() || "Salin Nomor"
  const copyAddress = (tc.copy_address_button || "").trim() || "Salin Alamat"
  const copyAccountToast = (tc.copy_account_toast || "").trim() || "Nomor rekening disalin"
  const copyAddressToast = (tc.copy_address_toast || "").trim() || "Alamat disalin"
  const dressKicker = (tc.dresscode_kicker || "").trim() || "Dress Code"
  const dressTitle = (profile.dresscode?.title || "").trim() || "Formal"
  const dressNote = (tc.dresscode_note || "").trim() || "Mohon hindari warna putih — warna tersebut kami sediakan untuk mempelai."
  const wishesTitle = (tc.wishes_title || "").trim() || "Wishes"
  const wishesIntro = (tc.wishes_intro || "").trim() || "Sampaikan doa dan harapan terbaik untuk kami di hari istimewa ini."
  const wishNameLabel = (tc.wishes_name_label || "").trim() || "Nama Anda"
  const wishNamePlaceholder = (tc.wishes_name_placeholder || "").trim() || "Nama lengkap"
  const wishMessageLabel = (tc.wishes_message_label || "").trim() || "Ucapan & doa"
  const wishMessagePlaceholder = (tc.wishes_message_placeholder || "").trim() || "Tuliskan pesan Anda"
  const wishSubmit = (tc.wishes_submit || "").trim() || "Kirim Ucapan"
  const wishEmpty = (tc.wishes_empty || "").trim() || "Belum ada ucapan. Jadilah yang pertama."
  const wishLoading = (tc.wishes_loading || "").trim() || "Memuat ucapan"
  const closingTitle = (tc.closing_title || "").trim() || "Terima Kasih"
  const closingMessage = (tc.closing_message || "").trim() || DEFAULT_CLOSING
  const apology = (tc.cover_apology || "").trim()

  // "Hashtag Instagram Post" is stored in display_name (editor field). A value
  // that is not already a hashtag is derived from the couple's names.
  const rawHashtag = (profile.display_name || "").trim()
  const hashtag = rawHashtag.startsWith("#")
    ? rawHashtag
    : rawHashtag
      ? `#${rawHashtag.replace(/[^A-Za-z0-9]/g, "")}`
      : `#${`${groom}${bride}`.replace(/[^A-Za-z0-9]/g, "")}`

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.demoAudio : "")

  const nameState = useMemo(
    () => wishNameState(profile.guest_name, profile.guest_id, profile.guest_link_strict),
    [profile.guest_name, profile.guest_id, profile.guest_link_strict]
  )
  const [wishName, setWishName] = useState(nameState.value)

  const showDock =
    !profile.preview_mode &&
    !profile.template_demo &&
    phase === "done" &&
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

  const enterInvitation = useCallback(() => {
    setPhase("done")
    window.scrollTo(0, 0)
  }, [])

  // The tap plays the reference's opening film once (envelope + seal), then the
  // ivory curtain lifts. Never a blocker: any error or a 4s stall enters.
  const openInvitation = useCallback(() => {
    if (phase !== "idle") return
    playMusic()
    const video = gateVideoRef.current
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if (!video || reduced) {
      setPhase("fading")
      window.setTimeout(enterInvitation, 950)
      return
    }
    setPhase("playing")
    gateTimer.current = window.setTimeout(() => {
      setPhase("fading")
      window.setTimeout(enterInvitation, 1250)
    }, 4200)
    void video.play().catch(() => {
      setPhase("fading")
      window.setTimeout(enterInvitation, 950)
    })
  }, [phase, playMusic, enterInvitation])

  // Measured on the opening film (circular Hough, 540×960): the camera pans up
  // while the wax stamp rises from 53.1% to 26.9% of the frame height and grows
  // ~7%. The seal we draw must travel with it, otherwise the filmed stamp slides
  // out from under ours.
  const SEAL_TRACK: [number, number, number][] = [
    [0, 53.1, 1],
    [0.9, 51.3, 1.01],
    [1.8, 46.3, 1.02],
    [2.7, 39.4, 1.05],
    [3.667, 26.9, 1.07],
  ]

  const trackSeal = useCallback(() => {
    const video = gateVideoRef.current
    const seal = sealRef.current
    if (!video || !seal) return
    const t = video.currentTime
    let a = SEAL_TRACK[0]
    let b = SEAL_TRACK[SEAL_TRACK.length - 1]
    for (let i = 0; i < SEAL_TRACK.length - 1; i++) {
      if (t >= SEAL_TRACK[i][0] && t <= SEAL_TRACK[i + 1][0]) {
        a = SEAL_TRACK[i]
        b = SEAL_TRACK[i + 1]
        break
      }
    }
    const span = Math.max(b[0] - a[0], 0.001)
    const k = Math.min(1, Math.max(0, (t - a[0]) / span))
    const cy = a[1] + (b[1] - a[1]) * k
    const scale = a[2] + (b[2] - a[2]) * k
    seal.style.setProperty("--mj-seal-cy", cy.toFixed(3))
    seal.style.setProperty("--mj-seal-scale", scale.toFixed(4))
    if (!video.ended && !video.paused) sealRaf.current = window.requestAnimationFrame(trackSeal)
  }, [])

  const onGatePlaying = useCallback(() => {
    if (gateTimer.current) window.clearTimeout(gateTimer.current)
    if (sealRaf.current) window.cancelAnimationFrame(sealRaf.current)
    sealRaf.current = window.requestAnimationFrame(trackSeal)
    gateTimer.current = window.setTimeout(() => {
      setPhase("fading")
      window.setTimeout(enterInvitation, 1250)
    }, 4600)
  }, [enterInvitation, trackSeal])

  const onGateEnded = useCallback(() => {
    if (gateTimer.current) window.clearTimeout(gateTimer.current)
    setPhase("fading")
    window.setTimeout(enterInvitation, 1250)
  }, [enterInvitation])

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

  // Design QA hook: ?opened=1 opens the invitation so review tools can walk
  // every section without tapping. Harmless for real guests.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("opened") !== "1") return
    setPhase("done")
  }, [])

  useEffect(() => {
    document.body.classList.toggle("mj-locked", !opened)
    return () => document.body.classList.remove("mj-locked")
  }, [opened])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!opened) return
    const root = rootRef.current
    if (!root) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-mj-reveal]"))
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
  }, [opened, stories.length, gallery.length, accounts.length, honored.length, rundown.length, sessions.length])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null)
      if (event.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
      if (event.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, gallery.length])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (gateTimer.current) window.clearTimeout(gateTimer.current)
      if (sealRaf.current) window.cancelAnimationFrame(sealRaf.current)
    }
  }, [])

  useEffect(() => {
    if (!profile.wedding_profile_id) {
      setWishesLoaded(true)
      return
    }
    if (profile.wedding_profile_id === DEMO_ID) {
      setWishList([...DEMO_WISHES])
      setWishesLoaded(true)
      return
    }
    let cancelled = false
    fetch(`/api/wishes?wedding_profile_id=${encodeURIComponent(profile.wedding_profile_id)}&status=approved`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return
        setWishList(Array.isArray(data?.wishes) ? data.wishes : [])
        setWishesLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setWishesLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [profile.wedding_profile_id])

  const sendWish = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault()
      const text = wishMessage.trim()
      if (!text || wishStatus === "sending") return
      if (!profile.wedding_profile_id || profile.wedding_profile_id === DEMO_ID) {
        setWishStatus("done")
        setWishFeedback("Mode pratinjau — ucapan tidak disimpan.")
        setWishMessage("")
        window.setTimeout(() => {
          setWishStatus("idle")
          setWishFeedback("")
        }, 4000)
        return
      }
      setWishStatus("sending")
      setWishFeedback("")
      try {
        const response = await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wedding_profile_id: profile.wedding_profile_id,
            guest_id: profile.guest_id || null,
            name: wishName.trim() || guestName || "Tamu Undangan",
            message: text,
            source: "invitation",
          }),
        })
        if (response.status === 409) {
          setWishStatus("error")
          setWishFeedback("Anda sudah mengirim ucapan. Terima kasih atas doanya.")
          return
        }
        if (response.ok) {
          setWishStatus("done")
          setWishFeedback("Terima kasih. Ucapan Anda akan tampil setelah ditinjau.")
          setWishMessage("")
          window.setTimeout(() => {
            setWishStatus("idle")
            setWishFeedback("")
          }, 5000)
          return
        }
        setWishStatus("error")
        setWishFeedback("Terlalu banyak pesan saat ini. Silakan coba lagi.")
      } catch {
        setWishStatus("error")
        setWishFeedback("Ucapan gagal dikirim. Periksa koneksi Anda.")
      }
    },
    [wishMessage, wishStatus, wishName, guestName, profile.wedding_profile_id, profile.guest_id]
  )

  const countdownCells = useMemo(() => {
    const ms = target && now ? Math.max(0, target.getTime() - now) : 0
    return [
      Math.floor(ms / 86400000),
      Math.floor((ms % 86400000) / 3600000),
      Math.floor((ms % 3600000) / 60000),
      Math.floor((ms % 60000) / 1000),
    ]
  }, [target, now])

  const wishPages = Math.max(1, Math.ceil(wishList.length / WISH_PAGE))
  const wishPageSafe = Math.min(wishPage, wishPages - 1)
  const visibleWishes = wishList.slice(wishPageSafe * WISH_PAGE, wishPageSafe * WISH_PAGE + WISH_PAGE)
  const pagerPrev = `${wishesTitle} sebelumnya`
  const pagerNext = `${wishesTitle} berikutnya`
  const coverDate = shortUpperDate(eventDate)

  const venueMaps = (session: SessionData): string =>
    session.maps_url ||
    (session.venue || session.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [session.venue, session.address].filter(Boolean).join(", ")
        )}`
      : "")

  return (
    <div ref={rootRef} className={`mj-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="auto" data-warm-audio="" />}

      {opened && (
        <main className="mj-page">
          {/* ── Sampul ─────────────────────────────────────────── */}
          <section className="mj-cover" aria-label={coverKicker}>
            <video
              className="mj-cover__film"
              src={COVER_FILM}
              poster={COVER_POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />

            <div className="mj-cover__body">
              <p className="mj-kicker mj-reveal mj-reveal--fade" data-mj-reveal style={revealStyle(0.1)}>
                {coverKicker}
              </p>
              <h1 className="mj-script mj-cover__names mj-reveal" data-mj-reveal style={revealStyle(0.28)}>
                <span>{groom || groomFull}</span>
                <i>&amp;</i>
                <span>{bride || brideFull}</span>
              </h1>
              {coverDate && (
                <p className="mj-cover__date mj-reveal mj-reveal--fade" data-mj-reveal style={revealStyle(0.46)}>
                  {coverDate}
                </p>
              )}
            </div>

            <span className="mj-cover__scroll" aria-hidden="true" />
          </section>

          {/* ── Hitung mundur ──────────────────────────────────── */}
          {target && (
            <section className="mj-section mj-countdown" data-section="countdown">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0)}>
                {countdownTitle}
              </h2>
              {countdownIntro && (
                <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.06)}>
                  {countdownIntro}
                </p>
              )}
              <div className="mj-clock mj-reveal mj-reveal--zoom" data-mj-reveal style={revealStyle(0.1)}>
                {countdownCells.map((value, index) => (
                  <span className="mj-clock__cell" key={countdownLabels[index]}>
                    <b>{now ? String(value).padStart(2, "0") : "--"}</b>
                    <small>{countdownLabels[index]}</small>
                  </span>
                ))}
              </div>
              {calendarUrl && (
                <a
                  className="mj-btn mj-btn--ghost mj-countdown__cal mj-reveal"
                  data-mj-reveal
                  style={revealStyle(0.2)}
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {calendarLabel}
                </a>
              )}
            </section>
          )}

          {/* ── Lamp divider ───────────────────────────────────── */}
          {target && (
            <span className="mj-divider" aria-hidden="true">
              <img src={STRING_LIGHTS} alt="" loading="lazy" draggable={false} />
            </span>
          )}

          {/* ── Film pembuka ───────────────────────────────────── */}
          {hasVideo && (
            <section className="mj-section mj-film" data-section="video">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {videoTitle}
              </h2>
              {videoIntro && (
                <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.14)}>
                  {videoIntro}
                </p>
              )}
              <div className="mj-film__frame mj-reveal" data-mj-reveal style={revealStyle(0.16)}>
                <img className="mj-film__rings" src={RINGS} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                {film!.kind === "file" ? (
                  <video
                    className="mj-film__media"
                    src={film!.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <iframe
                    className="mj-film__media"
                    src={film!.src}
                    title={videoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
              </div>
            </section>
          )}

          {/* ── Kutipan ────────────────────────────────────────── */}
          {quoteText && (
            <section className="mj-section mj-verse" data-section="quote">
              <blockquote className="mj-quote mj-reveal" data-mj-reveal style={revealStyle(0)}>
                <span className="mj-quote__mark" aria-hidden="true">
                  &ldquo;
                </span>
                <p className="mj-quote__text">{quoteText}</p>
                {quoteSource && <cite className="mj-quote__source">{quoteSource}</cite>}
              </blockquote>
            </section>
          )}

          {/* ── Mempelai ───────────────────────────────────────── */}
          <section className="mj-section mj-couple" data-section="couple">
            <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
              {mempelaiTitle}
            </h2>
            <img className="mj-couple__rings mj-reveal mj-reveal--zoom" data-mj-reveal src={RINGS} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            {tc.profiles_intro && (
              <p className="mj-lead mj-couple__intro mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                {tc.profiles_intro}
              </p>
            )}

            <div className="mj-couple__pair">
              <article className="mj-person mj-reveal" data-mj-reveal style={revealStyle(0.16)}>
                <figure className="mj-person__frame">
                  <img className="mj-person__photo" src={groomPhoto(profile.groom_photo_url)} alt={groomFull} loading="lazy" />
                </figure>
                {personOneLabel && <p className="mj-person__label">{personOneLabel}</p>}
                <h3 className="mj-script mj-person__name">{groomFull}</h3>
                {profile.groom_parents && (
                  <p className="mj-person__parents">
                    <span className="mj-person__parents-label">{parentsLabel}</span>
                    {profile.groom_parents}
                  </p>
                )}
                {profile.groom_instagram && (
                  <a
                    className="mj-person__ig"
                    href={`https://instagram.com/${profile.groom_instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {profile.groom_instagram.startsWith("@") ? profile.groom_instagram : `@${profile.groom_instagram}`}
                  </a>
                )}
              </article>

              <span className="mj-couple__amp" aria-hidden="true">
                &amp;
              </span>

              <article className="mj-person mj-reveal" data-mj-reveal style={revealStyle(0.24)}>
                <figure className="mj-person__frame">
                  <img className="mj-person__photo" src={bridePhoto(profile.bride_photo_url)} alt={brideFull} loading="lazy" />
                </figure>
                {personTwoLabel && <p className="mj-person__label">{personTwoLabel}</p>}
                <h3 className="mj-script mj-person__name">{brideFull}</h3>
                {profile.bride_parents && (
                  <p className="mj-person__parents">
                    <span className="mj-person__parents-label">{parentsLabel}</span>
                    {profile.bride_parents}
                  </p>
                )}
                {profile.bride_instagram && (
                  <a
                    className="mj-person__ig"
                    href={`https://instagram.com/${profile.bride_instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {profile.bride_instagram.startsWith("@") ? profile.bride_instagram : `@${profile.bride_instagram}`}
                  </a>
                )}
              </article>
            </div>
          </section>

          {/* ── Kisah cinta ────────────────────────────────────── */}
          {stories.length > 0 && (
            <section className="mj-section mj-story" data-section="story">
              <img className="mj-lights mj-lights--top" src={STRING_LIGHTS} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {storyTitle}
              </h2>
              {storyIntro && (
                <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                  {storyIntro}
                </p>
              )}

              <ol className="mj-story__list">
                {stories.map((story, index) => (
                  <li className="mj-story__row mj-reveal" data-mj-reveal style={revealStyle(0.08)} key={`${story.title || "bab"}-${index}`}>
                    {story.image_url && (
                      <figure className="mj-story__photo">
                        <img src={story.image_url} alt={story.title || ""} loading="lazy" />
                      </figure>
                    )}
                    <div className="mj-story__text">
                      {story.year && <p className="mj-story__year">{story.year}</p>}
                      {story.title && <h3 className="mj-script mj-story__title">{story.title}</h3>}
                      {story.description && <p className="mj-story__desc">{story.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* ── Waktu & tempat ─────────────────────────────────── */}
          {sessions.length > 0 && (
            <section className="mj-section mj-events" data-section="events">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {eventsTitle}
              </h2>
              {eventsNote && (
                <p className="mj-lead mj-events__note mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                  {eventsNote}
                </p>
              )}

              {venuePhoto && (
                <figure className="mj-events__venue mj-reveal mj-reveal--zoom" data-mj-reveal style={revealStyle(0.14)}>
                  <img src={venuePhoto} alt="" loading="lazy" />
                </figure>
              )}

              <div className="mj-events__list">
                {sessions.map((session, index) => {
                  const maps = venueMaps(session)
                  return (
                    <article className="mj-event mj-reveal mj-reveal--zoom" data-mj-reveal style={revealStyle(0.1 + index * 0.06)} key={`${session.name || "acara"}-${index}`}>
                      <div className="mj-event__card">
                        <img className="mj-event__badge" src={ORNATE_BADGE} alt="" aria-hidden="true" loading="lazy" draggable={false} />
                        <div className="mj-event__body">
                        <h3 className="mj-script mj-event__name">{session.name || eventsTitle}</h3>
                        <p className="mj-event__venue">{session.venue || ""}</p>
                        {(session.date || eventDate) && (
                          <p className="mj-event__time">{formatLongDate(session.date || eventDate)}</p>
                        )}
                        {session.time && <p className="mj-event__time">{timeLine(session.time)}</p>}
                        {session.address && <p className="mj-event__address">{session.address}</p>}
                        </div>
                      </div>
                      {maps && (
                        <div className="mj-event__actions">
                          <a className="mj-btn" href={maps} target="_blank" rel="noreferrer noopener">
                            {mapsLabel}
                          </a>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Turut mengundang ───────────────────────────────── */}
          {honored.length > 0 && (
            <section className="mj-section mj-inviting" data-section="inviting">
              <img className="mj-inviting__bouquet mj-reveal mj-reveal--zoom" data-mj-reveal src={BOUQUET} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {invitingTitle}
              </h2>
              {invitingIntro && (
                <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                  {invitingIntro}
                </p>
              )}
              <ul className="mj-inviting__list mj-reveal" data-mj-reveal style={revealStyle(0.14)}>
                {honored.map((family, index) => (
                  <li key={`${family}-${index}`}>{family}</li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Susunan acara ──────────────────────────────────── */}
          {rundown.length > 0 && (
            <section className="mj-section mj-rundown" data-section="rundown">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {rundownTitle}
              </h2>
              {rundownIntro && (
                <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                  {rundownIntro}
                </p>
              )}
              <ol className="mj-rundown__list">
                {rundown.map((item, index) => (
                  <li className="mj-rundown__row" key={`${item.time || "jam"}-${index}`}>
                    {item.time && <p className="mj-rundown__time">{item.time}</p>}
                    {item.description && <p className="mj-rundown__desc">{item.description}</p>}
                    {index < rundown.length - 1 && <span className="mj-rundown__thread" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* ── Galeri ─────────────────────────────────────────── */}
          {gallery.length > 0 && (
            <section className="mj-section mj-gallery" data-section="gallery">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {galleryTitle}
              </h2>
              {galleryIntro && (
                <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                  {galleryIntro}
                </p>
              )}
              <div className={`mj-gallery__grid${gallery.length === 1 ? " is-single" : ""}`}>
                {gallery.map((photo, index) => (
                  <button
                    type="button"
                    className="mj-gallery__tile mj-reveal mj-reveal--zoom"
                    data-mj-reveal
                    style={revealStyle(0.06 + (index % 3) * 0.05)}
                    key={`${photo}-${index}`}
                    onClick={() => setLightbox(index)}
                    aria-label={`${galleryTitle} ${index + 1} / ${gallery.length}`}
                  >
                    <img src={photo} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              {galleryQuote && (
                <p className="mj-gallery__quote mj-reveal" data-mj-reveal style={revealStyle(0.1)}>
                  {galleryQuote}
                </p>
              )}
            </section>
          )}

          {/* ── Hadiah ─────────────────────────────────────────── */}
          {hasGift && (
            <section className="mj-section mj-gift" data-section="gift">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {giftTitle}
              </h2>
              <img className="mj-gift__envelope mj-reveal mj-reveal--zoom" data-mj-reveal src={GIFT_ENVELOPE} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <p className="mj-lead mj-gift__intro mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                {giftIntro}
              </p>

              <div className="mj-gift__list">
                {accounts.map((account, index) => {
                  const open = openAccount === index
                  return (
                    <div className={`mj-gift__item${open ? " is-open" : ""}`} key={`${account.account_number || "acc"}-${index}`}>
                      <button
                        type="button"
                        className="mj-gift__head"
                        aria-expanded={open}
                        onClick={() => setOpenAccount(open ? -1 : index)}
                      >
                        <span className="mj-gift__bank">{account.provider_name || giftSendLabel}</span>
                        <span className="mj-gift__chev" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M6 9.5 12 15l6-5.5" />
                          </svg>
                        </span>
                      </button>
                      <div className="mj-gift__panel">
                        <div className="mj-gift__inner">
                          {account.account_number && <p className="mj-gift__number">{account.account_number}</p>}
                          {account.account_name && <p className="mj-gift__owner">{accountOwner(account.account_name)}</p>}
                          {account.account_number && (
                            <button
                              type="button"
                              className="mj-link"
                              onClick={() => copyText(account.account_number || "", copyAccountToast)}
                            >
                              {copyAccount}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {giftAddress && (
                  <div className="mj-gift__address">
                    <p className="mj-gift__bank">{giftSendLabel}</p>
                    {profile.gift_address_name && <p className="mj-gift__owner">{profile.gift_address_name}</p>}
                    <p className="mj-gift__addresstext">{giftAddress}</p>
                    <button type="button" className="mj-link" onClick={() => copyText(giftAddress, copyAddressToast)}>
                      {copyAddress}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Dress code ─────────────────────────────────────── */}
          {hasDresscode && (
            <section className="mj-section mj-dress" data-section="dresscode">
              <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
                {dressKicker}
              </h2>
              <img className="mj-dress__crowd mj-reveal" data-mj-reveal src={DRESS_CROWD} alt="" aria-hidden="true" loading="lazy" draggable={false} />
              <div className="mj-dress__card mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
                <h3 className="mj-dress__title">{dressTitle}</h3>
                {profile.dresscode?.description && <p className="mj-dress__text">{profile.dresscode.description}</p>}
                {dressNote && <p className="mj-dress__note">{dressNote}</p>}
                {dressColors.length > 0 && (
                  <div className="mj-dress__swatches">
                    {dressColors.map((color, index) => (
                      <span className="mj-dress__swatch" key={`${color.hex || color.name}-${index}`}>
                        <i style={{ background: color.hex || "#cbbfae" }} aria-hidden="true" />
                        {color.name && <em>{color.name}</em>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Ucapan ─────────────────────────────────────────── */}
          <section className="mj-section mj-wishes" data-section="wishes">
            <img className="mj-wishes__art mj-reveal mj-reveal--zoom" data-mj-reveal src={GRAMOPHONE} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            <h2 className="mj-script mj-heading mj-reveal" data-mj-reveal style={revealStyle(0.08)}>
              {wishesTitle}
            </h2>
            <p className="mj-lead mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
              {wishesIntro}
            </p>

            <form className="mj-form mj-reveal" data-mj-reveal style={revealStyle(0.14)} onSubmit={sendWish}>
              <label className="mj-field">
                <span className="mj-field__label">{wishNameLabel}</span>
                <input
                  className="mj-input"
                  type="text"
                  value={wishName}
                  onChange={(event) => setWishName(event.target.value)}
                  placeholder={wishNamePlaceholder}
                  maxLength={80}
                  autoComplete="name"
                  readOnly={nameState.locked}
                  aria-readonly={nameState.locked}
                  style={nameState.locked ? LOCKED_FIELD_STYLE : undefined}
                />
              </label>
              <label className="mj-field">
                <span className="mj-field__label">{wishMessageLabel}</span>
                <textarea
                  className="mj-input mj-input--area"
                  value={wishMessage}
                  onChange={(event) => setWishMessage(event.target.value.slice(0, WISH_MAX))}
                  placeholder={wishMessagePlaceholder}
                  rows={4}
                  maxLength={WISH_MAX}
                />
              </label>
              <button type="submit" className="mj-btn mj-btn--wide" disabled={wishStatus === "sending" || !wishMessage.trim()}>
                {wishStatus === "sending" ? wishLoading : wishSubmit}
              </button>
              {wishFeedback && (
                <p className={`mj-feedback${wishStatus === "error" ? " is-error" : ""}`} role="status">
                  {wishFeedback}
                </p>
              )}
            </form>

            <div className="mj-feed">
              {!wishesLoaded && <p className="mj-feed__empty">{wishLoading}</p>}
              {wishesLoaded && wishList.length === 0 && <p className="mj-feed__empty">{wishEmpty}</p>}
              {visibleWishes.map((wish) => (
                <article className="mj-wish" key={wish.id}>
                  <p className="mj-wish__name">{wish.name || guestName}</p>
                  <p className="mj-wish__text">{wish.message}</p>
                  <span className="mj-wish__time">{ago(wish.created_at)}</span>
                </article>
              ))}
              {wishesLoaded && wishPages > 1 && (
                <div className="mj-pager">
                  <button
                    type="button"
                    className="mj-pager__btn"
                    onClick={() => setWishPage((page) => Math.max(0, page - 1))}
                    disabled={wishPageSafe === 0}
                    aria-label={pagerPrev}
                  >
                    ‹
                  </button>
                  <span>{`${wishPageSafe + 1} / ${wishPages}`}</span>
                  <button
                    type="button"
                    className="mj-pager__btn"
                    onClick={() => setWishPage((page) => Math.min(wishPages - 1, page + 1))}
                    disabled={wishPageSafe >= wishPages - 1}
                    aria-label={pagerNext}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Penutup ────────────────────────────────────────── */}
          <section className="mj-closing" data-section="closing">
            <p className="mj-script mj-closing__title mj-reveal" data-mj-reveal style={revealStyle(0)}>
              {closingTitle}
            </p>
            {closingPhoto && (
              <figure className="mj-closing__photo mj-reveal mj-reveal--zoom" data-mj-reveal style={revealStyle(0.08)}>
                <img src={closingPhoto} alt="" loading="lazy" />
              </figure>
            )}
            <p className="mj-script mj-closing__names mj-reveal" data-mj-reveal style={revealStyle(0.12)}>
              {coupleLabel}
            </p>
            {coverDate && (
              <p className="mj-closing__date mj-reveal mj-reveal--fade" data-mj-reveal style={revealStyle(0.16)}>
                {coverDate}
              </p>
            )}
            <div className="mj-closing__arch">
              <img src={CLOSING_ARCH} alt="" aria-hidden="true" loading="lazy" draggable={false} />
            </div>
            {hashtag && hashtag !== "#" && (
              <p className="mj-closing__hashtag mj-reveal mj-reveal--fade" data-mj-reveal style={revealStyle(0.14)}>
                {hashtag}
              </p>
            )}
            <p className="mj-closing__message mj-reveal" data-mj-reveal style={revealStyle(0.1)}>
              {closingMessage}
            </p>
            {apology && <p className="mj-closing__apology">{apology}</p>}

            <footer className="tpl-footer mj-footer">
              <a
                className="tpl-footer__link"
                href={`https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent("Halo Aksaraa Wedding, saya tertarik membuat undangan digital")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hubungi Aksaraa Wedding via WhatsApp"
              >
                <span className="tpl-footer__badge">
                  <img
                    src={ASSETS.galeriEnvelope.aksaraaLogo}
                    alt="Aksaraa Wedding"
                    className="tpl-footer__logo"
                    draggable={false}
                  />
                </span>
                <span className="tpl-footer__cta">Wedding by Aksaraa</span>
              </a>
            </footer>
          </section>
        </main>
      )}

      {/* ── Gerbang film amplop ───────────────────────────────── */}
      {phase !== "done" && (
        <div
          className={`mj-gate${phase === "fading" ? " is-fading" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={openLabel}
          onClick={openInvitation}
        >
          <div className="mj-gate__stage">
            <video
              ref={gateVideoRef}
              className="mj-gate__film"
              src={GATE_FILM}
              poster={GATE_POSTER}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onPlaying={onGatePlaying}
              onEnded={onGateEnded}
            />
            <span className="mj-gate__veil" aria-hidden="true" />
            {monogram && (
              <span ref={sealRef} className="mj-gate__seal" aria-hidden="true">
                <span>{monogram}</span>
              </span>
            )}
          </div>
          <div className="mj-gate__body">
            <div className="mj-gate__guest">
              <p className="mj-gate__guestlabel">{guestLabel}</p>
              {hasGuestName && <p className="mj-gate__guestname">{guestName}</p>}
            </div>
            <p className="mj-gate__hint">{gateHint}</p>
            <button type="button" className="mj-gate__open" onClick={openInvitation}>
              {openLabel}
            </button>
          </div>
        </div>
      )}

      {trackUrl && phase === "done" && (
        <button
          type="button"
          className={`mj-music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
          aria-pressed={playing}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {playing ? "music_note" : "music_off"}
          </span>
        </button>
      )}

      {lightbox !== null && gallery[lightbox] && (
        <div className="mj-lightbox" role="dialog" aria-modal="true" aria-label={galleryTitle}>
          <button
            type="button"
            className="mj-lightbox__nav mj-lightbox__nav--prev"
            onClick={() => setLightbox((lightbox - 1 + gallery.length) % gallery.length)}
            aria-label={`${galleryTitle} sebelumnya`}
          >
            ‹
          </button>
          <img src={gallery[lightbox]} alt="" />
          <button
            type="button"
            className="mj-lightbox__nav mj-lightbox__nav--next"
            onClick={() => setLightbox((lightbox + 1) % gallery.length)}
            aria-label={`${galleryTitle} berikutnya`}
          >
            ›
          </button>
          <button type="button" className="mj-lightbox__close" onClick={() => setLightbox(null)} aria-label="Tutup">
            ×
          </button>
        </div>
      )}

      {toast && (
        <div className="mj-toast" role="status">
          {toast}
        </div>
      )}

      {showDock && (
        <InvitationOverlay
          guestId={profile.guest_id}
          guestSlug={profile.guest_slug}
          allowFlexibleRsvp={profile.guest_link_strict === false}
          guestName={profile.guest_name || "Tamu Undangan"}
          coupleName={coupleLabel}
          weddingProfileId={profile.wedding_profile_id!}
          guestQrUrl={profile.guest_qr_url}
          guestTableNumber={profile.guest_table_number}
          guestRsvpStatus={profile.guest_rsvp_status}
          guestRsvpMessage={profile.guest_rsvp_message || undefined}
          rsvpMaxPax={profile.rsvp_max_pax ?? 2}
          qrEnabled={profile.feature_gates?.qr_code_book === true}
          anchor="bottom"
          bottom={92}
        />
      )}
    </div>
  )
}
