// Client-safe Galeri Tamu frame art (no server imports — the capture
// pages run this in the browser). Each frame is a full photobooth CARD
// baked into the uploaded JPG: zero storage blobs, zero per-view render
// cost, aspect-adaptive across 4:3 captures and 3:4 selfies, dynamic
// couple / date text. The dashboard picker thumbnails are static art.
//
// Two card families share one compositing pipeline:
//  - legacy frames (frame-1..5): maroon/sage/navy/plum/emerald stages with
//    corner florals, header (logo/couple/date), photo box + brackets, and a
//    script caption band.
//  - art frames (frame-polaroid/ivory/editorial): structural layouts that
//    mirror the couple-provided mocks. They carry couple + date only — the
//    guest caption stays off the frame (it lives in the gallery/book).

import { ASSETS } from "@/lib/assets"

export type GaleriFrameId =
  | "frame-polaroid"
  | "frame-ivory"
  | "frame-editorial"
  | "frame-1"
  | "frame-2"
  | "frame-3"
  | "frame-4"
  | "frame-5"

export type LegacyFrameId = "frame-1" | "frame-2" | "frame-3" | "frame-4" | "frame-5"

export const LEGACY_FRAME_IDS: readonly LegacyFrameId[] = ["frame-1", "frame-2", "frame-3", "frame-4", "frame-5"]

// Picker order: the art frames (newest) lead the list.
export const GALERI_FRAME_IDS: readonly GaleriFrameId[] = [
  "frame-polaroid",
  "frame-ivory",
  "frame-editorial",
  ...LEGACY_FRAME_IDS,
]

// "none" = upload the raw capture with zero decor (and zero re-encode loss).
export type FrameSelection = GaleriFrameId | "none"

function isFrameId(v: unknown): v is GaleriFrameId {
  return typeof v === "string" && (GALERI_FRAME_IDS as readonly string[]).includes(v)
}

export function normalizeFrameSelection(v: unknown): FrameSelection {
  if (v === "none") return "none"
  // Unset/unknown defaults to NO frame (explicit opt-in per frame).
  return isFrameId(v) ? v : "none"
}

export const DEFAULT_FRAME: GaleriFrameId = "frame-1"

export function normalizeFrameId(v: unknown): GaleriFrameId {
  return isFrameId(v) ? v : DEFAULT_FRAME
}

export const GALERI_FRAME_NAMES: Record<GaleriFrameId, string> = {
  "frame-polaroid": "Polaroid Minimalis",
  "frame-ivory": "Ivory Floral",
  "frame-editorial": "Editorial Majalah",
  "frame-1": "Maroon Klasik",
  "frame-2": "Sage",
  "frame-3": "Navy Night",
  "frame-4": "Burgundy Glow",
  "frame-5": "Emerald Gold",
}

// Static picker thumbnails (couple-provided art, card cropped + padded 4:5).
export const GALERI_FRAME_THUMBS: Record<GaleriFrameId, string> = {
  "frame-polaroid": "/frames/frame-polaroid.png",
  "frame-ivory": "/frames/frame-ivory-floral.png",
  "frame-editorial": "/frames/frame-editorial.png",
  "frame-1": "/frames/frame-1.png",
  "frame-2": "/frames/frame-2.png",
  "frame-3": "/frames/frame-3.png",
  "frame-4": "/frames/frame-4.png",
  "frame-5": "/frames/frame-5.png",
}

// Same-origin floral art for the ivory card (the mock's pink dahlia cluster).
const IVORY_FLORAL = "/frames/ivory-dahlia.png"

export type StageFlorals = { tl: string | null; tr: string | null; bl: string | null; br: string | null }

// DOM chrome (live preview, envelope gate) must show the SAME corners the
// canvas bake draws — read them from one table, never hardcode per frame.
const FRAME_FLORALS: Record<GaleriFrameId, StageFlorals> = {
  // Art frames keep the page chrome clean: only the ivory card carries art.
  "frame-polaroid": { tl: null, tr: null, bl: null, br: null },
  "frame-ivory": { tl: null, tr: null, bl: null, br: IVORY_FLORAL },
  "frame-editorial": { tl: null, tr: null, bl: null, br: null },
  "frame-1": {
    tl: null,
    tr: ASSETS.galeriEnvelope.previewFloralTopRight,
    bl: ASSETS.galeriEnvelope.previewFloralBottomLeft,
    br: null,
  },
  "frame-2": {
    tl: ASSETS.galeriEnvelope.botanicalTopLeft,
    tr: null,
    bl: null,
    br: ASSETS.galeriEnvelope.flowerBottomRight,
  },
  "frame-3": {
    tl: null,
    tr: ASSETS.galeriEnvelope.previewFloralTopRight,
    bl: ASSETS.galeriEnvelope.flowerBottomRight,
    br: null,
  },
  "frame-4": { tl: null, tr: null, bl: null, br: ASSETS.galeriEnvelope.flowerBottomRight },
  "frame-5": {
    tl: ASSETS.galeriEnvelope.botanicalTopLeft,
    tr: null,
    bl: null,
    br: ASSETS.galeriEnvelope.flowerBottomRight,
  },
}

// "none"/unknown falls back to frame-1 so unframed chrome keeps its look.
export function frameStageFlorals(frame: unknown): StageFlorals {
  const sel = normalizeFrameSelection(frame)
  return FRAME_FLORALS[sel === "none" ? DEFAULT_FRAME : sel]
}

type Palette = {
  stage: string
  radial: [string, string, string] | null
  band: string
  line: string
  lineSoft: string
  dateColor: string
  goldDivider: boolean
  glow: string
  floralTR: string | null
  floralTL: string | null
  floralBR: string | null
  floralBL: string | null
}

