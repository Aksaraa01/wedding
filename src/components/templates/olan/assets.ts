// Vendored art for the Olan template (Katsudoto "exclusive Olan" reference).
// Every file lives in public/templates/olan/ and is served from the VPS
// origin; nothing is hotlinked from the reference host. Filenames are resolved
// to whatever the optimiser picked (webp or png), so keep them in sync with the
// folder — assets.ts throws at import time if one disappears.
export const OLAN = {
  paper: "/templates/olan/overlay.webp",
  painting: "/templates/olan/bg-cover.jpg",
  countdownPainting: "/templates/olan/bg-savedate.jpg",
  coupleMask: "/templates/olan/mask-frame-couple.png",
  portraitFrame: "/templates/olan/frame-couple.webp",
  music: "/templates/olan/music.webp",

  // cover
  branch: "/templates/olan/ranting-pohon.png",
  cloudWide: "/templates/olan/awan-1-min.png",
  cloudSmall: "/templates/olan/awan-2.png",

  // bottom flower cluster (ordered 1..7 as the reference layers them)
  // index = the `.orn-cover-bottom-event-N` class it belongs to (the reference
  // numbers its ornament layers out of DOM order, so the slot order matters)
  flowers: [
    "/templates/olan/bunga-cover-1.png", // 1
    "/templates/olan/bunga-cover-kiri.png", // 2
    "/templates/olan/bunga-cover-2.png", // 3
    "/templates/olan/bunga-cover-tengah.webp", // 4
    "/templates/olan/bunga-cover-3.png", // 5
    "/templates/olan/bunga-cover-kanan.webp", // 6
    "/templates/olan/bunga-cover-4.png", // 7
  ],

  // couple portraits
  wreaths: [
    "/templates/olan/frame-mempelai-01-min.png",
    "/templates/olan/frame-mempelai-02-min.png",
    "/templates/olan/frame-mempelai-03-min.png",
    "/templates/olan/frame-mempelai-04-min.png",
  ],

  // countdown scene
  countdown: {
    floor: "/templates/olan/lantai.webp",
    bridge: "/templates/olan/jembatan.webp",
    stairs: "/templates/olan/tangga-savedate.png",
    tileTop: "/templates/olan/ubin.webp",
    pillar: "/templates/olan/pilar.webp",
    urnFlowers: "/templates/olan/bunga-ubin.png",
    urn: "/templates/olan/vas.png",
  },

  // section ornaments
  galleryRight: "/templates/olan/orn-galeri-kanan.png",
  galleryLeft: "/templates/olan/orn-galeri-kiri.png",
  storyLeft: "/templates/olan/orn-story-kiri.png",
  storyRight: "/templates/olan/orn-story-kanan.png",
  giftRight: "/templates/olan/orn-gift-kanan.png",

  // event card ornaments (arch frame + per-card ornaments, layered 1..6)
  eventFrame: "/templates/olan/frame-agenda.png",
  // index = the `.orn-event-frame-N` class (same out-of-order numbering)
  eventOrnaments: [
    "/templates/olan/orn-acara-01.png", // 1
    "/templates/olan/orn-acara-02.png", // 2
    "/templates/olan/orn-acara-03.png", // 3
    "/templates/olan/bunga-orange-agenda.webp", // 4
    "/templates/olan/orn-acara-04.png", // 5
    "/templates/olan/merak.webp", // 6
  ],

  // local copy of the brand badge (ASSETS.* is storage-relative and 404s in dev)
  aksaraaLogo: "/templates/olan/aksaraa-logo.jpg",
} as const
