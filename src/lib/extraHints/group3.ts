export type HintMap = Record<string, Record<string, { id?: string; en?: string; example?: boolean }>>

// Fresco — the painted-coast invitation. Several EKSTRA slots are optional
// (the component prints nothing until the couple fills them), so those hints
// are the template's own sample copy from demoProps, marked as examples.
// video_title is different: when empty the heading prints the video kicker
// fallback ("Video" / "The Film"), so that is the hint.
export const HINTS: HintMap = {
  fresco: {
    cover_apology: {
      id: "Mohon maaf bila ada kesalahan penulisan nama atau gelar Anda.",
      en: "We apologize for any misspelling of your name or title.",
      example: true,
    },
    events_note: {
      id: "Pintu dibuka tiga puluh menit sebelum acara.",
      en: "Doors open thirty minutes before the ceremony.",
      example: true,
    },
    inviting_kicker: { id: "Turut Mengundang", en: "With Honor", example: true },
    gallery_quote: {
      id: "Setiap kisah cinta itu indah, tetapi kisah kami yang paling kusuka.",
      en: "Every love story is beautiful, but ours is my favourite.",
      example: true,
    },
    video_title: { id: "Video", en: "The Film" },
    dresscode_note: {
      id: "Mohon sisakan warna putih untuk kedua mempelai.",
      en: "Please reserve white for the couple.",
      example: true,
    },
    closing_message: {
      id: "Terima kasih telah menjadi bagian dari kisah kami.",
      en: "Thank you for being part of our story.",
      example: true,
    },
  },
  // Dark Split Rail — fallback-free slots use the section defaults printed by
  // GiftTeaser/Wishes/Closing; the gallery intro has no default, so it takes
  // the shared sample and is marked as an example.
  "dark-split-rail": {
    gallery_intro: {
      id: "Contoh: Sekilas momen kebersamaan kami.",
      en: "e.g. A glimpse of our moments together.",
    },
    gift_intro_title: { id: "Tanda Kasih", en: "Wedding Gift" },
    gift_intro_description: {
      id: "Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika Anda ingin memberi kado secara cashless, kami menyediakannya untuk Anda.",
      en: "Your blessing is a precious gift to us. If you wish to send a cashless gift, we have provided the details for you.",
    },
    wishes_title: { id: "Ucapan & Doa", en: "Wishes & Prayers" },
    wishes_intro: {
      id: "Berikan harapan dan doa terbaikmu di sini untuk kami berdua.",
      en: "Share your best wishes and prayers for us here.",
    },
    closing_message: {
      id: "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.",
      en: "It is our joy and honor to have you join us and give your blessing on our special day.",
    },
  },
  // N-Film — the closing is a DEFAULT_* constant (exact copy); the badge and
  // meta line are rendered defaults. Blank-by-default body copy uses the demo
  // sample and is marked as an example.
  "n-film": {
    hero_badge: { id: "#1", en: "#1" },
    // The component prints this line verbatim in both languages; the ID hint
    // is the faithful Indonesian rendering because an English-only ID hint is
    // dropped by the localizer's language guard.
    hero_meta: { id: "100% Kasih · 2027 · Selamanya · Romantis", en: "100% Love · 2027 · Forever · Romance" },
    cover_apology: {
      id: "Mohon maaf bila ada kesalahan penulisan nama atau gelar Anda.",
      en: "We apologize for any misspelling of your name or title.",
      example: true,
    },
    inviting_intro: {
      id: "Dengan restu keluarga, kami mengundang Anda untuk merayakan bersama kami.",
      en: "With the blessings of their families, we invite you to celebrate with us.",
      example: true,
    },
    gift_intro_description: {
      id: "Kehadiran keluarga, sahabat, dan orang-orang terkasih di hari istimewa kami adalah hadiah terbesar. Jika Anda ingin memberi tanda kasih, detailnya kami sediakan di bawah ini.",
      en: "Having our family, friends, and loved ones share in our special day is the greatest gift. If you would like to express your love through a gift, we have provided the details below.",
      example: true,
    },
    wishes_intro: {
      id: "Tinggalkan ucapan, doa, atau kenangan untuk kami simpan.",
      en: "Leave a wish, a prayer, or a memory for us to keep.",
      example: true,
    },
    closing_message: {
      id: "Terima kasih telah menjadi bagian dari kisah kami. Kehadiran, doa, dan setiap ucapan hangat yang Anda tinggalkan berarti lebih dari yang dapat kami ungkapkan.",
      en: "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
    },
  },
}
