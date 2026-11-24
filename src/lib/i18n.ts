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
  groomLabel: { id: "Mempelai Pria", en: "The Groom" },
  brideLabel: { id: "Mempelai Wanita", en: "The Bride" },
  secQuote: { id: "Untaian Doa", en: "A Verse of Prayer" },
  secQuoteReligious: { id: "Ayat Suci", en: "A Sacred Verse" },
  secInviting: { id: "Turut Mengundang", en: "With the Blessing of" },
  secStory: { id: "Perjalanan Cinta", en: "Our Love Story" },
  secEvent: { id: "Rangkaian Acara", en: "The Celebration" },
  secCountdown: { id: "Menuju Hari Bahagia", en: "Counting Down" },
  saveTheDate: { id: "Simpan Tanggal", en: "Save the Date" },
  countdown: { id: "Hitung Mundur", en: "Countdown" },
  days: { id: "Hari", en: "Days" },
  hours: { id: "Jam", en: "Hours" },
  minutes: { id: "Menit", en: "Minutes" },
  seconds: { id: "Detik", en: "Seconds" },
  secRundown: { id: "Susunan Acara", en: "Order of Events" },
  secGallery: { id: "Galeri", en: "Gallery" },
  secVideo: { id: "Video", en: "Video" },
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
  copiedToClipboard: { id: "Berhasil disalin", en: "Copied to clipboard" },
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
  previewWishNotSaved: {
    id: "Mode pratinjau, ucapan Anda tidak disimpan.",
    en: "Preview mode — your wish was not saved.",
  },
  wishAlreadySent: {
    id: "Anda sudah mengirim ucapan. Terima kasih atas doa dan kasihnya.",
    en: "You have already sent a wish. Thank you for your love and prayers.",
  },
  tooManyMessages: {
    id: "Terlalu banyak pesan saat ini. Silakan coba lagi sebentar.",
    en: "Too many messages right now. Please try again in a moment.",
  },
  loadingWishes: { id: "Memuat ucapan…", en: "Loading wishes…" },
  noWishesYet: { id: "Belum ada ucapan. Jadilah yang pertama.", en: "No wishes yet. Be the first." },
  wishJustNow: { id: "Baru saja", en: "Just now" },
  wishMinutesAgo: { id: "{n} menit lalu", en: "{n} min ago" },
  wishHoursAgo: { id: "{n} jam lalu", en: "{n} hr ago" },
  wishDaysAgo: { id: "{n} hari lalu", en: "{n} days ago" },
  wishOneDayAgo: { id: "1 hari lalu", en: "Yesterday" },
  previousPage: { id: "Halaman sebelumnya", en: "Previous page" },
  nextPage: { id: "Halaman berikutnya", en: "Next page" },
  playMusic: { id: "Putar musik", en: "Play music" },
  pauseMusic: { id: "Jeda musik", en: "Pause music" },
  photoViewer: { id: "Lihat foto", en: "Photo viewer" },
  closeViewer: { id: "Tutup", en: "Close" },
  previousPhoto: { id: "Foto sebelumnya", en: "Previous photo" },
  nextPhoto: { id: "Foto berikutnya", en: "Next photo" },
  openPhoto: { id: "Buka foto {n} dari {total}", en: "Open photograph {n} of {total}" },
  guestHonored: { id: "Tamu Undangan", en: "Honored Guest" },

  // Couple labels
  sonOf: { id: "Putra dari", en: "Son of" },
  daughterOf: { id: "Putri dari", en: "Daughter of" },
  childOf: { id: "Putra/Putri dari", en: "Child of" },

  // Generic closing
  withLoveAndGratitude: { id: "Kami yang berbahagia", en: "With love and gratitude" },
  withRespectAndGratitude: { id: "Dengan hormat dan rasa syukur", en: "With respect and gratitude" },
  thankYou: { id: "Terima Kasih", en: "Thank You" },

  // Shared chrome / a11y
  skipToInvitation: { id: "Langsung ke undangan", en: "Skip to invitation" },
  playPauseMusic: { id: "Putar/jeda musik", en: "Play/pause music" },
  loadingVideo: { id: "Memuat video...", en: "Loading video..." },
  photoGallery: { id: "Galeri foto", en: "Photo gallery" },
  closeGallery: { id: "Tutup galeri", en: "Close gallery" },
  prevPhoto: { id: "Foto sebelumnya", en: "Previous photo" },
  viewPhoto: { id: "Lihat foto {n}", en: "View photo {n}" },
  dearGuest: { id: "Tamu Terhormat", en: "Dear Guest" },
  weddingEventFallback: { id: "Acara Pernikahan", en: "Wedding Event" },
  weddingInvitationByAksaraa: { id: "Undangan Pernikahan oleh Aksaraa", en: "Wedding Invitation by Aksaraa" },
  digitalWeddingInvitation: { id: "Undangan Pernikahan Digital", en: "Digital Wedding Invitation" },
  watchLivestream: { id: "Tonton Siaran Langsung", en: "Watch Livestream" },
  rundownTitle: { id: "Susunan Acara", en: "Order of Events" },
  storyPart: { id: "Bagian {n}", en: "Part {n}" },
  colorN: { id: "Warna {n}", en: "Color {n}" },

  // Sandhya Ivory
  sandhyaCoverApology: { id: "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.", en: "We apologize for any error in the writing of names & titles." },
  sandhyaGalleryQuote: { id: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.", en: "Every love story is beautiful, but ours is my favorite." },
  sandhyaGiftIntro: { id: "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.", en: "Your presence is the greatest gift. If you would like to send a token of love, the details are available below." },
  sandhyaClosing: { id: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.", en: "It is an honor and a joy for us if you would be pleased to attend and give your blessing on our wedding day." },
  sandhyaOpeningTitle: { id: "Salam Hangat", en: "Warmest Greetings" },
  sandhyaOpeningDescription: { id: "Dengan penuh sukacita dan rasa syukur, kami mengundang Anda untuk berbagi di awal kisah selamanya kami.", en: "With great joy and gratitude, we invite you to share in the beginning of our forever." },
  sandhyaDresscodePalette: { id: "Busana elegan bernuansa {colors}.", en: "Elegant Attire in {colors}." },
  sandhyaAksaraaWhatsapp: { id: "Halo Aksaraa Wedding, saya tertarik membuat undangan digital", en: "Hello Aksaraa Wedding, I would like to create a digital invitation." },
  sandhyaLoadingInvitation: { id: "Memuat undangan", en: "Loading invitation" },
  sandhyaDear: { id: "Kepada Yth.,", en: "Dear," },
  sandhyaLivestreamDescription: { id: "Bergabunglah secara virtual saat kami mengucapkan janji suci, bagi keluarga dan sahabat yang belum dapat hadir.", en: "Join us virtually as we exchange our vows, for beloved family and friends who cannot be with us in person." },
  sandhyaWithJoy: { id: "Dengan Sukacita", en: "With Joy" },
  sandhyaWeddingFilm: { id: "Film pernikahan kami", en: "Our wedding film" },
  sandhyaPlayWeddingFilm: { id: "Putar film pernikahan kami", en: "Play our wedding film" },
  sandhyaWishesIntro: { id: "Tinggalkan pesan cinta dan doa untuk {couple}.", en: "Leave a message of love and a prayer for {couple}." },
  sandhyaContactAksaraa: { id: "Hubungi Aksaraa Wedding via WhatsApp", en: "Contact Aksaraa Wedding via WhatsApp" },
  sandhyaCopyright: { id: "© {year} {couple}. Hak cipta dilindungi.", en: "© {year} {couple}. All rights reserved." },
  sandhyaSwipeUp: { id: "Geser ke atas", en: "Swipe up" },
  sandhyaWishNameLabel: { id: "Nama", en: "Name" },
  sandhyaWishNamePlaceholder: { id: "Nama Anda", en: "Your name" },
  aksaraaBrand: { id: "Aksaraa Wedding", en: "Aksaraa Wedding" },
  weddingByAksaraa: { id: "Wedding by Aksaraa", en: "Wedding by Aksaraa" },

  // Wishes extras
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

/** Localized relative time for wish timestamps. */
export function formatWishAgo(iso: string | undefined, lang: unknown): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return t("wishJustNow", lang)
  if (minutes < 60) return tf("wishMinutesAgo", lang, { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return tf("wishHoursAgo", lang, { n: hours })
  const days = Math.floor(hours / 24)
  return days === 1 ? t("wishOneDayAgo", lang) : tf("wishDaysAgo", lang, { n: days })
}

const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const ID_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function parseDateInput(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Localized long date, e.g. "Rabu, 20 Juli 2026" / "Wednesday, 20 July 2026". */
export function formatDate(value?: string | null, lang?: unknown): string {
  const d = parseDateInput(value)
  if (!d) return ""
  const l = normalizeLanguage(lang)
  const day = l === "en" ? EN_DAYS[d.getDay()] : ID_DAYS[d.getDay()]
  const month = l === "en" ? EN_MONTHS[d.getMonth()] : ID_MONTHS[d.getMonth()]
  return `${day}, ${d.getDate()} ${month} ${d.getFullYear()}`
}

/** Uppercase localized long date. */
export function formatDateUpper(value?: string | null, lang?: unknown): string {
  return formatDate(value, lang).toUpperCase()
}

/** Localized numeric-ish date: "20 Juli 2026" / "20 July 2026". */
export function formatIdDate(value?: string | null, lang?: unknown): string {
  const d = parseDateInput(value)
  if (!d) return ""
  const l = normalizeLanguage(lang)
  const month = l === "en" ? EN_MONTHS[d.getMonth()] : ID_MONTHS[d.getMonth()]
  return `${d.getDate()} ${month} ${d.getFullYear()}`
}
