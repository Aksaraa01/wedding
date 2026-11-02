import { resolveCoupleName, type CoupleNameInput } from "./coupleName"

export type ReminderTemplate = { label: string; text: string }

export const MESSAGE_TEMPLATES: Record<string, ReminderTemplate> = {
  formal: {
    label: "Formal & Resmi",
    text: "Kepada Yth. {Nama Tamu},\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir pada acara pernikahan kami.\n\nSimak detail undangan digital Anda melalui tautan berikut:\n{Tautan Unik}\n\nJangan lupa simpan QR Code akses masuk Anda.\n\nMerupakan suatu kehormatan apabila Anda berkenan hadir meluangkan waktu.\n\nHormat kami,\n{Nama Pengantin}",
  },
  hangat: {
    label: "Hangat & Personal",
    text: "Halo {Nama Tamu}! 🥂\n\nKami tidak sabar untuk merayakan hari spesial kami bersama Anda. Terima kasih telah menjadi bagian dari cerita cinta kami.\n\nSilakan akses undangan digital dan konfirmasi kehadiran Anda di:\n{Tautan Unik}\n\nQR Code masuk sudah menanti, jangan sampai ketinggalan ya!\n\nSampai jumpa di hari bahagia kami!\n{Nama Pengantin} ❤️",
  },
  singkat: {
    label: "Singkat & Padat",
    text: "{Nama Tamu},\n\nInformasi pernikahan kami:\n\n📅 {Tanggal}\n📍 {Lokasi}\n🔗 {Tautan Unik}\n\nQR Code akses: simpan untuk masuk.\nNomor Meja: {Nomor Meja}\n\nSampai jumpa!\n{Nama Pengantin}",
  },
  islami: {
    label: "Islami",
    text: "Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nKepada Yth. {Nama Tamu},\n\nDengan memohon ridha dan rahmat Allah SWT, kami mengundang Anda untuk menghadiri akad nikah dan resepsi putra-putri kami.\n\nSemoga kehadiran Anda menjadi keberkahan bagi kami. Detail acara:\n{Tautan Unik}\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n{Nama Pengantin}",
  },
  keluarga: {
    label: "Keluarga & Akrab",
    text: "Kepada {Nama Tamu} tersayang,\n\nDengan penuh sukacita, kami sekeluarga mengundang Anda untuk hadir merayakan momen bahagia pernikahan kami.\n\nKehadiran Anda adalah doa dan kebahagiaan bagi kami. Silakan buka undangan digital kami di:\n{Tautan Unik}\n\nJangan lupa simpan QR Code akses masuknya ya.\n\nSampai jumpa dalam doa dan keceriaan,\n{Nama Pengantin}",
  },
  santun: {
    label: "Santun & Elegan",
    text: "Yang terhormat Bapak/Ibu/Saudara/i {Nama Tamu},\n\nDengan hormat, kami bermaksud mengundang Anda untuk berkenan hadir pada acara pernikahan kami.\n\nMohon kiranya Anda berkenan meluangkan waktu untuk menyaksikan momen sakral kami. Detail undangan:\n{Tautan Unik}\n\nQR Code akses masuk Anda telah kami siapkan.\n\nAtas kehadiran dan doa restu Anda, kami ucapkan terima kasih.\n\nHormat kami,\n{Nama Pengantin}",
  },
  sahabat: {
    label: "Sahabat",
    text: "Hey {Nama Tamu}! 🎉\n\nAkhirnya hari bahagia kami hampir tiba, dan kamu wajib jadi bagiannya!\n\nJangan lupa cek undangan digitalnya ya:\n{Tautan Unik}\n\nSimpan QR Code masuk kamu, biar nggak bingung saat tiba di lokasi.\n\nSampai ketemu dan happy wedding!\n{Nama Pengantin}",
  },
  rekan: {
    label: "Rekan Kerja & Korporat",
    text: "Kepada Yth. {Nama Tamu},\n\nDengan hormat, kami mengundang Anda untuk berkenan hadir pada acara pernikahan kami.\n\nDetail undangan dan konfirmasi kehadiran dapat diakses melalui:\n{Tautan Unik}\n\nQR Code akses masuk telah kami sediakan.\n\nDemikian undangan ini kami sampaikan, atas kehadirannya kami ucapkan terima kasih.\n\nHormat kami,\n{Nama Pengantin}",
  },
  mewah: {
    label: "Mewah & Eksklusif",
    text: "Dear {Nama Tamu},\n\nAn affair of timeless elegance awaits. We are delighted to invite you to witness the beginning of our forever.\n\nYour exclusive digital invitation:\n{Tautan Unik}\n\nKindly present your QR Code for a seamless entrance.\nTable: {Nomor Meja}\n\nWe look forward to celebrating with you.\n\nWith love,\n{Nama Pengantin}",
  },
  elegant: {
    label: "Elegant Invitation",
    text: "Dear {Nama Tamu},\n\nWe would be honored to have you join us as we celebrate the beginning of our new journey together.\n\nPlease find your personal digital invitation at:\n{Tautan Unik}\n\nYour QR Code pass has been prepared for a smooth entrance.\n\nWe look forward to celebrating this special day with you.\n\nWarm regards,\n{Nama Pengantin}",
  },
}

export type ReminderContext = {
  NamaTamu?: string
  Tanggal?: string
  Lokasi?: string
  TautanUnik?: string
  QRAkses?: string
  NomorMeja?: string
  NamaPengantin?: string
}

export function renderReminderMessage(text: string, ctx: ReminderContext): string {
  const replacements: Record<string, string | undefined> = {
    "{Nama Tamu}": ctx.NamaTamu,
    "{Tanggal}": ctx.Tanggal,
    "{Lokasi}": ctx.Lokasi,
    "{Tautan Unik}": ctx.TautanUnik,
    "{QR Akses}": ctx.QRAkses,
    "{Nomor Meja}": ctx.NomorMeja,
    "{Nama Pengantin}": ctx.NamaPengantin,
  }
  let out = text
  for (const [tag, value] of Object.entries(replacements)) {
    if (value) out = out.split(tag).join(value)
  }
  return out
}

export function getCoupleDisplayName(profile: CoupleNameInput): string {
  return resolveCoupleName(profile)
}
