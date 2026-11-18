// Kirim pesan WhatsApp untuk CS.
//
// Urutan: gateway CS (nomor khusus, CS_WA_SEND_URL) → gateway bot lama
// (WA_SCHOOL_API_URL). Fallback ini penting selama nomor CS belum di-pair:
// notifikasi eskalasi dan OTP tidak boleh hilang hanya karena gateway baru
// belum terhubung.

export function csSendUrls(): string[] {
  const urls = [
    process.env.CS_WA_SEND_URL,
    process.env.WA_SCHOOL_API_URL,
    "http://127.0.0.1:3001/send",
  ].filter((value): value is string => !!value && value.trim() !== "")
  return Array.from(new Set(urls.map((url) => url.replace(/\/$/, ""))))
}

export async function sendCsWhatsApp(
  phone: string,
  message: string,
  timeoutMs = 6000
): Promise<boolean> {
  for (const url of csSendUrls()) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (res.ok) return true
    } catch {
      // coba gateway berikutnya
    }
  }
  return false
}
