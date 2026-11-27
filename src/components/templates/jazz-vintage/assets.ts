// Decorative art shipped with the Jazz Vintage template. Every file lives in
// public/templates/jazz-vintage/ (see docs/REA_JAZZ_VINTAGE.md §3): the
// reference's ornaments were vendored and re-encoded to WebP, no photograph of
// the reference couple and no reference audio is shipped. Photos always come
// from the couple's profile.
const A = (name: string) => `/templates/jazz-vintage/${name}`

export const JV = {
  paper: A("paper-texture.webp"),
  coverCurtain: A("cover-curtain.webp"),
  coverChandelier: A("cover-chandelier.webp"),
  coverTable: A("cover-table.webp"),
  garland: A("garland-band.webp"),
  sheetMusic: A("sheet-music.webp"),
  frameOval: A("frame-oval.webp"),
  gramophone: A("gramophone.webp"),
  jewelBox: A("welcome-jewel-box.webp"),
  cardCream: A("card-cream.webp"),
  cameo: A("cameo-bow.webp"),
  tulleBow: A("tulle-bow.webp"),
  calendarTulle: A("calendar-tulle.webp"),
  pocketWatch: A("pocket-watch.webp"),
  door: A("door.webp"),
  orchid: A("orchid.webp"),
  velvetTag: A("velvet-tag.webp"),
  lace: A("lace-band.webp"),
  frameCream: A("frame-cream.webp"),
  velvetBow: A("velvet-bow.webp"),
  bouquet: A("bouquet.webp"),
  giftEnvelope: A("gift-envelope.webp"),
  clockFace: A("clock-face.webp"),
} as const

// One vintage vignette per rundown row. The list cycles, so a five-row day and
// a nine-row day both stay illustrated without running out of art.
export const JV_RUNDOWN_ART = [
  A("rundown-hourglass.webp"),
  A("rundown-ringbox.webp"),
  A("rundown-champagne.webp"),
  A("rundown-fan.webp"),
] as const

export function rundownArt(index: number): string {
  return JV_RUNDOWN_ART[index % JV_RUNDOWN_ART.length]
}
