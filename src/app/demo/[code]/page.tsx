import { notFound } from "next/navigation"
import { getTemplateComponent } from "@/components/templates"
import { ASSETS } from "@/lib/assets"

export default async function DemoPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const Template = getTemplateComponent(code)
  if (!Template) notFound()

  return (
    <Template
      bride_name="Alexa"
      groom_name="Reza"
      estimated_wedding_date="2026-12-31"
      slug="demo"
      guest_name="Sahabat"
      display_name="Alexa & Reza"
      groom_full_name="Reza Pratama"
      bride_full_name="Alexa Amanda"
      groom_photo_url={ASSETS.demo.groomPhoto}
      bride_photo_url={ASSETS.demo.bridePhoto}
      groom_parents="Bapak Hendra & Ibu Sari"
      bride_parents="Bapak Wijaya & Ibu Dewi"
      sessions={[
        { name: "Akad Nikah", date: "2026-12-31", time: "08:00 - 10:00", venue: "Masjid Ramlie Musyaddad", address: "Jl. Contoh No. 123", maps_url: "https://maps.google.com" },
        { name: "Resepsi Pernikahan", date: "2026-12-31", time: "11:00 - 14:00", venue: "Grand Ballroom", address: "Jl. Contoh No. 456", maps_url: "https://maps.google.com" },
      ]}
      quote_text="Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya; dan dijadikan-Nya diantaramu rasa kasih dan sayang."
      quote_source="QS. Ar-Rum: 21"
      stories={[
        { title: "Pertama Kali Bertemu", description: "Sebuah senyum di kedai kopi yang mengubah segalanya.", image_url: ASSETS.demo.story1 },
        { title: "Pertanyaan Besar", description: "Di bawah langit senja, janji suci pun terucap.", image_url: ASSETS.demo.story2 },
      ]}
      gallery_photos={[
        ASSETS.demo.gallery[0],
        ASSETS.demo.gallery[1],
        ASSETS.demo.gallery[2],
      ]}
      gift_accounts={[
        { provider_name: "BANK MANDIRI", account_number: "338001052747530", account_name: "TRIA AMANDA SARI", type: "bank" },
        { provider_name: "SHOPEEPAY", account_number: "082361944259", account_name: "TRIA AMANDA SARI", type: "ewallet" },
      ]}
      gift_address="Jl. Contoh Alamat No. 123, Jakarta Selatan, DKI Jakarta 12345"
      track_url={ASSETS.demoAudio}
      inviting_families={["Bpk. Hendra & Ibu Sari", "Bpk. Wijaya & Ibu Dewi"]}
    />
  )
}