import { NextResponse } from "next/server"
import { createHash, timingSafeEqual } from "node:crypto"

import { supabaseAdmin } from "@/lib/supabase"
import { fromJid, generateCode, maskPhone, normalizeWhatsApp } from "@/lib/cs/identity"
import { checkRateLimit, rateLimited } from "@/lib/rateLimit"
import { aiPaused, nextPauseUntil, shouldAutoResume } from "@/lib/cs/handoff"
import { getCsSettings } from "@/lib/cs/settings"
import { classify } from "@/lib/cs/policy"
import { handleInbound } from "@/lib/cs/orchestrator"
import { handleOnboardingUpload } from "@/lib/cs/onboarding"
import { sendCsWhatsApp } from "@/lib/cs/waSend"
import { uploadFile, uploadFromUrl } from "@/lib/storage"
import {
  identityConfirmReply,
  identityNotMineReply,
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
  media_url?: string
  media_base64?: string
  mime_type?: string
  unsupported?: string
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
  return sendCsWhatsApp(phone, message, 5000)
}

async function persistOutbound(conversationId: string, text: string): Promise<void> {
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

  // Balasan yang dibuat di route ini (PIN/OTP/foto) tidak lewat `replies`,
  // jadi harus dikirim sendiri. Kirim ke JID chat (lid), bukan nomor telepon:
  // nomor telepon belum tentu bisa di-resolve oleh sesi CS.
  try {
    const { data } = await supabaseAdmin
      .from("cs_conversations")
      .select("cs_contacts!inner(wa_jid,phone)")
      .eq("id", conversationId)
      .maybeSingle()
    const contact = (data as { cs_contacts?: { wa_jid?: string; phone?: string } } | null)?.cs_contacts
    if (!contact?.wa_jid && !contact?.phone) return

    // Hanya lewat gateway CS: pesan OTP/konfirmasi tidak boleh terkirim dari
    // nomor bot lama.
    await sendCsWhatsApp({ jid: contact.wa_jid, phone: contact.phone }, text, 20_000)
  } catch {
    // gagal kirim tidak boleh menggagalkan proses
  }
}

