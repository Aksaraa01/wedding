// Vendored art for Swan Garden. Every path is local: the reference's own PNGs
// were re-encoded to WebP and live in public/templates/swan-garden/.
const base = "/templates/swan-garden"

export const SG = {
  frameCover: `${base}/frame-cover.webp`,
  frameCouple: `${base}/frame-couple.webp`,
  frameQuote: `${base}/frame-quote.webp`,
  frameEvent: `${base}/frame-event.webp`,
  frameStory: `${base}/frame-ls.webp`,
  dressMan: `${base}/ic-dress-man-elegant.webp`,
  dressWoman: `${base}/ic-dress-woman-elegant.webp`,
  ornLiveHeader: `${base}/orn-ls.webp`,
  thumbnail: `${base}/thumbnail.webp`,
} as const
