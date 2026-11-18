// Halaman yang boleh menampilkan widget CS.
//
// Deny by default: rute baru (dashboard, auth, checkout, undangan tamu, scanner)
// tidak ikut kebagian widget hanya karena memakai komponen Navigation. Undangan
// tamu /w/[slug] sengaja tidak pernah mengimpor widget sama sekali (invariant
// performa undangan), daftar ini hanya menjaga permukaan marketing.

const MARKETING_EXACT = new Set([
  "/",
  "/hero",
  "/templates",
  "/design",
  "/premium-web-invitation",
  "/qr-digital-buku-tamu",
  "/virtual-wish-wall",
  "/reminder-tamu-vip",
  "/galeri-kenangan-tamu",
  "/fitur",
  "/artikel",
  "/portofolio",
  "/checklist-nikah",
  "/kalkulator-budget",
])

const MARKETING_PREFIX = ["/templates/", "/fitur/", "/artikel/", "/portofolio/"]

export function csWidgetEnabledOn(pathname: string): boolean {
  const raw = (pathname || "/").split("?")[0].split("#")[0]
  const path = raw.length > 1 ? raw.replace(/\/+$/, "") : "/"
  if (MARKETING_EXACT.has(path)) return true
  return MARKETING_PREFIX.some((prefix) => path.startsWith(prefix))
}
