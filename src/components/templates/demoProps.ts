import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"

const TM = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media"

const DE = "/images/dark-elegance"
const DE_COVERS = [
  `${DE}/cover.webp`,
  `${DE}/cover-1.webp`,
  `${DE}/cover-2.webp`,
  `${DE}/cover-3.webp`,
  `${DE}/cover-4.webp`,
  `${DE}/cover-5.webp`,
  `${DE}/cover-6.webp`,
]
const DE_COVERS_DARK_SPLIT = [
  `${DE}/cover-2.webp`,
  `${DE}/cover-1.webp`,
  `${DE}/cover.webp`,
]
const DE_COVERS_COVER2 = [
  `${DE}/cover-2.webp`,
  `${DE}/cover-1.webp`,
  `${DE}/cover.webp`,
  `${DE}/cover-3.webp`,
  `${DE}/cover-4.webp`,
  `${DE}/cover-5.webp`,
  `${DE}/cover-6.webp`,
]
const DE_GALLERY = [...DE_COVERS]

export const DEMO_PROPS_BY_CODE: Record<string, TemplateProps> = {
  "dark-split-rail": {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    cover_photos: [...DE_COVERS_DARK_SPLIT],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    groom_parents: "Putra dari Bapak & Ibu Albarn",
    bride_parents: "Putri dari Bapak & Ibu Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
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
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Menuju Selamanya",
        description:
          "Setelah melewati banyak cerita, kami memutuskan untuk melangkah bersama. Hari ini kami mengundang Anda untuk menjadi bagian dari awal perjalanan kami.",
        image_url: `${DE}/cover-1.webp`,
      },
    ],
    gallery_photos: [...DE_GALLERY],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "David Albarn & Faye Reed",
    track_url:
      "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/user-tracks/t-1790768253171-AUD-20260930-WA0016.mp3",
    auto_play: false,
    inviting_families: [
      "Keluarga Bapak & Ibu Albarn",
      "Keluarga Bapak & Ibu Reed",
      "Keluarga Besar Kedua Mempelai",
    ],
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  "skyline-penthouse": {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2030",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2030-07-20",
    guest_name: "Tamu Undangan",
    cover_photos: [...DE_COVERS],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    groom_parents: "Putra dari Bapak & Ibu Albarn",
    bride_parents: "Putri dari Bapak & Ibu Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
    sessions: [
      {
        name: "Akad Nikah",
        date: "2030-07-20",
        time: "08:00 – 10:00 WIB",
        venue: "The Sky Chapel, Penthouse 48F",
        address: "Jakarta",
        maps_url: "https://maps.google.com",
      },
      {
        name: "Resepsi Pernikahan",
        date: "2030-07-20",
        time: "18:00 – 21:30 WIB",
        venue: "Grand Ballroom Penthouse",
        address: "Jakarta",
        maps_url: "https://maps.google.com",
      },
    ],
    quote_text: "Dua jiwa, satu tujuan, mengarungi samudera kehidupan bersama di bawah gemerlap cakrawala kota.",
    quote_source: "Gus Anwar",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    stories: [
      {
        title: "First Met",
        description: "Pertemuan pertama kami di sudut hangat kedai kopi metropolitan, di mana obrolan hangat mengubah dua orang asing menjadi satu tujuan.",
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "The Proposal",
        description: "Di bawah gemerlap cahaya cakrawala kota dari rooftop yang tinggi, sebuah janji terucap dan ‘Ya’ menjadi awal perjalanan abadi kami.",
        image_url: `${DE}/cover-1.webp`,
      },
    ],
    gallery_photos: [...DE_GALLERY],
    gift_accounts: [
      { provider_name: "Bank BCA", account_number: "1234-5678-90", account_name: "David Albarn", type: "bank" },
      { provider_name: "DANA", account_number: "0812-3456-7890", account_name: "Faye Reed", type: "ewallet" },
    ],
    gift_address: "Penthouse Suite 48A, The Grand Metropolitan Tower, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan, 12190",
    gift_address_name: "David Albarn & Faye Reed",
    track_url: "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/audio.mp3",
    auto_play: false,
    inviting_families: [
      "Keluarga Bapak & Ibu Albarn",
      "Keluarga Bapak & Ibu Reed",
      "Keluarga Besar Kedua Mempelai",
    ],
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  sandhya: {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [...DE_COVERS_COVER2],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    groom_parents: "Mr. & Mrs. Albarn",
    bride_parents: "Mr. & Mrs. Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
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
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
        image_url: `${DE}/cover-1.webp`,
      },
    ],
    gallery_photos: [...DE_GALLERY],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "David Albarn & Faye Reed",
    track_url:
      "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/user-tracks/t-1790768253171-AUD-20260930-WA0016.mp3",
    auto_play: false,
    inviting_families: [
      "The Albarn Family",
      "The Reed Family",
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
      cover_apology: "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.",
      gallery_quote: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      gift_intro_title: "Tanda Kasih",
      gift_intro_description:
        "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      closing_message:
        "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  imagine: {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2027-02-14",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [...DE_COVERS_COVER2],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    groom_parents: "Mr. & Mrs. Albarn",
    bride_parents: "Mr. & Mrs. Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
    opening_title: "Warmest Greetings",
    opening_description:
      "With great joy and gratitude, we invite you to share in the beginning of our forever. Your presence and blessings would mean the world to us.",
    quote_text:
      "And over all these virtues put on love, which binds them all together in perfect unity.",
    quote_source: "Colossians 3 : 14",
    sessions: [
      {
        name: "Holy Matrimony",
        date: "2027-02-14",
        time: "10.00 - 12.00 WIB",
        venue: "Gereja HKBP Sukadame",
        address: "Jl. Sisingamangaraja No. 333 Pematangsiantar, Sumatera Utara",
        maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
      },
      {
        name: "Reception",
        date: "2027-02-14",
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
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
        image_url: `${DE}/cover-1.webp`,
      },
    ],
    gallery_photos: [...DE_GALLERY],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "David Albarn & Faye Reed",
    track_url:
      "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/user-tracks/t-1790768253171-AUD-20260930-WA0016.mp3",
    auto_play: false,
    inviting_families: [
      "The Albarn Family",
      "The Reed Family",
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
      couple_description: "With the blessing of our families, we cordially invite you to the wedding of",
      gift_intro_title: "Wedding Gift",
      gift_intro_description:
        "Your presence is the greatest gift to us. If you would like to send another token of love, please use the details below:",
      love_story_title: "Our Love Story",
      gallery_title: "Gallery Of Us",
      wishes_intro: "Leave a message of love and a prayer for Albarn & Faye.",
      closing_message:
        "From the bottom of our hearts we just want to thank you for being part of our big day. We are extremely lucky to have each of you in our lives and honored you could be here with us.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  evermore: {
    slug: "demo",
    groom_name: "David",
    bride_name: "Faye",
    couple_initials: "DF",
    display_name: "#DavidFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [`${DE}/bride-child.webp`, `${DE}/groom-child.webp`],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    groom_parents: "Putra dari Bapak & Ibu Albarn",
    bride_parents: "Putri dari Bapak & Ibu Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
    opening_title: "Dear,",
    opening_description:
      "With great respect, we cordially invite you to celebrate our wedding day with us.",
    quote_text:
      "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan diantaramu rasa kasih dan sayang.",
    quote_source: "QS. Ar-Rum : 21",
    sessions: [
      {
        name: "Akad Nikah",
        date: "2026-10-16",
        time: "09:00 - 11:00 WIB",
        venue: "Masjid Al-Barkah",
        address: "Jl. Kemang Raya No. 12, RT 03/RW 02, Bangka, Mampang Prapatan, Jakarta Selatan 12730",
        maps_url: "https://maps.google.com/?q=Masjid+Al-Barkah",
      },
      {
        name: "Resepsi",
        date: "2026-10-16",
        time: "12:00 - 15:00 WIB",
        venue: "The Garden Hall Kemang",
        address: "Jl. Pangeran Antasari No. 18, RT 05/RW 06, Cilandak Barat, Cilandak, Jakarta Selatan 12430",
        maps_url: "https://maps.google.com/?q=The+Garden+Hall+Kemang",
      },
    ],
    stories: [
      {
        title: "How We Met",
        description:
          "A chance meeting at a friend's gathering in the old town. One long conversation over coffee turned a quiet afternoon into the start of everything.",
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Falling in Love",
        description:
          "Slow walks, shared playlists, and letters we still keep. Somewhere between the laughter and the silences, we simply knew.",
        image_url: `${DE}/cover-1.webp`,
      },
      {
        title: "Growing Together",
        description:
          "We learned to choose each other through busy days, small surprises, and every imperfect little adventure.",
        image_url: `${DE}/cover-2.webp`,
      },
      {
        title: "Forever Starts Here",
        description:
          "Now we are ready for the next chapter, with the same laughter and a little more room for all our dreams.",
        image_url: `${DE}/cover-3.webp`,
      },
    ],
    gallery_photos: [...DE_GALLERY],
    video_url: "https://youtu.be/-ARVwU58l7A",
    dresscode: {
      title: "Dress Code",
      description:
        "We would be delighted if you could dress in these tones - earthy maroon, dusty rose, gold & sage.",
      colors: [
        { hex: "#8a2822", name: "Maroon" },
        { hex: "#b5746b", name: "Dusty Rose" },
        { hex: "#b08a4f", name: "Gold" },
        { hex: "#8a9a7b", name: "Sage" },
        { hex: "#f2ede7", name: "Cream" },
      ],
    },
    livestream: {
      title: "Join Us Online",
      description:
        "Can't make it in person? Join the live stream and celebrate this lovely day with us from wherever you are.",
      buttonLabel: "Watch Live Stream",
      url: "https://www.youtube.com/live/dummy-livestream-link",
    },
    gift_accounts: [
      { provider_name: "Bank Central Asia (BCA)", account_number: "1234 5678 9012", account_name: "Faye Reed", type: "bank" },
      { provider_name: "Bank Mandiri", account_number: "0987 6543 2100", account_name: "David Albarn", type: "bank" },
    ],
    gift_address: "Jl. Melati No. 10, Menteng, Jakarta Pusat 10310",
    gift_address_name: "David Albarn & Faye Reed",
    track_url: ASSETS.defaultMusic,
    auto_play: false,
    inviting_families: [
      "Keluarga Bapak & Ibu Albarn",
      "Keluarga Bapak & Ibu Reed",
      "Keluarga Besar Kedua Mempelai",
    ],
    template_content: {
      cover_kicker: "Dua Insan Ini\nAkan Menikah",
      profiles_intro: "Dua hati, satu playlist, dan nol kesepakatan soal mau makan apa.",
      story_intro: "Dari pertemuan tak sengaja hingga seumur hidup saling memilih.",
      gallery_intro:
        "Beberapa bingkai yang telah kami lalui bersama, tersimpan seperti foto lama di album keluarga.",
      gallery_quote: "Di antara sapaan pertama dan setiap hari esok, kami menemukan selamanya.",
      gift_intro_title: "Hadiah Pernikahan",
      gift_intro_description:
        "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya dapat ditemukan di bawah ini.",
      wishes_intro: "Tinggalkan beberapa harapan dan doa untuk kedua mempelai.",
      closing_message:
        "Merupakan suatu kehormatan dapat berbagi hari ini dengan Anda, dan terus menulis kisah kami dikelilingi orang-orang yang kami cintai.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  "nihara-mist": {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [...DE_COVERS_COVER2],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    groom_parents: "Putra dari Bapak & Ibu Albarn",
    bride_parents: "Putri dari Bapak & Ibu Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
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
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Menuju Selamanya",
        description:
          "Setelah melewati banyak cerita, kami memutuskan untuk melangkah bersama. Hari ini kami mengundang Anda untuk menjadi bagian dari awal perjalanan kami.",
        image_url: `${DE}/cover-1.webp`,
      },
    ],
    gallery_photos: [...DE_GALLERY],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Pahlawan No. 123, Medan 20111",
    gift_address_name: "David Albarn & Faye Reed",
    track_url: "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media/audio.mp3",
    auto_play: true,
    inviting_families: [
      "Keluarga Bapak & Ibu Albarn",
      "Keluarga Bapak & Ibu Reed",
      "Keluarga Besar Kedua Mempelai",
    ],
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  "piano-garden": {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [...DE_COVERS_COVER2],
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_parents: "Mr. & Mrs. Albarn",
    bride_parents: "Mr. & Mrs. Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
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
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
      },
    ],
    gallery_photos: [...DE_GALLERY, `${DE}/bride.webp`, `${DE}/groom.webp`],
    video_url: "https://youtu.be/-ARVwU58l7A",
    dresscode: {
      colors: [
        { hex: "#e8d9c5", name: "Sand" },
        { hex: "#c98f6b", name: "Terracotta" },
        { hex: "#7c5a43", name: "Cocoa" },
        { hex: "#2c241d", name: "Espresso" },
      ],
    },
    livestream: { url: "https://www.youtube.com/live/dummy-livestream-link" },
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "David Albarn & Faye Reed",
    track_url: ASSETS.defaultMusic,
    auto_play: false,
    inviting_families: [
      "The Albarn Family",
      "The Reed Family",
      "The Extended Families of Both",
    ],
    template_content: {
      cover_apology: "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.",
      gallery_quote: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      gift_intro_title: "Tanda Kasih",
      gift_intro_description:
        "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      closing_message:
        "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
  "altar-garden": {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [...DE_COVERS_COVER2],
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_parents: "Mr. & Mrs. Albarn",
    bride_parents: "Mr. & Mrs. Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
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
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
      },
    ],
    gallery_photos: [...DE_GALLERY, `${DE}/bride.webp`, `${DE}/groom.webp`],
    video_url: "https://youtu.be/-ARVwU58l7A",
    dresscode: {
      colors: [
        { hex: "#e8d9c5", name: "Sand" },
        { hex: "#c98f6b", name: "Terracotta" },
        { hex: "#7c5a43", name: "Cocoa" },
        { hex: "#2c241d", name: "Espresso" },
      ],
    },
    livestream: { url: "https://www.youtube.com/live/dummy-livestream-link" },
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "David Albarn & Faye Reed",
    track_url: ASSETS.defaultMusic,
    auto_play: false,
    inviting_families: [
      "The Albarn Family",
      "The Reed Family",
      "The Extended Families of Both",
    ],
    template_content: {
      cover_apology: "Kami memohon maaf atas segala kekeliruan penulisan nama dan gelar.",
      gallery_quote: "Setiap kisah cinta itu indah, tetapi kisah kita adalah favoritku.",
      gift_intro_title: "Tanda Kasih",
      gift_intro_description:
        "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
      closing_message:
        "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan restu pada hari pernikahan kami.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
}

