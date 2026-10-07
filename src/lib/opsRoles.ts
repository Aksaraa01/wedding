import { OPS_STATUS_LABELS } from "@/lib/opsStatus"

export const OPS_ROLES = ["admin", "sales", "creative"] as const
export type OpsRole = (typeof OPS_ROLES)[number]

export const TAB_ROLES: Record<string, OpsRole[]> = {
  antrian: ["admin", "sales", "creative"],
  music: ["admin", "creative"],
  template: ["admin", "creative"],
  voucher: ["admin", "sales"],
}

export function canChangeStatus(role: string, derived: string): boolean {
  if (role === "admin") return true
  if (role === "sales") return derived !== "feedback_baru" && derived !== "feedback_progress"
  if (role === "creative") return derived === "feedback_baru" || derived === "feedback_progress"
  return false
}

export function unauthorizedStatusMessage(role: string, derived: string): string {
  const label = (OPS_STATUS_LABELS as Record<string, string>)[derived] || derived
  if (role === "sales" && (derived === "feedback_baru" || derived === "feedback_progress")) {
    return `Perubahan status pada tahap "${label}" hanya dapat dilakukan oleh Creative atau Admin. Peran Anda saat ini: Sales.`
  }
  if (role === "creative" && derived !== "feedback_baru" && derived !== "feedback_progress") {
    return `Perubahan status pada tahap "${label}" hanya dapat dilakukan oleh Sales atau Admin. Peran Anda saat ini: Creative.`
  }
  if (role !== "admin") {
    return `Akses ditolak untuk peran ${role} pada tahap "${label}". Hubungi Admin.`
  }
  return `Akses ditolak.`
}

export function canAccessTab(role: string, tab: string): boolean {
  const allowed = TAB_ROLES[tab]
  if (!allowed) return true
  return allowed.includes(role as OpsRole)
}
