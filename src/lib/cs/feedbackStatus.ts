// Status revisi undangan untuk klien terverifikasi. Hanya membaca baris milik
// profil yang terikat ke percakapan — tidak pernah menerima id dari pesan.

import { supabaseAdmin } from "@/lib/supabase"
import { eventSite } from "@/lib/eventType"
import { feedbackReplyText, type FeedbackSummary, type FeedbackStatus } from "@/lib/cs/feedbackReply"

const DAY_MS = 86_400_000

interface FeedbackRow {
  area: string | null
  status: string
  round_number: number | null
  created_at: string
}

export async function loadFeedbackSummary(profileId: string): Promise<FeedbackSummary> {
  const { data } = await supabaseAdmin
    .from("feedback_submissions")
    .select("area,status,round_number,created_at")
    .eq("wedding_profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100)

  const rows = (data || []) as FeedbackRow[]
  const pending = rows.filter((row) => row.status === "pending").length
  const inProgress = rows.filter((row) => row.status === "in_progress").length
  const resolved = rows.filter((row) => row.status === "resolved").length
  const maxRound = rows.reduce((max, row) => Math.max(max, Number(row.round_number) || 0), 0)

  const latestRow = rows[0] || null
  const openRows = rows.filter((row) => row.status !== "resolved")
  const oldestOpen = openRows.length
    ? Math.min(...openRows.map((row) => new Date(row.created_at).getTime()))
    : null

  return {
    total: rows.length,
    pending,
    inProgress,
    resolved,
    maxRound,
    latest: latestRow
      ? {
          area: latestRow.area,
          status: (latestRow.status as FeedbackStatus) || "pending",
          createdAt: latestRow.created_at,
        }
      : null,
    openDays: oldestOpen ? Math.max(0, Math.floor((Date.now() - oldestOpen) / DAY_MS)) : null,
  }
}

export async function feedbackStatusReply(
  profileId: string,
  eventType: unknown = "wedding"
): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("display_name,groom_name,bride_name,event_type")
    .eq("id", profileId)
    .maybeSingle()

  const coupleName =
    (profile?.display_name as string) ||
    [profile?.groom_name, profile?.bride_name].filter(Boolean).join(" & ") ||
    null

  const summary = await loadFeedbackSummary(profileId)

  return feedbackReplyText({
    coupleName,
    summary,
    dashboardUrl: `${eventSite(profile?.event_type || eventType)}/dashboard/${profileId}/web-invitation/feedback/new`,
  })
}
