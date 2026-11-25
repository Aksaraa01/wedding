"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { resolveCoupleName, resolveCoupleShortName } from "@/lib/coupleName"
import InvitationOverlay from "@/components/InvitationOverlay"
import { coverPhoto, flattenPhotos, initialsOf, normalizeVideoUrl, photoList } from "../shared/lib"
import { TIBRA_CSS } from "./Atmosphere"
import BackgroundVideo from "./BackgroundVideo"
import Cover from "./Cover"
import GiftPopup from "./GiftPopup"
import LeftPanel, { type PanelMedia } from "./LeftPanel"
import Rail from "./Rail"
import Splash from "./Splash"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function DarkSplitRail(profile: TemplateProps) {
  const lang = normalizeLanguage(profile.language)
  const [phase, setPhase] = useState<"splash" | "cover" | "open">("splash")
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [ready, setReady] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [media, setMedia] = useState<PanelMedia>("cover")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const readyRef = useRef(false)

  const hasTrack = !!profile.track_url

  // Preload the couple's photos behind the splash so the reveal never pops in.
  useEffect(() => {
    const srcs = [
      coverPhoto(profile),
      profile.couple_illustration_url,
      ...photoList(profile.groom_photo_url),
      ...photoList(profile.bride_photo_url),
      ...(profile.gallery_photos || []),
    ].filter(Boolean) as string[]
    let cancelled = false
    const load = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = src
      })
    const timeout = setTimeout(() => {
      if (!cancelled) {
        readyRef.current = true
        setReady(true)
      }
    }, 6000)
    Promise.allSettled(srcs.map(load)).then(() => {
      if (!cancelled) {
        clearTimeout(timeout)
        readyRef.current = true
        setReady(true)
      }
    })
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drives the 0–100% counter. It holds at 99% until every cover asset is
  // loaded and the Cover (with its "Buka Undangan" button) is mounted, so a
  // visible 100% always means the entry screen is genuinely ready.
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / 2600) * 100, 100)
      setProgress((prev) => {
        const next = readyRef.current ? pct : Math.min(pct, 99)
        return next > prev ? next : prev
      })
      if (pct >= 100 && readyRef.current) clearInterval(id)
    }, 60)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (ready && phase === "splash" && progress < 100) setProgress(100)
  }, [ready, phase, progress])

  useEffect(() => {
    if (phase !== "splash" || progress < 100 || !ready) return
    setLeaving(true)
    const t = setTimeout(() => setPhase("cover"), 1000)
    return () => clearTimeout(t)
  }, [phase, progress, ready])

  const coupleLabel = resolveCoupleName(profile)
  const tc = profile.template_content ?? {}
  // Splash, cover and the desktop media panel show the couple as one line, so
  // they use the nicknames; the full names stay in the per-person sections.
  const shortCoupleLabel = resolveCoupleShortName(profile)
  const initials =
    (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name) || "VF"
  const iso = (profile.estimated_wedding_date || "").slice(0, 10)
  const dm = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const coverDate = dm ? `${dm[3]} . ${dm[2]} . ${dm[1].slice(2)}` : undefined

  const openInvitation = useCallback(() => {
    setPhase("open")
    if (hasTrack && profile.auto_play !== false) {
      setPlaying(true)
      setTimeout(() => {
        audioRef.current?.play().catch(() => setPlaying(false))
      }, 60)
    }
  }, [hasTrack, profile.auto_play])

  const toggleMusic = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => setPlaying(false))
      setPlaying(true)
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [])

  const accounts = profile.gift_accounts || []
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const coverPhotos = flattenPhotos(profile.cover_photos)
  const panelPhotos = coverPhotos.length > 0 ? coverPhotos : [coverPhoto(profile)]
  const showGuestDock =
    phase === "open" &&
    (!!profile.guest_id || (profile.guest_link_strict === false && !!profile.guest_slug)) &&
    !!profile.wedding_profile_id

  return (
    <>
      <style>{TIBRA_CSS}</style>
      <div className="dsr-root relative w-full bg-black">
        {phase === "splash" && (
          <Splash progress={progress} leaving={leaving} initials={initials} coupleLabel={shortCoupleLabel} />
        )}

        {/* Mounted under the splash so the "Buka Undangan" button is already
            painted before the counter reaches 100%. */}
        {(phase === "splash" || phase === "cover") && (
          <Cover
            coverUrl={coverPhoto(profile)}
            coupleLabel={shortCoupleLabel}
            guestName={profile.guest_name}
            dateShort={coverDate}
            kicker={tc.cover_kicker}
            objectPosition={profile.template_demo ? "58% 50%" : "50% 50%"}
            onOpen={openInvitation}
            language={profile.language}
          />
        )}

        {/* Warmed up from the very first frame (behind the splash/cover) so the
            video is already playing the moment the invitation opens. */}
        {videoEmbed && (
          <BackgroundVideo embed={videoEmbed} poster={coverPhoto(profile)} signal={phase === "open" ? 1 : 0} dim clean />
        )}

        {phase === "open" && (
          <div className="relative z-10 flex min-h-screen">
            <LeftPanel
              photos={panelPhotos}
              storyImage={profile.stories?.[0]?.image_url || (profile.gallery_photos || [])[0]}
              active={media}
              coupleLabel={shortCoupleLabel}
            />
            <Rail
              profile={profile}
              accounts={accounts}
              giftAddress={profile.gift_address}
              giftAddressName={profile.gift_address_name}
              onOpenGift={() => setGiftOpen(true)}
              onActiveMedia={setMedia}
            />
          </div>
        )}

        {giftOpen && (
          <GiftPopup
            accounts={accounts}
            giftAddress={profile.gift_address}
            giftAddressName={profile.gift_address_name}
            onClose={() => setGiftOpen(false)}
            language={profile.language}
          />
        )}

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

        {phase === "open" && hasTrack && (
          <button
            type="button"
            onClick={toggleMusic}
            aria-label={t("playPauseMusic", lang)}
            className="fixed bottom-4 right-4 z-[95] flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#F2F1EE] text-[#1B1B18] shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <span className={`material-symbols-outlined text-[22px] ${playing ? "" : "opacity-60"}`}>
              {playing ? "music_note" : "music_off"}
            </span>
          </button>
        )}

        {hasTrack && <audio ref={audioRef} src={profile.track_url} loop playsInline preload="none" />}
      </div>
    </>
  )
}
