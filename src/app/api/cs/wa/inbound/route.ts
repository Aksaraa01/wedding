import { NextResponse } from "next/server"
import { createHash, timingSafeEqual } from "node:crypto"

import { supabaseAdmin } from "@/lib/supabase"
import { fromJid, generateCode, maskPhone, normalizeWhatsApp } from "@/lib/cs/identity"
import { checkRateLimit, rateLimited } from "@/lib/rateLimit"
import { getCsSettings } from "@/lib/cs/settings"
import { handleInbound } from "@/lib/cs/orchestrator"
import {
  notRegisteredReply,
  offlineReply,
  verificationSuccessReply,
  verifyCodeSentReply,
  verifyCodeWrongReply,
} from "@/lib/cs/replies"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface InboundBody {
  wa_message_id?: string
  from?: string
  push_name?: string
  text?: string
  timestamp?: number
  from_me?: boolean
}

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided || "")
  const b = Buffer.from(expected || "")
  if (a.length !== b.length || b.length === 0) return false
  return timingSafeEqual(a, b)
}

function hashCode(code: string, salt: string): string {
  return createHash("sha256").update(`${code}:${salt}`).digest("hex")
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const url = process.env.WA_SCHOOL_API_URL || "http://127.0.0.1:3001/send"
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function reply(conversationId: string, text: string): Promise<void> {
  await supabaseAdmin.from("cs_messages").insert({
    conversation_id: conversationId,
    direction: "out",
    role: "assistant",
    body: text,
  })
  await supabaseAdmin
    .from("cs_conversations")
    .update({ last_outbound_at: new Date().toISOString() })
    .eq("id", conversationId)
}

async function findProfileForPhone(
  normalized: string
): Promise<{ id: string; is_published: boolean; scanner_pin: string | null } | null> {
  const { data: profileByPhone } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id,is_published,scanner_pin")
    .eq("whatsapp_number", normalized)
    .maybeSingle()

  if (profileByPhone) {
    return profileByPhone as { id: string; is_published: boolean; scanner_pin: string | null }
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone_number", normalized)
    .maybeSingle()

  if (!user) return null

  const { data: profileByUser } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id,is_published,scanner_pin")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  return (profileByUser as { id: string; is_published: boolean; scanner_pin: string | null } | null) || null
}

// PIN undangan (dipilih pasangan untuk scanner) dipakai juga untuk verifikasi CS.
// Dicocokkan digit-per-digit, constant-time kalau panjangnya sama.
function pinMatches(input: string, stored: string): boolean {
  const a = Buffer.from(input.replace(/\D/g, ""))
  const b = Buffer.from(stored.replace(/\D/g, ""))
  if (!a.length || !b.length) return false
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function lastBotAskedPin(conversationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("cs_messages")
    .select("body")
    .eq("conversation_id", conversationId)
    .eq("direction", "out")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return /pin|verifikasi|nomor whatsapp/i.test(String(data?.body || ""))
}

async function recentPinFailures(contactId: string): Promise<number> {
  const since = new Date(Date.now() - 10 * 60_000).toISOString()
  const { count } = await supabaseAdmin
    .from("cs_audit")
    .select("id", { count: "exact", head: true })
    .eq("action", "pin_failed")
    .eq("subject", contactId)
    .gte("created_at", since)
  return count || 0
}

export async function POST(request: Request) {
  const expected = process.env.CS_INBOUND_SECRET || ""
  if (!expected || !secretMatches(request.headers.get("x-cs-secret") || "", expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: InboundBody
  try {
    body = (await request.json()) as InboundBody
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const jid = String(body.from || "").trim()
  const text = String(body.text || "").trim()
  if (!jid || !text) {
    return NextResponse.json({ replies: [] })
  }

  const phone = fromJid(jid)
  if (!phone) {
    return NextResponse.json({ replies: [] })
  }

  const rate = checkRateLimit(`cs-wa:${phone}`, 30, 60_000)
  if (!rate.ok) return rateLimited(rate.retryAfterMs!)

  const settings = await getCsSettings()
  if (!settings.enabled) {
    return NextResponse.json({ replies: [] })
  }

  const now = new Date().toISOString()

  const { data: contact, error: contactError } = await supabaseAdmin
    .from("cs_contacts")
    .upsert(
      {
        wa_jid: jid,
        phone,
        ...(body.push_name ? { name: String(body.push_name).slice(0, 80) } : {}),
        last_seen_at: now,
      },
      { onConflict: "wa_jid" }
    )
    .select("id,name,wedding_profile_id,verified_at,blocked")
    .single()

  if (contactError || !contact) {
    return NextResponse.json({ error: "contact" }, { status: 500 })
  }
  if (contact.blocked) {
    return NextResponse.json({ replies: [] })
  }

  const { data: existingConversation } = await supabaseAdmin
    .from("cs_conversations")
    .select("id,strike_count")
    .eq("contact_id", contact.id)
    .neq("status", "closed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let conversationId = existingConversation?.id as string | undefined

  if (!conversationId) {
    const { data: created, error: convError } = await supabaseAdmin
      .from("cs_conversations")
      .insert({ contact_id: contact.id, channel: "wa", status: "bot" })
      .select("id")
      .single()
    if (convError || !created) {
      return NextResponse.json({ error: "conversation" }, { status: 500 })
    }
    conversationId = created.id as string
  }

  const waMessageId = String(body.wa_message_id || "") || `local-${crypto.randomUUID()}`

  const { data: inbound, error: inboundError } = await supabaseAdmin
    .from("cs_messages")
    .insert({
      conversation_id: conversationId,
      direction: "in",
      role: "user",
      wa_message_id: waMessageId,
      body: text,
    })
    .select("id,created_at")
    .single()

  if (inboundError) {
    // wa_message_id unique: event reconnect yang sama tidak boleh dibalas dua kali.
    if (inboundError.code === "23505") return NextResponse.json({ replies: [] })
    return NextResponse.json({ error: "message" }, { status: 500 })
  }

  await supabaseAdmin
    .from("cs_conversations")
    .update({ last_inbound_at: now })
    .eq("id", conversationId)

  // Ops membalas manual dari HP: AI berhenti untuk kontak ini.
  if (body.from_me) {
    await supabaseAdmin
      .from("cs_conversations")
      .update({ ai_paused_until: new Date(Date.now() + 4 * 60 * 60_000).toISOString() })
      .eq("id", conversationId)
    return NextResponse.json({ replies: [] })
  }

  const verifiedAt = contact.verified_at ? new Date(contact.verified_at).getTime() : null
  let verified = verifiedAt !== null && Date.now() - verifiedAt < 24 * 60 * 60_000
  let profileId = (contact.wedding_profile_id as string | null) || null
  let published = false

  // --- Verifikasi ---------------------------------------------------------
  const digits = text.replace(/\D/g, "")
  const looksLikeCode = /^\d{6}$/.test(text)
  const looksLikePhone = !looksLikeCode && digits.length >= 9 && digits.length <= 15

  if (looksLikeCode) {
    const codeRate = checkRateLimit(`cs-code-try:${contact.id}`, 10, 10 * 60_000)
    if (!codeRate.ok) return rateLimited(codeRate.retryAfterMs!)

    const { data: row } = await supabaseAdmin
      .from("cs_verify_codes")
      .select("id,phone,code_hash,attempts,expires_at,used_at")
      .eq("contact_id", contact.id)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (row) {
      const expired = new Date(row.expires_at).getTime() < Date.now()
      if (expired || Number(row.attempts) >= 5) {
        await reply(conversationId, verifyCodeWrongReply())
        return NextResponse.json({ replies: [] })
      }

      const expectedHash = hashCode(text, contact.id as string)
      const ok = secretMatches(expectedHash, row.code_hash as string)

      if (!ok) {
        await supabaseAdmin
          .from("cs_verify_codes")
          .update({ attempts: Number(row.attempts) + 1 })
          .eq("id", row.id)
        await reply(conversationId, verifyCodeWrongReply())
        return NextResponse.json({ replies: [] })
      }

      const profile = await findProfileForPhone(normalizeWhatsApp(row.phone as string))

      await supabaseAdmin
        .from("cs_verify_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", row.id)

      await supabaseAdmin
        .from("cs_contacts")
        .update({
          verified_at: new Date().toISOString(),
          wedding_profile_id: profile?.id || null,
          phone: normalizeWhatsApp(row.phone as string),
        })
        .eq("id", contact.id)

      await supabaseAdmin.from("cs_audit").insert({
        actor: `wa:${contact.id}`,
        action: "verify_success",
        subject: profile?.id || null,
      })

      await reply(conversationId, verificationSuccessReply())
      return NextResponse.json({ replies: [] })
    }
  }

  // PIN undangan: dipakai saat agent meminta verifikasi untuk permintaan data.
  const looksLikePin = /^\d{4,6}$/.test(text)
  if (!verified && looksLikePin && (await lastBotAskedPin(conversationId))) {
    const pinRate = checkRateLimit(`cs-pin:${contact.id}`, 10, 10 * 60_000)
    if (!pinRate.ok) return rateLimited(pinRate.retryAfterMs!)

    const profile = await findProfileForPhone(normalizeWhatsApp(phone))
    const storedPin = profile?.scanner_pin ? String(profile.scanner_pin) : ""

    if (profile && storedPin.replace(/\D/g, "").length >= 4) {
      const failures = await recentPinFailures(contact.id as string)

      if (failures >= 3) {
        await reply(
          conversationId,
          "PIN-nya sudah salah 3 kali, jadi aku sambungkan ke tim dulu ya Kak biar aman."
        )
        return NextResponse.json({ replies: [] })
      }

      if (pinMatches(text, storedPin)) {
        await supabaseAdmin
          .from("cs_contacts")
          .update({
            verified_at: new Date().toISOString(),
            wedding_profile_id: profile.id,
            phone: normalizeWhatsApp(phone),
          })
          .eq("id", contact.id)

        await supabaseAdmin.from("cs_audit").insert({
          actor: `wa:${contact.id}`,
          action: "pin_success",
          subject: profile.id,
        })

        await reply(conversationId, verificationSuccessReply())
        return NextResponse.json({ replies: [] })
      }

      await supabaseAdmin.from("cs_audit").insert({
        actor: `wa:${contact.id}`,
        action: "pin_failed",
        subject: contact.id,
      })

      await reply(
        conversationId,
        `PIN belum cocok (${failures + 1}/3). Coba sebutkan lagi ya Kak.`
      )
      return NextResponse.json({ replies: [] })
    }
  }

  if (!verified && looksLikePhone) {
    const claimRate = checkRateLimit(`cs-code:${contact.id}`, 3, 10 * 60_000)
    if (!claimRate.ok) return rateLimited(claimRate.retryAfterMs!)

    const normalized = normalizeWhatsApp(digits)
    const profile = await findProfileForPhone(normalized)

    if (!profile) {
      await reply(conversationId, notRegisteredReply())
      return NextResponse.json({ replies: [] })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString()

    await supabaseAdmin
      .from("cs_verify_codes")
      .delete()
      .eq("contact_id", contact.id)
      .is("used_at", null)

    const { error: codeError } = await supabaseAdmin.from("cs_verify_codes").insert({
      contact_id: contact.id,
      phone: normalized,
      code_hash: hashCode(code, contact.id as string),
      expires_at: expiresAt,
    })

    if (codeError) {
      await reply(conversationId, offlineReply())
      return NextResponse.json({ replies: [] })
    }

    const sent = await sendWhatsApp(
      normalized,
      `Kode verifikasi CS Aksaraa: ${code}\nBerlaku 5 menit. Jangan bagikan kode ini ke siapa pun.`
    )

    await reply(
      conversationId,
      sent
        ? verifyCodeSentReply(maskPhone(normalized))
        : "Kode verifikasi gagal dikirim. Coba lagi sebentar lagi ya Kak."
    )
    return NextResponse.json({ replies: [] })
  }

  if (verified && profileId) {
    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("is_published")
      .eq("id", profileId)
      .maybeSingle()
    published = profile?.is_published === true
  }

  // --- Debounce: 3 pesan beruntun = 1 balasan ------------------------------
  const debounceMs = Number(process.env.CS_DEBOUNCE_MS || 2500)
  if (debounceMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, debounceMs))
    const { count } = await supabaseAdmin
      .from("cs_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("direction", "in")
      .gt("created_at", inbound.created_at)
    if ((count || 0) > 0) return NextResponse.json({ replies: [] })
  }

  const { data: historyRows } = await supabaseAdmin
    .from("cs_messages")
    .select("direction,body,created_at")
    .eq("conversation_id", conversationId)
    .lt("created_at", inbound.created_at)
    .order("created_at", { ascending: false })
    .limit(10)

  const history = ((historyRows || []) as { direction: string; body: string }[])
    .reverse()
    .filter((row) => row.body)
    .map((row) => ({
      role: row.direction === "in" ? ("user" as const) : ("assistant" as const),
      content: row.body,
    }))

  const result = await handleInbound({
    contactId: contact.id as string,
    conversationId,
    weddingProfileId: profileId,
    verified,
    hasProfile: !!profileId,
    published,
    strikeCount: Number(existingConversation?.strike_count || 0),
    sentiment: "neutral",
    text,
    history,
    model: settings.model,
    maxWords: settings.maxReplyWords,
    persona: settings.persona,
    policies: settings.policies,
    contactName: (contact.name as string | null) || null,
    phone,
  })

  return NextResponse.json({ replies: result.replies })
}
