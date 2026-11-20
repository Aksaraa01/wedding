// Tautan undangan untuk klien yang sudah terverifikasi.
// Terbatas → arahkan ke dashboard (tautan per tamu), Fleksibel → satu tautan
// + ?to=nama. Jangan pernah menebak slug: selalu dari profil yang terikat.

import { supabaseAdmin } from "@/lib/supabase"
import { coupleUrl } from "@/lib/coupleUrl"
import { eventSite } from "@/lib/eventType"
import { getPublishBlockers } from "@/lib/publishBlockers"
import { linkReplyText } from "@/lib/cs/linkReply"
import { pendingBlockers, type PaymentState } from "@/lib/cs/statusReply"

export async function invitationLinkReply(profileId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("wedding_profiles")
    .select(
      "id,slug,event_type,guest_link_strict,is_published,invitation_disabled_at,payment_status"
    )
    .eq("id", profileId)
    .maybeSingle()

  if (!data) return null
  const slug = String(data.slug || "").trim()
  if (!slug) {
    return "Undangan ini belum punya tautan karena data pasangan belum lengkap. Balas \"bantu isi undangan\" biar aku bantu lengkapi dulu."
  }

  const published = data.is_published === true
  const contentBlockers = published
    ? []
    : (await getPublishBlockers(profileId).catch(() => [])).map((item) => item.label)
  const blockers = pendingBlockers({
    payment: (data.payment_status as PaymentState) || "UNPAID",
    contentBlockers,
    published,
  })

  return linkReplyText({
    link: coupleUrl(slug, "", data.event_type),
    mode: data.guest_link_strict === false ? "fleksibel" : "terbatas",
    published,
    blockers,
    dashboardUrl: `${eventSite(data.event_type)}/dashboard/${profileId}/qr-guestbook`,
    disabled: !!data.invitation_disabled_at,
  })
}
