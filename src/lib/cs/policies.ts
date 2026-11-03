// Kebijakan layanan yang boleh dijawab langsung oleh agent.
// Disimpan di cs_settings.guardrails supaya bisa diubah tanpa deploy.

export interface CsPolicies {
  timelineSelf: string
  timelineAssisted: string
}

export const POLICIES: CsPolicies = {
  timelineSelf:
    "Kalau data diisi sendiri oleh pasangan, undangan bisa selesai dalam hitungan menit setelah datanya lengkap. Cepat atau tidaknya tergantung kecepatan dan kelengkapan data dari pasangan.",
  timelineAssisted:
    "Kalau pengisian data dibantu tim, waktunya menyesuaikan antrian pengerjaan. Setelah data lengkap, tim akan mengabari perkiraan selesainya.",
}

export function resolvePolicies(raw: unknown): CsPolicies {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    timelineSelf:
      typeof source.timeline_self === "string" && source.timeline_self.trim()
        ? source.timeline_self.trim()
        : POLICIES.timelineSelf,
    timelineAssisted:
      typeof source.timeline_assisted === "string" && source.timeline_assisted.trim()
        ? source.timeline_assisted.trim()
        : POLICIES.timelineAssisted,
  }
}

export function formatPolicies(policies: CsPolicies): string {
  return [
    `- Estimasi waktu (data diisi sendiri): ${policies.timelineSelf}`,
    `- Estimasi waktu (dibantu tim): ${policies.timelineAssisted}`,
  ].join("\n")
}
