import { supabaseAdmin } from "@/lib/supabase"
import { generateUniqueToken } from "@/lib/qr"

export function slugifyName(name: string): string {
  return name.toLowerCase().replace(/&/g, "dan").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function generateUniqueSlug(weddingProfileId: string, name: string): Promise<string> {
  const base = slugifyName(name) || "tamu"
  for (let i = 0; i < 100; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const { data } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("wedding_profile_id", weddingProfileId)
      .eq("slug", candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  return `${base}-${Date.now().toString(36)}`
}

export async function autoGenerateGuestLinks(
  weddingProfileId: string,
  guests: { id: string; name: string }[]
): Promise<number> {
  if (guests.length === 0) return 0

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("payment_status")
    .eq("id", weddingProfileId)
    .single()

  if (!profile || profile.payment_status === "UNPAID") return 0

  let generated = 0
  for (const g of guests) {
    const token = await generateUniqueToken()
    const slug = await generateUniqueSlug(weddingProfileId, g.name)
    const { error } = await supabaseAdmin
      .from("guests")
      .update({ qr_token: token, slug })
      .eq("id", g.id)
    if (!error) generated += 1
  }
  return generated
}
