import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { sendCsWhatsApp } from "@/lib/cs/waSend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ContactRow = {
  id: string
  name: string | null
  phone: string | null
  verified_at: string | null
  wedding_profile_id: string | null
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res

  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (id) {
    const { data: conversation, error } = await supabaseAdmin
      .from("cs_conversations")
      .select(
        "id,status,intent,strike_count,ai_paused_until,assigned_to,last_inbound_at,last_outbound_at,escalated_at,closed_at,created_at,contact_id,cs_contacts!inner(id,name,phone,verified_at,wedding_profile_id)"
      )
      .eq("id", id)
      .maybeSingle()

    if (error || !conversation) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 })
    }

    const contact = first((conversation as Record<string, unknown>).cs_contacts as ContactRow | ContactRow[])

    const [{ data: lead }, { data: messages }, { data: escalations }, { data: draftRow }] = await Promise.all([
      supabaseAdmin.from("cs_leads").select("*").eq("contact_id", conversation.contact_id).maybeSingle(),
      supabaseAdmin
        .from("cs_messages")
        .select("id,direction,role,body,intent,model,guard,error,created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .limit(200),
      supabaseAdmin
        .from("cs_escalations")
        .select("id,reason,priority,status,summary,created_at,resolved_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      contact?.wedding_profile_id
        ? supabaseAdmin
            .from("cs_profile_drafts")
            .select("draft,status,updated_at")
            .eq("wedding_profile_id", contact.wedding_profile_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    return NextResponse.json({
      conversation: { ...conversation, cs_contacts: undefined },
      contact,
      lead: lead || null,
      messages: messages || [],
      escalations: escalations || [],
      draft: draftRow || null,
      editorUrl: contact?.wedding_profile_id
        ? `/dashboard/${contact.wedding_profile_id}/web-invitation/editor`
        : null,
    })
  }

  const { data: conversations, error: listError } = await supabaseAdmin
    .from("cs_conversations")
    .select(
      "id,status,intent,ai_paused_until,assigned_to,last_inbound_at,last_outbound_at,escalated_at,created_at,contact_id,cs_contacts!inner(id,name,phone,verified_at,wedding_profile_id)"
    )
    .order("last_inbound_at", { ascending: false, nullsFirst: false })
    .limit(80)

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const rows = (conversations || []) as Record<string, unknown>[]
  const conversationIds = rows.map((row) => String(row.id))
  const contactIds = rows.map((row) => String(row.contact_id))

  const [{ data: leads }, { data: escalations }, { data: recentMessages }] = await Promise.all([
    contactIds.length
      ? supabaseAdmin.from("cs_leads").select("*").in("contact_id", contactIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    conversationIds.length
      ? supabaseAdmin
          .from("cs_escalations")
          .select("id,conversation_id,reason,priority,status,created_at")
          .in("conversation_id", conversationIds)
          .neq("status", "done")
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    conversationIds.length
      ? supabaseAdmin
          .from("cs_messages")
          .select("conversation_id,direction,body,created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
          .limit(400)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const leadByContact = new Map<string, Record<string, unknown>>()
  for (const lead of (leads || []) as Record<string, unknown>[]) {
    leadByContact.set(String(lead.contact_id), lead)
  }

  const escalationByConversation = new Map<string, Record<string, unknown>>()
  for (const escalation of (escalations || []) as Record<string, unknown>[]) {
    const key = String(escalation.conversation_id)
    if (!escalationByConversation.has(key)) escalationByConversation.set(key, escalation)
  }

  const lastMessageByConversation = new Map<string, Record<string, unknown>>()
  for (const message of (recentMessages || []) as Record<string, unknown>[]) {
    const key = String(message.conversation_id)
    if (!lastMessageByConversation.has(key)) lastMessageByConversation.set(key, message)
  }

  const items = rows.map((row) => {
    const contact = first(row.cs_contacts as ContactRow | ContactRow[])
    const lastMessage = lastMessageByConversation.get(String(row.id)) || null
    const needsReply =
      row.status !== "closed" &&
      !!row.last_inbound_at &&
      (!row.last_outbound_at || String(row.last_inbound_at) > String(row.last_outbound_at))

    return {
      id: row.id,
      status: row.status,
      intent: row.intent,
      ai_paused_until: row.ai_paused_until,
      escalated_at: row.escalated_at,
      last_inbound_at: row.last_inbound_at,
      last_outbound_at: row.last_outbound_at,
      contact,
      lead: leadByContact.get(String(row.contact_id)) || null,
      escalation: escalationByConversation.get(String(row.id)) || null,
      last_message: lastMessage,
      needs_reply: needsReply,
    }
  })

  return NextResponse.json({ items })
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  return sendCsWhatsApp(phone, message, 8000)
}

export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  const action = String(body.action || "")
  const conversationId = String(body.conversation_id || "")
  if (!conversationId) return NextResponse.json({ error: "conversation_id wajib" }, { status: 400 })

  const { data: conversation } = await supabaseAdmin
    .from("cs_conversations")
    .select("id,contact_id,status,channel,cs_contacts!inner(id,phone,name)")
    .eq("id", conversationId)
    .maybeSingle()

  if (!conversation) return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 })
  const contact = first((conversation as Record<string, unknown>).cs_contacts as ContactRow | ContactRow[])

  const now = new Date().toISOString()

  if (action === "ai_off" || action === "ai_on") {
    const off = action === "ai_off"
    await supabaseAdmin
      .from("cs_conversations")
      .update({
        status: off ? "human" : "bot",
        assigned_to: off ? auth.employee.id : null,
        ai_paused_until: null,
      })
      .eq("id", conversationId)
    await supabaseAdmin.from("cs_audit").insert({
      actor: `ops:${auth.employee.id}`,
      action: off ? "ai_off" : "ai_on",
      subject: conversationId,
      detail: { source: "ops_toggle" },
    })
    return NextResponse.json({ ok: true, ai_enabled: !off })
  }

  if (action === "claim") {
    await supabaseAdmin
      .from("cs_conversations")
      .update({
        status: "human",
        assigned_to: auth.employee.id,
        ai_paused_until: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
      })
      .eq("id", conversationId)
    return NextResponse.json({ ok: true })
  }

  if (action === "release") {
    await supabaseAdmin
      .from("cs_conversations")
      .update({ status: "bot", assigned_to: null, ai_paused_until: null })
      .eq("id", conversationId)
    return NextResponse.json({ ok: true })
  }

  if (action === "close") {
    await supabaseAdmin
      .from("cs_conversations")
      .update({ status: "closed", closed_at: now, ai_paused_until: null })
      .eq("id", conversationId)
    await supabaseAdmin
      .from("cs_escalations")
      .update({ status: "done", resolved_at: now })
      .eq("conversation_id", conversationId)
      .neq("status", "done")
    return NextResponse.json({ ok: true })
  }

  if (action === "reply") {
    const text = String(body.text || "").trim()
    if (!text) return NextResponse.json({ error: "pesan kosong" }, { status: 400 })
    if (text.length > 4000) return NextResponse.json({ error: "pesan terlalu panjang" }, { status: 400 })

    const channel = String((conversation as Record<string, unknown>).channel || "")
    const isWeb = channel === "web"

    // Web: balasan tidak dikirim ke WhatsApp (tidak ada nomor); widget mengambil
    // pesan ini lewat polling /api/cs/chat. WhatsApp tetap wajib punya nomor.
    if (!isWeb && !contact?.phone) {
      return NextResponse.json({ error: "nomor kontak tidak ada" }, { status: 400 })
    }

    const sent = isWeb ? true : await sendWhatsApp(contact!.phone as string, text)

    await supabaseAdmin.from("cs_messages").insert({
      conversation_id: conversationId,
      direction: "out",
      role: "assistant",
      body: text,
      // Penanda asal pesan: balasan tim, bukan model. Tanpa ini transkrip
      // tidak bisa membedakan jawaban AI dan jawaban manusia.
      model: "human:ops",
      error: sent ? null : "gateway_send_failed",
    })

    await supabaseAdmin
      .from("cs_conversations")
      .update({
        status: "human",
        assigned_to: auth.employee.id,
        last_outbound_at: now,
        ai_paused_until: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
      })
      .eq("id", conversationId)

    await supabaseAdmin.from("cs_audit").insert({
      actor: `ops:${auth.employee.id}`,
      action: "human_reply",
      subject: conversationId,
      detail: { sent, length: text.length },
    })

    return NextResponse.json({ ok: true, sent })
  }

  return NextResponse.json({ error: "aksi tidak dikenal" }, { status: 400 })
}