// Stage treatments mirror the HTML mocks exactly: f1/f2 flat solid,
// f3 navy / f4 plum / f5 emerald radial gradients. Corner florals:
// f1 TR+BL, f2 TL+BR, f3 TR+BL, f4 BR only, f5 TL+BR. The photo box
// itself stays clean — photo, vignette, corner brackets, center marker.
const PALETTES: Record<LegacyFrameId, Palette> = {
  "frame-1": {
    stage: "107,43,45",
    radial: null,
    band: "107,43,45",
    line: "251,249,244",
    lineSoft: "251,249,244",
    dateColor: "251,249,244",
    goldDivider: false,
    glow: "150,70,70",
    floralTR: ASSETS.galeriEnvelope.previewFloralTopRight,
    floralTL: null,
    floralBR: null,
    floralBL: ASSETS.galeriEnvelope.previewFloralBottomLeft,
  },
  "frame-2": {
    stage: "86,101,81",
    radial: null,
    band: "86,101,81",
    line: "251,249,244",
    lineSoft: "251,249,244",
    dateColor: "251,249,244",
    goldDivider: false,
    glow: "120,135,110",
    floralTR: null,
    floralTL: ASSETS.galeriEnvelope.botanicalTopLeft,
    floralBR: ASSETS.galeriEnvelope.flowerBottomRight,
    floralBL: null,
  },
  "frame-3": {
    stage: "23,36,60",
    radial: ["#243656", "#17243c", "#0f1828"],
    band: "23,36,60",
    line: "251,249,244",
    lineSoft: "251,249,244",
    dateColor: "251,249,244",
    goldDivider: false,
    glow: "90,110,150",
    floralTR: ASSETS.galeriEnvelope.previewFloralTopRight,
    floralTL: null,
    floralBR: null,
    floralBL: ASSETS.galeriEnvelope.flowerBottomRight,
  },
  "frame-4": {
    stage: "66,32,48",
    radial: ["#422030", "#2A1420", "#1E0D16"],
    band: "66,32,48",
    line: "251,249,244",
    lineSoft: "251,249,244",
    dateColor: "251,249,244",
    goldDivider: false,
    glow: "140,80,110",
    floralTR: null,
    floralTL: null,
    floralBR: ASSETS.galeriEnvelope.flowerBottomRight,
    floralBL: null,
  },
  "frame-5": {
    stage: "32,54,38",
    radial: ["#253d30", "#16261d", "#0f1c15"],
    band: "20,34,24",
    line: "212,175,55",
    lineSoft: "230,210,170",
    dateColor: "226,201,154",
    goldDivider: true,
    glow: "212,175,55",
    floralTR: null,
    floralTL: ASSETS.galeriEnvelope.botanicalTopLeft,
    floralBR: ASSETS.galeriEnvelope.flowerBottomRight,
    floralBL: null,
  },
}

export type FrameText = {
  couple: string
  date: string
  caption: string
}

const artCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadFloral(url: string, retry = true): Promise<HTMLImageElement | null> {
  const hit = artCache.get(url)
  if (hit) return hit
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) {
      resolve(null)
      return
    }
    const done = (img: HTMLImageElement | null) => resolve(img)
    const attempt = (first: boolean) => {
      const timer = setTimeout(() => {
        if (first) {
          attempt(false)
        } else {
          done(null)
        }
      }, 4000)
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          clearTimeout(timer)
          done(img.naturalWidth > 0 ? img : null)
        }
        img.onerror = () => {
          clearTimeout(timer)
          if (first) {
            setTimeout(() => attempt(false), 300)
          } else {
            done(null)
          }
        }
        // Cache-bust retries only: first attempt uses the cached URL.
        img.src = first ? url : `${url}${url.includes("?") ? "&" : "?"}retry=1`
      } catch {
        clearTimeout(timer)
        done(null)
      }
    }
    attempt(true)
  })
  artCache.set(url, p)
  return p
}

// Fire-and-forget prewarm so the art + fonts are cached (instant) by upload
// time. Call once when a capture page mounts — event Wi-Fi is often slow, and
// loading florals/fonts mid-upload is the failure window.
export function preloadFrameArt(): void {
  try {
    const urls = new Set<string>()
    for (const pal of Object.values(PALETTES)) {
      for (const u of [pal.floralTR, pal.floralTL, pal.floralBR, pal.floralBL]) {
        if (u) urls.add(u)
      }
    }
    for (const chrome of Object.values(FRAME_FLORALS)) {
      for (const u of [chrome.tr, chrome.tl, chrome.br, chrome.bl]) {
        if (u) urls.add(u)
      }
    }
    urls.add(ASSETS.galeriEnvelope.aksaraaLogo)
    urls.forEach((u) => {
      void loadFloral(u).catch(() => {})
    })
    void ensureFrameFonts()
  } catch {}
}

async function loadFontSpecs(specs: string[]): Promise<void> {
  try {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fonts?.load) return
    await Promise.race([
      Promise.all(specs.map((s) => fonts.load(s).catch(() => null))),
      // Never block a bake on font loading: a fallback face beats no card.
      new Promise((r) => setTimeout(r, 1800)),
    ])
  } catch {}
}

async function ensureScriptFont(): Promise<void> {
  await loadFontSpecs(['600 40px "Dancing Script"'])
}

const FRAME_FONT_SPECS = [
  '400 40px "Playfair Display"',
  '500 40px "Playfair Display"',
  '700 40px "Playfair Display"',
  '600 40px "Plus Jakarta Sans"',
  '400 40px "Caveat"',
  '600 40px "Caveat"',
  '600 40px "Dancing Script"',
]

async function ensureFrameFonts(): Promise<void> {
  await loadFontSpecs(FRAME_FONT_SPECS)
}

// All painters below draw inside an (ox, oy, w, h) box so header, photo,
// and caption zones share one code path at any size.
type Box = { ox: number; oy: number; w: number; h: number }

function drawVignette(ctx: CanvasRenderingContext2D, b: Box): void {
  const g = ctx.createRadialGradient(
    b.ox + b.w / 2, b.oy + b.h / 2, Math.min(b.w, b.h) * 0.35,
    b.ox + b.w / 2, b.oy + b.h / 2, Math.max(b.w, b.h) * 0.75
  )
  g.addColorStop(0, "rgba(0,0,0,0)")
  g.addColorStop(1, "rgba(0,0,0,0.22)")
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(b.ox, b.oy, b.w, b.h)
  ctx.restore()
}

// Stage-corner flourishes exactly where the HTML mocks put them (their own
// renders show broken "img" alt text at these same spots). The photo box
// itself stays clean.
function drawStageFlorals(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  imgs: { tr: HTMLImageElement | null; tl: HTMLImageElement | null; br: HTMLImageElement | null; bl: HTMLImageElement | null }
): void {
  ctx.save()
  ctx.globalAlpha = 0.85
  const spots: Array<[HTMLImageElement | null, number, number]> = [
    [imgs.tr, W, 0],
    [imgs.tl, 0, 0],
    [imgs.br, W, H],
    [imgs.bl, 0, H],
  ]
  for (const [img, x, y] of spots) {
    if (!img) continue
    const fw = W * 0.45
    const fh = (fw * img.naturalHeight) / Math.max(1, img.naturalWidth)
    const dx = x === 0 ? 0 : x - fw
    const dy = y === 0 ? 0 : y - fh
    ctx.drawImage(img, dx, dy, fw, fh)
  }
  ctx.restore()
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath()
  if (typeof (ctx as CanvasRenderingContext2D & { roundRect?: Function }).roundRect === "function") {
    ;(ctx as CanvasRenderingContext2D & { roundRect: Function }).roundRect(x, y, w, h, r)
    return
  }
  ctx.rect(x, y, w, h)
}

