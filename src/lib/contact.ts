// Central contact for Aksaraa Wedding customer-facing WhatsApp links
// (consultation, login help, payment gate). Change the number once here —
// it applies everywhere. Couple-specific links (ops console contacting the
// couple) intentionally stay dynamic per wedding profile.

export const AKSARAA_WA_NUMBER = "6281161613071"

export function waLink(text: string): string {
  return `https://wa.me/${AKSARAA_WA_NUMBER}?text=${encodeURIComponent(text)}`
}
