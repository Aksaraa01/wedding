import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import { TEMPLATE_CATEGORIES, getCategory, matchesCategory } from "@/lib/templateCategory"
import type { GalleryTemplate } from "@/lib/templateGallery"
import Navigation from "@/components/Navigation"
import SeoFaq from "@/components/SeoFaq"
import TemplateGallery from "@/components/template-gallery/TemplateGallery"

export function generateStaticParams() {
  return TEMPLATE_CATEGORIES.map((c) => ({ category: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const cat = getCategory(category)
  if (!cat) return {}
  return {
    title: cat.h1,
    description: cat.description,
    alternates: { canonical: `https://wedding.aksaraa.com/templates/kategori/${cat.id}` },
    openGraph: { title: cat.h1, description: cat.description },
  }
}

export const revalidate = 3600

async function getTemplates(): Promise<GalleryTemplate[]> {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,code,name,preview_image_url,demo_url,category,tier,no_photo,popular_rank,sort_order,created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return (data as GalleryTemplate[] | null) || []
}

export default async function TemplateCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const cat = getCategory(category)
  if (!cat) notFound()

  const all = await getTemplates()
  const templates = all.filter((t) =>
    cat.id === "tanpa-foto" ? t.no_photo === true : matchesCategory(t.category, cat.id)
  )
  const others = TEMPLATE_CATEGORIES.filter((c) => c.id !== cat.id)

  return (
    <main className="bg-[#FAF7F2] min-h-screen pt-24 md:pt-32 pb-10">
      <Navigation />
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-10">
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold mb-3">
          <Link href="/templates" className="hover:underline">Galeri Template</Link>
          {" • "}
          {cat.label}
        </p>
        <h1 className="font-headline-lg text-[26px] leading-[1.15] md:leading-normal md:text-headline-lg text-primary mb-4 md:mb-6">
          {cat.h1}
        </h1>
        <p className="text-[13px] leading-[1.6] md:text-body-lg md:leading-relaxed text-on-surface-variant max-w-2xl mx-auto">
          {cat.intro} Setiap desain sudah lengkap dengan RSVP online, amplop digital, dan galeri foto.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/customize"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase active:bg-[#9A3F32] hover:bg-[#9A3F32] transition-colors text-center"
          >
            Lihat Harga &amp; Paket
          </Link>
        </div>
      </section>

      {templates.length === 0 ? (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16 text-center">
          <p className="font-body-md text-base md:text-sm text-on-surface-variant">
            Koleksi {cat.label} segera hadir. Lihat{" "}
            <Link href="/templates" className="font-semibold text-[#B34E3F] underline underline-offset-2">
              semua template
            </Link>{" "}
            terlebih dahulu.
          </p>
        </section>
      ) : (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-14">
          <TemplateGallery
            templates={templates}
            initialCategory={cat.id}
            showFilterBar={false}
            showShelves={false}
            previewInModal
          />
        </section>
      )}

      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-4 text-center">
        <p className="text-sm text-on-surface-variant mb-3">Lihat gaya lain:</p>
        <div className="-mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 md:flex-wrap md:justify-center md:overflow-visible md:snap-none">
            {others.map((c) => (
              <Link
                key={c.id}
                href={`/templates/kategori/${c.id}`}
                className="shrink-0 snap-start rounded-full border border-[#E2D9CF] bg-white px-4 py-2.5 md:py-2 font-label-md text-[11px] uppercase tracking-widest text-[#2C2A29] active:border-[#B34E3F] md:hover:border-[#B34E3F] md:hover:text-[#B34E3F] transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SeoFaq
        heading={`Pertanyaan tentang Undangan ${cat.label}`}
        items={[
          {
            q: `Apakah template ${cat.label.toLowerCase()} bisa diganti nanti?`,
            a: `Bisa. Ganti desain kapan saja dari dashboard tanpa mengulang data: nama, acara, galeri, dan tamu tetap tersimpan. Lihat [halaman harga](/customize) untuk paketnya.`,
          },
          {
            q: "Apakah tamu perlu install aplikasi untuk membuka undangan?",
            a: "Tidak. Undangan website, RSVP, amplop digital, dan galeri berjalan langsung di browser HP tamu.",
          },
          {
            q: "Bagaimana cara memakai template ini?",
            a: `Pilih desain ${cat.label.toLowerCase()} favorit, daftar, isi data mempelai dan acara di editor, undangan langsung jadi dan siap dibagikan lewat WhatsApp.`,
          },
        ]}
      />
    </main>
  )
}
