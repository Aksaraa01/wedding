import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizeTemplateTier, tierBadgeClass } from "@/lib/templateTier"
import { TEMPLATE_CATEGORIES, getCategory, matchesCategory } from "@/lib/templateCategory"
import SeoFaq from "@/components/SeoFaq"

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
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center mb-10">
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold mb-3">
          <Link href="/templates" className="hover:underline">Galeri Template</Link>
          {" • "}
          {cat.label}
        </p>
        <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mb-6">
          {cat.h1}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {cat.intro} Setiap desain sudah lengkap dengan RSVP online, amplop digital, dan galeri foto.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/customize"
            className="px-8 py-3.5 rounded-full bg-[#B34E3F] text-white text-xs font-semibold tracking-widest uppercase hover:bg-[#9A3F32] transition-colors"
          >
            Lihat Harga &amp; Paket
          </Link>
        </div>
      </section>

      {templates.length === 0 ? (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16 text-center">
          <p className="font-body-md text-sm text-on-surface-variant">
            Koleksi {cat.label} segera hadir — lihat{" "}
            <Link href="/templates" className="font-semibold text-[#B34E3F] underline underline-offset-2">
              semua template
            </Link>{" "}
            terlebih dahulu.
          </p>
        </section>
      ) : (
        <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-12">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-x-4 lg:gap-y-10 lg:overflow-visible">
            {templates.map((t) => {
              const styleTag = (t.category || "Modern").toUpperCase()
              const tierTag = normalizeTemplateTier(t.tier)?.toUpperCase() ?? null
              return (
                <article key={t.id} className="template-card group flex flex-col shrink-0 snap-start w-[72vw] max-w-[300px] lg:w-auto lg:max-w-none bg-white border border-[#E2D9CF] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="relative overflow-hidden aspect-[9/19] bg-[#FAF7F2]">
                    {t.preview_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={`Template undangan pernikahan digital ${t.name}`}
                        className="w-full h-full object-cover object-top transition-transform duration-[1.5s] group-hover:scale-105"
                        src={t.preview_image_url}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#B34E3F] text-sm">
                        {t.name}
                      </div>
                    )}
                    {tierTag && (
                      <span className={`absolute top-3 left-3 text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm ${tierBadgeClass(t.tier)}`}>{tierTag}</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-headline-md text-[14px] leading-tight text-[#2C2A29] flex-1">{t.name}</h2>
                      <span className="shrink-0 px-2 py-0.5 bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] text-[9px] font-bold tracking-widest uppercase rounded-full">{styleTag}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Link
                        href={`/premium-web-invitation?template=${encodeURIComponent(t.code)}`}
                        className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#F5EFE6] border border-[#E2D9CF] text-[#2C2A29] hover:bg-[#E2D9CF] transition-colors text-center"
                      >
                        Lihat Template
                      </Link>
                      <Link
                        href={`/register?template=${encodeURIComponent(t.code)}`}
                        className="flex-1 py-2.5 font-label-md text-[10px] uppercase tracking-widest rounded-full bg-[#B34E3F] border border-[#B34E3F] text-white hover:bg-[#9E3B2D] transition-colors text-center"
                      >
                        Pilih
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-4 text-center">
        <p className="text-sm text-on-surface-variant mb-3">Lihat gaya lain:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {others.map((c) => (
            <Link
              key={c.id}
              href={`/templates/kategori/${c.id}`}
              className="rounded-full border border-[#E2D9CF] bg-white px-5 py-2 font-label-md text-[11px] uppercase tracking-widest text-[#2C2A29] hover:border-[#B34E3F] hover:text-[#B34E3F] transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <SeoFaq
        heading={`Pertanyaan tentang Undangan ${cat.label}`}
        items={[
          {
            q: `Apakah template ${cat.label.toLowerCase()} bisa diganti nanti?`,
            a: `Bisa. Ganti desain kapan saja dari dashboard tanpa mengulang data — nama, acara, galeri, dan tamu tetap tersimpan. Lihat [halaman harga](/customize) untuk paketnya.`,
          },
          {
            q: "Apakah tamu perlu install aplikasi untuk membuka undangan?",
            a: "Tidak. Undangan website, RSVP, amplop digital, dan galeri berjalan langsung di browser HP tamu.",
          },
          {
            q: "Bagaimana cara memakai template ini?",
            a: `Pilih desain ${cat.label.toLowerCase()} favorit, daftar, isi data mempelai dan acara di editor — undangan langsung jadi dan siap dibagikan lewat WhatsApp.`,
          },
        ]}
      />
    </main>
  )
}
