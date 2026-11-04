// Vendored artwork from the Teatro reference template
// (https://template-teatro.thedigitalyes.com). Every ornament in this template
// is one of these files — nothing is redrawn in CSS or inline SVG — so the
// curtain pull, the scratch foil, the venue/dress-code/gift line art and the
// programme frame stay pixel-identical to the design they came from.
const BASE = "/templates/teatro"

export const TEATRO_ASSETS = {
  curtainClosed: `${BASE}/curtain-closed.jpg`,
  curtainOpen: `${BASE}/curtain-open.jpg`,
  curtainVideo: `${BASE}/curtain-video.mp4`,
  scratchGold: `${BASE}/scratch-gold.jpg`,
  venue: `${BASE}/venue-illustration.png`,
  dressCode: `${BASE}/dresscode-illustration.png`,
  gift: `${BASE}/gift-icon.png`,
  menuFrame: `${BASE}/menu-frame.png`,
  divider: `${BASE}/flowers-divider.gif`,
} as const
