// Vendored artwork from the Fresco reference invitation
// (https://fresco-template.thedigitalyes.com). Every ornament in this template
// is one of these files — the painted envelope and its opening film, the
// Mediterranean hero loop, the blue-and-white countdown frame, the olive
// cenefas, the villa/fountain paintings, the day icons, the dress-code group,
// the welcome arch, the gift wreath, the RSVP window and the closing arch.
// Nothing is hotlinked; nothing is redrawn in CSS.
const BASE = "/templates/fresco"

export const FRESCO_ASSETS = {
  // Cover gate (envelope) + hero loop behind the names
  envelopePoster: `${BASE}/envelope-poster.webp`,
  envelopeVideo: `${BASE}/envelope-video.mp4`,
  heroVideo: `${BASE}/hero-video.mp4`,
  heroPoster: `${BASE}/hero-poster.webp`,
  sprig: `${BASE}/sprig.webp`,

  // Countdown
  countdownFrame: `${BASE}/countdown-frame.webp`,

  // Our story
  clouds: `${BASE}/clouds.webp`,
  fountain: `${BASE}/fountain.webp`,
  villa: `${BASE}/villa.webp`,

  // Celebration band + day programme. The band's olive paper is tiled from a
  // plain patch (`olive-paper.webp`) and every event card carries the
  // reference's ornamented frame (`event-frame.webp`, cropped from its
  // full-band plate) so a couple with three events still gets three frames.
  olivePaper: `${BASE}/olive-paper.webp`,
  eventFrame: `${BASE}/event-frame.webp`,
  bandBase: `${BASE}/band-base.webp`,
  bandLeaves: [
    `${BASE}/band-1.webp`,
    `${BASE}/band-2.webp`,
    `${BASE}/band-3.webp`,
    `${BASE}/band-4.webp`,
    `${BASE}/band-5.webp`,
  ],
  dayIcons: [
    `${BASE}/icon-cana.webp`,
    `${BASE}/icon-arch.webp`,
    `${BASE}/icon-cocktail.webp`,
    `${BASE}/icon-dinner.webp`,
    `${BASE}/icon-cake.webp`,
    `${BASE}/icon-ballroom.webp`,
    `${BASE}/icon-dance.webp`,
    `${BASE}/icon-moon.webp`,
  ],

  // Dress code
  dressGroup: `${BASE}/dresscode-group.webp`,

  // Welcome arch (inviting section)
  archMask: `${BASE}/arch-mask.webp`,
  oliveTexture: `${BASE}/olive-texture.webp`,
  archFrame: `${BASE}/arch-frame.webp`,
  archGarland: `${BASE}/arch-garland.webp`,
  archBottom: `${BASE}/arch-bottom.webp`,
  petals: [`${BASE}/petal-1.webp`, `${BASE}/petal-2.webp`, `${BASE}/petal-3.webp`],

  // Flowers
  almondFlower: `${BASE}/almond-flower.webp`,
  whiteFlower: `${BASE}/white-flower.webp`,

  // The reference's own score, re-encoded to 128 kbps for the demo
  music: `${BASE}/music.mp3`,

  // Gift + wishes + closing
  giftWreath: `${BASE}/gift-wreath.webp`,
  wishesWindow: `${BASE}/wishes-window.webp`,
  closingArch: `${BASE}/closing-arch.webp`,
} as const
