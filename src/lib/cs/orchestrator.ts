import { supabaseAdmin } from "@/lib/supabase"
import {
  classify,
  decide,
  type Decision,
  type DecisionContext,
  type EscalationReason,
  type Priority,
} from "@/lib/cs/policy"
import { buildSystemPrompt } from "@/lib/cs/prompt"
import { runAgentLoop, type LoopResult } from "@/lib/cs/agentLoop"
import { chatCompletion } from "@/lib/cs/llm"
import { runTool, TOOL_SCHEMAS, type CsToolContext } from "@/lib/cs/tools"
import {
  escalationReply,
  optOutReply,
  refuseReply,
  safeFallbackReply,
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

async function notifyOpsGroup(text: string): Promise<void> {
  const url = process.env.WA_SCHOOL_API_URL || "http://127.0.0.1:3001/send"
  const target = process.env.WA_TARGET_GROUP_JID || ""
  if (!target) return
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: target, message: text }),
      signal: AbortSignal.timeout(4000),
    })
  } catch {
    // Notifikasi gagal tidak boleh menggagalkan balasan ke klien.
  }
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

  await notifyOpsGroup(
    [
      `🔔 CS perlu tindakan (${input.priority})`,
      `Alasan: ${input.reason}`,
      input.summary.slice(0, 700),
      `Buka: https://wedding.aksaraa.com/ops/cs`,
    ].join("\n")
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
          ? ' Mulai dengan "get_draft_state", lalu simpan jawaban klien dengan "save_draft_field". Untuk sesi, cerita, jumlah tamu, atau template: panggil dulu dengan confirmed=false, bacakan ringkasannya, lalu ulangi dengan confirmed=true setelah klien setuju.'
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
  }

  const intent = classify(input.text)
  const decision = decide(intent, decisionContext)

  const summary = (reason: string) =>
    handoffSummary({
      facts: lead.facts,
      reason,
      name: input.contactName,
      phone: input.phone,
      lastMessage: input.text,
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

  if (decision.action === "verify") {
    const text = verifyRequiredReply()
    await persistOutbound(input.conversationId, text, { intent, model: null })
    return { replies: [{ text }], guarded: true, toolNames: [] }
  }

  let directive = directiveFor(decision)

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

  await persistOutbound(input.conversationId, result.text, {
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
    replies: [{ text: result.text, typing: true }],
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
