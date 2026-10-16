import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

// Public poll endpoint for the LED wall (same posture as /api/wishes/led).
// Returns check-ins newer than `since` plus the wall greeting config.
// `enabled` is true only for Buku Tamu Digital packages — the package is
// the gate, the profile flag is just a preference.
export async function GET(req: Request) {
  const rl = checkRateLimit(`led-checkins:${getClientIp(req)}`, 60, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs || 60_000)

  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("package_type, led_greeting_enabled, led_greeting_duration_sec")
      .eq("id", weddingProfileId)
      .maybeSingle()

    const pkg = (profile?.package_type || "") as string
    const isDgb = pkg.startsWith("dgb_")
    const enabled = isDgb && (profile as any)?.led_greeting_enabled === true
    const durationRaw = (profile as any)?.led_greeting_duration_sec
    const durationSec = durationRaw === 15 || durationRaw === 20 || durationRaw === 30 ? durationRaw : 30
    const now = new Date().toISOString()

    if (!enabled) {
      return NextResponse.json({ enabled: false, durationSec, now, checkins: [] })
    }

    const since = searchParams.get("since") || new Date(Date.now() - 3 * 60_000).toISOString()

    const { data: checkins, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, category, checkin_timestamp")
      .eq("wedding_profile_id", weddingProfileId)
      .eq("is_checked_in", true)
      .gt("checkin_timestamp", since)
      .order("checkin_timestamp", { ascending: true })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      enabled: true,
      durationSec,
      now,
      checkins: (checkins || []).map((g: any) => ({
        guest_id: g.id,
        name: g.name || "",
        category: g.category || "",
        checkin_timestamp: g.checkin_timestamp,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
