import type { Metadata } from "next"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import Navigation from "@/components/Navigation"
import SeoFaq from "@/components/SeoFaq"
import TemplateGallery from "@/components/template-gallery/TemplateGallery"
import type { GalleryTemplate } from "@/lib/templateGallery"

export const metadata: Metadata = {
  title: "Galeri Template Undangan Pernikahan Digital",
  description:
    "Jelajahi galeri template undangan pernikahan digital: adat, modern, floral, elegansi dark, hingga tanpa foto. Pilih desain favorit dan buat undangan Anda.",
  alternates: { canonical: "https://wedding.aksaraa.com/templates" },
  openGraph: {
    title: "Galeri Template Undangan Pernikahan Digital | Aksaraa",
    description:
      "Ratusan template undangan website untuk adat, modern, floral, hingga tanpa foto, siap pakai dengan RSVP dan amplop digital.",
  },
}

export const revalidate = 3600

async function getTemplates(): Promise<GalleryTemplate[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,code,name,preview_image_url,category,tier,no_photo,popular_rank,sort_order,created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return (data as GalleryTemplate[] | null) || []
}

export default async function TemplatesIndexPage() {
  const templates = await getTemplates()

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-7 md:mb-14">
        <h1 className="font-headline-lg text-[21px] leading-[1.25] md:leading-normal md:text-headline-lg text-primary mb-3 md:mb-6">
          Galeri Template Undangan Pernikahan Digital
        </h1>
        <p className="text-[13px] leading-[1.6] md:text-body-lg md:leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
          {templates.length}+ template undangan website pernikahan: adat, modern, floral, hingga tanpa foto.
          <span className="hidden md:inline">
            {" "}Setiap desain sudah lengkap dengan RSVP online, amplop digital, dan galeri foto.
          </span>
        </p>
        <div className="mt-4 md:mt-6 flex flex-row justify-center gap-2 md:gap-3">
          <Link
            href="/customize"
            className="px-5 md:px-8 py-2.5 md:py-3.5 rounded-full bg-[#B34E3F] text-white text-[10px] md:text-xs font-semibold tracking-widest uppercase active:bg-[#9A3F32] hover:bg-[#9A3F32] transition-colors text-center whitespace-nowrap"
          >
            Lihat Harga &amp; Paket
          </Link>
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-14">
        <TemplateGallery templates={templates} previewInModal />
      </section>

      <SeoFaq
        heading="Pertanyaan tentang Template Undangan"
        items={[
          {
            q: "Bagaimana cara memakai template undangan ini?",
            a: "Pilih desain favorit, daftar, lalu isi data mempelai dan acara di editor, undangan website langsung jadi dan siap dibagikan lewat WhatsApp. Lihat [halaman harga](/customize) untuk paketnya.",
          },
          {
            q: "Apakah ada template undangan adat dan tanpa foto?",
            a: "Ada. Gunakan kategori Adat/Tradisional untuk nuansa budaya, atau filter Tanpa Foto bila mengutamakan privasi. Keduanya tetap lengkap dengan RSVP dan amplop digital.",
          },
          {
            q: "Bisakah ganti template setelah undangan jadi?",
            a: "Bisa. Ganti desain kapan saja dari dashboard tanpa mengulang data: nama, acara, galeri, dan tamu tetap tersimpan.",
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
