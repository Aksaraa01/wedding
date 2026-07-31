import { supabaseAdmin } from "@/lib/supabase"

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
