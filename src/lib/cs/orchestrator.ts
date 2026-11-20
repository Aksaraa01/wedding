import { supabaseAdmin } from "@/lib/supabase"
import {
  classify,
  decide,
  detectPaymentClaim,
  wantsAllTemplates,
  type Decision,
  type DecisionContext,
  type EscalationReason,
  type Priority,
} from "@/lib/cs/policy"
import { asksToSwitchTemplate } from "@/lib/cs/templateFilter"
import { buildSystemPrompt } from "@/lib/cs/prompt"
import { runAgentLoop, type LoopResult } from "@/lib/cs/agentLoop"
import { chatCompletion } from "@/lib/cs/llm"
import { runTool, TOOL_SCHEMAS, type CsToolContext } from "@/lib/cs/tools"
import {
  escalationReply,
  optOutReply,
  refuseReply,
  safeFallbackReply,
  verifyPromptReply,
  verifyRequiredReply,
} from "@/lib/cs/replies"
import { ensureLead, leadMissing, leadPromptLine, recordObjection, saveLeadFact, updateLead } from "@/lib/cs/leads"
import {
  ctaFor,
  handoffSummary,
  nextQualifyingQuestion,
  detectPackageInterest,
  extractVoucherCode,
  nextStage,
  objectionPlan,
  type ObjectionKind,
} from "@/lib/cs/playbook"
import { formatPolicies, POLICIES, type CsPolicies } from "@/lib/cs/policies"
import { findSources } from "@/lib/cs/retrieval"
import { citationLine, isCitationRelevant } from "@/lib/cs/knowledge"
import { CS_WHATSAPP } from "@/lib/cs/contact"
import { escalationMessage } from "@/lib/cs/escalationMessage"
import { sendCsWhatsApp } from "@/lib/cs/waSend"
import { getOnboardingState, handleOnboarding } from "@/lib/cs/onboarding"

export interface AgentDeps {
  chat: typeof chatCompletion
  runTool: typeof runTool
}

const DEFAULT_DEPS: AgentDeps = { chat: chatCompletion, runTool }

export interface InboundInput {
  contactId: string
  conversationId: string
  weddingProfileId: string | null
  verified: boolean
  hasProfile: boolean
  published: boolean
  strikeCount: number
  sentiment: "neutral" | "frustrated" | "angry"
  channel?: "web" | "wa"
  text: string
  history: { role: "user" | "assistant"; content: string }[]
  model: string
  maxWords: number
  persona?: string | null
  policies?: CsPolicies
  contactName?: string | null
  phone?: string | null
  deps?: Partial<AgentDeps>
}

export interface InboundResult {
  replies: { text: string; typing?: boolean }[]
  escalation?: { reason: EscalationReason; priority: Priority }
  guarded: boolean
  toolNames: string[]
}

const REASON_LABEL: Record<EscalationReason, string> = {
  human_requested: "klien minta dihubungkan ke manusia",
  refund: "refund / pembatalan",
  reschedule: "ubah tanggal acara",
  data_change: "permintaan ubah data undangan",
  discount: "nego harga",
  voucher: "voucher / kode promo",
  payment: "pembayaran / bukti bayar",
  complaint: "komplain",
  sensitive_data: "permintaan data sensitif",
  low_confidence: "agent tidak yakin — perlu dicek manusia",
  no_profile: "profil tidak ditemukan untuk nomor ini",
}

// Notifikasi eskalasi: ringkas, hanya baris yang ada, dengan prioritas dan
// satu baris tindakan. Tujuan: grup ops (atau nomor koordinator).
async function notifyOps(text: string): Promise<void> {
  const target = process.env.CS_ESCALATION_TARGET || CS_WHATSAPP
  if (!target) return
  try {
    // Grup (@g.us) harus dikirim sebagai jid, bukan phone — kalau tidak,
    // gateway menganggapnya nomor telepon dan pesan tidak pernah terkirim.
    await sendCsWhatsApp(target.includes("@") ? { jid: target } : target, text, 5000)
  } catch {
    // Notifikasi gagal tidak boleh menggagalkan balasan ke klien.
  }
}

