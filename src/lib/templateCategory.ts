// Shared template-category definitions: filter ids, matching predicate,
// and per-category SEO copy. Single source for /premium-web-invitation
// (client filters) and /templates/[category] (SSR landing pages).

export type TemplateCategory = {
  id: string
  label: string
  h1: string
  description: string
  intro: string
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "adat",
    label: "Adat/Tradisional",
    h1: "Template Undangan Pernikahan Adat & Tradisional",
    description:
      "Template undangan digital adat Jawa, Batak, Minang, Bugis, dan tradisional lainnya — lengkap dengan RSVP, amplop digital, dan galeri foto.",
    intro:
      "Pilih template undangan website bernuansa adat dan tradisional: motif klasik, aksara daerah, dan palet warna khas — dipadukan dengan RSVP online dan amplop digital modern.",
  },
  {
    id: "modern",
    label: "Modern Minimalis",
    h1: "Template Undangan Pernikahan Modern Minimalis",
    description:
      "Template undangan digital modern minimalis: bersih, elegan, dan timeless. Lengkap dengan RSVP online, amplop digital, dan galeri foto.",
    intro:
      "Desain modern minimalis yang bersih dan timeless — tipografi rapi, ruang putih lega, dan fokus pada foto serta informasi acara Anda.",
  },
  {
    id: "elegansi",
    label: "Elegansi Dark",
    h1: "Template Undangan Pernikahan Elegansi Dark",
    description:
      "Template undangan digital dark yang mewah dan dramatis: latar gelap, aksen emas, dan tipografi anggun untuk pernikahan malam yang berkesan.",
    intro:
      "Tampil beda dengan undangan berlatar gelap: aksen emas, tipografi anggun, dan nuansa sinematik untuk pernikahan malam yang mewah.",
  },
  {
    id: "floral",
    label: "Floral",
    h1: "Template Undangan Pernikahan Floral",
    description:
      "Template undangan digital floral yang romantis: ilustrasi bunga watercolor dan pastel untuk undangan pernikahan yang lembut dan manis.",
    intro:
      "Ilustrasi bunga watercolor, warna pastel, dan ornamen botani yang romantis — favorit untuk akad pagi dan resepsi garden party.",
  },
  {
    id: "tanpa-foto",
    label: "Tanpa Photo",
    h1: "Template Undangan Pernikahan Tanpa Foto",
    description:
      "Template undangan digital tanpa foto untuk privasi maksimal: tipografi dan ornamen cantik tanpa menampilkan foto prewedding Anda.",
    intro:
      "Jaga privasi tanpa mengorbankan keindahan: desain tipografi dan ornamen yang berdiri sendiri — cocok untuk undangan yang intim dan tertutup.",
  },
]

export function matchesCategory(cat: string | null | undefined, filterId: string): boolean {
  const c = (cat || "").trim().toLowerCase()
  switch (filterId) {
    case "semua":
      return true
    case "adat":
      return c.includes("adat") || c.includes("tradisional") || c === "budaya"
    case "modern":
      return c.includes("modern") || c.includes("minimalis") || c === "nasional"
    case "elegansi":
      return c.includes("elegansi") || c.includes("dark")
    case "floral":
      return c.includes("floral")
    default:
      return c === filterId
  }
}

export function getCategory(id: string): TemplateCategory | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id)
}