async function findProfileForPhone(
  normalized: string
): Promise<{ id: string; is_published: boolean; scanner_pin: string | null; user_id: string | null } | null> {
  const { data: profileByPhone } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id,is_published,scanner_pin,user_id")
    .eq("whatsapp_number", normalized)
    .maybeSingle()

  if (profileByPhone) {
    return profileByPhone as {
      id: string
      is_published: boolean
      scanner_pin: string | null
      user_id: string | null
    }
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone_number", normalized)
    .maybeSingle()

  if (!user) return null

  const { data: profileByUser } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id,is_published,scanner_pin,user_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  return (profileByUser as {
    id: string
    is_published: boolean
    scanner_pin: string | null
    user_id: string | null
  } | null) || null
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

async function lastOutboundBody(conversationId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("cs_messages")
    .select("body")
    .eq("conversation_id", conversationId)
    .eq("direction", "out")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return String(data?.body || "")
}

// Pertanyaan yang tadi tertahan verifikasi. Dipakai supaya klien tidak perlu
// mengulang "status undangan saya?" setelah PIN benar. Diambil dari beberapa
// pesan masuk terakhir karena di antaranya ada "ya" dan PIN itu sendiri.
async function resumePendingQuestion(conversationId: string, profileId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("cs_messages")
    .select("body,created_at")
    .eq("conversation_id", conversationId)
    .eq("direction", "in")
    .order("created_at", { ascending: false })
    .limit(8)

  const cutoff = Date.now() - 15 * 60_000
  const pending = (data || []).find((row) => {
    const at = new Date(String(row.created_at)).getTime()
    if (!Number.isFinite(at) || at < cutoff) return false
    return ["status", "invitation_link"].includes(classify(String(row.body || "")))
  })
  if (!pending) return null

  const intent = classify(String(pending.body || ""))
  if (intent === "status") {
    const { invitationStatusReply } = await import("@/lib/cs/invitationStatus")
    return invitationStatusReply(profileId)
  }
  const { invitationLinkReply } = await import("@/lib/cs/invitationLink")
  return invitationLinkReply(profileId)
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
  const mediaUrl = String(body.media_url || "").trim()
  const mediaBase64 = String(body.media_base64 || "").trim()
  const unsupported = String(body.unsupported || "").trim()
  if (!jid || (!text && !mediaUrl && !mediaBase64 && !unsupported)) {
    return NextResponse.json({ replies: [] })
  }

  const phone = fromJid(jid)
  if (!phone) {
    return NextResponse.json({ replies: [] })
  }

  const rate = checkRateLimit(`cs-wa:${phone}`, 30, 60_000)
  if (!rate.ok) return rateLimited(rate.retryAfterMs!)

  const settings = await getCsSettings()

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
    .select("id,strike_count,status,ai_paused_until")
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

  // --- Manusia membalas dari HP / WhatsApp Web -----------------------------
  // Terjadi SEBELUM insert pesan masuk: pesan ini milik kita (out), bukan
  // pesan klien. Dulu tersimpan sebagai `in/user`, sehingga transkrip dan
  // konteks AI menganggap kata-kata tim sebagai ucapan klien.
  if (body.from_me) {
    if (text || unsupported) {
      await supabaseAdmin.from("cs_messages").insert({
        conversation_id: conversationId,
        direction: "out",
        role: "assistant",
        wa_message_id: waMessageId,
        body: text || `[${unsupported}]`,
        model: "human:wa",
      })
    }
    // Tim membalas dari perangkat: AI diam 10 menit (direset tiap balasan
    // berikutnya), lalu menyala sendiri. Toggle manual tetap permanen.
    const { data: current } = await supabaseAdmin
      .from("cs_conversations")
      .select("ai_paused_until")
      .eq("id", conversationId)
      .maybeSingle()
    const pausedUntil = nextPauseUntil(
      (current as { ai_paused_until?: string | null } | null)?.ai_paused_until
    )

    await supabaseAdmin
      .from("cs_conversations")
      .update({ status: "human", ai_paused_until: pausedUntil, last_outbound_at: now })
      .eq("id", conversationId)
    await supabaseAdmin.from("cs_audit").insert({
      actor: "human:wa",
      action: "ai_off",
      subject: conversationId,
      detail: { source: "wa_device", paused_until: pausedUntil, auto_resume: true },
    })
    return NextResponse.json({ replies: [] })
  }

  const { data: inbound, error: inboundError } = await supabaseAdmin
    .from("cs_messages")
    .insert({
      conversation_id: conversationId,
      direction: "in",
      role: "user",
      wa_message_id: waMessageId,
      body: text || (unsupported ? `[${unsupported}]` : ""),
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

  // Kill switch global: pesan tersimpan (muncul di /ops/cs) tetapi bot diam.
  // Status percakapan tidak disentuh, jadi saat AI dinyalakan lagi setiap
  // percakapan kembali ke status terakhirnya (bot/human/closed).
  if (!settings.enabled) {
    return NextResponse.json({ replies: [] })
  }

  // Toggle AI per percakapan: kalau tim sudah mengambil alih, AI diam.
  // Pesannya tetap disimpan supaya tim melihatnya (sudah di-insert di atas).
  if (shouldAutoResume(existingConversation)) {
    await supabaseAdmin
      .from("cs_conversations")
      .update({ status: "bot", ai_paused_until: null })
      .eq("id", conversationId)
  } else if (aiPaused(existingConversation)) {
    return NextResponse.json({ replies: [] })
  }

  // Jenis pesan yang belum didukung (voice note, stiker, dokumen, lokasi).
  if (unsupported) {
    await reply(
      conversationId,
      `Aku belum bisa buka ${unsupported} ya Kak. Tulis pesan teks saja biar aku bisa bantu, atau kirim foto lewat tombol foto.`
    )
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
      if (profile?.id) {
        const resumed = await resumePendingQuestion(conversationId, profile.id).catch(() => null)
        if (resumed) await reply(conversationId, resumed)
      }
      return NextResponse.json({ replies: [] })
    }
  }

  // --- Konfirmasi identitas (nomor bukan bukti) ----------------------------
  // Hanya untuk permintaan akun; pertanyaan produk biasa tidak perlu.
  if (!verified) {
    const lastBot = await lastOutboundBody(conversationId)
    const askedPin = /pin undangan/i.test(lastBot)
    const askedConfirm = /nomor ini terdaftar sebagai/i.test(lastBot)
    const accountIntent = [
      "data_collection",
      "data_change",
      "status",
      "feedback_status",
      "invitation_link",
    ].includes(classify(text))

    if (askedConfirm) {
      if (/^(ya|iya|betul|benar|yes)\b/i.test(text)) {
        await reply(
          conversationId,
          "Boleh sebutkan PIN undangan Kakak (6 angka) biar aku pastikan ini benar pemiliknya."
        )
        return NextResponse.json({ replies: [] })
      }
      if (/^(bukan|tidak|no|salah)\b/i.test(text)) {
        await reply(conversationId, identityNotMineReply())
        return NextResponse.json({ replies: [] })
      }
    }

    if (!askedConfirm && !askedPin && accountIntent) {
      const candidate = await findProfileForPhone(normalizeWhatsApp(phone))
      if (candidate) {
        const { data: couple } = await supabaseAdmin
          .from("wedding_profiles")
          .select("groom_name,bride_name,display_name")
          .eq("id", candidate.id)
          .maybeSingle()
        const name =
          (couple?.display_name as string) ||
          [couple?.groom_name, couple?.bride_name].filter(Boolean).join(" & ") ||
          "pasangan ini"
        await reply(conversationId, identityConfirmReply(String(name)))
        return NextResponse.json({ replies: [] })
      }
    }
  }

  // PIN undangan: dipakai saat agent meminta verifikasi untuk permintaan data.
  const looksLikePin = /^\d{4,6}$/.test(text)
  if (!verified && looksLikePin && (await lastBotAskedPin(conversationId))) {
    const pinRate = checkRateLimit(`cs-pin:${contact.id}`, 10, 10 * 60_000)
    if (!pinRate.ok) return rateLimited(pinRate.retryAfterMs!)

    const profile = await findProfileForPhone(normalizeWhatsApp(phone))

    // PIN dari pendaftaran (users.pin, 6 digit) — semua pasangan punya.
    // scanner_pin lama tetap diterima kalau sudah diisi.
    let registrationPin = ""
    if (profile?.user_id) {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("pin")
        .eq("id", profile.user_id)
        .maybeSingle()
      registrationPin = String(user?.pin || "")
    }
    const storedPin = registrationPin || (profile?.scanner_pin ? String(profile.scanner_pin) : "")

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
        const resumed = await resumePendingQuestion(conversationId, profile.id).catch(() => null)
        if (resumed) await reply(conversationId, resumed)
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

  // --- Foto dari WhatsApp (media passthrough gateway) ----------------------
  if ((mediaUrl || mediaBase64) && verified && profileId) {
    try {
      let stored = ""
      if (mediaBase64) {
        const bytes = Buffer.from(mediaBase64, "base64")
        const mime = String(body.mime_type || "image/jpeg")
        if (!mime.startsWith("image/")) throw new Error("bukan gambar")
        if (bytes.length > 8 * 1024 * 1024) throw new Error("terlalu besar")
        const file = new File([new Uint8Array(bytes)], "wa-photo.jpg", { type: mime })
        stored = await uploadFile(
          file,
          "cs-uploads",
          `${profileId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
        )
      } else {
        stored = await uploadFromUrl(
          mediaUrl,
          "cs-uploads",
          `${profileId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
        )
      }
      const text = await handleOnboardingUpload(profileId, contact.id as string, stored)
      await persistOutbound(conversationId, text)
      return NextResponse.json({ replies: [{ text }] })
    } catch {
      const text = "Fotonya gagal diunduh. Coba kirim ulang ya Kak."
      await persistOutbound(conversationId, text)
      return NextResponse.json({ replies: [{ text }] })
    }
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
    channel: "wa",
    text,
    history,
    model: settings.model,
    maxWords: settings.maxReplyWords,
    persona: settings.persona,
    policies: settings.policies,
    contactName: (contact.name as string | null) || null,
    phone,
  })

  // Balapan: tim bisa menekan toggle (atau membalas dari HP) selama model
  // menyusun jawaban. Cek sekali lagi tepat sebelum balasan dikirim.
  const { data: owner } = await supabaseAdmin
    .from("cs_conversations")
    .select("status,ai_paused_until")
    .eq("id", conversationId)
    .maybeSingle()
  if (aiPaused(owner)) return NextResponse.json({ replies: [] })

  return NextResponse.json({ replies: result.replies })
}
