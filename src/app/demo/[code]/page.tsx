import { notFound } from "next/navigation"
import { getTemplateComponent } from "@/components/templates"

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
      groom_full_name="Reza Pratama"
      bride_full_name="Alexa Amanda"
      groom_photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
      bride_photo_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face"
      groom_parents="Bapak Hendra & Ibu Sari"
      bride_parents="Bapak Wijaya & Ibu Dewi"
    />
  )
}