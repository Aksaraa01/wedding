"use client"

import { useEffect, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { countdownTarget, type GiftAccountData } from "../shared/lib"
import ImpastoAtmosphere, { IM_ATMOSPHERE_CSS } from "./Atmosphere"
import MainPage from "./pages/MainPage"
import PersonPage from "./pages/PersonPage"
import GalleryPage from "./pages/GalleryPage"
import StoryPage from "./pages/StoryPage"
import EventPage from "./pages/EventPage"
import CountdownPage from "./pages/CountdownPage"
import CombinedPage from "./pages/CombinedPage"
import ClosingPage from "./pages/ClosingPage"

export type ImpastoPageKey =
  | "main" | "groom" | "bride" | "gallery" | "story"
  | "events" | "countdown" | "combined" | "closing"

type Props = {
  profile: TemplateProps
  onWishOpenChange: (open: boolean) => void
}

// Scroll-snap page stack over ONE fixed background. Each page is at least one
// device screen (snap-start); the bg never moves while content cross-fades.
// Each page carries its own atmosphere mix (doves / birds / petals / motes)
// mirroring the reference designs.

// Per-page atmosphere mix matching ~/Downloads/design reference files.
const ATMO: Record<ImpastoPageKey, { doves: number; petals: boolean; motes: boolean }> = {
  main: { doves: 4, petals: true, motes: true },
  groom: { doves: 5, petals: false, motes: false },
  bride: { doves: 6, petals: false, motes: false },
  gallery: { doves: 3, petals: false, motes: false },
  story: { doves: 3, petals: false, motes: true },
  events: { doves: 4, petals: false, motes: false },
  countdown: { doves: 4, petals: false, motes: false },
  combined: { doves: 4, petals: false, motes: true },
  closing: { doves: 4, petals: false, motes: false },
}
import { normalizeLanguage } from "@/lib/i18n"
export default function ImpastoPages({ profile, onWishOpenChange }: Props) {
  const lang = normalizeLanguage(profile.language)
  const stories = Array.isArray(profile.stories) ? profile.stories : []
  const families = Array.isArray(profile.inviting_families) ? profile.inviting_families.filter(Boolean) : []
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  const galleryPhotos = (Array.isArray(profile.gallery_photos) ? profile.gallery_photos : []).filter(Boolean)
  const accounts: GiftAccountData[] = Array.isArray(profile.gift_accounts) ? profile.gift_accounts : []
  const gates = profile.feature_gates || {}

  const storyOn = gates.story !== false && profile.story_visible !== false && stories.length > 0
  const eventOn = (s: unknown) => !!s && typeof s === "object" && (((s as any).date as string) || ((s as any).venue as string))
  const giftOn =
    profile.gift_section_visible !== false &&
    (accounts.length > 0 || (gates.gift_address !== false && !!profile.gift_address))
  const invitingOn = gates.inviting_families !== false && profile.inviting_families_visible !== false && families.length > 0
  const videoOn = gates.video !== false && profile.video_section_visible !== false && !!profile.video_url
  const countdownOn = !!countdownTarget(sessions as any, profile.estimated_wedding_date)
  const galleryOn = galleryPhotos.length > 0
  const combinedOn = giftOn || invitingOn || videoOn

  const pages: ImpastoPageKey[] = ([
    "main", "groom", "bride", "gallery", "story", "events", "countdown", "combined", "closing",
  ] as ImpastoPageKey[]).filter((k) => {
    if (k === "main" || k === "groom" || k === "bride" || k === "closing") return true
    if (k === "gallery") return galleryOn
    if (k === "story") return storyOn
    if (k === "events") return eventOn(sessions[0]) || eventOn(sessions[1])
    if (k === "countdown") return countdownOn
    return combinedOn
  })

  // Per-page visibility ratio (0..1) driven by the scroll position. Page
  // content fades + drifts out as it scrolls away up or down — no timers.
  const [vis, setVis] = useState<Record<number, number>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => {
        setVis((prev) => {
          const next = { ...prev }
          let changed = false
          for (const e of entries) {
            const idx = Number((e.target as HTMLElement).dataset.idx)
            const targetH = (e.target as HTMLElement).offsetHeight || e.boundingClientRect.height || 1
            const viewH = e.rootBounds?.height || root.clientHeight || 1
            const v = Math.max(0, Math.min(1, e.intersectionRect.height / (Math.min(targetH, viewH) || 1)))
            if (Math.abs((next[idx] ?? 1) - v) > 0.01) {
              next[idx] = Math.round(v * 100) / 100
              changed = true
            }
          }
          return changed ? next : prev
        })
      },
      { root, threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    )
    pageRefs.current.forEach((el) => {
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [pages.length])

  const renderPage = (key: ImpastoPageKey) => {
    switch (key) {
      case "main":
        return <MainPage profile={profile} />
      case "groom":
        return <PersonPage profile={profile} side="groom" language={profile.language} />
      case "bride":
        return <PersonPage profile={profile} side="bride" language={profile.language} />
      case "gallery":
        return <GalleryPage photos={galleryPhotos} />
      case "story":
        return <StoryPage stories={stories} />
      case "events":
        return <EventPage sessions={sessions as any} lang={lang} />
      case "countdown":
        return <CountdownPage profile={profile} sessions={sessions as any} />
      case "combined":
        return <CombinedPage profile={profile} accounts={accounts} families={families} videoOn={videoOn} giftOn={giftOn} invitingOn={invitingOn} language={profile.language} />
      case "closing":
        return <ClosingPage profile={profile} onWishOpenChange={onWishOpenChange} />
    }
  }

  // Most-visible page drives the backdrop: landing on date & venue zooms
  // the painting into its middle-top as fullscreen.
  let landedIdx = 0
  let landedVis = -1
  pages.forEach((_, i) => {
    const v = vis[i] ?? 1
    if (v > landedVis) {
      landedVis = v
      landedIdx = i
    }
  })
  // Most-visible page drives the backdrop: date & venue zooms middle-top,
  // groom bottom-left, bride bottom-right, countdown center — smooth refocus.
  const BG_ZOOM: Record<string, { s: number; o: string }> = {
    events: { s: 1.5, o: "50% 18%" },
    groom: { s: 1.35, o: "0% 100%" },
    bride: { s: 1.35, o: "100% 100%" },
    countdown: { s: 1.3, o: "50% 55%" },
  }
  const landedKey = pages[landedIdx]
  const zoom = landedVis > 0.5 && BG_ZOOM[landedKey] ? BG_ZOOM[landedKey] : { s: 1, o: "50% 50%" }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{IM_ATMOSPHERE_CSS}</style>
      {/* Fixed background layer — never moves while pages scroll over it */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.impastoMosque.bg}
          alt=""
          draggable={false}
          className="w-full h-full object-cover object-center"
          style={{
            transform: `scale(${zoom.s})`,
            transformOrigin: zoom.o,
            transition: "transform 1.6s cubic-bezier(0.4, 0, 0.2, 1), transform-origin 1.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Scrollable content layer (snap = page change) */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto snap-y snap-mandatory custom-scrollbar">
        {pages.map((key, i) => {
          const o = vis[i] ?? 1
          return (
            <section
              key={key}
              data-idx={i}
              ref={(el) => {
                pageRefs.current[i] = el
              }}
              className="relative min-h-full snap-start snap-always flex flex-col"
            >
              <ImpastoAtmosphere {...ATMO[key]} />
              <div
                className="flex-1 flex flex-col min-h-0"
                style={{ opacity: o, transform: `translateY(${(1 - o) * 24}px)`, transition: "opacity 0.12s linear" }}
              >
                {renderPage(key)}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
