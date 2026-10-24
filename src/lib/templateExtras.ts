export interface TemplateExtraField {
  key: string
  label: string
  multiline?: boolean
  rows?: number
  placeholder?: string
  // Per-template placeholder override. Resolved by getTemplateExtraFields so a
  // shared field (e.g. gallery_quote) hints the copy of the active template.
  placeholders?: Record<string, string>
  templates: string[]
}

export const TEMPLATE_EXTRA_FIELDS: TemplateExtraField[] = [
  {
    key: "welcome_invite",
    label: "Teks Ajakan Sampul",
    multiline: true,
    rows: 2,
    placeholders: {
      "lunar-blossom": "Anda diundang untuk merayakan pernikahan",
    },
    templates: ["lunar-blossom"],
  },
  {
    key: "events_intro",
    label: "Pengantar Acara",
    multiline: true,
    rows: 3,
    placeholders: {
      "lunar-blossom":
        "Dengan kasih karunia Tuhan, kami dengan hormat memohon kehadiran Anda pada pernikahan anak-anak kami tercinta",
    },
    templates: ["lunar-blossom"],
  },
  {
    key: "cover_kicker",
    label: "Teks Pembuka Sampul",
    multiline: true,
    rows: 2,
    placeholder: "Dua Insan Ini\\nAkan Menikah",
    templates: ["evermore"],
  },
  {
    key: "cover_apology",
    label: "Permohonan Maaf Sampul",
    placeholders: {
      sandhya: "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.",
      "piano-garden": "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.",
      "altar-garden": "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.",
      "adat-melayu": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "adat-batak": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "adat-minang": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "adat-palembang": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
    },
    templates: ["sandhya", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
  {
    key: "profiles_intro",
    label: "Pengantar Profil Mempelai",
    multiline: true,
    rows: 2,
    placeholder: "Dua hati, satu playlist, dan nol kesepakatan soal mau makan apa.",
    templates: ["evermore"],
  },
  {
    key: "story_intro",
    label: "Pengantar Kisah Cinta",
    multiline: true,
    rows: 2,
    placeholder: "Dari pertemuan tak sengaja hingga seumur hidup saling memilih.",
    templates: ["evermore"],
  },
  {
    key: "gallery_intro",
    label: "Pengantar Galeri",
    multiline: true,
    rows: 3,
    placeholders: {
      evermore: "Beberapa bingkai yang telah kami lalui bersama, tersimpan seperti foto lama di album keluarga.",
      "piano-garden": "Momen yang kami simpan erat, seperti kenangan dalam album keluarga.",
      "altar-garden": "Momen yang kami simpan erat, seperti kenangan dalam album keluarga.",
      "adat-melayu": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-batak": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-minang": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-palembang": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
    },
    templates: ["evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
  {
    key: "gallery_quote",
    label: "Kutipan Galeri",
    multiline: true,
    rows: 2,
    placeholders: {
      evermore: "Di antara sapaan pertama dan setiap hari esok, kami menemukan selamanya.",
      sandhya: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      "piano-garden": "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      "altar-garden": "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      "adat-melayu": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-batak": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-minang": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-palembang": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
  {
    key: "gift_intro_title",
    label: "Judul Bagian Hadiah",
    placeholders: {
      evermore: "Hadiah Pernikahan",
      sandhya: "Tanda Kasih",
      "piano-garden": "Tanda Kasih",
      "altar-garden": "Tanda Kasih",
      "adat-melayu": "Love Gift",
      "adat-batak": "Love Gift",
      "adat-minang": "Love Gift",
      "adat-palembang": "Love Gift",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
  {
    key: "gift_intro_description",
    label: "Deskripsi Bagian Hadiah",
    multiline: true,
    rows: 3,
    placeholders: {
      evermore: "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya dapat ditemukan di bawah ini.",
      sandhya: "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "piano-garden": "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "altar-garden": "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "lunar-blossom": "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "adat-jawa": "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "adat-melayu": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-batak": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-minang": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-palembang": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
  {
    key: "wishes_intro",
    label: "Pengantar Ucapan & Doa",
    multiline: true,
    rows: 2,
    placeholders: {
      evermore: "Tinggalkan beberapa harapan dan doa untuk kedua mempelai.",
      "piano-garden": "Tinggalkan pesan cinta dan doa untuk kedua mempelai.",
      "altar-garden": "Tinggalkan pesan cinta dan doa untuk kedua mempelai.",
      "adat-melayu": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "adat-batak": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "adat-minang": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "adat-palembang": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
    },
    templates: ["evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
  {
    key: "closing_message",
    label: "Pesan Penutup",
    multiline: true,
    rows: 3,
    placeholders: {
      evermore: "Merupakan suatu kehormatan dapat berbagi hari ini dengan Anda, dan terus menulis kisah kami dikelilingi orang-orang yang kami cintai.",
      sandhya: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "piano-garden": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "altar-garden": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "lunar-blossom": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "adat-jawa": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "adat-melayu": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-batak": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-minang": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-palembang": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang"],
  },
]

export function getTemplateExtraFields(templateCode: string | null | undefined): TemplateExtraField[] {
  if (!templateCode) return []
  const code = templateCode.toLowerCase()
  return TEMPLATE_EXTRA_FIELDS
    .filter((field) => field.templates.includes(code))
    .map((field) => ({ ...field, placeholder: field.placeholders?.[code] ?? field.placeholder }))
}

export function templateExtrasLabel(templateName: string | null | undefined): string {
  const name = templateName?.trim()
  return name ? `EKSTRA ${name.toUpperCase()}` : "EKSTRA TEMPLATE"
}
