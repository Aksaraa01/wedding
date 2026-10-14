// Client-safe Galeri Tamu frame art (no server imports — the capture
// pages run this in the browser). Each frame is a full photobooth CARD
// mirroring the HTML mock stages: header (logo, couple serif, date),
// photo with corner flourishes, caption band. Cards are BAKED into the
// uploaded JPG: zero storage blobs, zero per-view render cost,
// aspect-adaptive across 4:3 captures and 3:4 selfies, dynamic couple /
// date / caption text. The dashboard picker thumbnails use this same path.

import { ASSETS } from "@/lib/assets"

export type GaleriFrameId = "frame-1" | "frame-2" | "frame-3" | "frame-4" | "frame-5"

export const GALERI_FRAME_IDS: GaleriFrameId[] = ["frame-1", "frame-2", "frame-3", "frame-4", "frame-5"]

// "none" = upload the raw capture with zero decor (and zero re-encode loss).
export type FrameSelection = GaleriFrameId | "none"

export function normalizeFrameSelection(v: unknown): FrameSelection {
  if (v === "none") return "none"
  if (v === "frame-2" || v === "frame-3" || v === "frame-4" || v === "frame-5") return v
  if (v === "frame-1") return "frame-1"
  // Unset/unknown defaults to NO frame (explicit opt-in per frame).
  return "none"
}

export const DEFAULT_FRAME: GaleriFrameId = "frame-1"

export function normalizeFrameId(v: unknown): GaleriFrameId {
  return v === "frame-2" || v === "frame-3" || v === "frame-4" || v === "frame-5" ? v : DEFAULT_FRAME
}

export const GALERI_FRAME_NAMES: Record<GaleriFrameId, string> = {
  "frame-1": "Maroon Klasik",
  "frame-2": "Sage",
  "frame-3": "Navy Night",
  "frame-4": "Burgundy Glow",
  "frame-5": "Emerald Gold",
}

// Static picker thumbnails (couple-provided art).
export const GALERI_FRAME_THUMBS: Record<GaleriFrameId, string> = {
  "frame-1": "/frames/frame-1.png",
  "frame-2": "/frames/frame-2.png",
  "frame-3": "/frames/frame-3.png",
  "frame-4": "/frames/frame-4.png",
  "frame-5": "/frames/frame-5.png",
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
const PALETTES: Record<GaleriFrameId, Palette> = {
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

const floralCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadFloral(url: string, retry = true): Promise<HTMLImageElement | null> {
  const hit = floralCache.get(url)
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
  floralCache.set(url, p)
  return p
}

// Fire-and-forget prewarm so the art is cached (instant) by upload time.
// Call once when the kamera page mounts — event Wi-Fi is often slow, and
// loading all four florals mid-upload is the failure window.
export function preloadFrameArt(): void {
  try {
    const urls = new Set<string>()
    for (const pal of Object.values(PALETTES)) {
      for (const u of [pal.floralTR, pal.floralTL, pal.floralBR, pal.floralBL]) {
        if (u) urls.add(u)
      }
    }
    urls.add(ASSETS.galeriEnvelope.aksaraaLogo)
    urls.forEach((u) => {
      void loadFloral(u).catch(() => {})
    })
  } catch {}
}

async function ensureScriptFont(): Promise<void> {
  try {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fonts?.load) return
    await Promise.race([
      fonts.load('600 40px "Dancing Script"'),
      new Promise((r) => setTimeout(r, 1500)),
    ])
  } catch {}
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
function mixCream(rgb: string, amt: number): string {
  const [r, g, b] = rgb.split(",").map(Number)
  const m = (c: number) => Math.round(c + (251 - c) * amt)
  return `${m(r)},${m(g)},${m(b)}`
}

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


// Center target marker on the photo (all frames, like the mocks).
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

// Full-card paint shared by baked uploads and picker thumbnails.
// paintPhoto draws the photo into (ox, oy, w, h); pass null for a dark
// viewfinder placeholder. Layout mirrors the HTML mock stages.
export async function paintGaleriCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  frame: GaleriFrameId,
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
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error("decode"))
        el.src = url
      })
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      if (!w || !h) return file
      const filter = (opts.cameraFilter || "").trim()
      const paintFiltered = (c: CanvasRenderingContext2D, x: number, y: number, pw: number, ph: number) => {
        c.save()
        if (filter) {
          try {
            c.filter = filter
          } catch {}
        }
        c.drawImage(img, x, y, pw, ph)
        c.restore()
      }
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
        paintFiltered(ctx, 0, 0, W, H)
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
      const spec = measureCard(W, aspect, caption.length > 0)
      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = spec.totalH
      const ctx = canvas.getContext("2d")
      if (!ctx) return file
      ctx.fillStyle = "#fbf9f4"
      ctx.fillRect(0, 0, W, spec.totalH)
      await paintGaleriCard(ctx, W, opts.frame, { ...opts, caption }, (x, y, pw, ph) => {
        paintFiltered(ctx, x, y, pw, ph)
      }, aspect)
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.88)
      )
      if (!blob) return file
      return new File([blob], `framed-${Date.now()}.jpg`, { type: "image/jpeg" })
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    return file
  }
}
