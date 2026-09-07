// Couple slug — "Rafi Namu" + "Novi Kamu" -> "RafiNamu-NoviKamu".
// Each person's name has its spaces/punctuation merged into ONE camel token
// (case preserved), and the couple is joined with "-". Diacritics are stripped.
// Lowercase variants are matched case-insensitively at lookup (subdomains are
// lowercased by browsers, so w/[slug] resolves via ILIKE).
export function slugifyName(name: string): string {
  return (name || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
}

export function slugifyCouple(name1: string, name2: string): string {
  const a = slugifyName(name1)
  const b = slugifyName(name2)
  return a && b ? `${a}-${b}` : a || b
}