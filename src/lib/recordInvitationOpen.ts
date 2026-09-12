import { supabaseAdmin } from "@/lib/supabase"

const BOT_PATTERN = /WhatsApp|facebookexternalhit|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Googlebot|bingbot|Bytespider|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|redditbot|Applebot|archive\.org/i

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false
  return BOT_PATTERN.test(ua)
}

// First-touch write of guests.invitation_opened_at. Safe to call from both
// the server component (w/[slug]) and POST /api/guests/[id]/open: the
// .is("invitation_opened_at", null) guard makes concurrent calls a no-op for
// the loser. Never throws — tracking must not break page render.
export async function markInvitationOpened(guestId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("guests")
      .update({ invitation_opened_at: new Date().toISOString() })
      .eq("id", guestId)
      .is("invitation_opened_at", null)
      .select("id")
      .maybeSingle()
    if (error) return false
    return !!data
  } catch {
    return false
  }
}
