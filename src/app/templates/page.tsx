import type { Metadata } from "next"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import SeoFaq from "@/components/SeoFaq"

export const metadata: Metadata = {
  title: "Galeri Template Undangan Pernikahan Digital",
  description:
    "Jelajahi galeri template undangan pernikahan digital: adat, modern, floral, elegansi dark, hingga tanpa foto. Pilih desain favorit dan buat undangan Anda.",
  alternates: { canonical: "https://wedding.aksaraa.com/templates" },
  openGraph: {
    title: "Galeri Template Undangan Pernikahan Digital | Aksaraa",
    description:
      "Ratusan template undangan website — adat, modern, floral, tanpa foto — siap pakai dengan RSVP dan amplop digital.",
  },
}

export const revalidate = 3600

type TemplateRow = {
  id: string
  code: string
  name: string
  preview_image_url: string | null
  category: string | null
  tier: string | null
  no_photo: boolean | null
}

async function getTemplates(): Promise<TemplateRow[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,code,name,preview_image_url,category,tier,no_photo")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return (data as TemplateRow[] | null) || []
}

export default async function TemplatesIndexPage() {
  const templates = await getTemplates()
  const byCategory = new Map<string, TemplateRow[]>()
  for (const t of templates) {
    const cat = (t.category || "Lainnya").trim() || "Lainnya"
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(t)
  }
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b, "id"))

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-12">
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          Galeri Template Undangan Pernikahan Digital
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {templates.length}+ template undangan website pernikahan — adat, modern, floral, elegansi dark,
          hingga tanpa foto. Setiap desain sudah lengkap dengan RSVP online, amplop digital, dan galeri foto.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Lihat Harga &amp; Paket
          </Link>
          <Link
            href="/premium-web-invitation"
            className="px-8 py-3.5 rounded-full border border-[#B34E3F] text-[#B34E3F] text-xs font-semibold tracking-widest uppercase hover:bg-[#B34E3F] hover:text-white transition-colors"
          >
            Cara Membuat
          </Link>
        </div>
      </section>

      {categories.map((cat) => (
        <section key={cat} className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-12">
          <h2 className="font-headline-md text-xl md:text-2xl text-[#2C2A29] mb-5">
            Undangan {cat}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {(byCategory.get(cat) || []).map((t) => (
              <Link
                key={t.id}
                href={`/register?template=${encodeURIComponent(t.code)}`}
                className="group bg-white border border-[#E2D9CF] rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {t.preview_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.preview_image_url}
                    alt={`Template undangan pernikahan digital ${t.name}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-[#F5EFE6] flex items-center justify-center text-[#B34E3F] text-sm">
                    {t.name}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-[#2C2A29] text-sm md:text-base group-hover:text-[#B34E3F]">
                    {t.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Undangan {cat}
                    {t.no_photo ? " • Tanpa Foto" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <SeoFaq
        heading="Pertanyaan tentang Template Undangan"
        items={[
          {
            q: "Bagaimana cara memakai template undangan ini?",
            a: "Pilih desain favorit, daftar, lalu isi data mempelai dan acara di editor — undangan website langsung jadi dan siap dibagikan lewat WhatsApp. Lihat [halaman harga](/customize) untuk paketnya.",
          },
          {
            q: "Apakah ada template undangan adat dan tanpa foto?",
            a: "Ada. Gunakan kategori Adat/Tradisional untuk nuansa budaya, atau Tanpa Foto bila mengutamakan privasi — keduanya tetap lengkap dengan RSVP dan amplop digital.",
          },
          {
            q: "Bisakah ganti template setelah undangan jadi?",
            a: "Bisa. Ganti desain kapan saja dari dashboard tanpa mengulang data — nama, acara, galeri, dan tamu tetap tersimpan.",
          },
          {
            q: "Apakah template bisa dicoba dulu?",
            a: "Ya. Buka halaman [premium web invitation](/premium-web-invitation) untuk melihat pratinjau tiap desain sebelum memilih paket.",
          },
        ]}
      />
    </main>
  )
}
