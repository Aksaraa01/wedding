export type MsgCategory = "nasional" | "international" | "muslim" | "kristen" | "budha" | "hindu"

export const MSG_CATEGORIES: { id: MsgCategory; label: string }[] = [
  { id: "nasional", label: "Nasional" },
  { id: "international", label: "International" },
  { id: "muslim", label: "Muslim" },
  { id: "kristen", label: "Kristen" },
  { id: "budha", label: "Budha" },
  { id: "hindu", label: "Hindu" },
]

export const MSG_TEMPLATES: Record<MsgCategory, string> = {
  nasional: `Yth. Bapak/Ibu/Saudara/i {Nama Tamu},\nKebahagiaan akan terasa lebih lengkap jika disambut bersama orang-orang tersayang.\nDengan penuh rasa syukur, kami mengundang Anda untuk menjadi bagian dari momen bahagia pernikahan kami.\n\n🗓️ Detail Acara & RSVP:\n{Tautan Undangan}\n\nMerupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\nSampai jumpa di hari bahagia kami!\n\nSalam hangat,\n{Nama Pasangan}`,
  international: `Dear {Nama Tamu},\n\nAs we begin this wonderful new chapter, our hearts are filled with gratitude for your love and friendship over the years.\nWe would be honored to have you celebrate our wedding day with us!\n\n🗓️ Event Details & RSVP:\n{Tautan Undangan}\n\nWe truly look forward to sharing this special day together.\n\nWarm regards,\n{Nama Pasangan}`,
  muslim: `Assalamu’alaikum Warahmatullahi Wabarakatuh\n\nYth. Bapak/Ibu/Saudara/i {Nama Tamu},\n\nDengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan syukuran pernikahan kami.\nKehadiran serta doa tulus dari Anda akan menambah kebahagiaan di hari istimewa ini.\n\n📌 Rincian Acara & Konfirmasi Kehadiran:\n{Tautan Undangan}\n\nTerima kasih atas segala doa baik yang dipanjatkan.\nWassalamu’alaikum Warahmatullahi Wabarakatuh.\n\nKami yang berbahagia,\n{Nama Pasangan}`,
  kristen: `Salam Sejahtera Bapak/Ibu/Saudara/i {Nama Tamu},\n\n"Demikianlah mereka bukan lagi dua, melainkan satu."\nAtas kasih dan kebaikan Tuhan, kami mengundang Anda untuk hadir dan menjadi saksi dalam janji suci pernikahan kami.\n\n⛪ Informasi Tata Ibadah & Resepsi:\n{Tautan Undangan}\n\nKehadiran dan persekutuan Anda merupakan berkah yang luar biasa bagi kami.\nTuhan Yesus memberkati.\n\nSalam kasih,\n{Nama Pasangan}`,
  budha: `Namo Buddhaya\nYth. Bapak/Ibu/Saudara/i {Nama Tamu},\n\nAtas berkah dan cinta kasih yang meliputi hidup kami, kami dengan penuh rasa hormat mengundang Anda untuk menghadiri perayaan pernikahan kami.\n\n🪷 Panduan Acara & RSVP:\n{Tautan Undangan}\n\nSemoga kebaikan dan kebahagiaan senantiasa menyertai kita semua.\n\nSalam bahagia,\n{Nama Pasangan}`,
  hindu: `Om Swastyastu\nYth. Bapak/Ibu/Saudara/i {Nama Tamu},\n\nAtas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, kami menyatukan dua hati dalam pawiwahan suci pernikahan kami.\n\n🛕 Rincian Prosesi & Lokasi:\n{Tautan Undangan}\n\nMatur Suksma atas perhatian, doa, dan kehadiran Anda yang penuh makna.\nOm Shanti, Shanti, Shanti Om.\n\nKami yang mengundang,\n{Nama Pasangan}`,
}

export const MSG_VARS: { tag: string; label: string }[] = [
  { tag: "{Nama Tamu}", label: "Nama Tamu" },
  { tag: "{Nama Pasangan}", label: "Nama Pasangan" },
  { tag: "{Tautan Undangan}", label: "Tautan Undangan" },
]

export function isValidMsgCategory(v: unknown): v is MsgCategory {
  return typeof v === "string" && (MSG_CATEGORIES as { id: string }[]).some((c) => c.id === v)
}

export function renderMessage(text: string, guestName: string, coupleName: string, guestUrl: string): string {
  return (text || "")
    .split("{Nama Tamu}").join(`*${guestName}*`)
    .split("{Nama Pasangan}").join(`*${coupleName}*`)
    .split("{Tautan Undangan}").join(guestUrl)
}

export function cleanMessageForCell(text: string): string {
  return (text || "").replace(/\r/g, "").replace(/^"+|"+$/g, "").replace(/"/g, "“")
}
