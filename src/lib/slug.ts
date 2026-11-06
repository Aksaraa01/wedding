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

// The slug IS the couple's subdomain, and a DNS label maxes out at 63 octets.
// Anything longer can never resolve (the browser answers
// DNS_PROBE_FINISHED_NXDOMAIN before a request is made), so registration asks
// for nicknames and refuses to create a slug that long.
export const MAX_COUPLE_SLUG_LENGTH = 63

export function coupleSlugError(name1: string, name2: string): string | null {
  const slug = slugifyCouple(name1, name2)
  if (!slug || slug.length <= MAX_COUPLE_SLUG_LENGTH) return null
  return `Nama terlalu panjang: alamat undangan menjadi ${slug.length} karakter (maks. ${MAX_COUPLE_SLUG_LENGTH}). Isi dengan nama panggilan saja, misalnya “Rafi” & “Novi”.`
}