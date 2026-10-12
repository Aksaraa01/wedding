import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"

// Bare /scanner (no slug), e.g. https://d-d.wedding.aksaraa.com/scanner:
// the couple is resolved from the subdomain, mirroring how the invitation
// root and QR links scope to the couple. Falls back to /hero when the host
// carries no couple subdomain (apex, localhost).
export default async function ScannerIndex() {
  const host = (await headers()).get("host") || ""
  const subdomain = host.split(":")[0].split(".")[0]
  if (subdomain) {
    const { data } = await supabaseAdmin
      .from("wedding_profiles")
      .select("slug")
      .ilike("slug", subdomain)
      .maybeSingle()
    if (data?.slug) redirect(`/scanner/${data.slug}`)
  }
  redirect("/hero")
}
