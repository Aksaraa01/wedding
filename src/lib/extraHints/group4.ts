export type HintMap = Record<string, Record<string, { id?: string; en?: string }>>

// Authored pins for templates whose copy the generator cannot attribute to a
// language branch (DEFAULT_* constants, demo template_content, or fields the
// component prints only when the couple fills them). Both languages are always
// present so the editor never falls back to the other language's copy.
export const HINTS: HintMap = {
  "minang-royal": {
    cover_apology: {
      id: "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      en: "We apologize for any errors in the spelling of names and titles.",
    },
    gallery_intro: {
      id: "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
      en: "A few frames we hold close, witnesses to the journey toward our happy day.",
    },
    dresscode_note: {
      id: "Kenakan pakaian formal yang serasi dengan nuansa adat Minang.",
      en: "Please wear formal attire in keeping with Minang tradition.",
    },
    wishes_intro: {
      id: "Tinggalkan doa dan ucapan terbaik Anda untuk kedua mempelai.",
      en: "Leave your best prayers and wishes for the couple.",
    },
    closing_message: {
      id: "Keluarga & Sahabat. Dari lubuk hati kami, terima kasih telah menjadi bagian dari hari besar kami. Kami sangat beruntung memiliki Anda dalam hidup kami.",
      en: "Family & Friends. From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives.",
    },
  },
  imagine: {
    cover_apology: {
      id: "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
      en: "We apologize for any misspelling of your name or title.",
    },
    gallery_quote: {
      id: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      en: "Every love story is beautiful, but ours is my favorite.",
    },
    wishes_intro: {
      id: "Tinggalkan ucapan dan doa terbaik Anda untuk kami.",
      en: "Leave your best wishes and prayers for us.",
    },
  },
  "love-line": {
    cover_apology: {
      id: "Kami mohon maaf apabila terdapat kesalahan penulisan nama atau gelar.",
      en: "We apologize for any misspelling of your name or title.",
    },
    countdown_intro: {
      id: "counting down",
      en: "counting down",
    },
    gift_intro_description: {
      id: "Doa restu Anda sudah lebih dari cukup. Jika ingin memberi lebih, kami menerimanya dengan penuh rasa syukur.",
      en: "Your blessings are more than enough. If you'd like to give more, we'll receive it with deep gratitude.",
    },
    closing_message: {
      id: "Merupakan suatu kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu. Terima kasih telah menjadi bagian dari cerita kami.",
      en: "Thank you for being part of our story. See you on the big day!",
    },
  },
  "impasto-mosque": {
    gift_intro_description: {
      id: "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
      en: "Without diminishing our respect, for those who wish to send a gift, it can be sent through:",
    },
    wishes_intro: {
      id: "Tinggalkan ucapan dan doa terbaik Anda untuk kami.",
      en: "Leave your best wishes and prayers for us.",
    },
  },
  iris: {
    profiles_intro: {
      id: "Tanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.",
      en: "With due respect, we cordially invite you to attend our wedding celebration.",
    },
    story_intro: {
      id: "Bab-bab kecil yang membawa kami sampai ke hari ini.",
      en: "The small chapters that brought us to this day.",
    },
    closing_message: {
      id: "Merupakan suatu kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu. Terima kasih telah menjadi bagian dari cerita kami.",
      en: "It is a joy for us if you would honour us with your presence and prayers. Thank you for being part of our story.",
    },
  },
  manjari: {
    closing_message: {
      id: "Terima kasih telah menjadi bagian dari kisah kami. Kehadiran, doa, dan ucapan hangat Anda berarti lebih dari yang dapat kami ungkapkan.",
      en: "Thank you for being part of our story. Your presence, prayers, and warm wishes mean more to us than words can express.",
    },
  },
}
