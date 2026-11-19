import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"

import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"
import { getCsSettings } from "@/lib/cs/settings"
import { countUnknownStrikes, detectSentiment } from "@/lib/cs/policy"
import { handleInbound } from "@/lib/cs/orchestrator"
import { COUPLE_COOKIE, getSessionToken, verifySession } from "@/lib/sessionToken"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const COOKIE = "cs_session"
const SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sameOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")
  if (!origin || !host) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const ip = getClientIp(request)
  const ipRate = checkRateLimit(`cs-chat:${ip}`, 20, 60_000)
  if (!ipRate.ok) return rateLimited(ipRate.retryAfterMs!)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const text = typeof body.text === "string" ? body.text.trim() : ""
  if (!text) return NextResponse.json({ error: "pesan kosong" }, { status: 400 })
  if (text.length > 1000) return NextResponse.json({ error: "pesan terlalu panjang" }, { status: 400 })

  const settings = await getCsSettings()
  if (!settings.enabled) {
    return NextResponse.json({
      reply: "CS Aksaraa sedang tidak aktif. Silakan coba lagi nanti atau hubungi kami lewat WhatsApp.",
      offline: true,
    })
  }

  const cookieStore = await cookies()
  let sessionId = cookieStore.get(COOKIE)?.value || ""
  let issueCookie = false
  if (!SESSION_RE.test(sessionId)) {
    sessionId = randomUUID()
    issueCookie = true
  }

  const sessionRate = checkRateLimit(`cs-chat-session:${sessionId}`, 40, 60 * 60_000)
  if (!sessionRate.ok) return rateLimited(sessionRate.retryAfterMs!)

  const now = new Date().toISOString()
  const waJid = `web:${sessionId}`

  // Sesi dashboard (kalau ada) membuat chat ini terhubung ke profil pasangan.
  const coupleSession = await verifySession(getSessionToken(request, COUPLE_COOKIE), "couple")
  let profile: { id: string; is_published: boolean; groom_name: string; bride_name: string } | null = null
  if (coupleSession?.sub) {
    const { data } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id,is_published,groom_name,bride_name")
      .eq("id", coupleSession.sub)
      .maybeSingle()
    if (data) profile = data as { id: string; is_published: boolean; groom_name: string; bride_name: string }
  }

  const contactName = profile ? `${profile.groom_name} & ${profile.bride_name}` : "Pengunjung web"

  const { data: contact, error: contactError } = await supabaseAdmin
    .from("cs_contacts")
    .upsert(
      {
        wa_jid: waJid,
        name: contactName,
        last_seen_at: now,
        ...(profile ? { wedding_profile_id: profile.id, verified_at: now } : {}),
      },
      { onConflict: "wa_jid" }
    )
    .select("id,blocked")
    .single()

  if (contactError || !contact) {
    return NextResponse.json({ error: "contact" }, { status: 500 })
  }
  if (contact.blocked) {
    return NextResponse.json({ reply: "", blocked: true })
  }

  const { data: existing } = await supabaseAdmin
    .from("cs_conversations")
    .select("id,status")
    .eq("contact_id", contact.id)
    .eq("channel", "web")
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let conversationId = existing?.id as string | undefined

  if (!conversationId) {
    const { data: created, error } = await supabaseAdmin
      .from("cs_conversations")
      .insert({ contact_id: contact.id, channel: "web", status: "bot" })
      .select("id")
      .single()
    if (error || !created) return NextResponse.json({ error: "conversation" }, { status: 500 })
    conversationId = created.id as string
  }

  const clientMessageId =
    typeof body.client_message_id === "string" && body.client_message_id
      ? String(body.client_message_id).slice(0, 80)
      : randomUUID()

  const { data: inbound, error: inboundError } = await supabaseAdmin
    .from("cs_messages")
    .insert({
      conversation_id: conversationId,
      direction: "in",
      role: "user",
      wa_message_id: `web:${clientMessageId}`,
      body: text,
    })
    .select("id,created_at")
    .single()

  if (inboundError) {
    if (inboundError.code === "23505") {
      return NextResponse.json({ reply: "", duplicate: true })
    }
    return NextResponse.json({ error: "message" }, { status: 500 })
  }

  await supabaseAdmin
    .from("cs_conversations")
    .update({ last_inbound_at: now })
    .eq("id", conversationId)

  // Toggle AI per percakapan (dashboard /ops): saat tim mengambil alih,
  // widget tidak boleh dibalas otomatis. Pesan tetap tersimpan untuk tim.
  if (existing?.status === "human") {
    return NextResponse.json({ reply: "", paused: true })
  }

  const { data: historyRows } = await supabaseAdmin
    .from("cs_messages")
    .select("direction,body,created_at,intent")
    .eq("conversation_id", conversationId)
    .lt("created_at", inbound.created_at)
    .order("created_at", { ascending: false })
    .limit(10)

  const rows = (historyRows || []) as {
    direction: string
    body: string
    intent: string | null
  }[]

  const history = rows
    .slice()
    .reverse()
    .filter((row) => row.body)
    .map((row) => ({
      role: row.direction === "in" ? ("user" as const) : ("assistant" as const),
      content: row.body,
    }))

  const result = await handleInbound({
    contactId: contact.id as string,
    conversationId,
    weddingProfileId: profile?.id || null,
    verified: !!profile,
    hasProfile: !!profile,
    published: profile?.is_published === true,
    strikeCount: countUnknownStrikes(rows),
    sentiment: detectSentiment(text),
    channel: "web",
    text,
    history,
    model: settings.model,
    maxWords: settings.maxReplyWords,
    persona: settings.persona,
    policies: settings.policies,
    contactName,
    phone: null,
  })

  // Balapan dengan toggle tim: cek ulang tepat sebelum balasan dikirim.
  const { data: owner } = await supabaseAdmin
    .from("cs_conversations")
    .select("status")
    .eq("id", conversationId)
    .maybeSingle()
  if (owner?.status !== "bot") return NextResponse.json({ reply: "", paused: true, conversationId })

  const reply = result.replies[0]?.text || ""
  const response = NextResponse.json({ reply, conversationId })

  if (issueCookie) {
    response.cookies.set(COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })
  }

  return response
}

// GET /api/cs/chat?conversationId=...&since=ISO
// Dipakai widget untuk menerima balasan manusia dari /ops/cs (dan balasan bot
// yang telat) tanpa mengirim pesan baru.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const conversationId = url.searchParams.get("conversationId") || ""
  const since = url.searchParams.get("since") || "1970-01-01T00:00:00.000Z"
  if (!conversationId) return NextResponse.json({ error: "conversationId wajib" }, { status: 400 })

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE)?.value || ""
  if (!SESSION_RE.test(sessionId)) return NextResponse.json({ messages: [] })

  const { data: contact } = await supabaseAdmin
    .from("cs_contacts")
    .select("id")
    .eq("wa_jid", `web:${sessionId}`)
    .maybeSingle()
  if (!contact) return NextResponse.json({ messages: [] })

  const { data: conversation } = await supabaseAdmin
    .from("cs_conversations")
    .select("id,contact_id")
    .eq("id", conversationId)
    .eq("contact_id", contact.id)
    .maybeSingle()
  if (!conversation) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const { data } = await supabaseAdmin
    .from("cs_messages")
    .select("id,direction,role,body,model,created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "out")
    .gt("created_at", since)
    .order("created_at", { ascending: true })
    .limit(50)

  return NextResponse.json({ messages: data || [] })
}
