// Pembersih teks balasan: buang karakter tak terlihat dan sisa aksara asing
// yang kadang menempel di penanda daftar (mis. "•ॅ ").

export function sanitizeReply(text: string): string {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/^([•\-*])\s*[\u0900-\u097F]+/gm, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
