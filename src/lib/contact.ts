// Central contact for Aksaraa Wedding customer-facing WhatsApp links
// (consultation, login help, payment gate). Change the number once here —
// it applies everywhere. Couple-specific links (ops console contacting the
// couple) intentionally stay dynamic per wedding profile.

export const AKSARAA_WA_NUMBER = "6281161613071"

import { getPackageCategory, PACKAGE_LABELS } from "@/lib/packages"

export function waLink(text: string): string {
  return `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(text)}`
}

// Payment CTA prefill: names the couple's package + Galeri tier so the
// consultant instantly knows what is being paid. Missing pieces degrade to
// the plain base message, never to a half-filled sentence.
export function paymentWaText(opts: { packageType?: string | null; galeriTier?: string | null }): string {
  const base = "Halo Aksaraa Wedding, Saya mau melakukan pembayaran"
  const pkg = (opts.packageType || "").trim()
  if (!pkg) return base
  let text = `${base} paket ${getPackageCategory(pkg)} ${PACKAGE_LABELS[pkg] || pkg}`
  const tier = (opts.galeriTier || "").trim()
  if (tier) text += ` dengan Galeri Tamu ${tier}`
  return text
}

export function paymentWaLink(opts: { packageType?: string | null; galeriTier?: string | null }): string {
  return waLink(paymentWaText(opts))
}
