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
    key: "cover_kicker",
    label: "Cover kicker",
    multiline: true,
    rows: 2,
    placeholder: "This Kids are\\nGetting Married",
    templates: ["evermore"],
  },
  {
    key: "cover_apology",
    label: "Cover apology",
    placeholders: {
      sandhya: "We sincerely apologize for any misspelling of names and titles.",
      "piano-garden": "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
    },
    templates: ["sandhya", "piano-garden"],
  },
  {
    key: "groom_child_order",
    label: "Groom — child order",
    placeholder: "The Second Son of",
    templates: ["sandhya"],
  },
  {
    key: "bride_child_order",
    label: "Bride — child order",
    placeholder: "The Daughter of",
    templates: ["sandhya"],
  },
  {
    key: "profiles_intro",
    label: "Profiles intro",
    multiline: true,
    rows: 2,
    placeholder: "Two hearts, one playlist, and zero agreement on what to eat.",
    templates: ["evermore"],
  },
  {
    key: "story_intro",
    label: "Story intro",
    multiline: true,
    rows: 2,
    placeholder: "From a chance meeting to a lifetime of choosing each other.",
    templates: ["evermore"],
  },
  {
    key: "gallery_intro",
    label: "Gallery intro",
    multiline: true,
    rows: 3,
    placeholders: {
      evermore: "A handful of frames from the chapters we have lived together.",
      "piano-garden": "Potongan momen yang kami simpan rapat, seperti kenangan di dalam album keluarga.",
    },
    templates: ["evermore", "piano-garden"],
  },
  {
    key: "gallery_quote",
    label: "Gallery quote",
    multiline: true,
    rows: 2,
    placeholders: {
      evermore: "Somewhere between the first hello and every tomorrow, we found our forever.",
      sandhya: "Every love story is beautiful, but ours is my favorite.",
      "piano-garden": "Setiap langkah yang kami tempuh membawa kami pada hari ini, sebuah awal untuk selamanya.",
    },
    templates: ["sandhya", "evermore", "piano-garden"],
  },
  {
    key: "gift_intro_title",
    label: "Gift intro title",
    placeholders: {
      evermore: "Wedding Gift",
      sandhya: "A Token of Love",
      "piano-garden": "Love Gift",
    },
    templates: ["sandhya", "evermore", "piano-garden"],
  },
  {
    key: "gift_intro_description",
    label: "Gift intro description",
    multiline: true,
    rows: 3,
    placeholders: {
      evermore: "Your presence is the greatest gift. If you would like to send a token of love, you can find the details below.",
      sandhya: "Your presence is the greatest gift. If you would like to send a token of love, the details are below.",
      "piano-garden": "Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah bagi kami. Bila berkenan memberikan tanda kasih, dapat melalui:",
    },
    templates: ["sandhya", "evermore", "piano-garden"],
  },
  {
    key: "wishes_intro",
    label: "Wishes intro",
    multiline: true,
    rows: 2,
    placeholders: {
      evermore: "Leave a few kind words and prayers for the couple.",
      "piano-garden": "Mohon konfirmasi kehadiran dan sampaikan doa terbaik untuk perjalanan baru kami.",
    },
    templates: ["evermore", "piano-garden"],
  },
  {
    key: "closing_message",
    label: "Closing message",
    multiline: true,
    rows: 3,
    placeholders: {
      evermore: "It would be an honour to share this day with you, and to keep writing our story surrounded by the people we love.",
      sandhya: "It would be an honor and a joy for us to have you present and to receive your blessing on our wedding day.",
      "piano-garden": "Merupakan kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu.",
    },
    templates: ["sandhya", "evermore", "piano-garden"],
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
  return name ? `${name.toUpperCase()} EXTRAS` : "TEMPLATE EXTRAS"
}
