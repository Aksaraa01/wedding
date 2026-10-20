import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTemplateComponent, getTemplateConfig } from "@/components/templates"
import { DEMO_PROPS_BY_CODE } from "@/components/templates/demoProps"
import { ASSETS } from "@/lib/assets"
import type { TemplateProps } from "@/types/template"

export const dynamic = "force-dynamic"

const TM = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media"

const NIHARA_MIST_DEMO: TemplateProps = {
  slug: "demo",
  groom_name: "Vincent",
  bride_name: "Felicia",
  couple_initials: "VF",
  display_name: "#VincentFelicia2026",
  groom_full_name: "Vincent Morgan Leonardo",
  bride_full_name: "Felicia Sagita Pandiangan",
  estimated_wedding_date: "2026-10-16",
  guest_name: "Tamu Undangan",
  cover_photos: [
    `${TM}/1790765548170-DSC06466.jpg`,
    `${TM}/1790765550955-DSC07125.jpg`,
    `${TM}/1790765554693-DSC07047.jpg`,
    `${TM}/1790765557463-DSC06424.jpg`,
    `${TM}/1790766757680-DSC07110.jpg`,
  ],
  couple_illustration_url: `${TM}/1790765548170-DSC06466.jpg`,
  groom_photo_url: [`${TM}/1790766039655-DSC06967.jpg`],
  bride_photo_url: [`${TM}/1790766068391-DSC06875.jpg`],
  groom_parents: "Putra dari Bapak Leonardo & Ibu Romauli",
  bride_parents: "Putri dari Bapak Pandiangan & Ibu Simbolon",
  groom_instagram: "@vincentmorgan",
  bride_instagram: "@feliciasagita",
  opening_title: "Warmest Greetings",
  opening_description:
    "Assalamu'alaikum warahmatullahi wabarakatuh. Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, InsyaaAllah kami akan menyelenggarakan acara pernikahan kami.",
  quote_text:
    "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
  quote_source: "QS Ar-Rum : 21",
  story_visible: false,
  gift_section_visible: false,
  sessions: [
    {
      name: "Akad Nikah",
      date: "2026-10-16",
      time: "07.30 - 09.30 WIB",
      venue: "Santika Premiere Dyandra Hotel",
      address: "Jl. Kapten Maulana Lubis No.7, Petisah Tengah, Kota Medan, Sumatera Utara 20111.",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "Resepsi",
      date: "2026-10-16",
      time: "11.00 - 17.00 WIB",
      venue: "Santika Premiere Dyandra Hotel",
      address: "Jl. Kapten Maulana Lubis No.7, Petisah Tengah, Kota Medan, Sumatera Utara 20111.",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "Pertemuan Pertama",
      description:
        "Semuanya dimulai dari sebuah perkenalan sederhana yang kemudian menumbuhkan rasa nyaman satu sama lain. Waktu membawa kami saling mengenal lebih dalam.",
      image_url: `${TM}/1790766757680-DSC07110.jpg`,
    },
    {
      title: "Menuju Selamanya",
      description:
        "Setelah melewati banyak cerita, kami memutuskan untuk melangkah bersama. Hari ini kami mengundang Anda untuk menjadi bagian dari awal perjalanan kami.",
      image_url: `${TM}/1790766888427-DSC07363__2_.jpg`,
    },
  ],
  gallery_photos: [
    `${TM}/1790766757680-DSC07110.jpg`,
    `${TM}/1790766759805-DSC06067.jpg`,
    `${TM}/1790766888427-DSC07363__2_.jpg`,
    `${TM}/1790768649651-DSC07291__2_.jpg`,
    `${TM}/1790765548170-DSC06466.jpg`,
    `${TM}/1790765550955-DSC07125.jpg`,
  ],
  video_url: "https://youtu.be/-ARVwU58l7A",
  gift_accounts: [
    { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "Vincent Morgan Leonardo", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Felicia Sagita Pandiangan", type: "bank" },
  ],
  gift_address: "Jl. Pahlawan No. 123, Medan 20111",
  gift_address_name: "Felicia Sagita Pandiangan",
  track_url: "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/audio.mp3",
  auto_play: true,
  inviting_families: [
    "Keluarga Bapak Leonardo & Ibu Romauli",
    "Keluarga Bapak Pandiangan & Ibu Simbolon",
    "Keluarga Besar Kedua Mempelai",
  ],
  dresscode: {
    colors: [
      { hex: "#e8e6e1", name: "Ivory" },
      { hex: "#b9bfc4", name: "Silver Mist" },
      { hex: "#6d7681", name: "Slate" },
      { hex: "#23262b", name: "Charcoal" },
    ],
  },
  livestream: { url: "https://www.youtube.com/live/dummy-livestream-link" },
  feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
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
    title: `Demo — ${config?.name || code}`,
    robots: { index: false, follow: false },
  }
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const Component = getTemplateComponent(code)
  if (!Component) notFound()

  const demoProps = DEMO_PROPS_BY_CODE[code] || (code === "nihara-mist" ? NIHARA_MIST_DEMO : DEMO_PROPS)

  return (
    <div className="bg-[#05070c]">
      <Component {...demoProps} />
    </div>
  )
}
