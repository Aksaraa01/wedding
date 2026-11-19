// Kirim pesan WhatsApp untuk CS.
//
// SATU nomor, satu jalur: gateway CS (CS_WA_SEND_URL, nomor yang sudah
// di-pair — 6281265781778). Gateway bot lama (WA_SCHOOL_API_URL, nomor lain)
// TIDAK boleh dipakai lagi untuk pesan ke klien: klien akan menerima balasan
// dari nomor asing. Fallback lama hanya dipakai kalau CS_WA_SEND_URL memang
// belum dikonfigurasi sama sekali.

export interface CsSendTarget {
  phone?: string | null
  jid?: string | null
}

function isChatJid(value: string | null | undefined): boolean {
  return !!value && (value.endsWith("@s.whatsapp.net") || value.endsWith("@lid"))
}

export function csSendUrls(): string[] {
  const cs = (process.env.CS_WA_SEND_URL || "").trim()
  if (cs) return [cs.replace(/\/$/, "")]
  const legacy = (process.env.WA_SCHOOL_API_URL || "").trim()
  return legacy ? [legacy.replace(/\/$/, "")] : []
}

export async function sendCsWhatsApp(
  target: CsSendTarget | string,
  message: string,
  timeoutMs = 6000
): Promise<boolean> {
  const value: CsSendTarget = typeof target === "string" ? { phone: target } : target
  const jid = isChatJid(value.jid) ? value.jid : null
  const phone = (value.phone || "").trim()
  if (!jid && !phone) return false

  for (const url of csSendUrls()) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Gateway CS mewajibkan header ini; gateway lama mengabaikannya.
          "x-cs-secret": process.env.CS_GATEWAY_SECRET || "",
        },
        // `jid` (lid) lebih andal daripada nomor telepon: chat modern memakai
        // @lid, dan nomor mentah bisa gagal di-resolve.
        body: JSON.stringify(jid ? { jid, phone, message } : { phone, message }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (res.ok) return true
    } catch {
      // tidak ada jalur lain: jangan pernah pindah ke nomor bot lama
    }
  }
  return false
}
