import { supabaseAdmin } from "@/lib/supabase"
import { generateUniqueToken } from "@/lib/qr"
import { getFeatureIncluded } from "@/lib/featureGates"

// Case-preserving guest slug: "Bpk. Surya Wahyudi " -> "Bpk.-Surya-Wahyudi".
// Keeps the guest's exact casing + punctuation, collapses whitespace runs to "-",
// and keeps "&" URL-safe ("&" -> "dan"). Always encodeURIComponent at build sites.
export function slugifyName(name: string): string {
  return (name || "")
    .trim()
    .replace(/&/g, "dan")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
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
  guests: { id: string; name: string; qr_token?: string | null }[]
): Promise<number> {
  if (guests.length === 0) return 0

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("payment_status, package_type")
    .eq("id", weddingProfileId)
    .single()

  // The invitation slug is only generated for PAID profiles. The QR token is a
  // separate fallback identifier (not part of the slug), generated only when the
  // profile's package includes the qr_code_book feature (from package_features).
  if (!profile || profile.payment_status === "UNPAID") return 0
  const features = await getFeatureIncluded(profile.package_type)
  const generateQr = features.has("qr_code_book")

  let generated = 0
  for (const g of guests) {
    const slug = await generateUniqueSlug(weddingProfileId, g.name)
    const update: Record<string, string> = { slug }
    if (generateQr && !g.qr_token) {
      update.qr_token = await generateUniqueToken()
    }
    const { error } = await supabaseAdmin
      .from("guests")
      .update(update)
      .eq("id", g.id)
    if (!error) generated += 1
  }
  return generated
}
