import { supabaseAdmin } from "@/lib/supabase"

// In-house templates render per-guest invited sessions; WP templates do not.
// Returns true only when the profile's selected template is explicitly inhouse.
export async function templateSupportsInvitedSessions(weddingProfileId: string): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("selected_template_id")
    .eq("id", weddingProfileId)
    .maybeSingle()
  const templateId = profile?.selected_template_id
  if (!templateId) return false

  const { data: tpl } = await supabaseAdmin
    .from("web_templates")
    .select("source_type")
    .eq("id", templateId)
    .maybeSingle()

  return tpl?.source_type === "inhouse"
}
