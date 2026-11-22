// Invitation language (id/en). Pure and client-safe: templates, editor, ops,
// and server render paths all import from here.
//
// Default is 'id' (Bahasa Indonesia). The couple selects the language in the
// editor/ops; every guest sees that same language. No guest toggle, no ?lang=,
// no auto-detect. Couple-entered content (names, quote, typed extras) is never
// auto-translated — only our shipped defaults and static chrome switch.

export type Language = "id" | "en"

export const LANGUAGES: Language[] = ["id", "en"]

export function isLanguage(value: unknown): value is Language {
  return value === "id" || value === "en"
}

/** Normalizes unknown input to a supported language. Defaults to 'id'. */
export function normalizeLanguage(value: unknown): Language {
  if (typeof value !== "string") return "id"
  const v = value.trim().toLowerCase()
  return v === "en" ? "en" : "id"
}

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
]

// ---------------------------------------------------------------------------
// Shared chrome dictionary. Keys are stable identifiers; values are the
// guest-facing strings in each language. Use t(key, lang).
// ---------------------------------------------------------------------------

export const I18N = {
  // Sampul / cover
  openInvitation: { id: "Buka Undangan", en: "Open Invitation" },
  weddingInvitation: { id: "Undangan Pernikahan", en: "Wedding Invitation" },
  theWeddingOf: { id: "Pernikahan", en: "The Wedding of" },
  toGuest: { id: "Kepada Bapak/Ibu/Saudara/i", en: "To Mr./Mrs./Family" },
  honoredGuest: { id: "Tamu Undangan", en: "Honored Guest" },

  // Section headings (locked, artful-but-clear — see plan §7)
  secOpening: { id: "Sepatah Kata", en: "A Few Words" },
  secCouple: { id: "Kedua Mempelai", en: "The Couple" },
  secQuote: { id: "Untaian Doa", en: "A Verse of Prayer" },
  secQuoteReligious: { id: "Ayat Suci", en: "A Sacred Verse" },
  secInviting: { id: "Turut Mengundang", en: "With the Blessing of" },
  secStory: { id: "Perjalanan Cinta", en: "Our Love Story" },
  secEvent: { id: "Rangkaian Acara", en: "The Celebration" },
  secCountdown: { id: "Menuju Hari Bahagia", en: "Counting Down" },
  saveTheDate: { id: "Simpan Tanggal", en: "Save the Date" },
  secRundown: { id: "Susunan Acara", en: "Order of Events" },
  secGallery: { id: "Momen Kami", en: "Our Moments" },
  secVideo: { id: "Film Kami", en: "Our Film" },
  secDresscode: { id: "Tema Busana", en: "Dress Code" },
  secLivestream: { id: "Siaran Langsung", en: "Live Stream" },
  secGift: { id: "Tanda Kasih", en: "Wedding Gift" },
  secWishes: { id: "Ucapan & Doa", en: "Wishes & Prayers" },
  secContact: { id: "Hubungi Kami", en: "Contact Us" },
  secClosing: { id: "Terima Kasih", en: "With Gratitude" },

  // Common labels / CTAs
  viewLocation: { id: "Lihat Lokasi", en: "View Location" },
  saveToCalendar: { id: "Simpan ke Kalender", en: "Save to Calendar" },
  sendGift: { id: "Kirim Hadiah", en: "Send Gift" },
  openEnvelope: { id: "Buka Amplop", en: "Open Envelope" },
  copy: { id: "Salin", en: "Copy" },
  copied: { id: "Tersalin", en: "Copied" },
  copiedToClipboard: { id: "Disalin ke clipboard", en: "Copied to clipboard" },
  failedToCopy: { id: "Gagal menyalin", en: "Failed to copy" },
  sendWishes: { id: "Kirim Ucapan", en: "Send Wishes" },
  writeWish: { id: "Tulis Ucapan", en: "Write a Wish" },
  watch: { id: "Tonton", en: "Watch" },
  scrollDown: { id: "Gulir ke bawah", en: "Scroll down" },
  copyAddress: { id: "Salin Alamat", en: "Copy Address" },
  copyNumber: { id: "Salin Nomor", en: "Copy Number" },
  copyAccount: { id: "Salin Rekening", en: "Copy Account" },
  close: { id: "Tutup", en: "Close" },
  loading: { id: "Memuat...", en: "Loading..." },
  days: { id: "Hari", en: "Days" },
  hours: { id: "Jam", en: "Hours" },
  minutes: { id: "Menit", en: "Minutes" },
  seconds: { id: "Detik", en: "Seconds" },

  // RSVP / attendance
  rsvpTitle: { id: "Konfirmasi Kehadiran", en: "Confirm Attendance" },
  attending: { id: "Hadir", en: "Attending" },
  notAttending: { id: "Tidak Hadir", en: "Not Attending" },
  maxPeople: { id: "Maks. {n} Orang", en: "Max. {n} People" },
  send: { id: "Kirim", en: "Send" },
  sending: { id: "Mengirim...", en: "Sending..." },

  // Wish feedback
  thanksForWish: {
    id: "Terima kasih! Ucapan Anda akan tampil setelah moderasi.",
    en: "Thank you! Your wish will appear after moderation.",
  },
  wishFailed: {
    id: "Ucapan gagal dikirim. Periksa koneksi Anda.",
    en: "Failed to send your wish. Please check your connection.",
  },

  // Couple labels
  sonOf: { id: "Putra dari", en: "Son of" },
  daughterOf: { id: "Putri dari", en: "Daughter of" },
  childOf: { id: "Putra/Putri dari", en: "Child of" },

  // Generic closing
  withLoveAndGratitude: { id: "Kami yang berbahagia", en: "With love and gratitude" },
  thankYou: { id: "Terima Kasih", en: "Thank You" },

  // Accessibility / chrome extras
  skipToInvitation: { id: "Lewati ke undangan", en: "Skip to invitation" },
  playPauseMusic: { id: "Putar atau jeda musik", en: "Play or pause music" },
  loadingVideo: { id: "Memuat video", en: "Loading video" },
  photoGallery: { id: "Galeri foto", en: "Photo gallery" },
  closeGallery: { id: "Tutup galeri", en: "Close gallery" },
  prevPhoto: { id: "Foto sebelumnya", en: "Previous photo" },
  nextPhoto: { id: "Foto berikutnya", en: "Next photo" },
  viewPhoto: { id: "Lihat foto {n}", en: "View photo {n}" },
  dearGuest: { id: "Kepada Yth:", en: "Dear:" },
  weddingEventFallback: { id: "Acara Pernikahan", en: "Wedding Event" },
  watchLivestream: { id: "Tonton Live Streaming", en: "Watch Live Stream" },
  rundownTitle: { id: "Rundown Acara", en: "Event Rundown" },
  weddingInvitationByAksaraa: { id: "Undangan Pernikahan oleh Aksaraa", en: "Wedding Invitation by Aksaraa" },
  digitalWeddingInvitation: { id: "Undangan Pernikahan Digital", en: "Digital Wedding Invitation" },
  withRespectAndGratitude: { id: "Dengan penuh hormat dan syukur,", en: "With respect and gratitude," },
  storyPart: { id: "Bagian {n}", en: "Part {n}" },
  colorN: { id: "Warna {n}", en: "Color {n}" },
} as const satisfies Record<string, Record<Language, string>>

export type I18nKey = keyof typeof I18N

/** Resolve a shared chrome string. Falls back to 'id' for unknown lang. */
export function t(key: I18nKey, lang?: unknown): string {
  const l = normalizeLanguage(lang)
  return I18N[key][l]
}

/** Format a string with {name} placeholders. */
export function tf(key: I18nKey, lang: unknown, vars: Record<string, string | number>): string {
  let s = t(key, lang)
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}
