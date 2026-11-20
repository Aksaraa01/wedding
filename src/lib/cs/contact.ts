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

// Pertanyaan "semua template" dijawab dengan galeri, bukan 8 link acak.
export function templateGalleryReply(kids: boolean): string {
  if (kids) {
    return [
      "Semua desain Ceriavite (khitanan, aqiqah, ulang tahun) bisa dilihat di:",
      "https://ceriavite.aksaraa.com",
      "",
      'Kalau mau, sebutkan acaranya (khitanan/aqiqah/ulang tahun) biar aku bantu pilihkan.',
    ].join("\n")
  }
  return [
    "Semua template undangan pernikahan bisa dilihat di galeri ini:",
    "https://wedding.aksaraa.com/templates",
    "",
    "Di sana bisa disaring per kategori (adat, modern, elegan, floral) dan ada filter dengan/tanpa foto.",
    'Kalau mau, sebutkan tema atau acaranya biar aku bantu pilihkan.',
  ].join("\n")
}

// "Template premium itu maksudnya apa?" → ini soal FILTER paket di galeri,
// bukan tingkatan kualitas desain. Dijawab tetap supaya tidak salah tebak.
export function premiumTemplateReply(): string {
  return [
    'Di galeri template ada filter paket: Semua, Basic, dan Premium.',
    '',
    '• Basic: desain yang terbuka lewat paket BONUS (diberikan tim, bukan paket berbayar).',
    '• Premium: desain yang perlu paket berbayar (Essential, Signature, Prestige, Elite).',
    '',
    'Jadi "template premium" bukan tingkatan kualitas desain, tapi penanda bahwa desainnya tidak termasuk paket bonus.',
    'Kalau di dashboard ada label Premium di sudut desain, artinya desain itu belum termasuk paket Kakak.',
    '',
    'Buka galeri lalu pilih filter Premium:',
    'https://wedding.aksaraa.com/templates',
  ].join("\n")
}

// "Bisa ganti template setelah daftar?" — bot tidak boleh menjanjikan apa pun,
// dan tidak perlu membuat tiket kalau klien baru bertanya. Kalau klien minta
// diproses, itu baru `data_change`.
export function switchTemplateReply(): string {
  return [
    "Template yang sudah dipakai tidak bisa diganti sendiri dari halaman undangan.",
    "Kalau memang perlu diganti, tim yang memproses (datanya tetap aman).",
    "",
    "Kalau mau dibantu sekarang, balas \"minta tim\" dan aku sambungkan ke tim CS.",
  ].join("\n")
}
