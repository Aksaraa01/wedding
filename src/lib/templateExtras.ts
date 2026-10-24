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
    },
    templates: ["sandhya", "piano-garden", "altar-garden"],
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
    },
    templates: ["evermore", "piano-garden", "altar-garden"],
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
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden"],
  },
  {
    key: "gift_intro_title",
    label: "Judul Bagian Hadiah",
    placeholders: {
      evermore: "Hadiah Pernikahan",
      sandhya: "Tanda Kasih",
      "piano-garden": "Tanda Kasih",
      "altar-garden": "Tanda Kasih",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden"],
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
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa"],
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
    },
    templates: ["evermore", "piano-garden", "altar-garden"],
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
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa"],
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
