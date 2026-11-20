// Status undangan untuk klien terverifikasi (bukan tebakan model).
// Semua angka dan label berasal dari DB milik profil yang terikat ke percakapan.

import { supabaseAdmin } from "@/lib/supabase"
import { coupleUrl } from "@/lib/coupleUrl"
import { eventSite } from "@/lib/eventType"
import { getPublishBlockers } from "@/lib/publishBlockers"
import { PACKAGE_LABELS } from "@/lib/packages"
import { statusReplyText, type PaymentState } from "@/lib/cs/statusReply"

export async function invitationStatusReply(profileId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("wedding_profiles")
    .select(
      "id,slug,groom_name,bride_name,display_name,package_type,payment_status,estimated_wedding_date,is_published,invitation_disabled_at,guest_link_strict,event_type"
    )
    .eq("id", profileId)
    .maybeSingle()

  if (!data) return null

  const published = data.is_published === true
  const contentBlockers = published
    ? []
    : (await getPublishBlockers(profileId).catch(() => [])).map((item) => item.label)

  const coupleName =
    (data.display_name as string) ||
    [data.groom_name, data.bride_name].filter(Boolean).join(" & ") ||
    null

  const packageLabel = PACKAGE_LABELS[String(data.package_type || "")] || null

  return statusReplyText({
    coupleName,
    packageName: packageLabel,
    payment: (data.payment_status as PaymentState) || "UNPAID",
    weddingDate: (data.estimated_wedding_date as string) || null,
    published,
    contentBlockers,
    linkMode: data.guest_link_strict === false ? "fleksibel" : "terbatas",
    link: coupleUrl(String(data.slug || ""), "", data.event_type),
    dashboardUrl: `${eventSite(data.event_type)}/dashboard/${profileId}/qr-guestbook`,
    disabled: !!data.invitation_disabled_at,
  })
}
