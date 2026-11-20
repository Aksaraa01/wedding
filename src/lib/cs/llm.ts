// Klien LLM minimal untuk OpenRouter (OpenAI-compatible).
// Server-only: key tidak pernah dikirim ke browser.

export interface LlmToolCall {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  tool_calls?: LlmToolCall[]
  tool_call_id?: string
  name?: string
}

export interface LlmResult {
  message: LlmMessage
  promptTokens: number
  completionTokens: number
  model: string
  finishReason: string
}

export interface LlmRequest {
  model: string
  messages: LlmMessage[]
  tools?: readonly unknown[]
  temperature?: number
  maxTokens?: number
  /** Batas waktu permintaan. Default 35 detik; klasifikasi intent memakai 2,5 detik. */
  timeoutMs?: number
}

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LlmUnavailableError"
  }
}

export async function chatCompletion(request: LlmRequest): Promise<LlmResult> {
  const key = (process.env.OPENROUTER_API_KEY || "").trim()
  if (!key) throw new LlmUnavailableError("OPENROUTER_API_KEY belum diset")

  const base = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "")

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://wedding.aksaraa.com",
      "X-Title": "Aksaraa CS",
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      tools: request.tools,
      tool_choice: request.tools ? "auto" : undefined,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1200,
    }),
    signal: AbortSignal.timeout(request.timeoutMs ?? 35_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new LlmUnavailableError(`LLM ${res.status}: ${body.slice(0, 300)}`)
  }

  const json = (await res.json()) as {
    model?: string
    choices?: { message?: LlmMessage; finish_reason?: string }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }

  const message = json.choices?.[0]?.message
  if (!message) throw new LlmUnavailableError("LLM tidak mengembalikan pesan")

  return {
    message,
    promptTokens: json.usage?.prompt_tokens || 0,
    completionTokens: json.usage?.completion_tokens || 0,
    model: json.model || request.model,
    finishReason: json.choices?.[0]?.finish_reason || "",
  }
}
