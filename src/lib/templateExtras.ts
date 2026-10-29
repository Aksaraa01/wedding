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
      "embroidered-garden": "You are invited to the wedding of",
      lace: "Together with their families",
    },
    templates: ["lunar-blossom", "embroidered-garden", "lace"],
  },
  {
    key: "events_intro",
    label: "Pengantar Acara",
    multiline: true,
    rows: 3,
    placeholders: {
      "lunar-blossom":
        "Dengan kasih karunia Tuhan, kami dengan hormat memohon kehadiran Anda pada pernikahan anak-anak kami tercinta",
      "embroidered-garden": "We would be honoured to have you with us as we say our vows.",
      lace: "We would be honoured to have you with us as we say our vows.",
    },
    templates: ["lunar-blossom", "embroidered-garden", "lace"],
  },
  {
    key: "cover_kicker",
    label: "Teks Pembuka Sampul",
    multiline: true,
    rows: 2,
    placeholder: "Dua Insan Ini\\nAkan Menikah",
    placeholders: { lace: "Together with their families" },
    templates: ["evermore", "lace"],
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
      "adat-betawi": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "adat-jawa-2": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "adat-jawa": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "adat-bali": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      "manjari": "We apologize for any misspelling of your name.",
      "still-ever": "We apologize for any misspelling of your name or title.",
      "embroidered-garden": "We apologize for any misspelling of your name or title.",
      imagine: "We apologize for any misspelling of your name.",
    },
    templates: ["sandhya", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-jawa-2", "adat-jawa", "adat-bali", "manjari", "imagine", "still-ever", "embroidered-garden"],
  },
  {
    key: "quote_title",
    label: "Judul Bagian Ayat",
    placeholders: {
      "still-ever": "A Word From Us",
    },
    templates: ["still-ever"],
  },
  {
    key: "profiles_intro",
    label: "Pengantar Profil Mempelai",
    multiline: true,
    rows: 2,
    placeholder: "Dua hati, satu playlist, dan nol kesepakatan soal mau makan apa.",
    placeholders: {
      lace: "With the blessing of our families, we invite you to share in the beginning of our forever.",
    },
    templates: ["evermore", "lace"],
  },
  {
    key: "story_intro",
    label: "Pengantar Kisah Cinta",
    multiline: true,
    rows: 2,
    placeholder: "Dari pertemuan tak sengaja hingga seumur hidup saling memilih.",
    placeholders: {
      "embroidered-garden": "Every chapter of our story has been leading to this day.",
    },
    templates: ["evermore", "embroidered-garden"],
  },
  {
    key: "gallery_intro",
    label: "Pengantar Galeri",
    multiline: true,
    rows: 3,
    placeholders: {
      "embroidered-garden":
        "The frames we keep closest — an afternoon in the garden, a table we shared, and the walk that led us here.",
      lace: "A few frames from the days that led us here — the quiet ones we keep closest.",
      evermore: "Beberapa bingkai yang telah kami lalui bersama, tersimpan seperti foto lama di album keluarga.",
      "piano-garden": "Momen yang kami simpan erat, seperti kenangan dalam album keluarga.",
      "altar-garden": "Momen yang kami simpan erat, seperti kenangan dalam album keluarga.",
      "adat-melayu": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-batak": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-minang": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-palembang": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-betawi": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-jawa-2": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-jawa": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      "adat-bali": "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
    },
    templates: ["evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-jawa-2", "adat-jawa", "adat-bali", "embroidered-garden", "lace"],
  },
  {
    key: "gallery_quote",
    label: "Kutipan Galeri",
    multiline: true,
    rows: 2,
    placeholders: {
      "embroidered-garden": "Every love story is beautiful, but ours is my favourite.",
      evermore: "Di antara sapaan pertama dan setiap hari esok, kami menemukan selamanya.",
      sandhya: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      imagine: "Every love story is beautiful, but ours is my favorite.",
      "piano-garden": "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      "altar-garden": "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      "adat-melayu": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-batak": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-minang": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-palembang": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-betawi": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-jawa-2": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-jawa": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "adat-bali": "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
      "manjari": "A lifetime with you is the most beautiful story I could ever choose.",
      "still-ever": "A lifetime with you is the story I would choose again and again.",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-jawa-2", "adat-jawa", "adat-bali", "manjari", "imagine", "still-ever", "embroidered-garden"],
  },
  {
    key: "video_title",
    label: "Judul Video",
    placeholders: { "embroidered-garden": "Our Wedding Film", lace: "Our Film" },
    templates: ["embroidered-garden", "lace"],
  },
  {
    key: "video_intro",
    label: "Pengantar Video",
    multiline: true,
    rows: 2,
    placeholders: {
      "embroidered-garden": "The day as it happened, kept in motion.",
      lace: "The day as it happened, kept in motion.",
    },
    templates: ["embroidered-garden", "lace"],
  },
  {
    key: "video_caption",
    label: "Keterangan Tombol Video",
    placeholders: { "embroidered-garden": "Press play to watch the day again" },
    templates: ["embroidered-garden", "lace"],
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
      "adat-betawi": "Love Gift",
      "minang-royal": "Love Gift",
      "adat-jawa-2": "Love Gift",
      "adat-jawa": "Love Gift",
      "adat-bali": "Love Gift",
      "manjari": "Wedding Gift",
      "still-ever": "Wedding Gift",
      "embroidered-garden": "Wedding Gift",
      lace: "Wedding Gift",
      imagine: "Wedding Gift",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-jawa-2", "adat-jawa", "adat-bali", "manjari", "imagine", "still-ever", "lace"],
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
      "adat-jawa-2": "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "adat-jawa": "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      "adat-bali": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "manjari": "Your presence is the greatest gift to us. If you would like to send another token of love, please use the details below:",
      "adat-melayu": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-batak": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-minang": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-palembang": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "adat-betawi": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      "minang-royal": "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      imagine: "Your presence is the greatest gift to us. If you would like to send another token of love, please use the details below:",
      "still-ever": "Your presence is the greatest gift. Should you wish to send a token of love, the details are below.",
      "embroidered-garden":
        "Your presence at our wedding is the greatest gift of all. Should you wish to celebrate with a gift, the details are below.",
      lace: "Should you wish to give a gift, you may do so in cash or by bank transfer.",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa-2", "adat-jawa", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-bali", "manjari", "imagine", "still-ever", "embroidered-garden", "lace"],
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
      "adat-betawi": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "adat-jawa-2": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "adat-jawa": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "adat-bali": "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
      "manjari": "Please let us know whether you will join our wedding celebration by completing the form below.",
      "still-ever": "Leave a wish, a prayer, or a memory for us to keep.",
      "embroidered-garden": "Leave a wish, a prayer, or a memory for us to keep.",
      lace: "Nothing would make us happier than celebrating this day surrounded by you.",
      imagine: "Leave a message of love and a prayer for the couple.",
    },
    templates: ["evermore", "piano-garden", "altar-garden", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-jawa-2", "adat-jawa", "adat-bali", "manjari", "imagine", "still-ever", "embroidered-garden", "lace"],
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
      "adat-jawa-2": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "adat-jawa": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "adat-bali": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
      "manjari": "Thank you for being part of our story. Your presence, prayers, and warm wishes mean more to us than words can express.",
      "still-ever": "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
      "embroidered-garden": "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
      lace: "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
      "adat-melayu": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-batak": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-minang": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-palembang": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "adat-betawi": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      "minang-royal": "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
      imagine: "From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives and honored you could be here with us.",
    },
    templates: ["sandhya", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa-2", "adat-jawa", "adat-melayu", "adat-batak", "adat-minang", "adat-palembang", "adat-betawi", "adat-bali", "manjari", "imagine", "still-ever", "embroidered-garden", "lace"],
  },
  {
    key: "couple_description",
    label: "Deskripsi Bagian Mempelai",
    multiline: true,
    rows: 2,
    placeholders: {
      imagine: "With the blessing of our families, we cordially invite you to the wedding of",
    },
    templates: ["imagine"],
  },
  {
    key: "welcome_message",
    label: "Pesan Sambutan",
    multiline: true,
    rows: 3,
    placeholders: {
      "embroidered-garden":
        "We are so happy to celebrate this day with you, surrounded by the people we love most.",
      lace: "We are so happy to celebrate this day with you, surrounded by the people we love most.",
    },
    templates: ["embroidered-garden", "lace"],
  },
  {
    key: "inviting_intro",
    label: "Pengantar Turut Mengundang",
    multiline: true,
    rows: 2,
    placeholders: {
      "embroidered-garden":
        "With deep gratitude we also present the families who extend this invitation alongside us.",
      lace: "Together with the families who share this invitation.",
    },
    templates: ["embroidered-garden", "lace"],
  },
  {
    key: "rundown_title",
    label: "Judul Susunan Acara",
    placeholders: { "embroidered-garden": "Order of the Day", lace: "The Day" },
    templates: ["embroidered-garden", "lace"],
  },
  {
    key: "rundown_intro",
    label: "Pengantar Susunan Acara",
    multiline: true,
    rows: 2,
    placeholders: {
      "embroidered-garden": "Our ceremony will be followed by an apéritif, dinner and dancing.",
      lace: "Our ceremony will be followed by an apéritif, dinner and dancing.",
    },
    templates: ["embroidered-garden", "lace"],
  },
  {
    key: "love_story_title",
    label: "Judul Love Story",
    placeholders: { manjari: "A Love Written in Time", "still-ever": "How Our Story Began", imagine: "Our Love Story", "embroidered-garden": "Our Story" },
    templates: ["manjari", "imagine", "still-ever", "embroidered-garden"],
  },
  {
    key: "gallery_title",
    label: "Judul Galeri",
    placeholders: {
      manjari: "Where Our Memories Live",
      "still-ever": "The Days We Kept",
      imagine: "Gallery Of Us",
      "embroidered-garden": "Our Moments",
      lace: "Our Moments",
    },
    templates: ["manjari", "imagine", "still-ever", "embroidered-garden", "lace"],
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
