"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"
import { copyPlainText } from "@/lib/clipboard"
import InvitationOverlay from "@/components/InvitationOverlay"
import { countdownTarget, formatDotDate, formatLongDate, gcalLink, groomPhoto, photoList } from "../shared/lib"
import { useWishes } from "../shared/kids/useWishes"
import "./songket-marun.css"

const ART = (name: string) => `/templates/songket-marun/${name}.webp`

const DEFAULT_ARABIC = "رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ"
const DEFAULT_DOA =
  "Ya Tuhanku, anugerahkanlah kepadaku (seorang anak) yang termasuk orang-orang yang saleh."
const DEFAULT_DOA_SOURCE = "QS. Ash-Shaffat: 100"
const DEFAULT_BLESSING =
  "Semoga ananda tumbuh menjadi anak yang saleh, berbakti kepada orang tua, dan menjadi kebanggaan keluarga."
const DEFAULT_OPENING =
  "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan acara ananda tercinta. Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu."
const DEFAULT_CLOSING =
  "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu. Atas kehadiran dan doanya kami ucapkan terima kasih."
const DEFAULT_GIFT =
  "Doa restu Bapak/Ibu/Saudara/i adalah hadiah terindah. Bila ingin memberi lebih, kami menerimanya dengan penuh rasa syukur."

