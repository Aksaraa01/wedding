// Client-side Wish Wall PDF: a cover in the digital live-guestbook style
// followed by content pages where each approved wish is rendered in the same
// card frame as the "Pratinjau Layar LED • Live" screen.
//
// html2canvas rasterises each A4 page node; jsPDF assembles the pages into a
// downloadable PDF. All styles are inline so html2canvas captures them without
// depending on the Tailwind CSSOM.

export type PdfWish = {
  id: string
  name: string
  message: string
  created_at?: string | null
  category?: string | null
  is_vip?: boolean
}

export type PdfProfile = {
  slug?: string | null
  bride_name?: string | null
  groom_name?: string | null
  estimated_wedding_date?: string | null
  sessions?: { venue?: string; date?: string }[] | null
  cover_photos?: string[] | null
  couple_illustration_url?: string | null
}

const PAGE_W = 794
const PAGE_H = 1123
const PER_PAGE = 6

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"

function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ))
}

function initials(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })
}

function el(tag: string, css: string, html?: string): HTMLElement {
  const e = document.createElement(tag)
  e.style.cssText = css
  if (html !== undefined) e.innerHTML = html
  return e
}

function loadImage(img: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) return resolve()
    img.onload = () => resolve()
    img.onerror = () => resolve()
  })
}

const FLOWER_SVG =
  '<svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.4" viewBox="0 0 24 24"><path d="M12 22V12M12 12C12 7 7 6 7 6C7 11 12 12 12 12ZM12 12C12 7 17 6 17 6C17 11 12 12 12 12Z"/></svg>'

async function ensureFonts(): Promise<void> {
  let link = document.getElementById("wish-wall-pdf-fonts") as HTMLLinkElement | null
  const waitForLink = new Promise<void>((resolve) => {
    if (link && (link as any).sheet) return resolve()
    if (!link) {
      link = document.createElement("link")
      link.id = "wish-wall-pdf-fonts"
      link.rel = "stylesheet"
      link.href = FONT_HREF
      document.head.appendChild(link)
    }
    const done = () => resolve()
    link.addEventListener("load", done, { once: true })
    link.addEventListener("error", done, { once: true })
    setTimeout(done, 5000)
  })
  await waitForLink

  const specs = [
    '400 40px "Cormorant Garamond"',
    '600 40px "Cormorant Garamond"',
    '400 16px "Cormorant Garamond"',
    '400 11px "Cinzel"',
    '400 30px "Pinyon Script"',
    '400 14px "Plus Jakarta Sans"',
    '700 16px "Plus Jakarta Sans"',
    '400 40px "Playfair Display"',
  ]
  try {
    const fonts = (document as any).fonts
    if (fonts) {
      await Promise.all(specs.map((s) => fonts.load(s).catch(() => {})))
      await fonts.ready
    }
  } catch {
    /* fonts are best-effort; capture still proceeds */
  }
}

