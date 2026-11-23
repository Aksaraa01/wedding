import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { TEMPLATE_CONFIGS, getTemplateComponent, getTemplateConfig } from "@/components/templates"
import { DEMO_PROPS_BY_CODE } from "@/components/templates/demoProps"
import { ASSETS } from "@/lib/assets"
import type { TemplateProps } from "@/types/template"

// Every demo page renders the same fixed demo props: nothing is resolved per
// request (no DB, no headers, no cookies). Prerender one page per template at
// build time and revalidate hourly, so the preview does not pay SSR latency on
// every open and can be cached at the edge.
export const revalidate = 3600

export function generateStaticParams() {
  return TEMPLATE_CONFIGS.filter((tpl) => getTemplateComponent(tpl.code)).map((tpl) => ({ code: tpl.code }))
}

const DEMO_PROPS: TemplateProps = {
  bride_name: "Annisa",
  groom_name: "Farhan",
  display_name: "Farhan & Annisa",
  couple_initials: "FA",
  estimated_wedding_date: "2030-07-20",
  slug: "demo",
  guest_name: "Tamu Undangan",
  groom_full_name: "Farhan Putra Nugraha",
  bride_full_name: "Annisa Kirana Putri",
  groom_photo_url: ASSETS.defaults.groom,
  bride_photo_url: ASSETS.defaults.bride,
  groom_parents: "Putra tercinta dari Bapak F & Ibu G",
  bride_parents: "Putri tercinta dari Bapak A & Ibu B",
  groom_instagram: "@farhan",
  bride_instagram: "@annisa",
  couple_illustration_url: ASSETS.defaults.couple,
  cover_photos: [ASSETS.defaults.couple],
  sessions: [
    {
      name: "Akad Nikah",
      date: "2030-07-20",
      time: "08:00 – 10:00 WIB",
      venue: "The Sky Chapel, Penthouse 48F",
      address: "Jakarta",
      maps_url: "https://maps.google.com",
    },
    {
      name: "Resepsi Pernikahan",
      date: "2030-07-20",
      time: "18:00 – 21:30 WIB",
      venue: "Grand Ballroom Penthouse",
      address: "Jakarta",
      maps_url: "https://maps.google.com",
    },
  ],
  quote_text: "Dua jiwa, satu tujuan, mengarungi samudera kehidupan bersama di bawah gemerlap cakrawala kota.",
  quote_source: "Gus Anwar",
  video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  stories: [
    {
      title: "First Met",
      description: "Pertemuan pertama kami di sudut hangat kedai kopi metropolitan, di mana obrolan hangat mengubah dua orang asing menjadi satu tujuan.",
      image_url: ASSETS.demo.story1,
    },
    {
      title: "The Proposal",
      description: "Di bawah gemerlap cahaya cakrawala kota dari rooftop yang tinggi, sebuah janji terucap dan ‘Ya’ menjadi awal perjalanan abadi kami.",
      image_url: ASSETS.demo.story2,
    },
  ],
  gallery_photos: ASSETS.demo.gallery,
  gift_accounts: [
    { provider_name: "Bank BCA", account_number: "1234-5678-90", account_name: "Farhan Putra", type: "bank" },
    { provider_name: "DANA", account_number: "0812-3456-7890", account_name: "Annisa Kirana", type: "ewallet" },
  ],
  gift_address: "Penthouse Suite 48A, The Grand Metropolitan Tower, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan, 12190",
  gift_address_name: "Farhan & Annisa",
  track_url: ASSETS.demoAudio,
  auto_play: false,
  inviting_families: [
    "Kel. Besar Bpk. H. Achmad Syafii (Alm) & Ibu Hj. Nurhayati",
    "Kel. Besar Bpk. Dr. Danang Priyadi & Ibu Siti Fatimah",
    "Kel. Besar Bpk. H. Ridwan Kamil & Ibu Atalia",
  ],
  feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const config = getTemplateConfig(code)
  return {
    title: `Demo: ${config?.name || code}`,
    robots: { index: false, follow: false },
  }
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const Component = getTemplateComponent(code)
  if (!Component) notFound()

  const demoProps = DEMO_PROPS_BY_CODE[code] || DEMO_PROPS
  const keepDemoIds = code === "evermore" || code === "piano-garden" || code === "altar-garden" || code === "adat-melayu" || code === "adat-batak" || code === "adat-bugis" || code === "adat-dayak" || code === "adat-banjar" || code === "adat-minang" || code === "lunar-blossom" || code === "adat-jawa" || code === "adat-jawa-2" || code === "adat-bali" || code === "adat-palembang" || code === "adat-betawi" || code === "manjari" || code === "minang-royal" || code === "imagine" || code === "still-ever" || code === "lace" || code === "n-film" || code === "boarding-pass" || code === "ivory-lace" || code === "cinnabar-seal" || code === "iris" || code === "teatro" || code === "silver-gelatin" || code === "traditional-bugis-pinishi" || code === "love-line" || code === "film-roll" || code === "majestic" || code === "fresco" || code === "emerald-heirloom" || code === "swan-garden" || code === "noir"
  const previewProps: TemplateProps = {
    ...demoProps,
    preview_mode: true,
    template_demo: true,
    wedding_profile_id: keepDemoIds ? demoProps.wedding_profile_id : undefined,
    guest_id: keepDemoIds ? demoProps.guest_id : undefined,
    guest_slug: undefined,
    guest_link_strict: undefined,
    guest_qr_url: undefined,
  }

  return (
    <div className={code === "cinnabar-seal" ? "bg-[#33080b]" : code === "iris" ? "bg-[#f3ecdf]" : code === "teatro" ? "bg-[#efe7dd]" : code === "fresco" ? "bg-[#fbf7ef]" : code === "olan" ? "bg-[#eee8e5]" : code === "emerald-heirloom" ? "bg-[#566a58]" : code === "swan-garden" ? "bg-[#eaf1e6]" : code === "majestic" ? "bg-[#f0e8e0]" : code === "noir" ? "bg-black" : code === "silver-gelatin" ? "bg-[#f4efe9]" : code === "ubin-ottoman" ? "bg-[#f6eedc]" : "bg-[#05070c]"}>
      <Component {...previewProps} />
    </div>
  )
}
