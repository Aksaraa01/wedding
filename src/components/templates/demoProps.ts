import type { TemplateProps } from "@/types/template"

const TM = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media"

export const DEMO_PROPS_BY_CODE: Record<string, TemplateProps> = {
  "dark-split-rail": {
    slug: "demo",
    groom_name: "Vincent",
    bride_name: "Felicia",
    couple_initials: "VF",
    display_name: "#VincentFelicia2026",
    groom_full_name: "Vincent Morgan Leonardo",
    bride_full_name: "Felicia Sagita Pandiangan",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    cover_photos: [
      `${TM}/1790765548170-DSC06466.jpg`,
      `${TM}/1790765550955-DSC07125.jpg`,
      `${TM}/1790765554693-DSC07047.jpg`,
      `${TM}/1790765557463-DSC06424.jpg`,
    ],
    couple_illustration_url: `${TM}/1790765548170-DSC06466.jpg`,
    groom_photo_url: [`${TM}/1790766039655-DSC06967.jpg`, `${TM}/1790766607844-DSC05947.jpg`],
    bride_photo_url: [`${TM}/1790766068391-DSC06875.jpg`, `${TM}/1790766189214-DSC05913__1_.jpg`],
    groom_parents: "Putra dari Bapak Leonardo & Ibu Romauli",
    bride_parents: "Putri dari Bapak Pandiangan & Ibu Simbolon",
    groom_instagram: "@vincentmorgan",
    bride_instagram: "@feliciasagita",
    opening_title: "Warmest Greetings",
    opening_description:
      "God makes everything beautiful in His time. In His perfect plan, He brought us together, nurtured love between us, and united us in the holy bond of marriage.",
    quote_text:
      "Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan.",
    quote_source: "Kolose 3 : 14",
    sessions: [
      {
        name: "HOLY MATRIMONY",
        date: "2026-10-16",
        time: "10.00 - 12.00 WIB",
        venue: "Gereja HKBP Sukadame",
        address: "Jl. Sisingamangaraja No. 333 Pematangsiantar, Sumatera Utara",
        maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
      },
      {
        name: "CEREMONY",
        date: "2026-10-16",
        time: "13.00 WIB - Selesai",
        venue: "Sopo Godang HKBP",
        address: "Jl. Gereja No. 35 Pematangsiantar, Sumatera Utara",
        maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
      },
    ],
    stories: [
      {
        title: "Pertemuan Pertama",
        description:
          "Semuanya dimulai dari sebuah perkenalan sederhana yang kemudian menumbuhkan rasa nyaman satu sama lain. Waktu membawa kami saling mengenal lebih dalam.",
        image_url: `${TM}/1790766757680-DSC07110.jpg`,
      },
      {
        title: "Menuju Selamanya",
        description:
          "Setelah melewati banyak cerita, kami memutuskan untuk melangkah bersama. Hari ini kami mengundang Anda untuk menjadi bagian dari awal perjalanan kami.",
        image_url: `${TM}/1790766888427-DSC07363__2_.jpg`,
      },
    ],
    gallery_photos: [
      `${TM}/1790766757680-DSC07110.jpg`,
      `${TM}/1790766759805-DSC06067.jpg`,
      `${TM}/1790766888427-DSC07363__2_.jpg`,
      `${TM}/1790768649651-DSC07291__2_.jpg`,
      `${TM}/1790765548170-DSC06466.jpg`,
      `${TM}/1790765550955-DSC07125.jpg`,
    ],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "Vincent Morgan Leonardo", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Felicia Sagita Pandiangan", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "Felicia Sagita Pandiangan",
    track_url:
      "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/user-tracks/t-1790768253171-AUD-20260930-WA0016.mp3",
    auto_play: false,
    inviting_families: [
      "Keluarga Bapak Leonardo & Ibu Romauli",
      "Keluarga Bapak Pandiangan & Ibu Simbolon",
      "Keluarga Besar Kedua Mempelai",
    ],
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  sandhya: {
    slug: "demo",
    groom_name: "Vincent",
    bride_name: "Felicia",
    couple_initials: "VF",
    display_name: "#VincentFelicia2026",
    groom_full_name: "Vincent Morgan Leonardo",
    bride_full_name: "Felicia Sagita Pandiangan",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [`${TM}/1790765548170-DSC06466.jpg`],
    couple_illustration_url: `${TM}/1790765548170-DSC06466.jpg`,
    groom_photo_url: [`${TM}/1790766039655-DSC06967.jpg`],
    bride_photo_url: [`${TM}/1790766068391-DSC06875.jpg`],
    groom_parents: "Mr. Leonardo & Mrs. Romauli",
    bride_parents: "Mr. Pandiangan & Mrs. Simbolon",
    groom_instagram: "@vincentmorgan",
    bride_instagram: "@feliciasagita",
    opening_title: "Warmest Greetings",
    opening_description:
      "With great joy and gratitude, we invite you to share in the beginning of our forever. Your presence and blessings would mean the world to us.",
    quote_text:
      "And over all these virtues put on love, which binds them all together in perfect unity.",
    quote_source: "Colossians 3 : 14",
    sessions: [
      {
        name: "Holy Matrimony",
        date: "2026-10-16",
        time: "10.00 - 12.00 WIB",
        venue: "Gereja HKBP Sukadame",
        address: "Jl. Sisingamangaraja No. 333 Pematangsiantar, Sumatera Utara",
        maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
      },
      {
        name: "Reception",
        date: "2026-10-16",
        time: "13.00 WIB - Selesai",
        venue: "Sopo Godang HKBP",
        address: "Jl. Gereja No. 35 Pematangsiantar, Sumatera Utara",
        maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
      },
    ],
    stories: [
      {
        title: "The First Hello",
        description:
          "It began with a simple introduction that slowly grew into a comfortable companionship. Time brought us closer and taught us to know each other deeply.",
        image_url: `${TM}/1790766757680-DSC07110.jpg`,
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
        image_url: `${TM}/1790766888427-DSC07363__2_.jpg`,
      },
    ],
    gallery_photos: [
      `${TM}/1790766757680-DSC07110.jpg`,
      `${TM}/1790766759805-DSC06067.jpg`,
      `${TM}/1790766888427-DSC07363__2_.jpg`,
      `${TM}/1790768649651-DSC07291__2_.jpg`,
      `${TM}/1790765548170-DSC06466.jpg`,
      `${TM}/1790765550955-DSC07125.jpg`,
    ],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "Vincent Morgan Leonardo", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Felicia Sagita Pandiangan", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "Felicia Sagita Pandiangan",
    track_url:
      "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/user-tracks/t-1790768253171-AUD-20260930-WA0016.mp3",
    auto_play: false,
    inviting_families: [
      "The Leonardo Family",
      "The Pandiangan Family",
      "The Extended Families of Both",
    ],
    dresscode: {
      colors: [
        { hex: "#e8d9c5", name: "Sand" },
        { hex: "#c98f6b", name: "Terracotta" },
        { hex: "#7c5a43", name: "Cocoa" },
        { hex: "#2c241d", name: "Espresso" },
      ],
    },
    livestream: { url: "https://www.youtube.com/live/dummy-livestream-link" },
    template_content: {
      cover_apology: "We sincerely apologize for any misspelling of names and titles.",
      groom_child_order: "The Second Son of",
      bride_child_order: "The Daughter of",
      gallery_quote: "Every love story is beautiful, but ours is my favorite.",
      gallery_quote_sign: "Vincent & Felicia",
      gift_intro_title: "A Token of Love",
      gift_intro_description:
        "Your presence is the greatest gift. If you would like to send a token of love, the details are below.",
      closing_message:
        "It would be an honor and a joy for us to have you present and to receive your blessing on our wedding day.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  "nihara-mist": {
    slug: "demo",
    groom_name: "Vincent",
    bride_name: "Felicia",
    couple_initials: "VF",
    display_name: "#VincentFelicia2026",
    groom_full_name: "Vincent Morgan Leonardo",
    bride_full_name: "Felicia Sagita Pandiangan",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [
      `${TM}/1790765548170-DSC06466.jpg`,
      `${TM}/1790765550955-DSC07125.jpg`,
      `${TM}/1790765554693-DSC07047.jpg`,
      `${TM}/1790765557463-DSC06424.jpg`,
      `${TM}/1790766757680-DSC07110.jpg`,
    ],
    couple_illustration_url: `${TM}/1790765548170-DSC06466.jpg`,
    groom_photo_url: [`${TM}/1790766039655-DSC06967.jpg`],
    bride_photo_url: [`${TM}/1790766068391-DSC06875.jpg`],
    groom_parents: "Putra dari Bapak Leonardo & Ibu Romauli",
    bride_parents: "Putri dari Bapak Pandiangan & Ibu Simbolon",
    groom_instagram: "@vincentmorgan",
    bride_instagram: "@feliciasagita",
    opening_title: "Warmest Greetings",
    opening_description:
      "Assalamu'alaikum warahmatullahi wabarakatuh. Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, InsyaaAllah kami akan menyelenggarakan acara pernikahan kami.",
    quote_text:
      "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
    quote_source: "QS Ar-Rum : 21",
    sessions: [
      {
        name: "Akad Nikah",
        date: "2026-10-16",
        time: "07.30 - 09.30 WIB",
        venue: "Santika Premiere Dyandra Hotel",
        address: "Jl. Kapten Maulana Lubis No.7, Petisah Tengah, Kota Medan, Sumatera Utara 20111.",
        maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
      },
      {
        name: "Resepsi",
        date: "2026-10-16",
        time: "11.00 - 17.00 WIB",
        venue: "Santika Premiere Dyandra Hotel",
        address: "Jl. Kapten Maulana Lubis No.7, Petisah Tengah, Kota Medan, Sumatera Utara 20111.",
        maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
      },
    ],
    stories: [
      {
        title: "Pertemuan Pertama",
        description:
          "Semuanya dimulai dari sebuah perkenalan sederhana yang kemudian menumbuhkan rasa nyaman satu sama lain. Waktu membawa kami saling mengenal lebih dalam.",
        image_url: `${TM}/1790766757680-DSC07110.jpg`,
      },
      {
        title: "Menuju Selamanya",
        description:
          "Setelah melewati banyak cerita, kami memutuskan untuk melangkah bersama. Hari ini kami mengundang Anda untuk menjadi bagian dari awal perjalanan kami.",
        image_url: `${TM}/1790766888427-DSC07363__2_.jpg`,
      },
    ],
    gallery_photos: [
      `${TM}/1790766757680-DSC07110.jpg`,
      `${TM}/1790766759805-DSC06067.jpg`,
      `${TM}/1790766888427-DSC07363__2_.jpg`,
      `${TM}/1790768649651-DSC07291__2_.jpg`,
      `${TM}/1790765548170-DSC06466.jpg`,
      `${TM}/1790765550955-DSC07125.jpg`,
    ],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "Vincent Morgan Leonardo", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Felicia Sagita Pandiangan", type: "bank" },
    ],
    gift_address: "Jl. Pahlawan No. 123, Medan 20111",
    gift_address_name: "Felicia Sagita Pandiangan",
    track_url: "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/audio.mp3",
    auto_play: true,
    inviting_families: [
      "Keluarga Bapak Leonardo & Ibu Romauli",
      "Keluarga Bapak Pandiangan & Ibu Simbolon",
      "Keluarga Besar Kedua Mempelai",
    ],
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
}