function buildCover(profile: PdfProfile, count: number): Promise<HTMLElement> {
  const groom = (profile.groom_name || "Mempelai").trim()
  const bride = (profile.bride_name || "Mempelai").trim()
  const venue = (profile.sessions?.[0]?.venue || "").trim()
  const date = formatLongDate(profile.estimated_wedding_date)
  const coverPhoto =
    (Array.isArray(profile.cover_photos) && profile.cover_photos.find(Boolean)) ||
    profile.couple_illustration_url ||
    ""

  const cover = el(
    "div",
    `width:${PAGE_W}px;height:${PAGE_H}px;position:relative;overflow:hidden;background:#FAF6EE;` +
      `display:flex;flex-direction:column;align-items:center;justify-content:space-between;` +
      `padding:64px 56px;box-sizing:border-box;font-family:'Plus Jakarta Sans',sans-serif;`,
  )
  cover.appendChild(el("div", "position:absolute;inset:26px;border:1px solid rgba(201,163,78,0.65);pointer-events:none;"))

  const top = el("div", "text-align:center;position:relative;z-index:1;")
  top.appendChild(
    el(
      "div",
      "width:74px;height:74px;margin:0 auto 12px;border:1px dashed #C9A34E;border-radius:50%;display:flex;align-items:center;justify-content:center;",
      `<span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:26px;color:#A98231;">${escapeHtml(initials(`${groom} ${bride}`))}</span>`,
    ),
  )
  top.appendChild(el("div", "font-family:'Cinzel',serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#A98231;", "The Wedding Wish Wall"))
  top.appendChild(el("div", "font-family:'Pinyon Script',cursive;font-size:30px;color:#39332D;margin-top:6px;", "Celebration of Eternal Love"))
  cover.appendChild(top)

  const photoWrap = el(
    "div",
    "width:248px;height:306px;border-radius:124px 124px 0 0;overflow:hidden;border:2px solid #D8CEB8;" +
      "box-shadow:0 10px 26px -14px rgba(0,0,0,0.4);background:#F4EFE6;position:relative;z-index:1;" +
      "display:flex;align-items:center;justify-content:center;",
  )
  cover.appendChild(photoWrap)

  const names = el("div", "text-align:center;position:relative;z-index:1;")
  names.innerHTML =
    `<h1 style="font-family:'Cormorant Garamond',serif;font-size:42px;line-height:1.1;color:#A98231;font-weight:600;margin:0;">` +
    `${escapeHtml(groom)}<span style="font-family:'Pinyon Script',cursive;font-size:34px;color:#A98231;margin:0 12px;">&amp;</span>${escapeHtml(bride)}</h1>` +
    (date ? `<p style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#39332D;margin:12px 0 0;">${escapeHtml(date)}</p>` : "") +
    (venue ? `<p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:16px;color:#8B6F2A;margin:4px 0 0;">${escapeHtml(venue)}</p>` : "") +
    `<p style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#A98231;margin:22px 0 0;">Doa &amp; Harapan Tamu</p>` +
    `<p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#8B6F2A;margin:6px 0 0;">${count} ucapan dari tamu</p>`
  cover.appendChild(names)

  if (coverPhoto) {
    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    img.style.cssText = "width:100%;height:100%;object-fit:cover;"
    img.src = coverPhoto
    photoWrap.appendChild(img)
    return loadImage(img).then(() => cover)
  }
  photoWrap.innerHTML = `<span style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#8B6F2A;">Foto menyusul</span>`
  return Promise.resolve(cover)
}

function buildCard(wish: PdfWish): HTMLElement {
  const card = el(
    "div",
    "height:280px;background:#FFFFFF;border:1px solid #E8DCDB;border-radius:16px;padding:20px;box-sizing:border-box;" +
      "display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;",
  )
  const head = el("div", "display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;")
  head.appendChild(
    el(
      "div",
      "width:40px;height:40px;border-radius:50%;background:#FAF3EC;border:1px solid #E8DCDB;" +
        "display:flex;align-items:center;justify-content:center;flex-shrink:0;" +
        "font-family:'Cormorant Garamond',serif;font-weight:700;font-size:14px;color:#5B242A;",
      escapeHtml(initials(wish.name)),
    ),
  )
  const col = el("div", "flex:1;min-width:0;")
  col.appendChild(
    el(
      "div",
      "font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:17px;line-height:1.3;color:#5B242A;" +
        "word-break:break-word;margin:0;padding:0;",
      escapeHtml(wish.name),
    ),
  )
  const meta = el("div", "display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;")
  if (wish.category) {
    meta.appendChild(
      el(
        "span",
        "display:inline-flex;align-items:center;justify-content:center;height:22px;box-sizing:border-box;" +
          "padding:0 10px;border-radius:9999px;line-height:1;" +
          "font-family:'Plus Jakarta Sans',sans-serif;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;" +
          "color:#6B5B45;background:#F6F1E7;border:1px solid #E2D9CF;",
        escapeHtml(wish.category),
      ),
    )
  }
  if (wish.is_vip) {
    const vip = el(
      "span",
      "display:inline-flex;align-items:center;justify-content:center;gap:4px;height:22px;box-sizing:border-box;" +
        "padding:0 10px;border-radius:9999px;line-height:1;" +
        "font-family:'Plus Jakarta Sans',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;" +
        "color:#7A5A2E;background:#F7EDD3;border:1px solid #C9A34E;",
    )
    vip.appendChild(el("span", "font-size:11px;line-height:1;", "&#9733;"))
    vip.appendChild(el("span", "line-height:1;", "VIP"))
    meta.appendChild(vip)
  }
  if (meta.childNodes.length > 0) col.appendChild(meta)
  head.appendChild(col)
  card.appendChild(head)
  card.appendChild(
    el(
      "div",
      "font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;line-height:1.5;color:rgba(56,45,41,0.9);flex:1;overflow:hidden;",
      `&ldquo;${escapeHtml(wish.message)}&rdquo;`,
    ),
  )
  card.appendChild(el("div", "align-self:flex-end;opacity:0.4;color:#7E3B42;", FLOWER_SVG))
  return card
}