DEMO_PROPS_BY_CODE["adat-melayu"] = {
  ...DEMO_PROPS_BY_CODE["altar-garden"],
  slug: "demo",
  groom_name: "Ridho",
  bride_name: "Aisyah",
  couple_initials: "RA",
  display_name: "#RidhoAisyah2027",
  groom_full_name: "Ridho Pratama",
  bride_full_name: "Aisyah Nurhaliza",
  groom_parents: "Putra dari Bapak H. Abdul Rahman & Ibu Hj. Siti Aminah",
  bride_parents: "Putri dari Bapak H. Muhammad Yusuf & Ibu Hj. Khadijah",
  groom_instagram: "@ridho.pratama",
  bride_instagram: "@aisyah.nurhaliza",
  estimated_wedding_date: "2027-12-31",
  quote_text:
    "Bismillahirrahmanirrahim. Semoga Allah SWT senantiasa melimpahkan keberkahan, kasih, dan keharmonisan dalam perjalanan kami.",
  quote_source: "Doa Pernikahan Adat Melayu",
  sessions: [
    {
      name: "Akad Nikah",
      date: "2027-12-31",
      time: "08.00 - 10.00 WIB",
      venue: "Balai Adat Melayu",
      address:
        "Jl. Hang Tuah No. 7, Kompleks Bandar Seni Raja Ali Haji, Kelurahan Sumahilang, Kecamatan Pekanbaru Kota, Kota Pekanbaru, Riau 28111",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "Resepsi Pernikahan",
      date: "2027-12-31",
      time: "11.00 - 14.00 WIB",
      venue: "Balai Adat Melayu",
      address:
        "Jl. Hang Tuah No. 7, Kompleks Bandar Seni Raja Ali Haji, Kelurahan Sumahilang, Kecamatan Pekanbaru Kota, Kota Pekanbaru, Riau 28111",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "Pertama Bertemu",
      description:
        "Kami pertama kali bertemu dalam sebuah acara keluarga di Pekanbaru. Sebuah sapaan sederhana menjadi awal dari kisah yang tidak pernah kami duga.",
    },
    {
      title: "Melangkah Bersama",
      description:
        "Dari hari-hari yang sederhana, kami belajar untuk tumbuh bersama dan menemukan rumah dalam diri satu sama lain.",
    },
    {
      title: "Memantapkan Hati",
      description:
        "Dengan doa dan restu kedua keluarga, kami memantapkan hati untuk mengikat janji pernikahan.",
    },
    {
      title: "Hari Pernikahan",
      description:
        "Dengan penuh syukur, kami memulai perjalanan membangun keluarga kecil. Semoga keberkahan menyertai setiap langkah kami.",
    },
  ],
  gift_accounts: [
    { provider_name: "Bank Mandiri", account_number: "1230009876543", account_name: "Ridho Pratama", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Aisyah Nurhaliza", type: "bank" },
  ],
  gift_address:
    "Jl. Hang Tuah No. 7, Kompleks Bandar Seni Raja Ali Haji, Kelurahan Sumahilang, Kecamatan Pekanbaru Kota, Kota Pekanbaru, Riau 28111",
  gift_address_name: "Ridho & Aisyah",
  inviting_families: [
    "Keluarga Besar Bapak H. Abdul Rahman",
    "Keluarga Besar Ibu Hj. Siti Aminah",
    "Keluarga Besar Bapak H. Muhammad Yusuf",
    "Keluarga Besar Ibu Hj. Khadijah",
  ],
  track_url: "/templates/adat-melayu/selamat-pengantin-baru.mp3",
  template_content: {
    cover_apology: "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
    gallery_intro: "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
    gallery_quote: "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
    gift_intro_title: "Love Gift",
    gift_intro_description:
      "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
    wishes_intro:
      "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
    closing_message:
      "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
  },
  rundown_visible: true,
  contacts_visible: true,
  rundown: [
    { time: "11.30 pagi", description: "Tamu tiba ke venue" },
    { time: "12.00 siang", description: "Kedatangan pengantin" },
    { time: "12.15 siang", description: "Makan bersama tamu" },
    { time: "1.30 siang", description: "Ucapan dan doa restu" },
    { time: "2.00 siang", description: "Sesi foto bersama tamu" },
  ],
  contacts: [
    { name: "Rizky Pratama", description: "Keluarga Mempelai Pria", whatsapp: "+62 812 3456 7890" },
    { name: "Dewi Anggraini", description: "Keluarga Mempelai Wanita", whatsapp: "+62 812 9876 5432" },
  ],
}

DEMO_PROPS_BY_CODE["adat-batak"] = {
  ...DEMO_PROPS_BY_CODE["adat-melayu"],
  slug: "demo",
  groom_name: "Bona",
  bride_name: "Ruth",
  couple_initials: "BR",
  display_name: "#BonaRuth2027",
  groom_full_name: "Bona Simanjuntak",
  bride_full_name: "Ruth Hutapea",
  groom_parents: "Putra dari Bapak Ir. T. Simanjuntak & Ibu br. Siregar",
  bride_parents: "Putri dari Bapak Drs. Hutapea & Ibu br. Nainggolan",
  groom_instagram: "@bona.simanjuntak",
  bride_instagram: "@ruth.hutapea",
  quote_text:
    "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
  quote_source: "Matius 19 : 6",
  sessions: [
    {
      name: "Ibadah Pernikahan",
      date: "2027-12-31",
      time: "08.00 - 10.00 WIB",
      venue: "Gereja HKBP Pematangsiantar",
      address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "Resepsi Adat Batak",
      date: "2027-12-31",
      time: "11.00 - 14.00 WIB",
      venue: "Sopo Godang HKBP",
      address: "Jl. Gereja No. 35, Pematangsiantar, Sumatera Utara",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "Pertemuan Pertama",
      description:
        "Kami pertama kali bertemu dalam sebuah acara keluarga di Pematangsiantar. Sebuah sapaan sederhana menjadi awal dari kisah yang tidak pernah kami duga.",
    },
    {
      title: "Melangkah Bersama",
      description:
        "Dari hari-hari sederhana, kami belajar tumbuh bersama dan menemukan rumah dalam diri satu sama lain.",
    },
    {
      title: "Memantapkan Hati",
      description:
        "Dengan doa dan restu kedua keluarga, serta adat Batak yang menyatukan marga kami, kami memantapkan hati untuk menikah.",
    },
    {
      title: "Hari Pernikahan",
      description:
        "Dengan penuh syukur, kami memulai perjalanan membangun keluarga kecil. Semoga berkat Tuhan menyertai setiap langkah kami.",
    },
  ],
  gift_accounts: [
    { provider_name: "Bank Mandiri", account_number: "1230009876543", account_name: "Bona Simanjuntak", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Ruth Hutapea", type: "bank" },
  ],
  gift_address:
    "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara 21142",
  gift_address_name: "Bona & Ruth",
  inviting_families: [
    "Keluarga Besar Bapak Ir. T. Simanjuntak",
    "Keluarga Besar Ibu br. Siregar",
    "Keluarga Besar Bapak Drs. Hutapea",
    "Keluarga Besar Ibu br. Nainggolan",
  ],
  track_url: "/templates/adat-batak/dongan-matua.mp3",
  template_content: {
    cover_apology: "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
    gallery_intro: "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
    gallery_quote: "Cinta tumbuh dalam doa, restu keluarga, dan setiap langkah yang kami jalani bersama.",
    gift_intro_title: "Love Gift",
    gift_intro_description:
      "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
    wishes_intro:
      "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menyampaikan doa restu.",
    closing_message:
      "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Tuhan senantiasa melimpahkan berkat-Nya.",
  },
}

DEMO_PROPS_BY_CODE["adat-minang"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: DEMO_PROPS_BY_CODE["adat-melayu"].estimated_wedding_date,
  quote_text: DEMO_PROPS_BY_CODE["adat-melayu"].quote_text,
  quote_source: "Doa Pernikahan Adat Minang",
  sessions: DEMO_PROPS_BY_CODE["adat-melayu"].sessions,
  stories: DEMO_PROPS_BY_CODE["adat-melayu"].stories,
  template_content: DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  contacts: DEMO_PROPS_BY_CODE["adat-melayu"].contacts,
  rundown_visible: true,
  contacts_visible: true,
  track_url: "/templates/adat-minang/urang-minang.mp3",
}

DEMO_PROPS_BY_CODE["lunar-blossom"] = {
    slug: "demo",
    groom_name: "Albarn",
    bride_name: "Faye",
    couple_initials: "AF",
    display_name: "#AlbarnFaye2026",
    groom_full_name: "David Albarn",
    bride_full_name: "Faye Reed",
    estimated_wedding_date: "2026-10-16",
    guest_name: "Tamu Undangan",
    preview_mode: true,
    wedding_profile_id: "demo-wedding-profile-id",
    guest_id: "demo-guest-id",
    cover_photos: [...DE_COVERS_COVER2],
    groom_photo_url: [`${DE}/groom.webp`],
    bride_photo_url: [`${DE}/bride.webp`],
    couple_illustration_url: `${DE}/cover.webp`,
    groom_parents: "Mr. & Mrs. Albarn",
    bride_parents: "Mr. & Mrs. Reed",
    groom_instagram: "@wedding.aksaraa",
    bride_instagram: "@wedding.aksaraa",
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
    gallery_photos: [...DE_GALLERY, `${DE}/bride.webp`, `${DE}/groom.webp`],
    stories: [
      {
        title: "The First Hello",
        description:
          "It began with a simple introduction that slowly grew into a comfortable companionship. Time brought us closer and taught us to know each other deeply.",
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
        image_url: `${DE}/cover-1.webp`,
      },
    ],
    video_url: "https://youtu.be/-ARVwU58l7A",
    gift_accounts: [
      { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
      { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    ],
    gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
    gift_address_name: "David Albarn & Faye Reed",
    track_url: ASSETS.defaultMusic,
    auto_play: false,
    inviting_families: [
      "The Albarn Family",
      "The Reed Family",
      "The Extended Families of Both",
    ],
    template_content: {
      welcome_invite: "You are invited to celebrate the wedding of",
      events_intro:
        "By the grace of God, we cordially request the honour of your presence at the marriage of our beloved children",
      gift_intro_description:
        "Your presence is the greatest gift. If you wish to send a token of love, the details are available below.",
      closing_message:
        "Thanks for your presence, participation and blessing. It is our honor and joy to share this special moment with you.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  }

DEMO_PROPS_BY_CODE["adat-jawa"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: DEMO_PROPS_BY_CODE["adat-melayu"].estimated_wedding_date,
  quote_text: DEMO_PROPS_BY_CODE["adat-melayu"].quote_text,
  quote_source: "Doa Pernikahan Adat Jawa",
  sessions: DEMO_PROPS_BY_CODE["adat-melayu"].sessions,
  stories: DEMO_PROPS_BY_CODE["adat-melayu"].stories,
  template_content: DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  contacts: DEMO_PROPS_BY_CODE["adat-melayu"].contacts,
  rundown_visible: true,
  contacts_visible: true,
  track_url: "/templates/adat-jawa/pujaningsih.mp3",
}
DEMO_PROPS_BY_CODE["adat-jawa-2"] = {
  slug: "demo",
  groom_name: "Albarn",
  bride_name: "Faye",
  couple_initials: "AF",
  display_name: "#AlbarnFaye2026",
  groom_full_name: "David Albarn",
  bride_full_name: "Faye Reed",
  estimated_wedding_date: "2026-10-16",
  guest_name: "Tamu Undangan",
  preview_mode: true,
  wedding_profile_id: "demo-wedding-profile-id",
  guest_id: "demo-guest-id",
  cover_photos: [...DE_COVERS_COVER2],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  couple_illustration_url: `${DE}/cover.webp`,
  groom_parents: "Mr. & Mrs. Albarn",
  bride_parents: "Mr. & Mrs. Reed",
  groom_instagram: "@wedding.aksaraa",
  bride_instagram: "@wedding.aksaraa",
  quote_text: "And over all these virtues put on love, which binds them all together in perfect unity.",
  quote_source: "Colossians 3 : 14",
  sessions: [
    { name: "Akad Nikah", date: "2026-10-16", time: "10.00 - 12.00 WIB", venue: "Gereja HKBP Sukadame", address: "Jl. Sisingamangaraja No. 333 Pematangsiantar, Sumatera Utara", maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6" },
    { name: "Resepsi", date: "2026-10-16", time: "13.00 WIB - Selesai", venue: "Sopo Godang HKBP", address: "Jl. Gereja No. 35 Pematangsiantar, Sumatera Utara", maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6" },
  ],
  gallery_photos: [...DE_GALLERY, `${DE}/bride.webp`, `${DE}/groom.webp`],
  stories: [
    { title: "The First Hello", description: "It began with a simple introduction that slowly grew into a comfortable companionship.", image_url: `${DE}/cover.webp` },
    { title: "Toward Forever", description: "After many chapters together, we chose to walk hand in hand toward forever.", image_url: `${DE}/cover-1.webp` },
  ],
  video_url: "https://youtu.be/-ARVwU58l7A",
  gift_accounts: [
    { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
  ],
  gift_address: "Jl. Sisingamangaraja No. 333, Pematangsiantar, Sumatera Utara, 21142",
  gift_address_name: "David Albarn & Faye Reed",
  track_url: ASSETS.defaultMusic,
  auto_play: false,
  inviting_families: ["The Albarn Family", "The Reed Family"],
  template_content: {
    gift_intro_description: "Kehadiran Anda adalah hadiah terindah. Jika Anda ingin mengirimkan tanda kasih, detailnya tersedia di bawah ini.",
    closing_message: "Terima kasih atas kehadiran dan doa terbaik Anda. Kami berharap kebahagiaan ini menjadi keajaiban dalam hidup kita.",
  },
  feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
}

DEMO_PROPS_BY_CODE["adat-palembang"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: DEMO_PROPS_BY_CODE["adat-melayu"].estimated_wedding_date,
  quote_text: DEMO_PROPS_BY_CODE["adat-melayu"].quote_text,
  quote_source: "Doa Pernikahan Adat Palembang",
  sessions: DEMO_PROPS_BY_CODE["adat-melayu"].sessions,
  stories: DEMO_PROPS_BY_CODE["adat-melayu"].stories,
  template_content: DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  contacts: DEMO_PROPS_BY_CODE["adat-melayu"].contacts,
  rundown_visible: true,
  contacts_visible: true,
  track_url: "/templates/adat-palembang/pagar-pengantin.mp3",
}

DEMO_PROPS_BY_CODE["adat-betawi"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: DEMO_PROPS_BY_CODE["adat-melayu"].estimated_wedding_date,
  quote_text: DEMO_PROPS_BY_CODE["adat-melayu"].quote_text,
  quote_source: "Doa Pernikahan Adat Betawi",
  sessions: DEMO_PROPS_BY_CODE["adat-melayu"].sessions,
  stories: DEMO_PROPS_BY_CODE["adat-melayu"].stories,
  template_content: DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  contacts: DEMO_PROPS_BY_CODE["adat-melayu"].contacts,
  rundown_visible: true,
  contacts_visible: true,
  track_url: "/templates/adat-betawi/sirih-kuning.mp3",
}

DEMO_PROPS_BY_CODE["adat-bali"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: DEMO_PROPS_BY_CODE["adat-melayu"].estimated_wedding_date,
  quote_text: DEMO_PROPS_BY_CODE["adat-melayu"].quote_text,
  quote_source: "Doa Pernikahan Adat Bali",
  sessions: DEMO_PROPS_BY_CODE["adat-melayu"].sessions,
  stories: DEMO_PROPS_BY_CODE["adat-melayu"].stories,
  template_content: DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  contacts: DEMO_PROPS_BY_CODE["adat-melayu"].contacts,
  rundown_visible: true,
  contacts_visible: true,
  track_url: "/templates/adat-bali/sacred-bali.mp3",
}

DEMO_PROPS_BY_CODE["manjari"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  estimated_wedding_date: "2027-12-31",
  sessions: (DEMO_PROPS_BY_CODE["sandhya"].sessions || []).map((s) => ({ ...s, date: "2027-12-31" })),
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  rundown_visible: true,
  track_url: "/templates/manjari/lee-hi-only.mp3",
  template_content: {
    cover_apology: "We apologize for any misspelling of your name.",
    love_story_title: "A Love Written in Time",
    gallery_title: "Where Our Memories Live",
    gallery_quote: "A lifetime with you is the most beautiful story I could ever choose.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description: "Your presence is the greatest gift to us. If you would like to send another token of love, please use the details below:",
    wishes_intro: "Please let us know whether you will join our wedding celebration by completing the form below.",
    closing_message: "Thank you for being part of our story. Your presence, prayers, and warm wishes mean more to us than words can express.",
  },
}

DEMO_PROPS_BY_CODE["minang-royal"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  groom_full_name: "David Albarn",
  bride_full_name: "Faye Reed",
  groom_parents: "Putra dari Bapak H. Ahmad Fadillah & Ibu Hj. Nur Aisyah",
  bride_parents: "Putri dari Bapak H. Muhammad Yusuf & Ibu Hj. Siti Khadijah",
  cover_photos: [...DE_COVERS_COVER2].slice(0, 2),
  opening_description:
    "Bismillahirrahmanirrahim\nAssalamu'alaikum Warahmatullahi Wabarakatuh\nMaha Suci Allah yang telah menciptakan mahkluk-Nya berpasang-pasangan\nYa Allah, perkenankanlah putra-putri kami:",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: DEMO_PROPS_BY_CODE["adat-melayu"].estimated_wedding_date,
  quote_text: DEMO_PROPS_BY_CODE["adat-melayu"].quote_text,
  quote_source: "Doa Pernikahan Adat Minang",
  sessions: DEMO_PROPS_BY_CODE["adat-melayu"].sessions,
  stories: DEMO_PROPS_BY_CODE["adat-melayu"].stories,
  rundown: DEMO_PROPS_BY_CODE["adat-melayu"].rundown,
  rundown_visible: true,
  dresscode: {
    title: "Dresscode",
    description: "Formal Attire",
    colors: [
      { hex: "#650b04", name: "Maroon" },
      { hex: "#f4e1c3", name: "Cream" },
      { hex: "#ffde8f", name: "Gold" },
      { hex: "#501817", name: "Deep Maroon" },
    ],
  },
  inviting_families: [
    "Keluarga Besar Bapak Ahmad Fadillah",
    "Keluarga Besar Ibu Nur Aisyah",
    "Keluarga Besar Bapak Muhammad Yusuf",
    "Keluarga Besar Ibu Siti Khadijah",
  ],
  livestream: {
    title: "Live Streaming",
    description: "Saksikan momen akad dan resepsi kami secara langsung.",
    url: "https://www.youtube.com/live/dummy-livestream-link",
  },
  template_content: {
    events_intro:
      "Untuk melaksanakan syariat agama-Mu, mengikuti sunnah rasul-Mu dalam membentuk keluarga yang Sakinah, Mawaddah, Warahmah yang Insya Allah akan diselenggarakan pada hari:",
    cover_apology: "Kami mohon maaf apabila terdapat kesalahan dalam penulisan nama dan gelar.",
    gallery_intro: "Beberapa bingkai yang kami simpan erat, menjadi saksi perjalanan menuju hari bahagia.",
    dresscode_note: "Kenakan pakaian formal yang serasi dengan nuansa adat Minang.",
    gift_intro_title: "Love Gift",
    gift_intro_description:
      "Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih untuk kami, dapat melalui:",
    wishes_intro: "Tinggalkan doa dan ucapan terbaik Anda untuk kedua mempelai.",
    closing_message:
      "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan terima kasih. Semoga Allah SWT senantiasa melimpahkan keberkahan.",
  },
  track_url: "/templates/minang-royal/bergema.mp3",
}

DEMO_PROPS_BY_CODE["still-ever"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: "2027-12-31",
  sessions: (DEMO_PROPS_BY_CODE["sandhya"].sessions || []).map((s) => ({ ...s, date: "2027-12-31" })),
  cover_photos: [...DE_COVERS_COVER2].slice(0, 3),
  gallery_photos: [...DE_GALLERY],
  track_url: ASSETS.defaultMusic,
  template_content: {
    cover_apology: "We apologize for any misspelling of your name or title.",
    quote_title: "A Word From Us",
    love_story_title: "How Our Story Began",
    gallery_title: "The Days We Kept",
    gallery_quote: "A lifetime with you is the story I would choose again and again.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Your presence is the greatest gift. Should you wish to send a token of love, the details are below.",
    wishes_intro: "Leave a wish, a prayer, or a memory for us to keep.",
    closing_message:
      "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
  },
}
