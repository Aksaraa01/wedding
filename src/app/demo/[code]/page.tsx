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
    />
  )
}