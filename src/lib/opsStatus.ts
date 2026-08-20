export const OPS_COLUMNS = [
  { key: "belum_bayar", label: "Belum Bayar", icon: "payments" },
  { key: "sudah_bayar", label: "Sudah Bayar", icon: "check_circle" },
  { key: "feedback_baru", label: "Feedback Baru", icon: "mail" },
  { key: "feedback_progress", label: "Feedback On Progress", icon: "hourglass_top" },
  { key: "feedback_selesai", label: "Feedback Selesai", icon: "task_alt" },
  { key: "project_selesai", label: "Project Selesai", icon: "verified" },
] as const

export type OpsStatusKey = (typeof OPS_COLUMNS)[number]["key"]

export const OPS_STATUS_LABELS: Record<OpsStatusKey, string> = Object.fromEntries(
  OPS_COLUMNS.map((c) => [c.key, c.label]),
) as Record<OpsStatusKey, string>

// The forward feedback pipeline. Advancing past the payment stage follows this
// strictly one step at a time.
const FEEDBACK_CHAIN: OpsStatusKey[] = [
  "sudah_bayar",
  "feedback_baru",
  "feedback_progress",
  "feedback_selesai",
  "project_selesai",
]

export function isOpsStatusKey(v: unknown): v is OpsStatusKey {
  return typeof v === "string" && v in OPS_STATUS_LABELS
}

// The column a card belongs to. Derived from the stored pipeline status, with
// one hard rule: any PENDING feedback submission always drags the card back to
// the Feedback Baru column (resubmission), regardless of stored progress.
export function resolveDerivedStatus(opts: {
  storedStatus: string
  paymentStatus: string
  latestFeedbackStatus: string | null
}): OpsStatusKey {
  if (opts.latestFeedbackStatus === "pending") return "feedback_baru"
  const stored = opts.storedStatus as OpsStatusKey
  if (isOpsStatusKey(stored)) return stored
  // Legacy rows that never left the pre-pipeline state.
  if (opts.paymentStatus !== "UNPAID") return "sudah_bayar"
  return "belum_bayar"
}

// Transitions the agent may fire from a given (derived) column.
// Payment corrections (Belum Bayar <-> Sudah Bayar) stay available at every
// stage to fix human error; the feedback chain only advances one strict step.
export function allowedNextStatuses(current: OpsStatusKey): OpsStatusKey[] {
  const targets: OpsStatusKey[] = []
  if (current !== "belum_bayar") targets.push("belum_bayar")
  if (current !== "sudah_bayar") targets.push("sudah_bayar")
  const idx = FEEDBACK_CHAIN.indexOf(current)
  if (idx >= 0 && idx < FEEDBACK_CHAIN.length - 1) {
    targets.push(FEEDBACK_CHAIN[idx + 1])
  }
  return targets
}