// Center target marker on the photo (all legacy frames, like the mocks).
function drawCenterMarker(ctx: CanvasRenderingContext2D, b: Box, line: string): void {
  const cx = b.ox + b.w / 2
  const cy = b.oy + b.h / 2
  const half = Math.max(4, Math.round(b.w * 0.02))
  const dot = Math.max(2, Math.round(b.w * 0.004))
  ctx.save()
  ctx.strokeStyle = `rgba(${line},0.5)`
  ctx.fillStyle = `rgba(${line},0.5)`
  ctx.lineWidth = Math.max(1, Math.round(b.w * 0.002))
  ctx.beginPath()
  ctx.moveTo(cx - half, cy)
  ctx.lineTo(cx - dot * 2, cy)
  ctx.moveTo(cx + dot * 2, cy)
  ctx.lineTo(cx + half, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, dot, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Antique corner brackets (gold filigree on frame-5, cream otherwise).
function drawCorners(ctx: CanvasRenderingContext2D, b: Box, line: string): void {
  const arm = Math.round(Math.min(b.w, b.h) * 0.055)
  const inset = Math.round(Math.min(b.w, b.h) * 0.065)
  ctx.save()
  ctx.strokeStyle = `rgba(${line},0.85)`
  ctx.lineWidth = Math.max(2, Math.round(b.w * 0.005))
  ctx.lineCap = "round"
  const corners: Array<[number, number, number, number]> = [
    [b.ox + inset, b.oy + inset, 1, 1],
    [b.ox + b.w - inset, b.oy + inset, -1, 1],
    [b.ox + inset, b.oy + b.h - inset, 1, -1],
    [b.ox + b.w - inset, b.oy + b.h - inset, -1, -1],
  ]
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(x + arm * dx, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + arm * dy)
    ctx.stroke()
  }
  ctx.restore()
}

function drawLogoMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  d: number,
  logo: HTMLImageElement | null
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(251,249,244,0.95)"
  ctx.fill()
  ctx.clip()
  if (logo && logo.naturalWidth > 0) {
    // Contain-fit the square-ish mark inside the circle.
    const s = Math.max(logo.naturalWidth, logo.naturalHeight)
    const dw = (d * 0.82 * logo.naturalWidth) / s
    const dh = (d * 0.82 * logo.naturalHeight) / s
    ctx.drawImage(logo, cx - dw / 2, cy - dh / 2, dw, dh)
  } else {
    ctx.fillStyle = "#b58c4f"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `600 ${Math.round(d * 0.5)}px "Playfair Display", serif`
    ctx.fillText("A", cx, cy + d * 0.03)
  }
  ctx.restore()
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  b: Box,
  pal: Palette,
  text: FrameText,
  logo: HTMLImageElement | null
): void {
  // No background fill here: the header sits on the painted stage so the
  // diagonal panel and corner flourishes stay visible behind the text.
  const cx = b.ox + b.w / 2
  const logoD = b.h * 0.24
  drawLogoMark(ctx, cx, b.oy + b.h * 0.2, logoD, logo)
  const couple = text.couple.trim() || "Mempelai"
  ctx.textAlign = "center"
  ctx.fillStyle = "rgba(251,249,244,0.98)"
  ctx.font = `500 ${Math.round(b.h * 0.115)}px "Playfair Display", serif`
  ctx.fillText(couple.slice(0, 40), cx, b.oy + b.h * 0.52, b.w * 0.9)
  const date = text.date.trim()
  // Gold side-rules exist only on frame-5; other frames use a plain date.
  if (date && pal.goldDivider) {
    const dy = b.oy + b.h * 0.72
    const half = b.w * 0.16
    ctx.strokeStyle = `rgba(${pal.line},0.7)`
    ctx.lineWidth = Math.max(1, Math.round(b.h * 0.006))
    ctx.beginPath()
    ctx.moveTo(cx - half, dy)
    ctx.lineTo(cx - 10, dy)
    ctx.moveTo(cx + 10, dy)
    ctx.lineTo(cx + half, dy)
    ctx.stroke()
  }
  if (date) {
    const dy = b.oy + b.h * (pal.goldDivider ? 0.72 : 0.7)
    try {
      ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "2px"
    } catch {}
    ctx.font = `600 ${Math.round(b.h * 0.075)}px "Plus Jakarta Sans", sans-serif`
    ctx.fillStyle = `rgba(${pal.dateColor},0.95)`
    ctx.fillText(date.slice(0, 30).toUpperCase(), cx, dy - b.h * 0.045, b.w * 0.8)
    try {
      ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px"
    } catch {}
  }
}

function drawCaptionZone(
  ctx: CanvasRenderingContext2D,
  b: Box,
  pal: Palette,
  text: FrameText
): void {
  const caption = text.caption.trim()
  // No background fill: the caption sits directly on the painted stage,
  // exactly like the HTML mocks. Empty caption leaves the zone blank.
  ctx.save()
  ctx.textAlign = "center"
  const cx = b.ox + b.w / 2
  if (caption) {
    ctx.fillStyle = "rgba(251,249,244,0.96)"
    ctx.font = `600 ${Math.round(b.h * 0.3)}px "Dancing Script", "Playfair Display", serif`
    ctx.fillText(caption.slice(0, 140), cx, b.oy + b.h * 0.52, b.w * 0.9)
    // Underline: gold divider + diamond (frame-5) or a plain cream
    // hairline like the other mocks.
    {
      const dy = b.oy + b.h * 0.74
      const half = b.w * (pal.goldDivider ? 0.18 : 0.375)
      ctx.strokeStyle = pal.goldDivider ? `rgba(${pal.line},0.7)` : "rgba(251,249,244,0.3)"
      ctx.lineWidth = Math.max(1, Math.round(b.h * 0.012))
      ctx.beginPath()
      if (pal.goldDivider) {
        ctx.moveTo(cx - half, dy)
        ctx.lineTo(cx - 8, dy)
        ctx.moveTo(cx + 8, dy)
        ctx.lineTo(cx + half, dy)
      } else {
        ctx.moveTo(cx - half, dy)
        ctx.lineTo(cx + half, dy)
      }
      ctx.stroke()
    }
    if (pal.goldDivider) {
      const dy = b.oy + b.h * 0.74
      const d = Math.max(3, Math.round(b.h * 0.05))
      ctx.save()
      ctx.translate(cx, dy)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = `rgba(${pal.lineSoft},0.9)`
      ctx.fillRect(-d / 2, -d / 2, d, d)
      ctx.restore()
    }
  } else {
    // Empty caption: leave the zone blank (no fallback microtext — the
    // header already carries the couple + date).
  }
  ctx.restore()
}

export type CardSpec = {
  padX: number
  topPad: number
  headerH: number
  gap1: number
  photoW: number
  photoH: number
  gap2: number
  captionH: number
  botPad: number
  radius: number
  totalH: number
}

export function measureCard(W: number, aspect: number, hasCaption: boolean): CardSpec {
  const padX = W * 0.06
  const w = W * 0.88
  const h = w * aspect
  const topPad = W * 0.05
  const headerH = W * 0.44
  const gap1 = W * 0.03
  const gap2 = W * 0.04
  const capH = W * (hasCaption ? 0.22 : 0.1)
  const botPad = W * 0.06
  return {
    padX, topPad, headerH, gap1, photoW: w, photoH: h, gap2,
    captionH: capH, botPad, radius: W * 0.035,
    totalH: Math.round(topPad + headerH + gap1 + h + gap2 + capH + botPad),
  }
}

