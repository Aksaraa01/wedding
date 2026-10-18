// Central contact for Aksaraa Wedding customer-facing WhatsApp links
// (consultation, login help, payment gate). Change the number once here —
// it applies everywhere. Couple-specific links (ops console contacting the
// couple) intentionally stay dynamic per wedding profile.

export const AKSARAA_WA_NUMBER = "6281161613071"

import { packageDisplayName } from "@/lib/packages"

export function waLink(text: string): string {
  return `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(text)}`
}

// Payment CTA prefill: names the couple's package + Galeri tier so the
// consultant instantly knows what is being paid. Missing pieces degrade to
// the plain base message, never to a half-filled sentence.
export function formatRupiah(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString("id-ID")}`
}

export function paymentWaText(opts: { packageType?: string | null; galeriTier?: string | null; amount?: number | null }): string {
  const base = "Halo Aksaraa Wedding, Saya mau melakukan pembayaran"
  const pkg = (opts.packageType || "").trim()
  if (!pkg) return base
  let text = `${base} paket ${packageGroupLabel(pkg)}`
  if (typeof opts.amount === "number" && opts.amount > 0) {
    text += ` senilai ${formatRupiah(opts.amount)}`
  }
  const tier = (opts.galeriTier || "").trim()
  if (tier) text += ` dengan Galeri Tamu ${tier}`
  return text
}

export function paymentWaLink(opts: { packageType?: string | null; galeriTier?: string | null; amount?: number | null }): string {
  return waLink(paymentWaText(opts))
}

export type PackageChangeSelection = {
  package: string
  waBlastTier: number
  express: boolean
  fisik: boolean
  galeri: { on: boolean; photos?: number; guests?: number } | null
  delta?: number | null
}

// "Undangan Digital Signature" style label: group + tier, so the
// consultant instantly knows both. Unknown codes fall back to the raw
// code, never to a wrong group.
function packageGroupLabel(code: string | undefined | null): string {
  const c = (code || "").trim()
  if (!c) return "?"
  return packageDisplayName(c)
}

// Package-change CTA prefill: names the paid package, the new selection,
// and any changed/new add-ons so the consultant instantly knows the request.
// Unchanged or absent pieces are omitted, never half-filled.
export function packageChangeWaText(oldSel: PackageChangeSelection, newSel: PackageChangeSelection): string {
  const oldPkg = packageGroupLabel(oldSel.package)
  const newPkg = packageGroupLabel(newSel.package)
  let text = `Halo Aksaraa Wedding, saya sudah membayar paket ${oldPkg} dan ingin ganti ke ${newPkg}.`
  const addons: string[] = []
  if (newSel.waBlastTier > 0 && newSel.waBlastTier !== oldSel.waBlastTier) {
    addons.push(`WA Blast ${newSel.waBlastTier}`)
  }
  if (newSel.express && !oldSel.express) addons.push("Layanan Express")
  if (newSel.fisik && !oldSel.fisik) addons.push("Undangan Fisik")
  const g = newSel.galeri
  const og = oldSel.galeri
  if (g?.on && (!og?.on || og.photos !== g.photos || og.guests !== g.guests)) {
    addons.push(`Galeri Tamu ${g.photos || "?"} foto × ${g.guests || "?"} tamu`)
  }
  if (addons.length > 0) text += ` Add-on baru: ${addons.join(", ")}.`
  if (newSel.delta != null && newSel.delta > 0) text += ` Selisih bayar: ${formatRupiah(newSel.delta)}.`
  return `${text} Mohon bantuan konsultan.`
}

export function packageChangeWaLink(oldSel: PackageChangeSelection, newSel: PackageChangeSelection): string {
  return waLink(packageChangeWaText(oldSel, newSel))
}
