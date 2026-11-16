"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, formatLongDate, gcalLink, groomPhoto, photoList } from "../shared/lib"
import { useWishes } from "../shared/kids/useWishes"
import "./lentera-zamrud.css"

const ART = (name: string) => `/templates/lentera-zamrud/${name}.webp`

const DEFAULT_ARABIC = "رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ"
const DEFAULT_BLESSING =
  "Semoga ananda tumbuh menjadi anak yang saleh, berbakti kepada orang tua, dan menjadi kebanggaan keluarga."
const DEFAULT_OPENING =
  "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan acara ananda tercinta. Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu."
const DEFAULT_CLOSING =
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu. Atas kehadiran dan doanya kami ucapkan terima kasih."
const DEFAULT_GIFT =
  "Doa restu Bapak/Ibu/Saudara/i adalah hadiah terindah. Bila ingin memberi lebih, kami menerimanya dengan penuh rasa syukur."

export default function LenteraZamrud(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [wishName, setWishName] = useState("")
  const [wishMessage, setWishMessage] = useState("")
  const [now, setNow] = useState<number | null>(null)

  // Design QA hook: ?opened=1 starts the invitation open for screenshot review.
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
  const cover = covers[0] || profile.couple_illustration_url || ASSETS.defaults.couple
  const closingPhoto = covers[2] || cover
  const portrait = groomPhoto(profile.groom_photo_url)

  const childName = (profile.groom_name || "").trim() || "Ananda"
  const childFull = (profile.groom_full_name || childName).trim()
  const parents = (profile.groom_parents || "").trim()
  const guestName = (profile.guest_name || "").trim() || labels.guestFallback

  const events = useMemo(
    () => (profile.sessions || []).filter((s) => s && (s.name || s.date || s.venue || s.address)),
    [profile.sessions]
  )
  const eventDate = (profile.estimated_wedding_date || "").trim()
  const target = useMemo(() => countdownTarget(events, eventDate), [events, eventDate])
  const calendarUrl = useMemo(() => gcalLink(events[0], childFull), [events, childFull])

  const gallery = useMemo(
    () => (Array.isArray(profile.gallery_photos) ? profile.gallery_photos.filter(Boolean).slice(0, 9) : []),
    [profile.gallery_photos]
  )

  const accounts = profile.gift_section_visible !== false ? (profile.gift_accounts || []).filter(Boolean) : []
  const giftAddress =
    profile.gift_section_visible !== false && gates.gift_address !== false ? (profile.gift_address || "").trim() : ""
  const hasGift = accounts.length > 0 || !!giftAddress

  const quoteText = (profile.quote_text || "").trim()
  const quoteSource = (profile.quote_source || "").trim()
  const doaArabic = (tc.doa_arabic || "").trim() || DEFAULT_ARABIC
  const doaBlessing = (tc.doa_blessing || "").trim() || DEFAULT_BLESSING
  const openingText = (profile.opening_description || "").trim() || DEFAULT_OPENING
  const closingText = (tc.closing_message || "").trim() || DEFAULT_CLOSING
  const giftLead = (tc.gift_intro_description || "").trim() || DEFAULT_GIFT
  const salam = (tc.opening_salam || "").trim() || "Assalamu'alaikum Warahmatullahi Wabarakatuh"
  const closingSalam = (tc.closing_salam || "").trim() || "Wassalamu'alaikum Warahmatullahi Wabarakatuh"
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const coverKicker = (tc.cover_kicker || "").trim() || labels.eventKicker

  const honored = useMemo(
    () =>
      gates.inviting_families !== false && profile.inviting_families_visible !== false
        ? (profile.inviting_families || []).filter((f) => !!f && !!f.trim())
        : [],
    [profile.inviting_families, profile.inviting_families_visible, gates.inviting_families]
  )

  const parsed = eventDate ? new Date(eventDate) : null
  const valid = parsed && !isNaN(parsed.getTime()) ? parsed : null
  const dayNum = valid ? String(valid.getDate()).padStart(2, "0") : "--"
  const monthName = valid ? valid.toLocaleDateString("id-ID", { month: "long" }) : ""
  const yearNum = valid ? String(valid.getFullYear()) : ""
  const weekday = valid ? valid.toLocaleDateString("id-ID", { weekday: "long" }) : ""

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.kidsMusic : "")
  const wishes = useWishes(profile.wedding_profile_id, profile.guest_id)

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
    void audio.play().then(() => setPlaying(true), () => setPlaying(false))
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
    if (ok) setWishMessage("")
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
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [opened, gallery.length, accounts.length, wishes.wishes.length])

  const countdownCells = (() => {
    const ms = target && now ? Math.max(0, target.getTime() - now) : 0
    return [
      { v: Math.floor(ms / 86400000), l: "Hari" },
      { v: Math.floor((ms % 86400000) / 3600000), l: "Jam" },
      { v: Math.floor((ms % 3600000) / 60000), l: "Menit" },
      { v: Math.floor((ms % 60000) / 1000), l: "Detik" },
    ]
  })()

  return (
    <div ref={rootRef} className={`lz-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      {!opened && (
        <section className="lz-cover" aria-label={coverKicker}>
          <div className="lz-paper" aria-hidden="true" />
          <div className="lz-stars" aria-hidden="true" />
          <img className="lz-cover__dome" src={ART("kubah-masjid")} alt="" aria-hidden="true" />
          <img className="lz-lantern lz-lantern--1" src={ART("lentera-1")} alt="" aria-hidden="true" />
          <img className="lz-lantern lz-lantern--2" src={ART("lentera-2")} alt="" aria-hidden="true" />
          <img className="lz-lantern lz-lantern--3" src={ART("lentera-3")} alt="" aria-hidden="true" />

          <p className="lz-cover__kicker-script" style={{ marginTop: 26 }}>{labels.eventKicker}</p>

          <div className="lz-arch">
            <div className="lz-arch__photo">
              <img src={cover} alt={childFull} draggable={false} />
            </div>
            <img className="lz-arch__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" />
            <img className="lz-arch__sprig lz-arch__sprig--l" src={ART("ranting-daun")} alt="" aria-hidden="true" />
            <img className="lz-arch__sprig lz-arch__sprig--r" src={ART("ranting-zaitun")} alt="" aria-hidden="true" />
          </div>

          <div className="lz-cover__inner">
            <h1 className="lz-cover__name">{childName}</h1>
            <img className="lz-divider" src={ART("pemisah-emas")} alt="" aria-hidden="true" style={{ margin: "12px auto" }} />
            <p className="lz-cover__guest">
              Kepada Yth. Bapak/Ibu/Saudara/i
              {guestName && guestName !== labels.guestFallback ? <strong>{guestName}</strong> : null}
            </p>
            <button type="button" className="lz-open" onClick={openInvitation}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
              {openLabel}
            </button>
          </div>
        </section>
      )}

      {opened && (
        <main>
          {/* Pembuka (emerald) */}
          <section className="lz-section lz-dark lz-pembuka" data-lz-reveal>
            <img className="lz-lantern lz-lantern--1" src={ART("lentera-2")} alt="" aria-hidden="true" />
            <img className="lz-lantern lz-lantern--3" src={ART("lentera-3")} alt="" aria-hidden="true" />
            <p className="lz-pembuka__salam">{salam}</p>
            <img className="lz-divider" src={ART("pemisah-emas-2")} alt="" aria-hidden="true" />
            <p className="lz-pembuka__text">{openingText}</p>
          </section>

          {/* Putra Kami (cream) */}
          <section className="lz-section lz-putra" data-lz-reveal>
            <div className="lz-paper" aria-hidden="true" />
            <p className="lz-kicker">{labels.subjectPossessive}</p>
            <div className="lz-putra__stage">
              <div className="lz-putra__photo">
                <img src={portrait} alt={childFull} draggable={false} />
              </div>
              <img className="lz-putra__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" />
              <img className="lz-putra__branch lz-putra__branch--l" src={ART("ranting-daun")} alt="" aria-hidden="true" />
              <img className="lz-putra__branch lz-putra__branch--r" src={ART("ranting-zaitun")} alt="" aria-hidden="true" />
            </div>
            <p className="lz-name">{childFull}</p>
            {parents && (
              <>
                <p className="lz-of">{labels.subjectOf}</p>
                <p className="lz-parents">{parents}</p>
              </>
            )}
            {profile.groom_instagram && (
              <p className="lz-ig">@{profile.groom_instagram.replace(/^@/, "")}</p>
            )}
          </section>

          {/* Hitung Mundur (emerald) */}
          <section className="lz-section lz-dark" data-lz-reveal>
            <img className="lz-lantern lz-lantern--1" src={ART("lentera-1")} alt="" aria-hidden="true" />
            <img className="lz-lantern lz-lantern--2" src={ART("lentera-2")} alt="" aria-hidden="true" />
            <p className="lz-kicker">Hitung Mundur</p>
            <h2 className="lz-title">Menuju Hari Bahagia</h2>
            <div className="lz-divider" aria-hidden="true" />
            <div className="lz-clock">
              {countdownCells.map((c) => (
                <div key={c.l}>
                  <span>{now ? String(c.v).padStart(2, "0") : "--"}</span>
                  <small>{c.l}</small>
                </div>
              ))}
            </div>
            <p className="lz-lead">
              {weekday}, {dayNum} {monthName} {yearNum}
            </p>
            {calendarUrl && (
              <p style={{ textAlign: "center", marginTop: 16 }}>
                <a className="lz-event__maps" href={calendarUrl} target="_blank" rel="noreferrer noopener">
                  Simpan Tanggal
                </a>
              </p>
            )}
          </section>

          {/* Waktu & Tempat (cream) */}
          <section className="lz-section" data-lz-reveal>
            <div className="lz-paper" aria-hidden="true" />
            <img
              src={ART("sudut-emas-1")}
              alt=""
              aria-hidden="true"
              style={{ position: "absolute", top: -6, left: -6, width: 96, opacity: 0.8 }}
            />
            <p className="lz-kicker">Rangkaian Acara</p>
            <h2 className="lz-title">Waktu &amp; Tempat</h2>
            <div className="lz-divider" aria-hidden="true" />
            {events.map((s, i) => (
              <article className="lz-event" key={`${s.name || "acara"}-${i}`}>
                <h3 className="lz-event__name">{s.name || labels.mainEventName}</h3>
                {s.date && <p className="lz-event__date">{formatLongDate(s.date)}</p>}
                {s.time && <p className="lz-event__time">Pukul {s.time}</p>}
                {(s.venue || s.address) && (
                  <p className="lz-event__place">
                    {s.venue && <strong>{s.venue}</strong>}
                    {s.address}
                  </p>
                )}
                {s.maps_url && (
                  <a className="lz-event__maps" href={s.maps_url} target="_blank" rel="noreferrer noopener">
                    Lihat Lokasi
                  </a>
                )}
              </article>
            ))}
          </section>

          {/* Galeri (cream) */}
          {gallery.length > 0 && (
            <section className="lz-section" data-lz-reveal>
              <div className="lz-paper" aria-hidden="true" />
              <p className="lz-kicker">Galeri</p>
              <h2 className="lz-title">Momen Bahagia</h2>
              <div className="lz-divider" aria-hidden="true" />
              <p className="lz-lead">Sepenggal cerita ananda menjelang hari istimewanya.</p>
              <div className="lz-galeri__grid">
                {gallery.map((src, i) => (
                  <figure key={`${src}-${i}`}>
                    <img src={src} alt="" loading="lazy" draggable={false} />
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Tanda Kasih (cream) */}
          {hasGift && (
            <section className="lz-section" data-lz-reveal>
              <div className="lz-paper" aria-hidden="true" />
              <p className="lz-kicker">Tanda Kasih</p>
              <h2 className="lz-title">Amplop Digital</h2>
              <p className="lz-lead">{giftLead}</p>
              {accounts.map((acc, i) => (
                <div className="lz-gift" key={`${acc.account_number || acc.provider_name || "acc"}-${i}`}>
                  <p className="lz-gift__bank">{acc.provider_name}</p>
                  <p className="lz-gift__number">{acc.account_number}</p>
                  <p className="lz-gift__owner">{acc.account_name}</p>
                  <button type="button" className="lz-gift__copy" onClick={() => copyText(acc.account_number || "", "Nomor rekening disalin")}>
                    Salin Nomor
                  </button>
                </div>
              ))}
              {giftAddress && (
                <div className="lz-gift">
                  <p className="lz-gift__bank">Kirim Hadiah</p>
                  <p className="lz-gift__address">{giftAddress}</p>
                  <button type="button" className="lz-gift__copy" onClick={() => copyText(giftAddress, "Alamat disalin")}>
                    Salin Alamat
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Doa & Ucapan (cream) */}
          <section className="lz-section" data-lz-reveal>
            <div className="lz-paper" aria-hidden="true" />
            <p className="lz-kicker">Doa &amp; Ucapan</p>
            <h2 className="lz-title">Titip Doa</h2>
            <div className="lz-divider" aria-hidden="true" />
            <div className="lz-form">
              <input value={wishName} onChange={(e) => setWishName(e.target.value)} placeholder="Nama Anda" aria-label="Nama Anda" />
              <textarea value={wishMessage} onChange={(e) => setWishMessage(e.target.value)} placeholder="Tulis doa dan ucapan" aria-label="Doa dan ucapan" />
              <button type="button" className="lz-send" onClick={submitWish} disabled={wishes.state === "sending" || !wishMessage.trim()}>
                {wishes.state === "sending" ? "Mengirim" : "Kirim Ucapan"}
              </button>
              {wishes.feedback && <p className="lz-note">{wishes.feedback}</p>}
            </div>
            <div className="lz-wishes">
              {!wishes.loaded ? (
                <p className="lz-empty">Memuat ucapan</p>
              ) : wishes.wishes.length === 0 ? (
                <p className="lz-empty">Belum ada ucapan. Jadilah yang pertama.</p>
              ) : (
                wishes.wishes.map((w) => (
                  <div className="lz-wish" key={w.id}>
                    <span className="lz-wish__time">{formatDotDate(w.created_at)}</span>
                    <div className="lz-wish__name">{w.name || labels.guestFallback}</div>
                    <p className="lz-wish__text">{w.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Turut Mengundang */}
          {honored.length > 0 && (
            <section className="lz-section" data-lz-reveal>
              <div className="lz-paper" aria-hidden="true" />
              <p className="lz-kicker">Turut Mengundang</p>
              <h2 className="lz-title">Keluarga &amp; Kerabat</h2>
              <div className="lz-divider" aria-hidden="true" />
              <ul style={{ listStyle: "none", margin: 0, padding: 0, textAlign: "center" }}>
                {honored.map((f, i) => (
                  <li key={`${f}-${i}`} style={{ padding: "7px 0", fontSize: 15, lineHeight: 1.5 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Penutup (emerald) */}
          <section className="lz-section lz-dark lz-penutup" data-lz-reveal>
            <img className="lz-lantern lz-lantern--1" src={ART("lentera-3")} alt="" aria-hidden="true" />
            <img className="lz-lantern lz-lantern--3" src={ART("lentera-1")} alt="" aria-hidden="true" />
            <div className="lz-penutup__photo">
              <img src={closingPhoto} alt="" loading="lazy" draggable={false} />
              <img className="lz-arch__frame" src={ART("bingkai-lengkung")} alt="" aria-hidden="true" />
            </div>
            <h2 className="lz-thanks">Terima Kasih</h2>
            <p className="lz-penutup__text">{closingText}</p>
            <p className="lz-penutup__salam">{closingSalam}</p>
            <img className="lz-divider" src={ART("pemisah-emas-3")} alt="" aria-hidden="true" />
            <p className="lz-family">Kami yang berbahagia</p>
            <p className="lz-family-name">Keluarga Besar</p>
            {parents && <p className="lz-family-name" style={{ fontSize: 15 }}>{parents}</p>}
          </section>

          <a
            className="lz-footer"
            href="https://wa.me/6281161613071"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="lz-footer__badge">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa" loading="lazy" />
            </span>
            <span className="lz-footer__cta">{labels.brand} by Aksaraa</span>
          </a>
        </main>
      )}

      {opened && trackUrl && (
        <button type="button" className="lz-music" onClick={toggleMusic} aria-label={playing ? "Jeda musik" : "Putar musik"}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {playing ? "music_note" : "music_off"}
          </span>
        </button>
      )}

      {toast && <div className="lz-toast" role="status">{toast}</div>}

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
