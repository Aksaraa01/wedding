const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/media/seeded`

function s(path: string): string {
  return `${STORAGE_BASE}/${path}`
}

export const ASSETS = {
  hero: {
    mockup: s("hero/hero-mockup.png"),
  },
  heritageJawa: {
    parchment: s("heritage-jawa/parchment.jpg"),
    heroBg: s("heritage-jawa/hero-bg.jpg"),
    groomFrame: s("heritage-jawa/groom-frame.jpg"),
    brideFrame: s("heritage-jawa/bride-frame.jpg"),
    eventsTexture: s("heritage-jawa/events-texture.jpg"),
    storyBg: s("heritage-jawa/story-bg.jpg"),
    giftBg: s("heritage-jawa/gift-bg.jpg"),
    closingBg: s("heritage-jawa/closing-bg.jpg"),
  },
  defaultGallery: [
    s("heritage-jawa/gallery-1.jpg"),
    s("heritage-jawa/gallery-2.jpg"),
    s("heritage-jawa/gallery-3.jpg"),
    s("heritage-jawa/gallery-4.jpg"),
    s("heritage-jawa/gallery-5.jpg"),
    s("heritage-jawa/gallery-6.jpg"),
  ],
  defaultStory: [
    s("heritage-jawa/gallery-5.jpg"),
    s("heritage-jawa/gallery-5.jpg"),
    s("heritage-jawa/gallery-3.jpg"),
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
  guestGallery: {
    heroSide1: s("guest-gallery/hero-side-1.jpg"),
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
  textures: {
    naturalPaper: "https://www.transparenttextures.com/patterns/natural-paper.png",
    felt: "https://www.transparenttextures.com/patterns/felt.png",
  },
}