export default function SongketMarun(profile: TemplateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toastTimer = useRef<number | null>(null)

  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState("")
  const [wishName, setWishName] = useState("")
  const [wishMessage, setWishMessage] = useState("")

  const tc = profile.template_content || {}
  const gates = profile.feature_gates || {}
  const labels = profile.event_labels || eventLabels(profile.event_type, profile.subject_gender)

  const covers = useMemo(() => photoList(profile.cover_photos as string | string[] | undefined), [profile.cover_photos])
  const cover = covers[0] || profile.couple_illustration_url || ASSETS.defaults.couple
  const venuePhoto = covers[1] || ""
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

  const coverKicker = (tc.cover_kicker || "").trim() || labels.coverKicker
  const coverGuestLabel = (tc.cover_guest_label || "").trim() || "Kepada Yth. Bapak/Ibu/Saudara/i"
  const openLabel = (tc.open_button || "").trim() || "Buka Undangan"
  const salam = (tc.opening_salam || "").trim() || "Assalamu'alaikum Warahmatullahi Wabarakatuh"
  const openingText = (profile.opening_description || "").trim() || DEFAULT_OPENING
  const doaArabic = (tc.doa_arabic || "").trim() || DEFAULT_ARABIC
  const doaText = (profile.quote_text || "").trim() || DEFAULT_DOA
  const doaSource = (profile.quote_source || "").trim() || DEFAULT_DOA_SOURCE
  const doaBlessing = (tc.doa_blessing || "").trim() || DEFAULT_BLESSING
  const eventsTitle = (tc.events_title || "").trim() || "Waktu & Tempat"
  const eventsLead = (tc.events_intro || "").trim() || "Insya Allah acara akan diselenggarakan pada:"
  const mapsLabel = (tc.maps_label || "").trim() || "Lihat Lokasi"
  const galleryTitle = (tc.gallery_title || "").trim() || "Momen Bahagia"
  const galleryLead = (tc.gallery_intro || "").trim() || "Sepenggal cerita ananda menjelang hari istimewanya."
  const giftTitle = (tc.gift_intro_title || "").trim() || "Amplop Digital"
  const giftLead = (tc.gift_intro_description || "").trim() || DEFAULT_GIFT
  const wishesTitle = (tc.wishes_title || "").trim() || "Titip Doa"
  const wishesLead =
    (tc.wishes_intro || "").trim() || "Tuliskan doa dan harapan terbaik untuk ananda di hari bahagianya."
  const closingText = (tc.closing_message || "").trim() || DEFAULT_CLOSING
  const closingSalam = (tc.closing_salam || "").trim() || "Wassalamu'alaikum Warahmatullahi Wabarakatuh"
  const familyLabel = (tc.closing_family_label || "").trim() || "Kami yang berbahagia"
  const apology =
    (tc.cover_apology || "").trim() || "Mohon maaf apabila ada kesalahan penulisan nama atau gelar."

  const parsedDate = eventDate ? new Date(eventDate) : null
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null
  const dayNum = validDate ? String(validDate.getDate()).padStart(2, "0") : "--"
  const monthName = validDate ? validDate.toLocaleDateString("id-ID", { month: "long" }) : ""
  const yearNum = validDate ? String(validDate.getFullYear()) : ""
  const weekday = validDate ? validDate.toLocaleDateString("id-ID", { weekday: "long" }) : ""

  const trackUrl = profile.track_url || (profile.template_demo ? ASSETS.defaultMusic : "")
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
    if (ok) setWishMessage("")
  }, [wishes, wishName, guestName, wishMessage])

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
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [opened, gallery.length, accounts.length, wishes.wishes.length])

  return (
    <div ref={rootRef} className={`skm-root${opened ? " is-open" : " is-locked"}`}>
      {trackUrl && <audio ref={audioRef} src={trackUrl} loop preload="metadata" data-warm-audio="" />}

      {!opened && (
        <section className="skm-cover" aria-label={coverKicker}>
          <img className="skm-cover__photo" src={cover} alt="" aria-hidden="true" draggable={false} />
          <div className="skm-cover__veil" />
          <div className="skm-cover__tenun" aria-hidden="true" />
          <img className="skm-cover__melur" src={ART("melur")} alt="" aria-hidden="true" />

          <div className="skm-cover__inner">
            <p className="skm-cover__kicker">{labels.eventKicker}</p>
            <h1 className="skm-cover__name">{childName}</h1>
            <div className="skm-flower-line" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M12 3c1.6 2.1 2.6 4 2.6 5.9 0 1.4-.9 2.6-2.6 3.6-1.7-1-2.6-2.2-2.6-3.6C9.4 7 10.4 5.1 12 3Z" fill="currentColor" />
                <path d="M21 12c-2.1 1.6-4 2.6-5.9 2.6-1.4 0-2.6-.9-3.6-2.6 1-1.7 2.2-2.6 3.6-2.6 1.9 0 3.8 1 5.9 2.6Z" fill="currentColor" />
                <path d="M12 21c-1.6-2.1-2.6-4-2.6-5.9 0-1.4.9-2.6 2.6-3.6 1.7 1 2.6 2.2 2.6 3.6 0 1.9-1 3.8-2.6 5.9Z" fill="currentColor" />
                <path d="M3 12c2.1-1.6 4-2.6 5.9-2.6 1.4 0 2.6.9 3.6 2.6-1 1.7-2.2 2.6-3.6 2.6-1.9 0-3.8-1-5.9-2.6Z" fill="currentColor" />
              </svg>
            </div>
            <p className="skm-cover__date">{formatLongDate(eventDate)}</p>
            <p className="skm-cover__guest">{coverGuestLabel}</p>
            <p className="skm-cover__guestname">{guestName}</p>
            <button type="button" className="skm-open" onClick={openInvitation}>
              {openLabel}
            </button>
          </div>
        </section>
      )}

      {opened && (
        <main>
          {/* Pembuka */}
          <section className="skm-section skm-section--cream skm-pembuka" data-skm-reveal>
            <div className="skm-star" aria-hidden="true" />
            <p className="skm-basmalah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="skm-pembuka__salam">{salam}</p>
            <div className="skm-pita" aria-hidden="true" />
            <p className="skm-pembuka__text">{openingText}</p>
            <p className="skm-putra__of">{apology}</p>
          </section>

          {/* Putra Kami */}
          <section className="skm-section skm-section--dark skm-putra" data-skm-reveal>
            <span className="skm-edge skm-edge--top" aria-hidden="true" />
            <span className="skm-edge skm-edge--bottom" aria-hidden="true" />
            <p className="skm-kicker skm-section__kicker">{labels.subjectPossessive}</p>
            <h2 className="skm-section__title">{labels.subjectLabel}</h2>
            <div className="skm-putra__stage">
              <div className="skm-putra__photo">
                <img src={portrait} alt={childFull} draggable={false} />
              </div>
              <img className="skm-putra__frame" src={ART("bingkai-ukir-lak")} alt="" aria-hidden="true" />
              <img className="skm-putra__tanjak" src={ART("tanjak-songket")} alt="" aria-hidden="true" />
              <img className="skm-putra__melur" src={ART("melur")} alt="" aria-hidden="true" />
            </div>
            <p className="skm-putra__name">{childFull}</p>
            {parents && (
              <>
                <p className="skm-putra__of">{labels.subjectOf}</p>
                <p className="skm-putra__parents">{parents}</p>
              </>
            )}
          </section>

          {/* Doa untuk Ananda */}
          <section className="skm-section skm-section--cream skm-doa" data-skm-reveal>
            <div className="skm-star" aria-hidden="true" />
            <div className="skm-star" aria-hidden="true" />
            <h2 className="skm-section__title">Doa untuk Ananda</h2>
            <div className="skm-doa__card">
              <p className="skm-doa__arabic" lang="ar" dir="rtl">
                {doaArabic}
              </p>
              <p className="skm-doa__text">&ldquo;{doaText}&rdquo;</p>
              <p className="skm-doa__source">{doaSource}</p>
              <div className="skm-pita" aria-hidden="true" />
              <p className="skm-doa__blessing">{doaBlessing}</p>
            </div>
          </section>

          {/* Save the Date */}
          <section className="skm-section skm-section--dark skm-date" data-skm-reveal>
            <span className="skm-edge skm-edge--top" aria-hidden="true" />
            <span className="skm-edge skm-edge--bottom" aria-hidden="true" />
            <p className="skm-kicker skm-section__kicker">Save the Date</p>
            <h2 className="skm-section__title">Hari Bahagia</h2>
            <p className="skm-date__day">{dayNum}</p>
            <p className="skm-date__rest">
              {weekday} · {monthName} {yearNum}
            </p>
            {calendarUrl && (
              <a className="skm-date__cta" href={calendarUrl} target="_blank" rel="noreferrer noopener">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  calendar_month
                </span>
                Simpan Tanggal
              </a>
            )}
            {target && <p className="skm-section__lead">{labels.countdownLabel}</p>}
          </section>

          {/* Acara */}
          <section className="skm-section skm-section--cream skm-acara" data-skm-reveal>
            <span className="skm-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
            </span>
            <p className="skm-kicker skm-section__kicker">Rangkaian Acara</p>
            <h2 className="skm-section__title">{eventsTitle}</h2>
            <p className="skm-section__lead">{eventsLead}</p>

            {venuePhoto && (
              <div className="skm-acara__venue">
                <img src={venuePhoto} alt="" loading="lazy" draggable={false} />
                <img className="skm-acara__tepak" src={ART("tepak-sirih")} alt="" aria-hidden="true" loading="lazy" />
              </div>
            )}

            {events.map((session, i) => (
              <article className="skm-event" key={`${session.name || "acara"}-${i}`}>
                <h3 className="skm-event__name">{session.name || labels.mainEventName}</h3>
                {session.date && <p className="skm-event__date">{formatLongDate(session.date)}</p>}
                {session.time && <p className="skm-event__time">Pukul {session.time}</p>}
                {(session.venue || session.address) && (
                  <p className="skm-event__place">
                    {session.venue && <strong>{session.venue}</strong>}
                    {session.address}
                  </p>
                )}
                {session.maps_url && (
                  <a className="skm-event__maps" href={session.maps_url} target="_blank" rel="noreferrer noopener">
                    {mapsLabel}
                  </a>
                )}
              </article>
            ))}
          </section>

          {/* Galeri */}
          {gallery.length > 0 && (
            <section className="skm-section skm-section--dark skm-galeri" data-skm-reveal>
            <span className="skm-edge skm-edge--top" aria-hidden="true" />
            <span className="skm-edge skm-edge--bottom" aria-hidden="true" />
              <p className="skm-kicker skm-section__kicker">Galeri</p>
              <h2 className="skm-section__title">{galleryTitle}</h2>
              <p className="skm-section__lead">{galleryLead}</p>
              <div className="skm-galeri__grid">
                {gallery.map((src, i) => (
                  <figure key={`${src}-${i}`}>
                    <img src={src} alt="" loading="lazy" draggable={false} />
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Tanda Kasih */}
          {hasGift && (
            <section className="skm-section skm-section--dark skm-gift" data-skm-reveal>
            <span className="skm-edge skm-edge--top" aria-hidden="true" />
            <span className="skm-edge skm-edge--bottom" aria-hidden="true" />
              <img className="skm-gift__orn" src={ART("songket-terlipat")} alt="" aria-hidden="true" loading="lazy" />
              <p className="skm-kicker skm-section__kicker">{giftTitle}</p>
              <h2 className="skm-section__title">Tanda Kasih</h2>
              <p className="skm-section__lead">{giftLead}</p>

              {accounts.map((acc, i) => (
                <div className="skm-gift__card" key={`${acc.account_number || acc.provider_name || "acc"}-${i}`}>
                  <p className="skm-gift__bank">{acc.provider_name}</p>
                  <p className="skm-gift__number">{acc.account_number}</p>
                  <p className="skm-gift__owner">{acc.account_name}</p>
                  <button
                    type="button"
                    className="skm-gift__copy"
                    onClick={() => copyText(acc.account_number || "", "Nomor rekening disalin")}
                  >
                    Salin Nomor
                  </button>
                </div>
              ))}

              {giftAddress && (
                <div className="skm-gift__card">
                  <p className="skm-gift__bank">Kirim Hadiah</p>
                  <p className="skm-gift__address">{giftAddress}</p>
                  <button
                    type="button"
                    className="skm-gift__copy"
                    onClick={() => copyText(giftAddress, "Alamat disalin")}
                  >
                    Salin Alamat
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Doa & Ucapan */}
          <section className="skm-section skm-section--cream skm-ucapan" data-skm-reveal>
            <span className="skm-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 5.5h16v11H9l-5 3.6V5.5Z" /><path d="M8 10h8M8 13h5" /></svg>
            </span>
            <p className="skm-kicker skm-section__kicker">Doa &amp; Ucapan</p>
            <h2 className="skm-section__title">{wishesTitle}</h2>
            <p className="skm-section__lead">{wishesLead}</p>
            <div className="skm-wish-form">
              <input
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                placeholder="Nama Anda"
                aria-label="Nama Anda"
              />
              <textarea
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                placeholder="Tulis doa dan ucapan"
                aria-label="Doa dan ucapan"
              />
              <button
                type="button"
                className="skm-wish-send"
                onClick={submitWish}
                disabled={wishes.state === "sending" || !wishMessage.trim()}
              >
                {wishes.state === "sending" ? "Mengirim" : "Kirim Ucapan"}
              </button>
              {wishes.feedback && <p className="skm-wish-note">{wishes.feedback}</p>}
            </div>
            <div className="skm-wish-list">
              {!wishes.loaded ? (
                <p className="skm-wish-empty">Memuat ucapan</p>
              ) : wishes.wishes.length === 0 ? (
                <p className="skm-wish-empty">Belum ada ucapan. Jadilah yang pertama.</p>
              ) : (
                wishes.wishes.map((w) => (
                  <div className="skm-wish" key={w.id}>
                    <span className="skm-wish__time">{formatDotDate(w.created_at)}</span>
                    <div className="skm-wish__name">{w.name || labels.guestFallback}</div>
                    <p className="skm-wish__text">{w.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Penutup */}
          <section className="skm-section skm-section--dark skm-penutup" data-skm-reveal>
            <span className="skm-edge skm-edge--top" aria-hidden="true" />
            <span className="skm-edge skm-edge--bottom" aria-hidden="true" />
            <div className="skm-penutup__photo">
              <img src={closingPhoto} alt="" loading="lazy" draggable={false} />
              <img className="skm-penutup__melur" src={ART("melur")} alt="" aria-hidden="true" loading="lazy" />
            </div>
            <h2 className="skm-penutup__thanks">Terima Kasih</h2>
            <p className="skm-penutup__text">{closingText}</p>
            <p className="skm-penutup__salam">{closingSalam}</p>
            <div className="skm-pita" aria-hidden="true" />
            <p className="skm-penutup__family">{familyLabel}</p>
            <p className="skm-penutup__names">Keluarga Besar</p>
            {parents && <p className="skm-penutup__names" style={{ fontSize: 15 }}>{parents}</p>}
          </section>

          <p className="skm-footer">
            {labels.brand} · {labels.site.replace("https://", "")}
          </p>
        </main>
      )}

      {opened && trackUrl && (
        <button
          type="button"
          className={`skm-music${playing ? " skm-music--playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {playing ? "music_note" : "music_off"}
          </span>
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