// Legacy card paint (frames 1–5), shared by baked uploads and picker art.
// paintPhoto draws the photo into (ox, oy, w, h); pass null for a dark
// viewfinder placeholder. Layout mirrors the HTML mock stages.
async function paintLegacyCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  frame: LegacyFrameId,
  text: FrameText,
  paintPhoto: ((x: number, y: number, w: number, h: number) => void) | null,
  aspect: number
): Promise<void> {
  const pal = PALETTES[frame]
  const spec = measureCard(W, aspect, text.caption.trim().length > 0)
  const H = spec.totalH
  await ensureScriptFont()
  const [tr, tl, br, bl, logo] = await Promise.all([
    loadFloral(pal.floralTR || ""),
    loadFloral(pal.floralTL || ""),
    loadFloral(pal.floralBR || ""),
    loadFloral(pal.floralBL || ""),
    loadFloral(ASSETS.galeriEnvelope.aksaraaLogo),
  ])
  // Stage base: flat solid, or the mock radial gradient. Then ambient glows.
  if (pal.radial) {
    const rg = ctx.createRadialGradient(W / 2, H * 0.15, 0, W / 2, H * 0.15, H * 0.85)
    rg.addColorStop(0, pal.radial[0])
    rg.addColorStop(0.65, pal.radial[1])
    rg.addColorStop(1, pal.radial[2])
    ctx.fillStyle = rg
  } else {
    ctx.fillStyle = `rgb(${pal.stage})`
  }
  ctx.fillRect(0, 0, W, H)
  for (const [gx, gy, gr] of [[W * 0.85, H * 0.08, W * 0.3], [W * 0.12, H * 0.9, W * 0.32]] as const) {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
    g.addColorStop(0, `rgba(${pal.glow},0.25)`)
    g.addColorStop(1, `rgba(${pal.glow},0)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  drawStageFlorals(ctx, W, H, { tr, tl, br, bl })
  // Header content (no bg — sits on the painted stage).
  drawHeader(ctx, { ox: 0, oy: spec.topPad, w: W, h: spec.headerH }, pal, text, logo)
  // Photo box: inset, rounded, clean inside.
  const px = spec.padX
  const py = spec.topPad + spec.headerH + spec.gap1
  const pw = spec.photoW
  const ph = spec.photoH
  ctx.save()
  roundRectPath(ctx, px, py, pw, ph, spec.radius)
  ctx.clip()
  if (paintPhoto) {
    paintPhoto(px, py, pw, ph)
  } else {
    ctx.fillStyle = "#1b1c19"
    ctx.fillRect(px, py, pw, ph)
  }
  drawVignette(ctx, { ox: px, oy: py, w: pw, h: ph })
  drawCorners(ctx, { ox: px, oy: py, w: pw, h: ph }, pal.line)
  drawCenterMarker(ctx, { ox: px, oy: py, w: pw, h: ph }, pal.line)
  ctx.restore()
  // Emerald keepsake photo: double gold border following the rounded box.
  if (pal.goldDivider) {
    ctx.save()
    ctx.strokeStyle = `rgba(${pal.line},0.55)`
    ctx.lineWidth = Math.max(2, Math.round(W * 0.005))
    roundRectPath(ctx, px, py, pw, ph, spec.radius)
    ctx.stroke()
    ctx.strokeStyle = `rgba(${pal.lineSoft},0.35)`
    ctx.lineWidth = Math.max(1, Math.round(W * 0.0025))
    const io = Math.round(W * 0.012)
    roundRectPath(ctx, px + io, py + io, pw - io * 2, ph - io * 2, Math.max(1, spec.radius - io))
    ctx.stroke()
    ctx.restore()
  }
  // Caption zone on the stage.
  drawCaptionZone(ctx, { ox: 0, oy: py + ph + spec.gap2, w: W, h: spec.captionH }, pal, text)
  // Frame-5 outer gold filigree: solid edge + dashed inset.
  if (frame === "frame-5") {
    ctx.save()
    ctx.strokeStyle = `rgba(${pal.line},0.9)`
    ctx.lineWidth = Math.max(2, Math.round(W * 0.006))
    ctx.strokeRect(4, 4, W - 8, H - 8)
    ctx.strokeStyle = `rgba(${pal.lineSoft},0.35)`
    ctx.setLineDash([Math.max(3, Math.round(W * 0.008)), Math.max(3, Math.round(W * 0.008))])
    const o = Math.round(W * 0.03)
    ctx.strokeRect(o, o, W - o * 2, H - o * 2)
    ctx.setLineDash([])
    ctx.restore()
  }
}

// ---------------------------------------------------------------------------
// Text helpers shared by the art frames.
// ---------------------------------------------------------------------------

function measureTracked(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  if (!text) return 0
  let total = 0
  for (const ch of Array.from(text)) total += ctx.measureText(ch).width + tracking
  return total - tracking
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  tracking: number,
  align: "left" | "center" | "right" = "left"
): void {
  if (!text) return
  ctx.save()
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px"
  } catch {}
  ctx.textAlign = "left"
  const width = measureTracked(ctx, text, tracking)
  let x = align === "center" ? anchorX - width / 2 : align === "right" ? anchorX - width : anchorX
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, x, y)
    x += ctx.measureText(ch).width + tracking
  }
  ctx.restore()
}

// Shrink a tracked label until it fits (mock labels are set very wide).
function fitTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight: string,
  family: string,
  trackRatio: number,
  minSize: number
): { size: number; tracking: number } {
  let s = size
  for (;;) {
    ctx.font = `${weight} ${s}px ${family}`
    const tracking = s * trackRatio
    if (measureTracked(ctx, text, tracking) <= maxWidth || s <= minSize) return { size: s, tracking }
    s = Math.max(minSize, s * 0.94)
  }
}

function wrapAll(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const lines: string[] = []
  let cur = ""
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word
    if (!cur || ctx.measureText(next).width <= maxWidth) {
      cur = next
    } else {
      lines.push(cur)
      cur = word
    }
  }
  if (cur) lines.push(cur)
  return lines
}

// Greedy wrap that shrinks the face until the text fits the line budget,
// then ellipsizes the overflow (long couple names never squash the card).
function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { maxWidth: number; maxLines: number; size: number; minSize: number; weight: string; family: string }
): { size: number; lines: string[] } {
  const raw = text.trim()
  if (!raw) return { size: opts.size, lines: [] }
  let size = opts.size
  let lines: string[] = []
  for (;;) {
    ctx.font = `${opts.weight} ${size}px ${opts.family}`
    lines = wrapAll(ctx, raw, opts.maxWidth)
    if (lines.length <= opts.maxLines || size <= opts.minSize) break
    size = Math.max(opts.minSize, size * 0.93)
  }
  if (lines.length > opts.maxLines) {
    ctx.font = `${opts.weight} ${size}px ${opts.family}`
    const kept = lines.slice(0, opts.maxLines)
    let last = kept[opts.maxLines - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > opts.maxWidth) last = last.slice(0, -1)
    kept[opts.maxLines - 1] = `${last}…`
    lines = kept
  }
  return { size, lines }
}

const MONTHS_ID = [
  "januari", "februari", "maret", "april", "mei", "juni",
  "juli", "agustus", "september", "oktober", "november", "desember",
]
const MONTHS_ID_SHORT = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"]

// "12 Okt 2026" / "12 Oktober 2026" / "2026-10-12" -> numeric parts for the
// ivory card's stacked dd/mm/yyyy stamp.
function dateParts(label: string): { d: string; m: string; y: string } | null {
  const raw = (label || "").trim()
  if (!raw) return null
  const named = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (named) {
    const word = named[2].toLowerCase()
    const idx = MONTHS_ID.findIndex((full, i) => full === word || MONTHS_ID_SHORT[i] === word.slice(0, 3))
    if (idx >= 0) {
      return { d: named[1].padStart(2, "0"), m: String(idx + 1).padStart(2, "0"), y: named[3] }
    }
  }
  const numeric = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/) || raw.match(/(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/)
  if (numeric) {
    const [a, b, c] = [numeric[1], numeric[2], numeric[3]]
    if (a.length === 4) return { d: c.padStart(2, "0"), m: b.padStart(2, "0"), y: a }
    return { d: a.padStart(2, "0"), m: b.padStart(2, "0"), y: c }
  }
  const yearOnly = raw.match(/\b(\d{4})\b/)
  return yearOnly ? { d: "", m: "", y: yearOnly[1] } : null
}

// ---------------------------------------------------------------------------
// Art frames (couple-provided mocks): polaroid / ivory floral / editorial.
// ---------------------------------------------------------------------------

type ArtLayout = {
  H: number
  cardX: number
  cardY: number
  cardW: number
  cardH: number
  photoX: number
  photoY: number
  photoW: number
  photoH: number
}

type PolaroidLayout = ArtLayout & { stagePad: number; band: number }
type IvoryLayout = ArtLayout & { stagePad: number }
type EditorialLayout = ArtLayout & { topBand: number; textBand: number }

// Warm paper stage, white polaroid card, white mat, thick signature margin.
function polaroidLayout(W: number, aspect: number): PolaroidLayout {
  const stagePad = W * 0.045
  const cardW = W - stagePad * 2
  const matX = cardW * 0.055
  const matTop = cardW * 0.05
  const photoW = cardW - matX * 2
  const photoH = photoW * aspect
  const band = cardW * 0.3
  const cardH = matTop + photoH + band
  return {
    H: Math.round(cardH + stagePad * 2),
    stagePad,
    cardX: stagePad,
    cardY: stagePad,
    cardW,
    cardH,
    photoX: stagePad + matX,
    photoY: stagePad + matTop,
    photoW,
    photoH,
    band,
  }
}

// Cream stationery card: label + serif couple + stacked date, hairline mat,
// "A NEW CHAPTER TOGETHER" footer, watercolour cluster bleeding bottom-right.
function ivoryLayout(W: number, aspect: number): IvoryLayout {
  const stagePad = W * 0.035
  const cardX = stagePad
  const cardY = stagePad
  const cardW = W - stagePad * 2
  const padTop = cardW * 0.06
  const headerH = cardW * 0.27
  const gap1 = cardW * 0.04
  const photoInset = cardW * 0.085
  const photoW = cardW - photoInset * 2
  const photoH = photoW * aspect
  const gap2 = cardW * 0.055
  const footerH = cardW * 0.16
  const padBottom = cardW * 0.065
  const cardH = padTop + headerH + gap1 + photoH + gap2 + footerH + padBottom
  return {
    H: Math.round(cardH + stagePad * 2),
    stagePad,
    cardX,
    cardY,
    cardW,
    cardH,
    photoX: cardX + photoInset,
    photoY: cardY + padTop + headerH + gap1,
    photoW,
    photoH,
  }
}

// High-fashion magazine cover: black masthead bar, full-bleed photo, huge
// uppercase couple name over a white text band.
function editorialLayout(W: number, aspect: number): EditorialLayout {
  const topBand = W * 0.022
  const photoW = W
  const photoH = photoW * aspect
  const textBand = W * 0.3
  return {
    H: Math.round(topBand + photoH + textBand),
    topBand,
    textBand,
    cardX: 0,
    cardY: 0,
    cardW: W,
    cardH: topBand + photoH + textBand,
    photoX: 0,
    photoY: topBand,
    photoW,
    photoH,
  }
}

function paintArtPhoto(
  ctx: CanvasRenderingContext2D,
  paintPhoto: ((x: number, y: number, w: number, h: number) => void) | null,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  if (paintPhoto) {
    paintPhoto(x, y, w, h)
  } else {
    ctx.fillStyle = "#1b1c19"
    ctx.fillRect(x, y, w, h)
  }
}

async function paintPolaroidCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  text: FrameText,
  paintPhoto: ((x: number, y: number, w: number, h: number) => void) | null,
  aspect: number
): Promise<void> {
  const L = polaroidLayout(W, aspect)
  await ensureFrameFonts()
  ctx.fillStyle = "#fbf9f4"
  ctx.fillRect(0, 0, W, L.H)

  // Floating white card with the mock's soft vintage shadow.
  ctx.save()
  ctx.shadowColor = "rgba(107,43,45,0.16)"
  ctx.shadowBlur = W * 0.04
  ctx.shadowOffsetY = W * 0.014
  ctx.fillStyle = "#ffffff"
  roundRectPath(ctx, L.cardX, L.cardY, L.cardW, L.cardH, W * 0.004)
  ctx.fill()
  ctx.restore()

  // Recessed mat behind the photo.
  const mat = W * 0.012
  ctx.save()
  ctx.fillStyle = "rgba(240,238,233,0.65)"
  roundRectPath(ctx, L.photoX - mat, L.photoY - mat, L.photoW + mat * 2, L.photoH + mat * 2, W * 0.003)
  ctx.fill()
  ctx.restore()

  // Photo.
  ctx.save()
  roundRectPath(ctx, L.photoX, L.photoY, L.photoW, L.photoH, W * 0.002)
  ctx.clip()
  paintArtPhoto(ctx, paintPhoto, L.photoX, L.photoY, L.photoW, L.photoH)
  const film = ctx.createLinearGradient(0, L.photoY + L.photoH * 0.55, 0, L.photoY + L.photoH)
  film.addColorStop(0, "rgba(0,0,0,0)")
  film.addColorStop(1, "rgba(0,0,0,0.22)")
  ctx.fillStyle = film
  ctx.fillRect(L.photoX, L.photoY, L.photoW, L.photoH)
  drawVignette(ctx, { ox: L.photoX, oy: L.photoY, w: L.photoW, h: L.photoH })
  ctx.restore()
  // Inner hairline mat border, like the mock's inset paper edge.
  ctx.save()
  ctx.strokeStyle = "rgba(255,255,255,0.5)"
  ctx.lineWidth = Math.max(1, W * 0.0012)
  const inset = W * 0.005
  ctx.strokeRect(L.photoX + inset, L.photoY + inset, L.photoW - inset * 2, L.photoH - inset * 2)
  ctx.restore()

  // Signature band: couple (handwritten) + spaced uppercase date.
  const cx = W / 2
  const bandTop = L.photoY + L.photoH
  const couple = (text.couple || "").trim() || "Mempelai"
  const signature = fitLines(ctx, couple, {
    maxWidth: L.cardW * 0.82,
    maxLines: 1,
    size: L.cardW * 0.09,
    minSize: L.cardW * 0.045,
    weight: "600",
    family: '"Caveat", cursive',
  })
  ctx.save()
  ctx.fillStyle = "#1b1c19"
  ctx.font = `600 ${signature.size}px "Caveat", cursive`
  ctx.textAlign = "center"
  if (signature.lines[0]) ctx.fillText(signature.lines[0], cx, bandTop + L.band * 0.42, L.cardW * 0.82)
  const date = (text.date || "").trim()
  if (date) {
    const stamp = fitTracked(ctx, date.toUpperCase(), L.cardW * 0.8, L.cardW * 0.027, "600", '"Plus Jakarta Sans", sans-serif', 0.28, L.cardW * 0.016)
    ctx.font = `600 ${stamp.size}px "Plus Jakarta Sans", sans-serif`
    ctx.fillStyle = "#534342"
    drawTracked(ctx, date.toUpperCase(), cx, bandTop + L.band * 0.68, stamp.tracking, "center")
  }
  ctx.restore()
}

async function paintIvoryCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  text: FrameText,
  paintPhoto: ((x: number, y: number, w: number, h: number) => void) | null,
  aspect: number
): Promise<void> {
  const L = ivoryLayout(W, aspect)
  const [floral] = await Promise.all([loadFloral(IVORY_FLORAL), ensureFrameFonts()])
  const padX = L.cardW * 0.075
  const leftX = L.cardX + padX
  const rightX = L.cardX + L.cardW - padX
  const headerTop = L.cardY + L.cardW * 0.065

  ctx.fillStyle = "#fbf9f4"
  ctx.fillRect(0, 0, W, L.H)
  // Stationery card: warm tint, soft tinted shadow, hairline edge.
  ctx.save()
  ctx.shadowColor = "rgba(107,43,45,0.10)"
  ctx.shadowBlur = W * 0.03
  ctx.shadowOffsetY = W * 0.008
  ctx.fillStyle = "#f8f5ee"
  roundRectPath(ctx, L.cardX, L.cardY, L.cardW, L.cardH, W * 0.035)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = "rgba(27,28,25,0.08)"
  ctx.lineWidth = Math.max(1, W * 0.0012)
  roundRectPath(ctx, L.cardX, L.cardY, L.cardW, L.cardH, W * 0.035)
  ctx.stroke()
  ctx.restore()

  // Header: eyebrow label (left), stacked numeric date (right, behind a rule).
  ctx.save()
  ctx.fillStyle = "#1b1c19"
  const label = fitTracked(ctx, "THE WEDDING OF", L.cardW * 0.42, L.cardW * 0.026, "600", '"Plus Jakarta Sans", sans-serif', 0.3, L.cardW * 0.016)
  ctx.font = `600 ${label.size}px "Plus Jakarta Sans", sans-serif`
  drawTracked(ctx, "THE WEDDING OF", leftX, headerTop + L.cardW * 0.04, label.tracking, "left")
  ctx.restore()

  const parts = dateParts(text.date)
  if (parts) {
    const stampLines = [parts.d, parts.m, parts.y].filter(Boolean)
    const dateSize = L.cardW * 0.03
    const lineH = dateSize * 1.55
    const stackTop = headerTop + L.cardW * 0.012
    ctx.save()
    ctx.fillStyle = "#1b1c19"
    ctx.font = `600 ${dateSize}px "Plus Jakarta Sans", sans-serif`
    stampLines.forEach((line, i) => {
      drawTracked(ctx, line, rightX, stackTop + dateSize + i * lineH, dateSize * 0.22, "right")
    })
    // Hairline divider between the couple block and the date stack.
    ctx.strokeStyle = "rgba(27,28,25,0.28)"
    ctx.lineWidth = Math.max(1, W * 0.0013)
    const ruleX = rightX - L.cardW * 0.12
    ctx.beginPath()
    ctx.moveTo(ruleX, stackTop + L.cardW * 0.004)
    ctx.lineTo(ruleX, stackTop + stampLines.length * lineH - L.cardW * 0.012)
    ctx.stroke()
    ctx.restore()
  }

  // Couple name: stately uppercase serif, up to two lines.
  const couple = (text.couple || "").trim().toUpperCase() || "MEM PELAI"
  const nameMaxW = rightX - leftX - L.cardW * 0.19
  const name = fitLines(ctx, couple, {
    maxWidth: nameMaxW,
    maxLines: 2,
    size: L.cardW * 0.072,
    minSize: L.cardW * 0.042,
    weight: "400",
    family: '"Playfair Display", serif',
  })
  ctx.save()
  ctx.fillStyle = "#1b1c19"
  ctx.textAlign = "left"
  const nameLineH = name.size * 1.14
  let nameY = headerTop + L.cardW * 0.08 + name.size
  for (const line of name.lines) {
    ctx.font = `400 ${name.size}px "Playfair Display", serif`
    ctx.fillText(line, leftX, nameY)
    nameY += nameLineH
  }
  ctx.restore()

  // Photo with a clean heirloom mat + hairline inner border.
  ctx.save()
  roundRectPath(ctx, L.photoX, L.photoY, L.photoW, L.photoH, W * 0.004)
  ctx.clip()
  paintArtPhoto(ctx, paintPhoto, L.photoX, L.photoY, L.photoW, L.photoH)
  drawVignette(ctx, { ox: L.photoX, oy: L.photoY, w: L.photoW, h: L.photoH })
  ctx.restore()
  const matInset = L.cardW * 0.022
  ctx.save()
  ctx.strokeStyle = "rgba(27,28,25,0.22)"
  ctx.lineWidth = Math.max(1, W * 0.0014)
  ctx.strokeRect(L.photoX + matInset, L.photoY + matInset, L.photoW - matInset * 2, L.photoH - matInset * 2)
  ctx.restore()

  // Footer: two tracked lines, the second trailed by a hairline rule.
  const footerTop = L.photoY + L.photoH + L.cardW * 0.06
  ctx.save()
  ctx.fillStyle = "#1b1c19"
  const foot1 = fitTracked(ctx, "A NEW CHAPTER", L.cardW * 0.5, L.cardW * 0.027, "600", '"Plus Jakarta Sans", sans-serif', 0.26, L.cardW * 0.016)
  ctx.font = `600 ${foot1.size}px "Plus Jakarta Sans", sans-serif`
  drawTracked(ctx, "A NEW CHAPTER", leftX, footerTop + L.cardW * 0.045, foot1.tracking, "left")
  const foot2 = fitTracked(ctx, "TOGETHER", L.cardW * 0.28, L.cardW * 0.027, "600", '"Plus Jakarta Sans", sans-serif', 0.26, L.cardW * 0.016)
  const y2 = footerTop + L.cardW * 0.115
  ctx.font = `600 ${foot2.size}px "Plus Jakarta Sans", sans-serif`
  drawTracked(ctx, "TOGETHER", leftX, y2, foot2.tracking, "left")
  const ruleStart = leftX + measureTracked(ctx, "TOGETHER", foot2.tracking) + L.cardW * 0.03
  ctx.strokeStyle = "rgba(27,28,25,0.35)"
  ctx.lineWidth = Math.max(1, W * 0.0013)
  ctx.beginPath()
  ctx.moveTo(ruleStart, y2 - foot2.size * 0.32)
  ctx.lineTo(Math.min(ruleStart + L.cardW * 0.26, rightX), y2 - foot2.size * 0.32)
  ctx.stroke()
  ctx.restore()

  // Watercolour cluster: overlaps the photo, bleeds off the card corner.
  if (floral) {
    const fw = W * 0.46
    const fh = (fw * floral.naturalHeight) / Math.max(1, floral.naturalWidth)
    ctx.save()
    ctx.globalAlpha = 0.98
    ctx.drawImage(floral, W - fw * 0.82, L.H - fh * 0.98, fw, fh)
    ctx.restore()
  }
}

async function paintEditorialCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  text: FrameText,
  paintPhoto: ((x: number, y: number, w: number, h: number) => void) | null,
  aspect: number
): Promise<void> {
  const L = editorialLayout(W, aspect)
  await ensureFrameFonts()
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, L.H)

  // Full-bleed cover photo.
  ctx.save()
  ctx.beginPath()
  ctx.rect(L.photoX, L.photoY, L.photoW, L.photoH)
  ctx.clip()
  paintArtPhoto(ctx, paintPhoto, L.photoX, L.photoY, L.photoW, L.photoH)
  // White scrims: top for the masthead copy, bottom blend into the text band.
  const topScrim = ctx.createLinearGradient(0, L.photoY, 0, L.photoY + W * 0.34)
  topScrim.addColorStop(0, "rgba(255,255,255,0.86)")
  topScrim.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = topScrim
  ctx.fillRect(L.photoX, L.photoY, L.photoW, W * 0.34)
  const bottomFade = ctx.createLinearGradient(0, L.photoY + L.photoH - W * 0.2, 0, L.photoY + L.photoH)
  bottomFade.addColorStop(0, "rgba(255,255,255,0)")
  bottomFade.addColorStop(1, "rgba(255,255,255,1)")
  ctx.fillStyle = bottomFade
  ctx.fillRect(L.photoX, L.photoY + L.photoH - W * 0.2, L.photoW, W * 0.2)
  ctx.restore()

  // Black masthead bar (top edge of the cover).
  ctx.fillStyle = "#121214"
  ctx.fillRect(0, 0, W, L.topBand)

  // Date + masthead ("the Wedding") + subtitle over the photo. The white halo
  // keeps the copy readable on any shot.
  ctx.save()
  ctx.fillStyle = "#1b1c19"
  const date = (text.date || "").trim().toUpperCase()
  if (date) {
    const stamp = fitTracked(ctx, date, W * 0.6, W * 0.023, "600", '"Plus Jakarta Sans", sans-serif', 0.16, W * 0.013)
    ctx.font = `600 ${stamp.size}px "Plus Jakarta Sans", sans-serif`
    drawTracked(ctx, date, W - W * 0.05, L.photoY + W * 0.048, stamp.tracking, "right")
  }
  ctx.shadowColor = "rgba(255,255,255,0.92)"
  ctx.shadowBlur = W * 0.016
  // Masthead: italic "the" baseline-aligned before the display "Wedding".
  const theSize = W * 0.052
  const weddingSize = W * 0.132
  ctx.font = `italic 400 ${theSize}px "Playfair Display", serif`
  const theW = ctx.measureText("the").width
  ctx.font = `400 ${weddingSize}px "Playfair Display", serif`
  const weddingW = ctx.measureText("Wedding").width
  const gap = W * 0.008
  const mastheadX = (W - (theW + gap + weddingW)) / 2
  const mastheadY = L.photoY + W * 0.175
  ctx.fillStyle = "#1b1c19"
  ctx.font = `italic 400 ${theSize}px "Playfair Display", serif`
  ctx.textAlign = "left"
  ctx.fillText("the", mastheadX, mastheadY)
  ctx.font = `400 ${weddingSize}px "Playfair Display", serif`
  ctx.fillText("Wedding", mastheadX + theW + gap, mastheadY)
  // Editorial subtitle.
  const eyebrow = fitTracked(ctx, "FOREVER BEGINS HERE", W * 0.62, W * 0.0215, "600", '"Plus Jakarta Sans", sans-serif', 0.4, W * 0.012)
  ctx.font = `600 ${eyebrow.size}px "Plus Jakarta Sans", sans-serif`
  drawTracked(ctx, "FOREVER BEGINS HERE", W / 2, L.photoY + W * 0.245, eyebrow.tracking, "center")
  ctx.restore()

  // White text band under the cover.
  const bandTop = L.photoY + L.photoH
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, bandTop, W, L.textBand)

  // Couple name: huge uppercase serif, bottom-left.
  const couple = (text.couple || "").trim().toUpperCase() || "MEMPELAI"
  const name = fitLines(ctx, couple, {
    maxWidth: W * 0.61,
    maxLines: 2,
    size: W * 0.098,
    minSize: W * 0.05,
    weight: "700",
    family: '"Playfair Display", serif',
  })
  ctx.save()
  ctx.fillStyle = "#1b1c19"
  ctx.textAlign = "left"
  const lineH = name.size * 0.9
  const lastBaseline = bandTop + L.textBand * 0.82
  let nameY = lastBaseline - (name.lines.length - 1) * lineH
  for (const line of name.lines) {
    ctx.font = `700 ${name.size}px "Playfair Display", serif`
    ctx.fillText(line, W * 0.05, nameY)
    nameY += lineH
  }
  ctx.restore()

  // Credit block: tracked label + script sign-off, bottom-right.
  ctx.save()
  ctx.fillStyle = "#534342"
  const cred = fitTracked(ctx, "CHEERS TO THE COUPLE", W * 0.29, W * 0.0195, "600", '"Plus Jakarta Sans", sans-serif', 0.2, W * 0.012)
  ctx.font = `600 ${cred.size}px "Plus Jakarta Sans", sans-serif`
  drawTracked(ctx, "CHEERS TO THE COUPLE", W - W * 0.05, bandTop + L.textBand * 0.6, cred.tracking, "right")
  const script = fitLines(ctx, "Happily Ever After!", {
    maxWidth: W * 0.3,
    maxLines: 1,
    size: W * 0.045,
    minSize: W * 0.028,
    weight: "600",
    family: '"Dancing Script", cursive',
  })
  ctx.fillStyle = "#1b1c19"
  ctx.textAlign = "right"
  ctx.font = `600 ${script.size}px "Dancing Script", cursive`
  if (script.lines[0]) ctx.fillText(script.lines[0], W - W * 0.05, bandTop + L.textBand * 0.86)
  ctx.restore()
}

// Card height for a frame (the canvas is sized before painting).
export function measureFrameCard(W: number, frame: GaleriFrameId, aspect: number, hasCaption: boolean): number {
  switch (frame) {
    case "frame-polaroid":
      return polaroidLayout(W, aspect).H
    case "frame-ivory":
      return ivoryLayout(W, aspect).H
    case "frame-editorial":
      return editorialLayout(W, aspect).H
    default:
      return measureCard(W, aspect, hasCaption).totalH
  }
}

// Full-card paint shared by baked uploads and the live preview.
// paintPhoto draws the photo into (ox, oy, w, h); pass null for a dark
// viewfinder placeholder.
export async function paintGaleriCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  frame: GaleriFrameId,
  text: FrameText,
  paintPhoto: ((x: number, y: number, w: number, h: number) => void) | null,
  aspect: number
): Promise<void> {
  switch (frame) {
    case "frame-polaroid":
      await paintPolaroidCard(ctx, W, text, paintPhoto, aspect)
      return
    case "frame-ivory":
      await paintIvoryCard(ctx, W, text, paintPhoto, aspect)
      return
    case "frame-editorial":
      await paintEditorialCard(ctx, W, text, paintPhoto, aspect)
      return
    default:
      await paintLegacyCard(ctx, W, frame, text, paintPhoto, aspect)
  }
}

async function decodeImageFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("decode"))
      el.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function cameraFilterPainter(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filter: string
): (x: number, y: number, w: number, h: number) => void {
  return (x, y, w, h) => {
    ctx.save()
    if (filter) {
      try {
        ctx.filter = filter
      } catch {}
    }
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
  }
}

// Composite the full card over an image file. Never throws: any failure
// returns the original file so an upload is never blocked by decor.
export async function applyGaleriFrame(
  file: File,
  opts: { frame: FrameSelection; couple: string; date: string; caption: string; cameraFilter?: string }
): Promise<File> {
  // "none" without a filter skips compositing entirely (no re-encode loss).
  if (opts.frame === "none" && !opts.cameraFilter) return file
  const frame = normalizeFrameId(opts.frame)
  try {
    const img = await decodeImageFile(file)
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return file
    const filter = (opts.cameraFilter || "").trim()
    // No frame: filtered (or raw) photo only, no card chrome.
    if (opts.frame === "none") {
      if (!filter) return file
      const W = Math.min(w, 1600)
      const H = Math.round((W * h) / Math.max(1, w))
      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")
      if (!ctx) return file
      cameraFilterPainter(ctx, img, filter)(0, 0, W, H)
      const only = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.88)
      )
      if (!only) return file
      return new File([only], `framed-${Date.now()}.jpg`, { type: "image/jpeg" })
    }
    const caption = opts.caption.trim()
    const aspect = h / Math.max(1, w)
    // Cap card width so extreme panoramas stay under the upload cap.
    const W = Math.min(w, 1600)
    const H = measureFrameCard(W, frame, aspect, caption.length > 0)
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.fillStyle = "#fbf9f4"
    ctx.fillRect(0, 0, W, H)
    await paintGaleriCard(
      ctx,
      W,
      frame,
      { couple: opts.couple, date: opts.date, caption },
      cameraFilterPainter(ctx, img, filter),
      aspect
    )
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.88)
    )
    if (!blob) return file
    return new File([blob], `framed-${Date.now()}.jpg`, { type: "image/jpeg" })
  } catch {
    return file
  }
}

// ---------------------------------------------------------------------------
// Live preview (pre-upload): paints the exact card the bake will produce so
// the caption screen can never drift from the uploaded JPG.
// ---------------------------------------------------------------------------

const previewImageCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadPreviewImage(url: string): Promise<HTMLImageElement | null> {
  const hit = previewImageCache.get(url)
  if (hit) return hit
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img.naturalWidth > 0 ? img : null)
      img.onerror = () => resolve(null)
      img.src = url
    } catch {
      resolve(null)
    }
  })
  // Each shot is a fresh blob URL; keep the cache from growing forever.
  if (previewImageCache.size > 8) {
    const oldest = previewImageCache.keys().next().value
    if (oldest) previewImageCache.delete(oldest)
  }
  previewImageCache.set(url, p)
  return p
}

export type GaleriCardPreviewOptions = {
  imageUrl: string
  frame: FrameSelection
  couple: string
  date: string
  caption?: string
  cameraFilter?: string
  // Target canvas width in device pixels.
  width: number
}

// Paints into `canvas` at the requested device width. Returns false when the
// frame is "none" or the image cannot be decoded (the caller keeps its DOM
// fallback). Paint happens offscreen then blits, so re-rendering on every
// keystroke never flashes a blank frame.
export async function paintGaleriCardPreview(
  canvas: HTMLCanvasElement,
  opts: GaleriCardPreviewOptions
): Promise<boolean> {
  const sel = normalizeFrameSelection(opts.frame)
  if (sel === "none") {
    canvas.width = 0
    canvas.height = 0
    return false
  }
  const frame = sel
  const img = await loadPreviewImage(opts.imageUrl)
  if (!img) return false
  const naturalW = img.naturalWidth || img.width
  const naturalH = img.naturalHeight || img.height
  if (!naturalW || !naturalH) return false
  const aspect = naturalH / naturalW
  const W = Math.max(280, Math.min(1600, Math.round(opts.width)))
  const text: FrameText = {
    couple: opts.couple,
    date: opts.date,
    caption: (opts.caption || "").trim(),
  }
  const H = measureFrameCard(W, frame, aspect, text.caption.length > 0)
  const off = document.createElement("canvas")
  off.width = W
  off.height = H
  const ctx = off.getContext("2d")
  if (!ctx) return false
  ctx.fillStyle = "#fbf9f4"
  ctx.fillRect(0, 0, W, H)
  await paintGaleriCard(
    ctx,
    W,
    frame,
    text,
    cameraFilterPainter(ctx, img, (opts.cameraFilter || "").trim()),
    aspect
  )
  canvas.width = W
  canvas.height = H
  const out = canvas.getContext("2d")
  if (!out) return false
  out.drawImage(off, 0, 0)
  return true
}
