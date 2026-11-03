import { chatCompletion, type LlmMessage, type LlmRequest, type LlmResult } from "./llm"
import { SAFE_FALLBACK, validateReply } from "./guard"
import { sanitizeReply } from "./text"

export interface AgentDeps {
  chat: (request: LlmRequest) => Promise<LlmResult>
  runTool: (name: string, args: Record<string, unknown>, ctx: unknown) => Promise<{ data: unknown; evidence: unknown }>
}

export interface LoopInput {
  system: string
  history: { role: "user" | "assistant"; content: string }[]
  userText: string
  ctx: unknown
  model: string
  maxWords: number
  tools: readonly unknown[]
  prefetched?: { name: string; data: unknown }[]
  expectPrice?: boolean
  expectNoVoucherCodes?: boolean
  expectedVoucherCode?: string | null
  deps: AgentDeps
}

export interface LoopResult {
  text: string
  guarded: boolean
  violations: string[]
  attempts: { text: string; violations: string[] }[]
  toolNames: string[]
  model: string
  promptTokens: number
  completionTokens: number
}

function safeArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}")
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export async function runAgentLoop(input: LoopInput): Promise<LoopResult> {
  const prefetched = input.prefetched || []
  const prefetchBlock = prefetched.length
    ? `\n\nDATA SISTEM (sudah diambil untukmu; pakai angkanya, jangan mengarang, jangan sebut ini data sistem):\n${JSON.stringify(
        prefetched.map((item) => item.data)
      ).slice(0, 6000)}\nATURAN DATA: kalau klien menanyakan harga, sebutkan nominalnya langsung dari data ini. Jangan menjawab \"sudah aku cek\" tanpa angka.`
    : ""

  const messages: LlmMessage[] = [{ role: "system", content: input.system + prefetchBlock }]
  for (const item of input.history.slice(-10)) {
    messages.push({ role: item.role, content: item.content })
  }
  messages.push({ role: "user", content: input.userText })

  const evidence: unknown[] = prefetched.map((item) => ({ name: item.name, data: item.data }))
  const toolNames: string[] = prefetched.map((item) => item.name)
  let text = ""
  let finishReason = ""
  let model = input.model
  let promptTokens = 0
  let completionTokens = 0

  for (let step = 0; step < 3; step++) {
    const result = await input.deps.chat({
      model: input.model,
      messages,
      tools: input.tools,
      temperature: 0.7,
    })

    model = result.model
    finishReason = result.finishReason
    promptTokens += result.promptTokens
    completionTokens += result.completionTokens

    const calls = result.message.tool_calls || []
    if (calls.length === 0) {
      text = (result.message.content || "").trim()
      break
    }

    messages.push({
      role: "assistant",
      content: result.message.content ?? null,
      tool_calls: calls,
    })

    for (const call of calls) {
      const args = safeArgs(call.function.arguments)
      const toolResult = await input.deps.runTool(call.function.name, args, input.ctx)
      evidence.push({ name: call.function.name, data: toolResult.evidence })
      toolNames.push(call.function.name)
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(toolResult.data).slice(0, 4000),
      })
    }
  }

  const attempts: { text: string; violations: string[] }[] = []
  const recordAttempt = (value: string, result: ReturnType<typeof validateReply>) => {
    attempts.push({
      text: value.slice(0, 600),
      violations: result.violations.filter((v) => v.severity === "error").map((v) => v.code),
    })
  }

  let check = validateReply({
    reply: text,
    evidence,
    maxWords: input.maxWords,
    expectPrice: input.expectPrice,
    expectNoVoucherCodes: input.expectNoVoucherCodes,
    expectedVoucherCode: input.expectedVoucherCode,
  })
  if (finishReason === "length") {
    check = {
      ok: false,
      violations: [
        ...check.violations,
        { code: "truncated_reply", severity: "error", detail: "balasan terpotong" },
      ],
    }
  }

  recordAttempt(text, check)

  if (!check.ok) {
    const codes = check.violations
      .filter((v) => v.severity === "error")
      .map((v) => v.code)
      .join(", ")

    messages.push({ role: "assistant", content: text })
    messages.push({
      role: "user",
      content: `Balasanmu ditolak pemeriksa sistem (${codes}). Tulis ulang memakai angka yang ada di DATA SISTEM atau hasil tool; jangan mengarang angka lain. Maksimal ${input.maxWords} kata, satu pertanyaan saja.`,
    })

    const retry = await input.deps.chat({
      model: input.model,
      messages,
      temperature: 0.3,
    })

    promptTokens += retry.promptTokens
    completionTokens += retry.completionTokens
    finishReason = retry.finishReason
    text = (retry.message.content || "").trim()
    check = validateReply({
      reply: text,
      evidence,
      maxWords: input.maxWords,
      expectPrice: input.expectPrice,
      expectNoVoucherCodes: input.expectNoVoucherCodes,
    })
    if (finishReason === "length") {
      check = {
        ok: false,
        violations: [
          ...check.violations,
          { code: "truncated_reply", severity: "error", detail: "balasan terpotong" },
        ],
      }
    }
    recordAttempt(text, check)
  }

  if (!check.ok) {
    return {
      text: SAFE_FALLBACK,
      guarded: false,
      violations: check.violations.filter((v) => v.severity === "error").map((v) => v.code),
      attempts,
      toolNames,
      model,
      promptTokens,
      completionTokens,
    }
  }

  return {
    text: sanitizeReply(text),
    guarded: true,
    violations: [],
    attempts,
    toolNames,
    model,
    promptTokens,
    completionTokens,
  }
}

export const DEFAULT_CHAT = chatCompletion