function buildContentPage(profile: PdfProfile, wishes: PdfWish[], pageNo: number): HTMLElement {
  const groom = (profile.groom_name || "").trim()
  const bride = (profile.bride_name || "").trim()
  const page = el(
    "div",
    `width:${PAGE_W}px;height:${PAGE_H}px;background:#FAF6EE;box-sizing:border-box;padding:44px 40px;` +
      `display:flex;flex-direction:column;font-family:'Plus Jakarta Sans',sans-serif;position:relative;`,
  )
  page.appendChild(
    el(
      "div",
      "text-align:center;margin-bottom:20px;",
      `<p style="font-family:'Cormorant Garamond',serif;font-size:22px;color:#5B242A;margin:0;">The Wedding of ${escapeHtml(groom)} <span style="font-style:italic;color:#7E3B42;">&amp;</span> ${escapeHtml(bride)}</p>` +
        `<p style="font-family:'Cinzel',serif;font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#A98231;margin:6px 0 0;">Wish Wall &bull; Doa &amp; Harapan</p>`,
    ),
  )

  const grid = el("div", "display:grid;grid-template-columns:1fr 1fr;gap:18px;flex:1;align-content:start;")
  for (const w of wishes) grid.appendChild(buildCard(w))
  page.appendChild(grid)

  page.appendChild(
    el(
      "div",
      "display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-family:'Cinzel',serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#A98231;",
      `<span>Aksaraa Wedding</span><span>Halaman ${pageNo}</span>`,
    ),
  )
  return page
}

function slugifyFilename(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "wish-wall"
}

export async function generateWishWallPdf(profile: PdfProfile, wishes: PdfWish[]): Promise<void> {
  const approved = wishes.filter((w) => w && (w.message || "").trim())
  if (approved.length === 0) {
    throw new Error("Belum ada doa yang disetujui untuk diunduh.")
  }

  await ensureFonts()

  const pages: HTMLElement[] = []
  pages.push(await buildCover(profile, approved.length))
  for (let i = 0; i < approved.length; i += PER_PAGE) {
    pages.push(buildContentPage(profile, approved.slice(i, i + PER_PAGE), Math.floor(i / PER_PAGE) + 1))
  }

  const staging = document.createElement("div")
  staging.style.cssText = "position:absolute;left:-10000px;top:0;z-index:-1;"
  for (const p of pages) staging.appendChild(p)
  document.body.appendChild(staging)

  try {
    // Let the staged nodes lay out (and any remaining font glyphs settle)
    // before rasterising.
    await new Promise((r) => setTimeout(r, 350))
    try { await (document as any).fonts?.ready } catch {}
    const { default: html2canvas } = await import("html2canvas")
    const { jsPDF } = await import("jspdf")
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FAF6EE",
        logging: false,
        width: PAGE_W,
        height: PAGE_H,
        windowWidth: PAGE_W,
        windowHeight: PAGE_H,
      })
      const img = canvas.toDataURL("image/jpeg", 0.92)
      if (i > 0) pdf.addPage()
      pdf.addImage(img, "JPEG", 0, 0, 210, 297)
    }

    const groom = (profile.groom_name || "").trim()
    const bride = (profile.bride_name || "").trim()
    const name = groom && bride ? `${groom}-${bride}` : profile.slug || "Wish-Wall"
    pdf.save(`Wish-Wall-${slugifyFilename(name)}.pdf`)
  } finally {
    staging.remove()
  }
}
