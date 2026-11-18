// Vendored artwork from the Viding "Vidi & Hening" reference invitation
// (studio.viding.co/theme/preview/175, theme 13735). Every ornament in this
// template is one of these files: the painted garden cover, the carved frames
// with their transparent windows, the lace bands, the pond plate behind the
// countdown, the fan, the swans and the flower sprays. Nothing is hotlinked;
// nothing is redrawn in CSS.
//
// The reference's decorations are 50-frame GIFs (~2 MB each). We ship their
// first frame as WebP (~15 KB) and reproduce the sway with one CSS keyframe on
// `rotate` — the motion is the same, the payload is not.
const BASE = "/templates/emerald-heirloom"

export const EH_ASSETS = {
  // Cover gate + the fixed desktop art panel. `coverFrame` is the same plate
  // with the carved opening cut out (alpha), so the couple's photo can sit
  // inside the frame exactly like the mempelai portraits do.
  cover: `${BASE}/cover.webp`,
  coverFrame: `${BASE}/cover-frame.webp`,

  // Welcome arch: painting behind, carved frame with a 73% x 54.9% window on top
  welcomeScene: `${BASE}/welcome-scene.webp`,
  welcomeFrame: `${BASE}/welcome-frame.webp`,
  // The same garden, cropped for the opening card's dimmed backdrop
  welcomeSceneAlt: `${BASE}/welcome-scene-alt.webp`,

  // Mempelai portraits: frame window at 12.4% / 12.9% / 73% x 61%
  portraitFrame: `${BASE}/portrait-frame.webp`,

  // Countdown: pond plate (lace side columns + green bands) and the fan
  countdownScene: `${BASE}/countdown-scene.webp`,
  fan: `${BASE}/fan.webp`,

  // Paper + lace
  paper: `${BASE}/paper.webp`,
  laceBand: `${BASE}/lace-band.webp`,
  laceThin: `${BASE}/lace-thin.webp`,
  // The tall painted forest mural behind the gift / wishes run
  edgeFlorals: `${BASE}/edge-florals.webp`,
  shadowSoft: `${BASE}/shadow-soft.webp`,

  // Paintings + event plates (the wave tops sit over the paper)
  gardenScene: `${BASE}/garden-scene.webp`,
  eventWave: `${BASE}/event-wave.webp`,
  eventWave2: `${BASE}/event-wave-2.webp`,

  // Envelope (turut mengundang), heart (wishes), cards, film window
  envelope: `${BASE}/envelope.webp`,
  heart: `${BASE}/heart.webp`,
  cardSage: `${BASE}/card-sage.webp`,
  cardBeige: `${BASE}/card-beige.webp`,
  videoFrame: `${BASE}/video-frame.webp`,

  // Loose ornaments. Each ships as a 17-frame animated WebP (the reference's
  // 50-frame GIF, decimated) plus a still used when the visitor asks for
  // reduced motion — `<picture media>` swaps it without any JS.
  flowerTrumpet: `${BASE}/flower-trumpet.webp`,
  flowerTrumpetStill: `${BASE}/flower-trumpet-still.webp`,
  lilies: `${BASE}/lilies.webp`,
  liliesStill: `${BASE}/lilies-still.webp`,
  swan: `${BASE}/swan.webp`,
  swanStill: `${BASE}/swan-still.webp`,
  lilySpray: `${BASE}/lily-spray.webp`,
  lilySprayStill: `${BASE}/lily-spray-still.webp`,
  lilySprayB: `${BASE}/lily-spray-b.webp`,
  lilySprayBStill: `${BASE}/lily-spray-b-still.webp`,
  fanStill: `${BASE}/fan-still.webp`,

  // The reference pairs every ornament with a darkened silhouette GIF to fake a
  // drop shadow. We keep them as a single static frame under the animated art.
  shadowLilies: `${BASE}/shadow-lilies.webp`,
  shadowTrumpet: `${BASE}/shadow-trumpet.webp`,
  shadowSwan: `${BASE}/shadow-swan.webp`,
  shadowFan: `${BASE}/shadow-fan.webp`,
} as const
