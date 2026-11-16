import { toTransformedUrl } from "@/lib/storageUrl"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/media/seeded`
// Env-relative so staging/dev traffic bills its own project, never prod.
// Falls back to the prod literal only when the env is unset (single literal
// is safe: the file is public and shared across environments).
const PROD_FALLBACK = "https://ylmfgorryxzpdckkebnr.supabase.co"

function trackUrl(name: string): string {
  const base = SUPABASE_URL || PROD_FALLBACK
  return `${base}/storage/v1/object/public/media/tracks/${name}`
}

function s(path: string): string {
  return `${STORAGE_BASE}/${path}`
}

export const ASSETS = {
  // Default background track for in-house templates ("An Everlasting Love" —
  // tracked in web_tracks; the audio file lives in the media bucket and is
  // public, so a single fallback literal is safe across environments).
  defaultMusic: trackUrl("An_Everlasting_Love.mp3"),
  // Ceriavite: qasidah khitanan used as the demo/latency fallback for kids
  // templates. Served from /defaults so the cdn host caches it.
  kidsMusic: "/defaults/khitanan.mp3",
  hero: {
    mockup: s("hero/hero-portrait.jpg"),
  },
  defaultGallery: [
    s("demo/gallery-1.jpg"),
    s("demo/gallery-2.jpg"),
    s("demo/gallery-3.jpg"),
    s("demo/gallery-1.jpg"),
    s("demo/gallery-2.jpg"),
    s("demo/gallery-3.jpg"),
  ],
  defaultStory: [
    s("demo/gallery-1.jpg"),
    s("demo/gallery-2.jpg"),
    s("demo/gallery-3.jpg"),
  ],
  features: {
    img1: s("features/invitation-showcase.jpg"),
    img2: s("features/stationery-texture.jpg"),
  },
  solution: {
    bg: s("solution/silk-texture.jpg"),
  },
  timeline: {
    img1: s("timeline/web-invitation.jpg"),
    img2: s("timeline/rsvp-management.jpg"),
    img3: s("timeline/qr-checkin.jpg"),
  },
  register: {
    bg: s("register/portrait-bg.jpg"),
  },
  qrGuestbook: {
    bg: s("qr-guestbook/texture-bg.jpg"),
  },
  defaults: {
    couple: "/defaults/couple.png",
    groom: "/defaults/groom.png",
    bride: "/defaults/bride.png",
  },
  demo: {
    groomPhoto: s("demo/groom.jpg"),
    bridePhoto: s("demo/bride.jpg"),
    story1: s("demo/story-1.jpg"),
    story2: s("demo/story-2.jpg"),
    gallery: [
      s("demo/gallery-1.jpg"),
      s("demo/gallery-2.jpg"),
      s("demo/gallery-3.jpg"),
    ],
  },
  demoAudio: s("demo/audio.mp3"),
  webTemplates: [
    s("templates/parallax-sinematik.jpg"),
    s("templates/editorial-modern.jpg"),
    s("templates/animasi-watercolor.jpg"),
    s("templates/heritage-dinamis.jpg"),
  ],
  webTracks: [
    s("tracks/white-moment.mp3"),
    s("tracks/perfect.mp3"),
    s("tracks/women-in-white.mp3"),
  ],
  galeriEnvelope: {
    flowerTopLeft: s("galeri/flower-tl.png"),
    flowerBottomRight: s("galeri/flower-br.png"),
    botanicalTopLeft: s("galeri/botanical-tl.png"),
    botanicalBottomRight: s("galeri/botanical-br.png"),
    previewFloralTopRight: s("galeri/preview-floral-tr.png"),
    previewFloralBottomLeft: s("galeri/preview-floral-bl.png"),
    galleryBannerTopRight: s("galeri/gallery-banner-tr.png"),
    galleryBannerBottomLeft: s("galeri/gallery-banner-bl.png"),
    aksaraaLogo: s("galeri/aksaraa-logo.jpg"),
    aksaraaMonogram: s("galeri/aksaraa-monogram.jpg"),
  },
  guestGallery: {    heroSide1: s("guest-gallery/hero-side-1.jpg"),
    heroSide2: s("guest-gallery/hero-side-2.jpg"),
    heroSide3: s("guest-gallery/hero-side-3.jpg"),
    heroSide4: s("guest-gallery/hero-side-4.jpg"),
    card1: s("guest-gallery/card-1.jpg"),
    card2: s("guest-gallery/card-2.jpg"),
    card3: s("guest-gallery/card-3.jpg"),
    card4: s("guest-gallery/card-4.jpg"),
  },
  wishWall: {
    venueProjection: s("wish-wall/venue-projection.jpg"),
    dashboardInterface: s("wish-wall/dashboard-interface.jpg"),
  },
  qrDigital: {
    hero: s("qr-digital/hero-reception.jpg"),
    tablet: s("qr-digital/tablet-dashboard.jpg"),
  },
  premiumWeb: {
    hero: s("premium-web/hero-mockup.jpg"),
    tablet: s("premium-web/tablet-mockup.jpg"),
    maps: s("premium-web/maps-location.jpg"),
    story1: s("premium-web/story-couple-walking.jpg"),
    story2: s("premium-web/story-hands-ring.jpg"),
    story3: s("premium-web/story-coastal-villa.jpg"),
    story4: s("premium-web/story-couple-gallery.jpg"),
    cinematic: s("premium-web/cinematic-video-bg.jpg"),
    dashboard: s("premium-web/dashboard-screenshot.jpg"),
  },
  reminderVip: {
    chat: s("reminder-vip/whatsapp-chat.jpg"),
    dashboard: s("reminder-vip/dispatch-dashboard.jpg"),
  },
  skylinePenthouse: {
    coverBg: s("skyline-penthouse/cover-bg.jpg"),
    room: s("skyline-penthouse/room-bg.jpg"),
  },
  pixelParadise: {
    coverBg: s("pixel-paradise/cover-bg.jpg"),
    room: s("pixel-paradise/room-bg.jpg"),
  },
  pixelQuest: {
    coverBg: s("pixel-quest/cover-bg.jpg"),
    frame1: s("pixel-quest/frame1.jpg"),
    frame2: s("pixel-quest/frame2.jpg"),
    frame3: s("pixel-quest/frame3.jpg"),
    frameGallery: s("pixel-quest/frame-gallery.jpg"),
    frame4: s("pixel-quest/frame4.jpg"),
  },
  impastoMosque: {
    coverBg: s("impasto-mosque/cover-bg.jpg"),
    bg: s("impasto-mosque/bg.jpg"),
    brush: toTransformedUrl(s("impasto-mosque/brush.jpg"), { width: 1200 }),
    coupleCover: s("impasto-mosque/couple-cover.png"),
  },
  pastelDreamCathedral: {
    coverBg: "/images/church.webp",
    bg: "/images/church.webp",
    brush: toTransformedUrl(s("impasto-mosque/brush.jpg"), { width: 1200 }),
  },
  pastelCoastal: {
    bg: s("pastel-coastal-cut/bg.jpg"),
    cloud: s("pastel-coastal-cut/cloud.png"),
    shell: s("pastel-coastal-cut/shell.png"),
  },
  textures: {
    naturalPaper: "https://www.transparenttextures.com/patterns/natural-paper.png",
    felt: "https://www.transparenttextures.com/patterns/felt.png",
  },
}