// Konteks untuk notifikasi grup: siapa, sudah berapa lama menunggu, paket/
// template/revisi, dan 4 giliran terakhir. Semua dari DB, bukan dari input
// pesan, supaya tidak bisa dipalsukan klien.
async function buildEscalationNotice(input: {
  conversationId: string
  contactId: string
  reason: EscalationReason
  priority: Priority
}): Promise<string> {
  const [{ data: conversation }, { data: contact }] = await Promise.all([
    supabaseAdmin
      .from("cs_conversations")
      .select("channel,last_inbound_at")
      .eq("id", input.conversationId)
      .maybeSingle(),
    supabaseAdmin
      .from("cs_contacts")
      .select("name,phone,wedding_profile_id,verified_at")
      .eq("id", input.contactId)
      .maybeSingle(),
  ])

  const profileId = (contact as { wedding_profile_id?: string | null } | null)?.wedding_profile_id || null
  const [profileResult, leadResult, messagesResult] = await Promise.all([
    profileId
      ? supabaseAdmin
          .from("wedding_profiles")
          .select("display_name,groom_name,bride_name,package_type,selected_template_id")
          .eq("id", profileId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin.from("cs_leads").select("stage").eq("contact_id", input.contactId).maybeSingle(),
    supabaseAdmin
      .from("cs_messages")
      .select("direction,body,created_at")
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const profile = profileResult.data as Record<string, unknown> | null
  let templateName: string | null = null
  if (profile?.selected_template_id) {
    const { data: template } = await supabaseAdmin
      .from("web_templates")
      .select("name")
      .eq("id", profile.selected_template_id)
      .maybeSingle()
    templateName = (template?.name as string) || null
  }

  let feedbackOpen = 0
  if (profileId) {
    const { count } = await supabaseAdmin
      .from("feedback_submissions")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", profileId)
      .neq("status", "resolved")
    feedbackOpen = count || 0
  }

  const lastInbound = (conversation as { last_inbound_at?: string | null } | null)?.last_inbound_at
  const waitingMinutes = lastInbound
    ? Math.max(0, (Date.now() - new Date(lastInbound).getTime()) / 60_000)
    : null

  const recent = ((messagesResult.data || []) as { direction: string; body: string }[])
    .slice()
    .reverse()
    .filter((row) => row.body && row.body.trim())
    .map((row) => ({
      role: row.direction === "in" ? ("user" as const) : ("assistant" as const),
      content: row.body,
    }))

  const coupleName =
    (profile?.display_name as string) ||
    [profile?.groom_name, profile?.bride_name].filter(Boolean).join(" & ") ||
    null

  const phone = (contact as { phone?: string | null } | null)?.phone || null
  const query = phone ? `?q=${encodeURIComponent(phone.replace(/\D/g, ""))}` : ""

  return escalationMessage({
    reason: input.reason,
    reasonLabel: REASON_LABEL[input.reason] || input.reason,
    priority: input.priority,
    channel: ((conversation as { channel?: string } | null)?.channel as "wa" | "web") || "wa",
    contactName: (contact as { name?: string | null } | null)?.name || null,
    phone,
    coupleName,
    registered: Boolean((contact as { wedding_profile_id?: string | null } | null)?.wedding_profile_id),
    stage: (leadResult.data as { stage?: string | null } | null)?.stage || null,
    waitingMinutes,
    packageName: (profile?.package_type as string) || null,
    templateName,
    feedbackOpen,
    recent,
    opsUrl: `https://wedding.aksaraa.com/ops/cs${query}`,
  })
}

async function recordUnanswered(
  conversationId: string,
  question: string,
  reason: string
): Promise<void> {
  const text = (question || "").trim()
  if (!text) return
  await supabaseAdmin.from("cs_unanswered").insert({
    conversation_id: conversationId,
    question: text.slice(0, 1000),
    reason,
  })
}

async function createEscalation(input: {
  conversationId: string
  contactId: string
  reason: EscalationReason
  priority: Priority
  summary: string
  // Voucher (dan tiket informatif lain) tetap membuat tiket + ping ops tanpa
  // mematikan AI 4 jam, supaya satu pertanyaan promo tidak mengakhiri percakapan.
  pauseAi?: boolean
}): Promise<void> {
  const pauseAi = input.pauseAi !== false

  if (!pauseAi) {
    // Tanpa jeda AI, klien bisa bertanya voucher berkali-kali. Satu tiket
    // terbuka per alasan sudah cukup; jangan spam grup ops.
    const { data: open } = await supabaseAdmin
      .from("cs_escalations")
      .select("id")
      .eq("conversation_id", input.conversationId)
      .eq("reason", input.reason)
      .eq("status", "open")
      .limit(1)
      .maybeSingle()
    if (open) return
  }

  await supabaseAdmin.from("cs_escalations").insert({
    conversation_id: input.conversationId,
    reason: input.reason,
    priority: input.priority,
    summary: input.summary.slice(0, 2000),
  })

  await supabaseAdmin
    .from("cs_conversations")
    .update(
      pauseAi
        ? {
            status: "human",
            escalated_at: new Date().toISOString(),
            ai_paused_until: new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
          }
        : { escalated_at: new Date().toISOString() }
    )
    .eq("id", input.conversationId)

  await supabaseAdmin.from("cs_audit").insert({
    actor: "system:cs",
    action: "escalation",
    subject: input.conversationId,
    detail: { reason: input.reason, priority: input.priority },
  })

  await notifyOps(
    await buildEscalationNotice({
      conversationId: input.conversationId,
      contactId: input.contactId,
      reason: input.reason,
      priority: input.priority,
    }).catch(() => input.summary.slice(0, 1200))
  )
}

const TOOL_NAMES: Record<string, string> = {
  quote: "quote_price",
  list_packages: "get_price_book",
  list_templates: "list_templates",
  check_voucher: "check_voucher",
  list_vouchers: "list_vouchers",
  profile_status: "get_profile_status",
  guest_summary: "get_guest_summary",
  profile_draft: "get_draft_state",
}

function directiveFor(decision: Decision): string {
  switch (decision.action) {
    case "tool": {
      const name = TOOL_NAMES[decision.tool] || decision.tool
      const extra =
        decision.tool === "profile_draft"
          ? ' Mulai dengan "get_draft_state", lalu simpan jawaban klien dengan "save_draft_field". Untuk sesi, cerita, jumlah tamu, atau template: panggil dulu dengan confirmed=false, bacakan ringkasannya, lalu ulangi dengan confirmed=true setelah klien setuju. Setelah semua data inti terkumpul, bacakan ringkasan dan panggil "apply_profile_draft" dengan confirm=true HANYA setelah klien membalas setuju. Jangan pernah bilang data sudah diterapkan sebelum tool itu mengembalikan applied=true.'
          : ""
      const priceHint =
        decision.tool === "quote"
          ? " Sebutkan nominal paket yang ditanyakan langsung dari DATA SISTEM; jangan hanya bilang sudah dicek."
          : decision.tool === "list_templates"
            ? ' Sebutkan 2-3 nama template dan sertakan link demo lengkap (awali dengan https://wedding.aksaraa.com). Jangan mengarang nama template. Kalau templates kosong tetapi ada inactive_matches, sebut nama yang belum aktif, bilang belum tersedia, dan tawarkan cek tim tanpa memberi link.'
            : decision.tool === "list_vouchers"
              ? " Jangan sebut kode voucher sama sekali. Tulis narasi singkat yang mengalir (2-4 kalimat): potongan apa, untuk paket apa, dan bahwa voucher bisa dipilih saat registrasi. Jangan meminta kode ke klien. Kalau tidak ada voucher aktif, bilang belum ada dan tawarkan sambungkan ke tim."
              : decision.tool === "check_voucher"
                ? " Cek kode yang dikirim klien dengan check_voucher. Jelaskan valid atau tidak beserta paket yang berlaku. Jangan mengarang kode."
                : ""
      return `Panggil tool "${name}" sebelum menjawab. Jangan menyebut angka apa pun sebelum tool mengembalikan hasil. Jawab pertanyaan klien lebih dulu dan jangan menambahkan pertanyaan penutup kecuali benar-benar perlu.${priceHint}${extra}`
    }
    case "answer":
      if (decision.intent === "print_question") {
        return "Jelaskan singkat: Aksaraa hanya menyediakan undangan digital (website), tidak ada undangan cetak atau fisik. Jangan menawarkan cetak. Tawarkan bantuan memilih template digital."
      }
      return "Jawab pertanyaan klien lebih dulu dari pengetahuan produk, FAQ, dan KEBIJAKAN LAYANAN. Jangan mengubah balasan menjadi formulir. Untuk estimasi waktu, jawab dari kebijakan; jangan bilang cek tim."
    case "refuse":
      return "Tolak dengan sopan dan arahkan kembali ke topik undangan."
    default:
      return "Jawab singkat dan jelas."
  }
}

export async function handleInbound(input: InboundInput): Promise<InboundResult> {
  const deps: AgentDeps = { ...DEFAULT_DEPS, ...input.deps }
  const ctx: CsToolContext = {
    contactId: input.contactId,
    conversationId: input.conversationId,
    weddingProfileId: input.weddingProfileId,
    verified: input.verified,
  }

  let lead = await ensureLead(input.contactId, input.weddingProfileId)

  if (lead.optOut) {
    return { replies: [], guarded: true, toolNames: [] }
  }

  const voucherCode = extractVoucherCode(input.text)

  const decisionContext: DecisionContext = {
    verified: input.verified,
    hasProfile: input.hasProfile,
    published: input.published,
    strikeCount: input.strikeCount,
    sentiment: input.sentiment,
    objectionCount: lead.objectionCount,
    missingFacts: leadMissing(lead),
    leadStage: lead.stage,
    voucherCode,
    paidClaim: detectPaymentClaim(input.text),
    wantsAllTemplates: wantsAllTemplates(input.text),
    kidsTopic: /ceriavite|khitanan|aqiqah|ulang tahun/i.test(input.text),
    asksPremiumTemplate:
      /premium/i.test(input.text) &&
      /template|desain|filter|badge|label|tanda/i.test(input.text),
    asksSwitchTemplate: asksToSwitchTemplate(input.text),
    channel: input.channel,
  }

  const intent = classify(input.text)
  const { templateAnswerKind } = await import("@/lib/cs/templateFilter")

  // Pertanyaan template yang jawabannya sudah pasti: kategori/daerah ("template
  // adat ada apa aja?"), rak terbaru/populer, filter paket, dan acara anak.
  // Dijawab dari DB + kode, bukan dari ingatan model dan bukan seluruh galeri.
  const templateIntent =
    intent === "template" ||
    (intent === "unknown" &&
      (templateAnswerKind(input.text) === "category" || templateAnswerKind(input.text) === "package"))
  if (templateIntent) {
    const { templateAnswer } = await import("@/lib/cs/templateReply")
    const listing = await templateAnswer(input.text)
    if (listing) {
      await persistOutbound(input.conversationId, listing, { intent, model: null })
      return { replies: [{ text: listing }], guarded: true, toolNames: ["list_templates"] }
    }
  }

  // Status revisi/masukan undangan: dijawab dari feedback_submissions milik
  // profil yang terikat. Jangan pernah menyebut masukan pasangan lain.
  if (intent === "feedback_status" && input.verified && input.weddingProfileId) {
    const { feedbackStatusReply } = await import("@/lib/cs/feedbackStatus")
    const feedback = await feedbackStatusReply(input.weddingProfileId)
    await persistOutbound(input.conversationId, feedback, { intent, model: null })
    return { replies: [{ text: feedback }], guarded: true, toolNames: [] }
  }

  // Status undangan: tayang/belum, apa yang kurang, paket & pembayaran, dan
  // tautan sesuai mode. Dijawab dari DB, bukan dikarang model.
  if (intent === "status" && input.verified && input.weddingProfileId && !decisionContext.paidClaim) {
    const { invitationStatusReply } = await import("@/lib/cs/invitationStatus")
    const status = await invitationStatusReply(input.weddingProfileId)
    if (status) {
      await persistOutbound(input.conversationId, status, { intent, model: null })
      return { replies: [{ text: status }], guarded: true, toolNames: [] }
    }
  }

  // Permintaan tautan undangan: jawabannya bergantung mode tautan (Terbatas /
  // Fleksibel) dan status tayang, jadi jangan diserahkan ke model.
  if (intent === "invitation_link" && input.verified && input.weddingProfileId) {
    const { invitationLinkReply } = await import("@/lib/cs/invitationLink")
    const linkAnswer = await invitationLinkReply(input.weddingProfileId)
    if (linkAnswer) {
      await persistOutbound(input.conversationId, linkAnswer, { intent, model: null })
      return { replies: [{ text: linkAnswer }], guarded: true, toolNames: [] }
    }
  }

  const decision = decide(intent, decisionContext)

  // --- Alur "Bantu Isi Undangan" -------------------------------------------
  // Kalau onboarding sedang berjalan untuk profil ini, SEMUA pesan masuk ke
  // alur itu dulu supaya jawaban tidak dianggap pertanyaan baru.
  if (input.weddingProfileId) {
    const { state: onboarding } = await getOnboardingState(input.weddingProfileId)
    if (onboarding && onboarding.stage !== "done") {
      const text = await handleOnboarding(input.weddingProfileId, input.contactId, input.text)
      // null = pertanyaan di luar alur (voucher/refund/bayar): lanjut ke router.
      if (text !== null) {
        await persistOutbound(input.conversationId, text, { intent, model: null })
        return { replies: [{ text }], guarded: true, toolNames: [] }
      }
    }
  }

  const wantsDataHelp = intent === "data_collection" || intent === "data_change"
  if (wantsDataHelp) {
    if (!input.verified && input.channel === "web") {
      const text =
        "Biar aku bisa bantu isi undangan, Kakak perlu masuk dulu ya. Buka https://wedding.aksaraa.com/login lalu balik ke chat ini."
      await persistOutbound(input.conversationId, text, { intent, model: null })
      return { replies: [{ text }], guarded: true, toolNames: [] }
    }
    if (input.verified && input.weddingProfileId) {
      const text =
        (await handleOnboarding(input.weddingProfileId, input.contactId, input.text)) ||
        "Oke, lanjut isi undangannya kapan-kapan ya Kak."
      await persistOutbound(input.conversationId, text, { intent, model: null })
      return { replies: [{ text }], guarded: true, toolNames: [] }
    }
  }
  // -------------------------------------------------------------------------

  const summary = (reason: string) =>
    handoffSummary({
      facts: lead.facts,
      reason,
      name: input.contactName,
      phone: input.phone,
      lastMessage: input.text,
      recent: [...input.history, { role: "user", content: input.text }],
      objectionCount: lead.objectionCount,
      stage: lead.stage,
    })

  if (decision.action === "opt_out") {
    await updateLead(lead.id, { opt_out: true, stage: "handoff" })
    await supabaseAdmin
      .from("cs_conversations")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", input.conversationId)
    const text = optOutReply()
    await persistOutbound(input.conversationId, text, { intent, model: null })
    return { replies: [{ text }], guarded: true, toolNames: [] }
  }

  if (decision.action === "escalate") {
    await createEscalation({
      conversationId: input.conversationId,
      contactId: input.contactId,
      reason: decision.reason,
      priority: decision.priority,
      summary: summary(decision.reason),
      pauseAi: decision.reason !== "voucher",
    })
    if (decision.reason === "low_confidence") {
      await recordUnanswered(input.conversationId, input.text, "low_confidence")
    }
    await updateLead(lead.id, { stage: "handoff" })
    const text = escalationReply(decision.reason, intent)
    await persistOutbound(input.conversationId, text, { intent, model: null })
    return {
      replies: [{ text, typing: true }],
      escalation: { reason: decision.reason, priority: decision.priority },
      guarded: true,
      toolNames: [],
    }
  }

  if (decision.action === "refuse") {
    const text = refuseReply()
    await persistOutbound(input.conversationId, text, { intent, model: null })
    return { replies: [{ text }], guarded: true, toolNames: [] }
  }

  if (decision.action === "contact") {
    // Pertanyaan pembayaran tetap membuat tiket supaya muncul di filter "Perlu",
    // tapi AI tidak dijeda: instruksi transfer sudah dikirim deterministik dan
    // klien biasanya masih lanjut bertanya soal paket.
    if (intent === "payment") {
      await createEscalation({
        conversationId: input.conversationId,
        contactId: input.contactId,
        reason: "payment",
        priority: "normal",
        summary: summary("payment"),
        pauseAi: false,
      }).catch(() => {})
      await updateLead(lead.id, { stage: "handoff" })
    }
    await persistOutbound(input.conversationId, decision.message, { intent, model: null })
    return { replies: [{ text: decision.message }], guarded: true, toolNames: [] }
  }

  if (decision.action === "verify") {
    const text = verifyPromptReply(input.hasProfile)
    await persistOutbound(input.conversationId, text, { intent, model: null })
    return { replies: [{ text }], guarded: true, toolNames: [] }
  }

  let directive = directiveFor(decision)

  // Jawaban berbasis pengetahuan hanya untuk intent "answer" (teknis, kebijakan,
  // pertanyaan produk). Harga/paket/template tetap lewat tool.
  const sources =
    decision.action === "answer" ? await findSources(input.text, 2) : []

  if (decision.action === "playbook") {
    if (decision.intent === "select_package") {
      const code = detectPackageInterest(input.text)
      if (code) {
        await saveLeadFact(input.contactId, "package_interest", code)
        lead = await ensureLead(input.contactId, input.weddingProfileId)
      }
    }

    if (decision.step === "objection") {
      const kind = (decision.strategy || "none") as ObjectionKind
      const plan = objectionPlan(kind, lead.objectionCount)

      if (plan.escalate) {
        await createEscalation({
          conversationId: input.conversationId,
          contactId: input.contactId,
          reason: "discount",
          priority: "normal",
          summary: summary("keberatan berulang"),
        })
        await updateLead(lead.id, { stage: "handoff" })
        const text = escalationReply("discount", "discount")
        await persistOutbound(input.conversationId, text, { intent, model: null })
        return {
          replies: [{ text, typing: true }],
          escalation: { reason: "discount", priority: "normal" },
          guarded: true,
          toolNames: [],
        }
      }

      if (kind === "price" || kind === "timing") {
        await recordObjection(lead.id, lead.objectionCount, plan.followupDays)
      }
      directive = plan.directive
    } else if (decision.step === "qualify") {
      const next = nextQualifyingQuestion(lead.facts, lead.qualifyAsked)
      await updateLead(lead.id, { qualify_asked: lead.qualifyAsked + 1 })
      directive = next
        ? `Klien minta rekomendasi. Jelaskan singkat kenapa kamu perlu tahu (biar paketnya pas), lalu tanya SATU hal saja: "${next.question}". Jangan menanyakan tanggal atau kota. Jangan menyebut harga sebelum rekomendasi.`
        : "Informasi sudah cukup. Berikan rekomendasi paket beserta alasannya dalam 2-3 kalimat. Jangan menambahkan pertanyaan."
    } else {
      const cta = ctaFor(lead.facts)
      directive =
        decision.intent === "select_package"
          ? `Klien sudah memilih paket. Konfirmasi paket dan harganya dari DATA SISTEM, lalu arahkan ke ${cta.url}. Jangan menanyakan voucher atau pertanyaan kualifikasi lagi. Sebutkan template dipilih saat daftar dan tawarkan bantuan kalau ada kendala.`
          : `Jawab cara daftar dengan 3 langkah singkat: (1) pilih paket dan template, (2) isi data pengantin, (3) undangan siap dibagikan. Sertakan link https://wedding.aksaraa.com/register dan ${cta.label} (${cta.url}). Jangan bilang cek tim untuk langkah dasar, dan jangan menawarkan undangan cetak.`
    }
  }

  const system = buildSystemPrompt({
    nowIso: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
    verified: input.verified,
    hasProfile: input.hasProfile,
    directive,
    maxWords: input.maxWords,
    persona: input.persona,
    leadFacts: leadPromptLine(lead),
    policyText: formatPolicies(input.policies || POLICIES),
    sources,
  })

  const prefetched: { name: string; data: unknown }[] = []
  let result: LoopResult
  try {
    if (decision.action === "tool" && decision.tool === "check_voucher" && voucherCode) {
      const voucher = await deps.runTool("check_voucher", { code: voucherCode }, ctx)
      prefetched.push({ name: "check_voucher", data: voucher.data })
      const prices = await deps.runTool("get_price_book", {}, ctx)
      prefetched.push({ name: "get_price_book", data: prices.data })
    } else if (decision.action === "tool") {
      const prefetchTool =
        decision.tool === "quote" || decision.tool === "list_packages"
          ? "get_price_book"
          : decision.tool === "list_vouchers"
            ? "list_vouchers"
            : decision.tool === "list_templates"
            ? "list_templates"
            : decision.tool === "profile_status"
              ? "get_profile_status"
              : decision.tool === "guest_summary"
                ? "get_guest_summary"
                : decision.tool === "profile_draft"
                  ? "get_draft_state"
                  : null
      if (prefetchTool) {
        const args = prefetchTool === "list_templates" ? { limit: 8 } : {}
        const data = await deps.runTool(prefetchTool, args, ctx)
        prefetched.push({ name: prefetchTool, data: data.data })
      }
    } else if (decision.action === "playbook" && decision.step === "qualify") {
      const data = await deps.runTool("recommend_package", {}, ctx)
      prefetched.push({ name: "recommend_package", data: data.data })
    } else if (
      decision.action === "playbook" &&
      decision.step === "cta" &&
      decision.intent === "select_package"
    ) {
      const data = await deps.runTool("get_price_book", {}, ctx)
      prefetched.push({ name: "get_price_book", data: data.data })
    }

    result = await runAgentLoop({
      system,
      history: input.history,
      userText: input.text,
      ctx,
      model: input.model,
      maxWords: input.maxWords,
      tools: TOOL_SCHEMAS,
      prefetched,
      expectPrice: decision.action === "tool" && decision.tool === "quote",
      expectNoVoucherCodes: decision.action === "tool" && decision.tool === "list_vouchers",
      expectedVoucherCode:
        decision.action === "tool" && decision.tool === "check_voucher" ? voucherCode : null,
      deps: {
        chat: deps.chat,
        runTool: (name, args, toolCtx) => deps.runTool(name, args, toolCtx as CsToolContext),
      },
    })
  } catch (error) {
    await recordUnanswered(input.conversationId, input.text, "llm_error")
    await createEscalation({
      conversationId: input.conversationId,
      contactId: input.contactId,
      reason: "low_confidence",
      priority: "normal",
      summary: summary(`LLM gagal: ${error instanceof Error ? error.message : "unknown"}`),
    })
    const text = safeFallbackReply()
    await persistOutbound(input.conversationId, text, { intent, model: null, error: "llm_unavailable" })
    return {
      replies: [{ text, typing: true }],
      escalation: { reason: "low_confidence", priority: "normal" },
      guarded: false,
      toolNames: [],
    }
  }

  if (!result.guarded) {
    await recordUnanswered(input.conversationId, input.text, "guard_rejected")
    await createEscalation({
      conversationId: input.conversationId,
      contactId: input.contactId,
      reason: "low_confidence",
      priority: "normal",
      summary: summary(`Guard menolak balasan: ${result.violations.join(", ")}`),
    })
  }

  const refreshed = await ensureLead(input.contactId, input.weddingProfileId)
  const stage = nextStage(refreshed.stage, {
    missingFacts: leadMissing(refreshed),
    objectionCount: refreshed.objectionCount,
    ctaReady: decision.action === "playbook" && decision.step === "cta",
    handoff: !result.guarded,
  })
  if (stage !== refreshed.stage) {
    await updateLead(refreshed.id, { stage })
  }

  // Sitasi ditambahkan deterministik dari sumber teratas, bukan oleh model:
  // selalu menunjuk dokumen yang benar-benar dikirim sebagai konteks.
  const topSource = sources[0]
  // Jawaban yang menyerahkan ke tim tidak boleh menempel sumber acak.
  const hedged = /(cek (dulu )?ke tim|tanyakan ke tim|tanya ke tim|belum (ada|punya) info|aku teruskan ke tim|sambungkan ke tim)/i.test(
    result.text
  )
  const finalText =
    result.guarded && topSource && !hedged && isCitationRelevant(result.text, topSource)
      ? result.text + citationLine(topSource)
      : result.text

  await persistOutbound(input.conversationId, finalText, {
    intent,
    model: result.model,
    toolNames: result.toolNames,
    guarded: result.guarded,
    violations: result.violations,
    attempts: result.attempts,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  })

  return {
    replies: [{ text: finalText, typing: true }],
    guarded: result.guarded,
    toolNames: result.toolNames,
    ...(result.guarded
      ? {}
      : { escalation: { reason: "low_confidence" as EscalationReason, priority: "normal" as Priority } }),
  }
}

async function persistOutbound(
  conversationId: string,
  text: string,
  meta: {
    intent: string
    model: string | null
    toolNames?: string[]
    guarded?: boolean
    violations?: string[]
    attempts?: { text: string; violations: string[] }[]
    promptTokens?: number
    completionTokens?: number
    error?: string
  }
): Promise<void> {
  await supabaseAdmin.from("cs_messages").insert({
    conversation_id: conversationId,
    direction: "out",
    role: "assistant",
    body: text,
    intent: meta.intent,
    model: meta.model,
    tool_result: meta.toolNames?.length ? { tools: meta.toolNames } : null,
    guard:
      meta.guarded === undefined
        ? null
        : { ok: meta.guarded, violations: meta.violations || [], attempts: meta.attempts || [] },
    input_tokens: meta.promptTokens || 0,
    output_tokens: meta.completionTokens || 0,
    error: meta.error || null,
  })

  await supabaseAdmin
    .from("cs_conversations")
    .update({ last_outbound_at: new Date().toISOString() })
    .eq("id", conversationId)
}
