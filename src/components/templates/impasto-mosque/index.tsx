"use client"

import { useCallback, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import InvitationOverlay from "@/components/InvitationOverlay"
import Skin from "../shared/Skin"
import LiveWishes from "../shared/LiveWishes"
import ImpastoCover from "./Cover"
import ImpastoPages from "./Pages"

export default function ImpastoMosque(props: TemplateProps) {
  const [opened, setOpened] = useState(false)
  const [wishOpen, setWishOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const hasTrack = !!props.track_url

  const openInvitation = useCallback(() => {
    setOpened(true)
    if (hasTrack && props.auto_play !== false) {
      setPlaying(true)
      setTimeout(() => {
        audioRef.current?.play().catch(() => setPlaying(false))
      }, 60)
    }
  }, [hasTrack, props.auto_play])

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

  const onWishOpenChange = useCallback((open: boolean) => setWishOpen(open), [])

  // Guest QR/RSVP dock shows only after the invitation opens, for identified
  // guests, and hides while the wishes feed is open.
  const showGuestDock = opened && !wishOpen && !!props.guest_id && !!props.wedding_profile_id
  const coupleName =
    (props.groom_full_name && props.bride_full_name
      ? `${props.groom_full_name} & ${props.bride_full_name}`
      : props.display_name) || `${props.groom_name || ""} & ${props.bride_name || ""}`

  return (
    <Skin display="Cormorant Garamond" body="Montserrat" script="Alex Brush">
      <div className="sp-shell w-full bg-[#2A1F18] flex justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-[#2A1F18] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {!opened ? (
            <ImpastoCover
              groom_name={props.groom_name}
              bride_name={props.bride_name}
              guest_name={props.guest_name}
              estimated_wedding_date={props.estimated_wedding_date}
              onOpen={openInvitation}
            />
          ) : (
            <ImpastoPages profile={props} onWishOpenChange={onWishOpenChange} />
          )}

          {opened && (
            <LiveWishes
              open={wishOpen}
              onOpenChange={onWishOpenChange}
              weddingProfileId={props.wedding_profile_id}
              guestId={props.guest_id}
              guestName={props.guest_name}
            />
          )}
        </div>

        {showGuestDock && (
          <InvitationOverlay
            guestId={props.guest_id!}
            guestName={props.guest_name || "Tamu Undangan"}
            coupleName={coupleName}
            weddingProfileId={props.wedding_profile_id!}
            guestQrUrl={props.guest_qr_url}
            guestTableNumber={props.guest_table_number}
            guestRsvpStatus={props.guest_rsvp_status}
            guestRsvpMessage={props.guest_rsvp_message || undefined}
            rsvpMaxPax={props.rsvp_max_pax ?? 2}
            qrEnabled={props.feature_gates?.qr_code_book === true}
            anchor="bottom"
          />
        )}

        {opened && !wishOpen && (
          <button
            type="button"
            onClick={toggleMusic}
            aria-label="Putar atau jeda musik"
            title="Putar atau jeda musik"
            className="fixed right-4 z-[95] w-11 h-11 rounded-full bg-white text-[#111827] shadow-lg border border-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            style={{ bottom: 144, right: 16 }}
          >
            <span className={`material-symbols-outlined text-[22px] ${playing ? "" : "opacity-70"}`}>
              {playing ? "graphic_eq" : "music_off"}
            </span>
          </button>
        )}

        {hasTrack && <audio ref={audioRef} src={props.track_url} loop playsInline preload="auto" />}
      </div>
    </Skin>
  )
}
