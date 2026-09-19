import { supabaseAdmin } from "@/lib/supabase"
import { generateUniqueToken } from "@/lib/qr"
import { getFeatureIncluded } from "@/lib/featureGates"
import { slugifyName } from "@/lib/guest-slug"

// Allowed guest-name charset (manual add/edit + bulk auto-sanitize): letters,
// digits, space, dot, comma, parentheses. Everything else is stripped.
export { sanitizeGuestName } from "@/lib/nameClean"

// Pure slug helpers live in the client-safe ./guest-slug module;
// re-exported here so server code keeps importing from "@/lib/guest-link".
export {
  slugifyName,
  prettifyGuestSlug,
  isValidGuestSlug,
  FALLBACK_GUEST_SLUG,
  FALLBACK_GUEST_NAME,
  isFallbackGuestSlug,
} from "@/lib/guest-slug"

// Display version of a raw ?to= slug, slug validation, and the Fleksibel
// fallback identity live in ./guest-slug (re-exported above) — single source.

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
  guests: { id: string; name: string; qr_token?: string | null; slug?: string | null }[]
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
    const update: Record<string, string> = {}
    if (!g.slug) {
      update.slug = await generateUniqueSlug(weddingProfileId, g.name)
    }
    if (generateQr && !g.qr_token) {
      update.qr_token = await generateUniqueToken()
    }
    if (Object.keys(update).length === 0) continue
    const { error } = await supabaseAdmin
      .from("guests")
      .update(update)
      .eq("id", g.id)
    if (!error) generated += 1
  }
  return generated
}
