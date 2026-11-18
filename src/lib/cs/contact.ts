// Kontak CS yang boleh disebut ke klien.
//
// Satu sumber kebenaran: notifikasi internal dan balasan ke klien memakai nomor
// yang sama. Guard memblokir nomor HP selain milik penerima, jadi balasan yang
// menyebut nomor ini harus lewat jalur deterministik (bukan output model).
export const CS_WHATSAPP = "6281161613071"

export function csWhatsAppUrl(context?: string): string {
  const text = context || "Halo tim Aksaraa, saya mau tanya soal pembayaran undangan."
  return `https://wa.me/${CS_WHATSAPP}?text=${encodeURIComponent(text)}`
}

export function paymentContactReply(): string {
  return `Buat pembayaran, langsung chat tim kami di WhatsApp ${CS_WHATSAPP} ya Kak: ${csWhatsAppUrl()}\nTim bantu sampai pembayarannya tercatat.`
}
