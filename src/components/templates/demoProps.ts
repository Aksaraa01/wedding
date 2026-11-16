import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { eventLabels } from "@/lib/eventType"

const TM = "https://ylmfgorryxzpdckkebnr.supabase.co/storage/v1/object/public/media/template-media"

const DE = "/images/dark-elegance"
const BP = (name: string) => `/templates/boarding-pass/${name}`
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
    couple_initials: "A&A",
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
    couple_initials: "A&A",
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
    couple_initials: "A&A",
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
    couple_initials: "A&A",
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
    couple_initials: "A&A",
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
    couple_initials: "A&A",
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
    couple_initials: "A&A",
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
    profiles_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami dipertemukan untuk melangkah bersama dalam kasih dan keharmonisan.",
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Melayu kami:",
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

DEMO_PROPS_BY_CODE["adat-bugis"] = {
  ...DEMO_PROPS_BY_CODE["adat-melayu"],
  slug: "demo",
  groom_name: "Andi",
  bride_name: "Nurul",
  couple_initials: "AN",
  display_name: "#AndiNurul2027",
  groom_full_name: "Andi Muh. Fadhil Pratama",
  bride_full_name: "Nurul Aisyah Ramadhani",
  groom_parents: "Putra dari Bapak H. Andi Muhammad Idris & Ibu Hj. Andi Nurhayati",
  bride_parents: "Putri dari Bapak H. Abdul Karim & Ibu Hj. Siti Rahmah",
  groom_instagram: "@wedding.aksaraa",
  bride_instagram: "@wedding.aksaraa",
  quote_source: "Doa Pernikahan Adat Bugis",
  sessions: [
    {
      name: "Mappacci",
      date: "2027-12-31",
      time: "08.00 - 10.00 WITA",
      venue: "Balai Adat Bugis",
      address: "Jl. Sultan Hasanuddin No. 12, Makassar, Sulawesi Selatan",
      maps_url: "https://maps.google.com/?q=Balai+Adat+Bugis+Makassar",
    },
    {
      name: "Resepsi Pernikahan",
      date: "2027-12-31",
      time: "11.00 - 14.00 WITA",
      venue: "Balai Adat Bugis",
      address: "Jl. Sultan Hasanuddin No. 12, Makassar, Sulawesi Selatan",
      maps_url: "https://maps.google.com/?q=Balai+Adat+Bugis+Makassar",
    },
  ],
  stories: [
    {
      title: "Pertemuan Pertama",
      description:
        "Kami pertama kali bertemu dalam sebuah acara keluarga di Makassar. Sebuah sapaan sederhana menjadi awal dari kisah yang tidak pernah kami duga.",
    },
    {
      title: "Melangkah Bersama",
      description:
        "Dari hari-hari sederhana, kami belajar tumbuh bersama dan menemukan rumah dalam diri satu sama lain.",
    },
    {
      title: "Memantapkan Hati",
      description:
        "Dengan doa dan restu kedua keluarga, serta adat Bugis yang menyatukan kami, kami memantapkan hati untuk menikah.",
    },
    {
      title: "Hari Pernikahan",
      description:
        "Dengan penuh syukur, kami memulai perjalanan membangun keluarga kecil. Semoga keberkahan menyertai setiap langkah kami.",
    },
  ],
  gift_accounts: [
    { provider_name: "Bank Mandiri", account_number: "1230009876543", account_name: "Andi Muh. Fadhil Pratama", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Nurul Aisyah Ramadhani", type: "bank" },
  ],
  gift_address: "Jl. Sultan Hasanuddin No. 12, Makassar, Sulawesi Selatan",
  gift_address_name: "Andi & Nurul",
  inviting_families: [
    "Keluarga Besar Bapak H. Andi Muhammad Idris",
    "Keluarga Besar Ibu Hj. Andi Nurhayati",
    "Keluarga Besar Bapak H. Abdul Karim",
    "Keluarga Besar Ibu Hj. Siti Rahmah",
  ],
  track_url: "/templates/adat-bugis/mula-macenning.mp3",
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
    profiles_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami dipertemukan untuk melangkah bersama dalam kasih dan keharmonisan.",
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Bugis kami:",
  },
}

DEMO_PROPS_BY_CODE["traditional-bugis-pinishi"] = {
  ...DEMO_PROPS_BY_CODE["adat-bugis"],
  slug: "demo",
  groom_name: "Andi",
  bride_name: "Nurul",
  couple_initials: "AN",
  display_name: "#AndiNurul2027",
  groom_full_name: "Andi Muh. Fadhil Pratama",
  bride_full_name: "Nurul Aisyah Ramadhani",
  groom_parents: "Putra dari Bapak H. Andi Muhammad Idris & Ibu Hj. Andi Nurhayati",
  bride_parents: "Putri dari Bapak H. Abdul Karim & Ibu Hj. Siti Rahmah",
  groom_instagram: "@wedding.aksaraa",
  bride_instagram: "@wedding.aksaraa",
  quote_source: "Doa Pernikahan Adat Bugis",
  cover_photos: [
    "/templates/traditional-bugis-pinishi/pembuka.webp",
    "/templates/traditional-bugis-pinishi/galeri-1.webp",
    "/templates/traditional-bugis-pinishi/galeri-2.webp",
  ],
  gallery_photos: [
    "/templates/traditional-bugis-pinishi/galeri-1.webp",
    "/templates/traditional-bugis-pinishi/galeri-2.webp",
    "/templates/traditional-bugis-pinishi/galeri-3.webp",
    "/templates/traditional-bugis-pinishi/galeri-4.webp",
  ],
  groom_photo_url: "/templates/traditional-bugis-pinishi/pria.webp",
  bride_photo_url: "/templates/traditional-bugis-pinishi/wanita.webp",
  track_url: "/templates/traditional-bugis-pinishi/music.mp3",
  wedding_profile_id: "demo-wedding-profile-id",
  guest_id: "demo-guest-id",
  preview_mode: true,
}

DEMO_PROPS_BY_CODE["adat-dayak"] = {
  ...DEMO_PROPS_BY_CODE["adat-melayu"],
  slug: "demo",
  groom_name: "Andi",
  bride_name: "Nurul",
  couple_initials: "AN",
  display_name: "#AndiNurul2027",
  groom_full_name: "Andi Muh. Fadhil Pratama",
  bride_full_name: "Nurul Aisyah Ramadhani",
  groom_parents: "Putra dari Bapak H. Andi Muhammad Idris & Ibu Hj. Andi Nurhayati",
  bride_parents: "Putri dari Bapak H. Abdul Karim & Ibu Hj. Siti Rahmah",
  groom_instagram: "@wedding.aksaraa",
  bride_instagram: "@wedding.aksaraa",
  quote_source: "Doa Pernikahan Adat Dayak",
  sessions: [
    {
      name: "Penerimaan / Siaga",
      date: "2027-12-31",
      time: "14.00 - 16.00 WITA",
      venue: "Rumah Betang Dayak",
      address: "Jl. Tjilik Riwut No. 7, Palangka Raya, Kalimantan Tengah",
      maps_url: "https://maps.google.com/?q=Rumah+Betang+Dayak+Palangka+Raya",
    },
    {
      name: "Akad Nikah",
      date: "2027-12-31",
      time: "16.30 - 18.00 WITA",
      venue: "Rumah Betang Dayak",
      address: "Jl. Tjilik Riwut No. 7, Palangka Raya, Kalimantan Tengah",
      maps_url: "https://maps.google.com/?q=Rumah+Betang+Dayak+Palangka+Raya",
    },
    {
      name: "Resepsi Pernikahan",
      date: "2027-12-31",
      time: "19.00 - 21.00 WITA",
      venue: "Rumah Betang Dayak",
      address: "Jl. Tjilik Riwut No. 7, Palangka Raya, Kalimantan Tengah",
      maps_url: "https://maps.google.com/?q=Rumah+Betang+Dayak+Palangka+Raya",
    },
  ],
  stories: [
    {
      title: "Pertama Bertemu",
      description:
        "Kami pertama kali bertemu dalam sebuah acara keluarga di Palangka Raya. Sebuah sapaan sederhana menjadi awal dari kisah yang tidak pernah kami duga.",
    },
    {
      title: "Melangkah Bersama",
      description:
        "Dari hari-hari yang sederhana, kami belajar untuk tumbuh bersama dan menemukan rumah dalam diri satu sama lain.",
    },
    {
      title: "Memantapkan Hati",
      description:
        "Dengan doa dan restu kedua keluarga, serta adat Dayak yang menyatukan kami, kami memantapkan hati untuk mengikat janji pernikahan.",
    },
    {
      title: "Hari Pernikahan",
      description:
        "Dengan penuh syukur, kami memulai perjalanan membangun keluarga kecil. Semoga keberkahan menyertai setiap langkah kami.",
    },
  ],
  gift_accounts: [
    { provider_name: "Bank Mandiri", account_number: "1230009876543", account_name: "Andi Muh. Fadhil Pratama", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Nurul Aisyah Ramadhani", type: "bank" },
  ],
  gift_address: "Jl. Tjilik Riwut No. 7, Palangka Raya, Kalimantan Tengah",
  gift_address_name: "Andi & Nurul",
  inviting_families: [
    "Keluarga Besar Bapak H. Andi Muhammad Idris",
    "Keluarga Besar Ibu Hj. Andi Nurhayati",
    "Keluarga Besar Bapak H. Abdul Karim",
    "Keluarga Besar Ibu Hj. Siti Rahmah",
  ],
  track_url: "/templates/adat-dayak/purnawandi-wawan-tabayang.mp3",
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
    profiles_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami dipertemukan untuk melangkah bersama dalam kasih dan keharmonisan.",
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Dayak kami:",
  },
}

DEMO_PROPS_BY_CODE["adat-banjar"] = {
  ...DEMO_PROPS_BY_CODE["adat-melayu"],
  slug: "demo",
  groom_name: "Joseph",
  bride_name: "Sandhya",
  couple_initials: "SJ",
  display_name: "#SandhyaJoseph2027",
  groom_full_name: "Joseph Alexander Wicaksana",
  bride_full_name: "Sandhya Kirana Adiwijaya",
  groom_parents: "Putra dari Bapak Muhammad Yusuf & Ibu Siti Khadijah",
  bride_parents: "Putri dari Bapak Ahmad Fadillah & Ibu Nur Aisyah",
  groom_instagram: "@joseph.alexander",
  bride_instagram: "@sandhya.kirana",
  quote_source: "Doa Pernikahan Adat Banjar",
  sessions: [
    {
      name: "Akad Nikah",
      date: "2027-12-31",
      time: "08.00 - 10.00 WIB",
      venue: "Rumah Bubungan Tinggi Banjar",
      address: "Jl. Ahmad Yani No. 7, Banjarbaru, Kalimantan Selatan",
      maps_url: "https://maps.google.com/?q=Rumah+Bubungan+Tinggi+Banjar+Banjarmasin",
    },
    {
      name: "Resepsi Pernikahan",
      date: "2027-12-31",
      time: "11.00 - 14.00 WIB",
      venue: "Rumah Bubungan Tinggi Banjar",
      address: "Jl. Ahmad Yani No. 7, Banjarbaru, Kalimantan Selatan",
      maps_url: "https://maps.google.com/?q=Rumah+Bubungan+Tinggi+Banjar+Banjarmasin",
    },
  ],
  stories: [
    {
      title: "Pertama Bertemu",
      description:
        "Kami pertama kali bertemu dalam sebuah acara keluarga di Banjarmasin. Sebuah sapaan sederhana menjadi awal dari kisah yang tidak pernah kami duga.",
    },
    {
      title: "Melangkah Bersama",
      description:
        "Dari hari-hari yang sederhana, kami belajar untuk tumbuh bersama dan menemukan rumah dalam diri satu sama lain.",
    },
    {
      title: "Memantapkan Hati",
      description:
        "Dengan doa dan restu kedua keluarga, serta adat Banjar yang menyatukan kami, kami memantapkan hati untuk mengikat janji pernikahan.",
    },
    {
      title: "Hari Pernikahan",
      description:
        "Dengan penuh syukur, kami memulai perjalanan membangun keluarga kecil. Semoga keberkahan menyertai setiap langkah kami.",
    },
  ],
  gift_accounts: [
    { provider_name: "Bank Mandiri", account_number: "1230009876543", account_name: "Joseph Alexander Wicaksana", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Sandhya Kirana Adiwijaya", type: "bank" },
  ],
  gift_address: "Jl. Ahmad Yani No. 7, Banjarbaru, Kalimantan Selatan",
  gift_address_name: "Joseph & Sandhya",
  inviting_families: [
    "Keluarga Bapak Muhammad Yusuf",
    "Keluarga Ibu Siti Khadijah",
    "Keluarga Bapak Ahmad Fadillah",
    "Keluarga Ibu Nur Aisyah",
  ],
  track_url: "/templates/adat-banjar/h-anang-ardiansyah-kembang-goyang.mp3",
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
    profiles_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami dipertemukan untuk melangkah bersama dalam kasih dan keharmonisan.",
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Banjar kami:",
  },
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
    profiles_intro:
      "Dengan memohon rahmat Tuhan Yang Maha Esa, kami dipertemukan untuk melangkah bersama dalam kasih dan keharmonisan.",
    events_intro:
      "Dengan memohon rahmat Tuhan Yang Maha Esa, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Batak kami:",
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
  template_content: {
    ...DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Minang kami:",
  },
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
    couple_initials: "A&A",
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
  template_content: {
    ...DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Jawa kami:",
  },
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
  couple_initials: "A&A",
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
  template_content: {
    ...DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Palembang kami:",
  },
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
  template_content: {
    ...DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Betawi kami:",
  },
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
  template_content: {
    ...DEMO_PROPS_BY_CODE["adat-melayu"].template_content,
    events_intro:
      "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri rangkaian pernikahan adat Bali kami:",
  },
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
  cover_photos: [...DE_COVERS_COVER2].slice(0, 4),
  gallery_photos: [...DE_GALLERY],
  rundown_visible: true,
  rundown: [
    { time: "10.00", description: "Guests are seated at the chapel" },
    { time: "10.30", description: "The ceremony begins" },
    { time: "11.30", description: "Family photographs and greetings" },
    { time: "12.30", description: "Reception and lunch together" },
    { time: "14.00", description: "A closing word and farewell" },
  ],
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

DEMO_PROPS_BY_CODE["embroidered-garden"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: "2027-12-31",
  sessions: (DEMO_PROPS_BY_CODE["sandhya"].sessions || []).map((s) => ({ ...s, date: "2027-12-31" })),
  cover_photos: [...DE_COVERS_COVER2].slice(0, 1),
  video_url: "https://youtu.be/-ARVwU58l7A",
  gallery_photos: [
    `${DE}/cover-2.webp`,
    `${DE}/cover-3.webp`,
    `${DE}/cover-4.webp`,
    `${DE}/cover-5.webp`,
    `${DE}/cover.webp`,
    `${DE}/cover-1.webp`,
  ],
  groom_instagram: "@wedding.aksaraa",
  bride_instagram: "@wedding.aksaraa",
  stories: [
    {
      title: "First Met",
      description:
        "It began with a chance introduction at a friend's dinner, two chairs apart and a conversation that outlasted the dessert.",
      image_url: `${DE}/cover.webp`,
    },
    {
      title: "The Proposal",
      description:
        "Years later, on a quiet morning walk through the gardens we love, one question was asked and answered before the sun was fully up.",
      image_url: `${DE}/cover-1.webp`,
    },
  ],
  gift_accounts: [
    { provider_name: "Bank Danamon", account_number: "903687866339", account_name: "David Albarn", type: "bank" },
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    { provider_name: "DANA", account_number: "0812 3456 7890", account_name: "Faye Reed", type: "ewallet" },
  ],
  rundown_visible: true,
  rundown: [
    { time: "4:45 PM", description: "Guests arrive" },
    { time: "5:00 PM", description: "Ceremony begins" },
    { time: "6:00 PM", description: "Cocktail hour" },
    { time: "7:00 PM", description: "Reception and dancing" },
    { time: "11:00 PM", description: "Farewell" },
  ],
  inviting_families: [
    "The Albarn Family",
    "The Reed Family",
    "The Extended Families of Both",
  ],
  track_url: ASSETS.defaultMusic,
  template_content: {
    welcome_invite: "You are invited to the wedding of",
    welcome_message:
      "We are so happy to celebrate this day with you, surrounded by the people we love most.",
    events_intro: "We would be honoured to have you with us as we say our vows.",
    inviting_intro:
      "With deep gratitude we also present the families who extend this invitation alongside us.",
    rundown_title: "Order of the Day",
    rundown_intro: "Our ceremony will be followed by an apéritif, dinner and dancing.",
    love_story_title: "Our Story",
    story_intro: "Every chapter of our story has been leading to this day.",
    cover_apology: "We apologize for any misspelling of your name or title.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Your presence at our wedding is the greatest gift of all. Should you wish to celebrate with a gift, the details are below.",
    wishes_intro: "Leave a wish, a prayer, or a memory for us to keep.",
    closing_message:
      "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
  },
}

// Photo-less reference design: every surface is lace art, so there are no
// cover/gallery/story photos and no film. `track_url` is the shared default
// demo track — never the reference site's own music.
DEMO_PROPS_BY_CODE["lace"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: "2027-05-20",
  sessions: [
    {
      name: "The Ceremony",
      date: "2027-05-20",
      time: "4:45 PM – 6:30 PM",
      venue: "Villa Aurelia",
      address: "Via della Lungara 12, 00165 Roma RM, Italy",
      maps_url: "https://maps.google.com/?q=Villa+Aurelia+Rome",
    },
    {
      name: "The Reception",
      date: "2027-05-20",
      time: "7:00 PM – 11:00 PM",
      venue: "Villa Aurelia, Garden Terrace",
      address: "Via della Lungara 12, 00165 Roma RM, Italy",
      maps_url: "https://maps.google.com/?q=Villa+Aurelia+Rome",
    },
  ],
  groom_full_name: "David Albarn",
  bride_full_name: "Faye Reed",
  groom_parents: "The Son of Mr. James Albarn & Mrs. Clara Albarn",
  bride_parents: "The Daughter of Mr. Edward Reed & Mrs. Anne Reed",
  cover_photos: [`${DE}/cover-2.webp`, `${DE}/cover-4.webp`],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  gallery_photos: [...DE_GALLERY].slice(0, 6),
  stories: [
    {
      title: "First Met",
      description:
        "It began with a chance introduction at a friend's dinner, two chairs apart and a conversation that outlasted the dessert.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "The Little Things",
      description:
        "Slow mornings, long walks home, and a habit of saving the last bite for each other, the years that made the answer obvious.",
      image_url: `${DE}/cover-5.webp`,
    },
    {
      title: "The Proposal",
      description:
        "On a quiet morning in the garden we love, one question was asked and answered before the sun was fully up.",
      image_url: `${DE}/cover.webp`,
    },
  ],
  video_url: "https://youtu.be/-ARVwU58l7A",
  groom_instagram: "@wedding.aksaraa",
  bride_instagram: "@wedding.aksaraa",
  gift_accounts: [
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    { provider_name: "Bank Mandiri", account_number: "1370012345678", account_name: "David Albarn", type: "bank" },
  ],
  gift_address_name: "Albarn & Faye",
  gift_address: "Via della Lungara 12, 00165 Roma RM, Italy",
  rundown_visible: true,
  rundown: [
    { time: "4:45 PM", description: "Guests arrive and are welcomed with a glass of Prosecco." },
    { time: "5:00 PM", description: "The ceremony begins in the garden courtyard." },
    { time: "6:00 PM", description: "Cocktails and photographs on the terrace." },
    { time: "7:00 PM", description: "Dinner is served beneath the garlands." },
    { time: "9:00 PM", description: "The first dance, and dancing until late." },
  ],
  inviting_families: [
    "The Reed Family",
    "The Albarn Family",
    "The Extended Families of Both",
  ],
  dresscode: {
    title: "Formal Attire",
    description: "We would love to see you in these tones, anything from a soft neutral to a deep burgundy.",
    colors: [
      { hex: "#f3ece4", name: "Ivory" },
      { hex: "#c9b49a", name: "Sand" },
      { hex: "#8c6a63", name: "Rosewood" },
      { hex: "#511f2b", name: "Burgundy" },
    ],
  },
  track_url: ASSETS.defaultMusic,
  template_content: {
    cover_kicker: "The Wedding Of",
    welcome_invite: "Together with their families",
    welcome_message:
      "We are so happy to celebrate this day with you, surrounded by the people we love most.",
    profiles_intro:
      "Two families, two homes, and one day we will remember for the rest of our lives.",
    events_intro: "We would be honoured to have you with us as we say our vows.",
    rundown_title: "The Day",
    rundown_intro: "Our ceremony will be followed by an aperitivo, dinner and dancing.",
    inviting_intro: "Together with the families who share this invitation.",
    gallery_title: "Our Moments",
    gallery_intro: "A few frames from the days that led us here, the quiet ones we keep closest.",
    video_title: "Our Film",
    video_intro: "The day as it happened, kept in motion.",
    video_caption: "Filmed on the day, from the first look to the last dance.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Should you wish to give a gift, you may do so in cash or by bank transfer.",
    wishes_intro:
      "Nothing would make us happier than celebrating this day surrounded by our favourite people. Please let us know whether you'll be able to join us.",
    closing_message:
      "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
  },
}

DEMO_PROPS_BY_CODE["n-film"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  // display_name is the editor/ops "Hashtag Instagram Post" — the demo carries it
  // so the cover shows the same value a couple would type.
  display_name: "#AlbarnFayeForever",
  estimated_wedding_date: "2027-08-24",
  sessions: (DEMO_PROPS_BY_CODE["sandhya"].sessions || []).map((session) => ({ ...session, date: "2027-08-24" })),
  cover_photos: [`${DE}/cover-2.webp`, `${DE}/cover.webp`, `${DE}/cover-4.webp`],
  gallery_photos: [...DE_GALLERY],
  stories: [
    {
      title: "The First Encounter",
      description:
        "Two strangers, one rainy evening, and a conversation that never really ended.",
      image_url: `${DE}/cover-1.webp`,
    },
    {
      title: "The Promise",
      description: "Through every season and every distance, they kept choosing each other.",
      image_url: `${DE}/cover-2.webp`,
    },
    {
      title: "The Proposal",
      description: "One question, one ring, and the easiest yes.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "The New Beginning",
      description:
        "Not the end of the story, but the first page of a new chapter, together.",
      image_url: `${DE}/cover-4.webp`,
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "10.00", description: "Guests are seated" },
    { time: "10.30", description: "The ceremony begins" },
    { time: "11.30", description: "Family photographs and greetings" },
    { time: "12.30", description: "Reception and lunch together" },
    { time: "14.00", description: "A closing word and farewell" },
  ],
  dresscode_visible: true,
  dresscode: {
    description:
      "We would love to see you in these tones, so the frames we keep from the day sit together.",
    colors: [
      { hex: "#f5f5f1", name: "Paper" },
      { hex: "#e50914", name: "Cinema Red" },
      { hex: "#8c8c8c", name: "Silver" },
      { hex: "#141414", name: "Midnight" },
    ],
  },
  template_content: {
    cover_kicker: "#AlbarnFayeForever",
    cover_title: "Now Showing",
    open_button: "Start the Film",
    cover_apology: "We apologize for any misspelling of your name or title.",
    hero_badge: "#1",
    hero_meta: "100% Love · 2027 · Forever · Romance",
    gallery_intro: "click to preview",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Having our family, friends, and loved ones share in our special day is the greatest gift. If you would like to express your love through a gift, we have provided the details below.",
    wishes_intro: "Leave a wish, a prayer, or a memory for us to keep.",
    inviting_intro: "With the blessings of their families, we invite you to celebrate with us.",
    closing_message:
      "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
  },
}

DEMO_PROPS_BY_CODE["ivory-lace"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: "2027-04-17",
  guest_name: "Tamu Undangan",
  opening_title: "Dear Family & Friends",
  opening_description:
    "We are so happy to share this day with you. Here you will find everything about the celebration, the ceremony, the day itself, and the people we cannot wait to see.",
  wedding_profile_id: "demo-wedding-profile-id",
  guest_id: "demo-guest-id",
  cover_photos: [`${DE}/cover-1.webp`, `${DE}/cover-3.webp`, `${DE}/cover-2.webp`, `${DE}/cover-4.webp`, `${DE}/cover-5.webp`],
  gallery_photos: [...DE_GALLERY].slice(0, 6),
  stories: [
    {
      title: "The First Chapter",
      description:
        "It began with a borrowed umbrella and an afternoon that ran long. What was meant to be a short walk home turned into the first of a thousand conversations we never wanted to end.",
      image_url: `${DE}/cover-2.webp`,
    },
    {
      title: "The Promise",
      description:
        "Years later, on a quiet morning by the water, one small question changed the shape of every day that followed. We have been planning this celebration ever since.",
      image_url: `${DE}/cover-4.webp`,
    },
  ],
  sessions: [
    {
      name: "The Ceremony",
      date: "2027-04-17",
      time: "Four in the afternoon",
      venue: "The Orangery",
      address: "Ashford Park, Kent, England",
      maps_url: "https://maps.google.com/?q=Ashford+Park+Kent",
    },
    {
      name: "The Reception",
      date: "2027-04-17",
      time: "Six in the evening",
      venue: "The Orangery, Garden Terrace",
      address: "Ashford Park, Kent, England",
      maps_url: "https://maps.google.com/?q=Ashford+Park+Kent",
    },
  ],
  video_url: "https://youtu.be/-ARVwU58l7A",
  rundown_visible: true,
  rundown: [
    { time: "04:00 PM", description: "Guests arrive and are welcomed in the garden" },
    { time: "04:30 PM", description: "The ceremony begins beneath the orangery arch" },
    { time: "05:15 PM", description: "Congratulations and photographs on the lawn" },
    { time: "06:00 PM", description: "Dinner is served at long tables" },
    { time: "08:00 PM", description: "Cake, toasts, and the first dance" },
    { time: "09:30 PM", description: "Dancing under the lanterns" },
    { time: "11:00 PM", description: "A quiet farewell" },
  ],
  inviting_families: ["The Whitmore Family", "The Sinclair Family", "The Families of Both"],
  dresscode: {
    title: "Garden Formal",
    description:
      "We would love to see you in soft neutrals, muted hues, or timeless classic tones, anything that feels at home in a spring garden.",
    colors: [
      { hex: "#22211f", name: "Ink" },
      { hex: "#4a4a48", name: "Charcoal" },
      { hex: "#f2ede3", name: "Ivory" },
      { hex: "#a3927c", name: "Taupe" },
    ],
  },
  gift_accounts: [
    { provider_name: "Bank Central Asia (BCA)", account_number: "8200891083", account_name: "Faye Reed", type: "bank" },
    { provider_name: "Bank Mandiri", account_number: "1370012345678", account_name: "David Albarn", type: "bank" },
  ],
  gift_address_name: "Albarn & Faye",
  gift_address: "12 Ashford Park Lane, Kent TN24 8TE, England",
  // Manjari's in-house track (the reference has no music of its own).
  track_url: "/templates/manjari/lee-hi-only.mp3",
  template_content: {
    cover_kicker: "The Wedding Of",
    cover_apology: "We apologize for any misspelling of your name or title.",
    welcome_invite: "Dear Family & Friends",
    welcome_message:
      "We are so happy to share this day with you. Here you will find everything about the celebration, the ceremony, the day itself, and the people we cannot wait to see.",
    profiles_intro: "Two families, two homes, and one day we will remember for the rest of our lives.",
    love_story_title: "Our Love Story",
    story_intro: "The chapters that brought us here",
    events_intro: "We would be honoured to have you with us as we say our vows.",
    rundown_title: "Wedding Time Line",
    rundown_intro: "How the day will unfold, from the first arrival to the last farewell.",
    gallery_title: "Our Moments",
    gallery_intro: "A few frames from the days that led us here, the quiet ones we keep closest.",
    gallery_quote: "Every love story is beautiful, but ours is my favourite.",
    video_title: "Our Film",
    video_intro: "The day as it happened, kept in motion.",
    video_caption: "Filmed on the day, from the first look to the last dance.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Your presence is the greatest gift. Should you wish to send a token of love, the details are below.",
    inviting_intro: "Together with the families who share this invitation.",
    wishes_intro:
      "Nothing would make us happier than celebrating this day surrounded by the people we love. Leave us a wish, and let us know you are coming.",
    closing_message:
      "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
  },
}

DEMO_PROPS_BY_CODE["boarding-pass"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  // Demo imagery is the reference design's own set, vendored into
  // public/templates/boarding-pass so the preview reads exactly like it.
  display_name: "#AlbarnFayeForever",
  estimated_wedding_date: "2027-12-11",
  // cover + hero are the reference's beach frame; closing borrows a couple frame
  cover_photos: [BP("hero-beach.webp"), BP("hero-beach.webp"), BP("couple-3.webp")],
  groom_photo_url: [BP("couple-1.webp")],
  bride_photo_url: [BP("couple-2.webp")],
  gallery_photos: [BP("gallery-1.webp"), BP("gallery-2.webp"), BP("gallery-3.webp"), BP("gallery-4.webp"),
                   BP("couple-3.webp"), BP("couple-4.webp"), BP("couple-5.webp"), BP("couple-1.webp")],
  sessions: [
    {
      name: "Akad Nikah",
      date: "2027-12-11",
      time: "08.00 - 10.00 WIB",
      venue: "Masjid Al-Bahar",
      address: "Jl. Pesisir No. 12, Badung, Bali",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "Resepsi",
      date: "2027-12-11",
      time: "11.00 - 14.00 WIB",
      venue: "Taman Nyiur",
      address: "Jl. Pesisir No. 30, Badung, Bali",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "2019 · Pertemuan Pertama",
      description:
        "Kami berkenalan di sebuah acara kantor yang sebenarnya sama-sama ingin kami lewatkan. Satu obrolan di dekat meja kopi berlanjut sampai lampu ruangan dimatikan.",
      image_url: BP("couple-3.webp"),
    },
    {
      title: "2022 · Jatuh Hati",
      description:
        "Dari teman bertukar cerita menjadi teman seperjalanan. Kami belajar bahwa jalan pulang terasa paling dekat bila ditempuh berdua.",
      image_url: BP("couple-4.webp"),
    },
    {
      title: "2025 · Sebuah Janji",
      description:
        "Di tepi pantai saat matahari turun, satu pertanyaan sederhana dijawab dengan anggukan dan tawa yang bercampur haru.",
      image_url: BP("couple-5.webp"),
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "07.30", description: "Tamu tiba dan registrasi di gerbang" },
    { time: "08.00", description: "Akad nikah dimulai" },
    { time: "09.30", description: "Sungkeman dan foto keluarga" },
    { time: "11.00", description: "Resepsi dibuka" },
    { time: "14.00", description: "Penutup dan pamit" },
  ],
  dresscode_visible: true,
  dresscode: {
    colors: [
      { hex: "#fffcf6", name: "Ivory" },
      { hex: "#1f5a60", name: "Teal" },
      { hex: "#bfd6d0", name: "Mint" },
      { hex: "#e4dccd", name: "Sand" },
    ],
  },
  template_content: {
    hero_tagline: "tujuan akhir: hari bahagia kami",
    board_footer: "sampai jumpa di gerbang keberangkatan",
    events_note: "Mohon hadir 30 menit sebelum boarding.",
    seat_class: "VIP",
    dresscode_intro:
      "Kami akan senang bila Anda hadir dengan nuansa warna berikut, agar setiap bingkai dari hari itu terasa satu cerita.",
    cover_kicker: "AF 27 · 01A",
    cover_apology: "Tunjukkan tiket ini dengan senyuman.",
    gallery_intro: "oleh-oleh dari perjalanan kami",
    gift_intro_title: "Tanda Kasih",
    gift_intro_description:
      "Doa restu Anda adalah bekal terbaik untuk perjalanan kami. Bila ingin memberi lebih, kami menerimanya dengan penuh syukur.",
    wishes_intro: "Titipkan pesan dan doa terbaik untuk perjalanan baru kami.",
    inviting_intro:
      "Dengan penuh rasa syukur, kami mengundang Anda untuk ikut dalam perjalanan ini bersama keluarga kami.",
    closing_message:
      "Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Terima kasih telah menjadi bagian dari perjalanan kami.",
  },
}


DEMO_PROPS_BY_CODE["cinnabar-seal"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  // Aksaraa's own sample couple (dark-elegance set), never the reference's.
  display_name: "Albarn & Faye",
  couple_initials: "A&A",
  estimated_wedding_date: "2027-03-20",
  cover_photos: [`${DE}/cover.webp`, `${DE}/cover-1.webp`, `${DE}/cover-2.webp`],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  gallery_photos: [
    `${DE}/cover-3.webp`, `${DE}/cover-4.webp`, `${DE}/cover-5.webp`, `${DE}/cover-6.webp`,
    `${DE}/cover.webp`, `${DE}/cover-1.webp`, `${DE}/cover-2.webp`, `${DE}/bride.webp`,
  ],
  sessions: [
    {
      name: "Tea Pai",
      date: "2027-03-20",
      time: "09.00 – 11.00 WIB",
      venue: "Kediaman Keluarga Reed",
      address: "Jl. Kemang Raya No. 18, Jakarta Selatan",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "Reception",
      date: "2027-03-20",
      time: "18.30 – 21.30 WIB",
      venue: "Grand Ballroom Lotus",
      address: "Jl. Gunung Sahari No. 7, Jakarta Utara",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "The First Cup",
      description:
        "Kami bertemu di sebuah kedai teh tua di sudut kota. Meja terakhir harus dibagi dua orang asing, dan percakapan itu tidak pernah benar-benar selesai.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "Beneath the Lanterns",
      description:
        "Di malam yang tenang di sepanjang jalan berlampion merah, sebuah pertanyaan akhirnya diucapkan. Jawabannya sederhana: ya.",
      image_url: `${DE}/cover-4.webp`,
    },
    {
      title: "Towards Forever",
      description:
        "Kini kami melangkah melewati pintu yang sama, membawa restu keluarga dan janji untuk saling menjaga.",
      image_url: `${DE}/cover-5.webp`,
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "08.30", description: "Tamu tiba dan registrasi" },
    { time: "09.00", description: "Upacara Tea Pai dimulai" },
    { time: "10.30", description: "Sesi foto keluarga" },
    { time: "18.30", description: "Resepsi dibuka" },
    { time: "21.00", description: "Salam perpisahan" },
  ],
  dresscode_visible: true,
  dresscode: {
    title: "Shades of Red",
    description: "Kami akan senang bila Anda hadir dengan nuansa warna berikut.",
    colors: [
      { hex: "#f3e8d8", name: "Ivory" },
      { hex: "#d6b676", name: "Gold" },
      { hex: "#9c1c22", name: "Lacquer Red" },
      { hex: "#2b0709", name: "Ink" },
    ],
  },
  template_content: {
    cover_kicker: "The Wedding Of",
    open_button: "Open Invitation",
    opening_kicker: "With Blessings",
    mempelai_kicker: "Mempelai",
    parents_label: "Anak dari",
    story_kicker: "Our",
    love_story_title: "Love Story",
    story_intro: "Bab-bab kecil yang membawa kami sampai ke hari ini.",
    events_kicker: "Save the Date",
    events_title: "The Celebration",
    events_intro: "Kami akan senang bila Anda berkenan hadir di hari bahagia kami.",
    maps_label: "Lihat Lokasi",
    inviting_kicker: "Turut Mengundang",
    inviting_title: "Keluarga & Sahabat",
    inviting_intro:
      "Dengan penuh rasa syukur, kami mengundang Anda untuk ikut dalam perayaan ini bersama keluarga kami.",
    rundown_kicker: "Rundown",
    rundown_title: "Rangkaian Acara",
    rundown_intro: "Bagaimana hari itu akan berjalan, dari kedatangan pertama hingga salam perpisahan.",
    gallery_kicker: "Precious",
    gallery_title: "Moments",
    gallery_intro: "Bingkai kecil dari perjalanan kami, disimpan untuk dikenang bersama.",
    video_kicker: "Our Film",
    video_title: "The Wedding Film",
    gift_kicker: "Digital Envelope",
    gift_intro_title: "Send your gift",
    gift_button: "Make a Gift Now",
    gift_intro_description:
      "Doa restu Anda adalah hadiah terindah. Bila ingin memberi lebih, kami menerimanya dengan penuh syukur.",
    dresscode_kicker: "Dress Code",
    dresscode_intro:
      "Kami akan senang bila Anda hadir dengan nuansa warna berikut, agar setiap bingkai dari hari itu terasa satu cerita.",
    wishes_kicker: "Words for Us",
    wishes_title: "Wishes",
    wishes_intro: "Titipkan pesan dan doa terbaik untuk perjalanan baru kami.",
    wishes_name_label: "Nama",
    wishes_name_placeholder: "Nama lengkap",
    wishes_message_label: "Ucapan & Doa",
    wishes_message_placeholder: "Titipkan pesan dan doa terbaik",
    wishes_submit: "Kirim Ucapan",
    wishes_empty: "Belum ada ucapan. Jadilah yang pertama.",
    copy_account_toast: "Nomor rekening disalin",
    copy_address_toast: "Alamat disalin",
    closing_kicker: "Thank You",
    closing_message:
      "Merupakan suatu kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu. Terima kasih telah menjadi bagian dari cerita kami.",
  },
}

DEMO_PROPS_BY_CODE.iris = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "Albarn & Faye",
  couple_initials: "A&A",
  estimated_wedding_date: "2027-11-12",
  cover_photos: [`${DE}/cover.webp`, `${DE}/cover-1.webp`, `${DE}/cover-2.webp`],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  gallery_photos: [
    `${DE}/cover-3.webp`, `${DE}/cover-4.webp`, `${DE}/cover-5.webp`, `${DE}/cover-6.webp`,
    `${DE}/cover.webp`, `${DE}/cover-1.webp`, `${DE}/cover-2.webp`, `${DE}/bride.webp`,
  ],
  sessions: [
    {
      name: "Pemberkatan",
      date: "2027-11-12",
      time: "09.00 WIB",
      venue: "The Dharmawangsa Jakarta",
      address: "Jl. Brawijaya Raya No. 26, Pulo, Kec. Kebayoran Baru, Jakarta Selatan 12160",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "Resepsi",
      date: "2027-11-12",
      time: "18.30 WIB",
      venue: "The Dharmawangsa Jakarta",
      address: "Jl. Brawijaya Raya No. 26, Pulo, Kec. Kebayoran Baru, Jakarta Selatan 12160",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "Awal Pertemuan",
      description:
        "Kami bertemu di sebuah acara keluarga di Jakarta. Percakapan singkat tentang kopi berlanjut menjadi obrolan panjang yang tidak ingin kami akhiri.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "Menjalin Hubungan",
      description:
        "Dari teman menjadi teman seperjalanan. Kami belajar bahwa rumah bukan hanya soal tempat, tetapi tentang siapa yang menunggu di sana.",
      image_url: `${DE}/cover-4.webp`,
    },
    {
      title: "Sebuah Janji",
      description:
        "Di sebuah taman pada sore hari, pertanyaan sederhana dijawab dengan senyum dan anggukan yang menyatukan kami untuk selamanya.",
      image_url: `${DE}/cover-5.webp`,
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "08.30", description: "Tamu tiba dan registrasi" },
    { time: "09.00", description: "Pemberkatan dimulai" },
    { time: "10.30", description: "Sesi foto keluarga" },
    { time: "18.30", description: "Resepsi dibuka" },
    { time: "21.00", description: "Salam perpisahan" },
  ],
  dresscode_visible: true,
  dresscode: {
    title: "Dresscode",
    description: "Kami dengan hormat menganjurkan para tamu mengenakan warna-warna ini untuk hari istimewa kami.",
    colors: [
      { hex: "#5c1f1c", name: "Maroon" },
      { hex: "#e8cf9e", name: "Champagne" },
      { hex: "#b06a3b", name: "Terracotta" },
      { hex: "#3b2a1e", name: "Coklat" },
    ],
  },
  template_content: {
    cover_kicker: "The Wedding of",
    open_button: "Buka Undangan",
    opening_kicker: "Ayat Suci",
    mempelai_kicker: "With Love",
    parents_label: "Anak dari",
    profiles_intro:
      "Tanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.",
    love_story_title: "Kisah Cinta",
    story_intro: "Bab-bab kecil yang membawa kami sampai ke hari ini.",
    save_date_label: "SAVE the DATE",
    events_intro: "Kami akan senang bila Anda berkenan hadir di hari bahagia kami.",
    maps_label: "Lihat Lokasi",
    inviting_kicker: "Turut Mengundang",
    inviting_title: "Keluarga & Sahabat",
    inviting_intro: "Dengan penuh rasa syukur, kami mengundang Anda untuk ikut dalam perayaan ini bersama keluarga kami.",
    rundown_kicker: "Rundown",
    rundown_title: "Rangkaian Acara",
    rundown_intro: "Bagaimana hari itu akan berjalan, dari kedatangan pertama hingga salam perpisahan.",
    gallery_title: "Gallery",
    gallery_intro: "Bingkai-bingkai yang kami simpan untuk dikenang bersama.",
    video_title: "Our Film",
    video_intro: "Hari itu, direkam agar bisa kami putar kembali kapan saja.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Kehadiran dan doa Anda adalah hadiah terindah bagi kami. Namun, apabila berkenan memberikan tanda kasih, silakan gunakan informasi di bawah ini.",
    gift_button: "Kirim Hadiah",
    dresscode_kicker: "Dresscode",
    dresscode_intro:
      "Kami dengan hormat menganjurkan para tamu mengenakan warna-warna ini untuk hari istimewa kami.",
    wishes_kicker: "Ucapan & Doa",
    wishes_title: "",
    wishes_intro: "Sampaikan doa dan harapan terbaik di sini, saat kami memulai perjalanan baru bersama.",
    wishes_name_label: "Nama",
    wishes_name_placeholder: "Nama lengkap",
    wishes_message_label: "Ucapan & Doa",
    wishes_message_placeholder: "Titipkan pesan dan doa terbaik",
    wishes_submit: "Kirim Ucapan",
    wishes_empty: "Belum ada ucapan. Jadilah yang pertama.",
    closing_kicker: "Terima Kasih",
    closing_message:
      "Menjadi sebuah kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dalam hari bahagia kami. Terima kasih atas segala ucapan, doa, dan perhatian yang diberikan.",
    copy_account_toast: "Nomor rekening disalin",
    copy_address_toast: "Alamat disalin",
    copy_address_button: "Salin Alamat",
  },
}

DEMO_PROPS_BY_CODE.teatro = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  track_url: "/templates/teatro/intro-music.mp3",
  display_name: "#AlbarnFaye2027",
  estimated_wedding_date: "2027-06-19",
  cover_photos: [`${DE}/cover.webp`, `${DE}/cover-1.webp`, `${DE}/cover-2.webp`],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  gallery_photos: [
    `${DE}/cover-3.webp`,
    `${DE}/cover-4.webp`,
    `${DE}/cover-5.webp`,
    `${DE}/cover-6.webp`,
    `${DE}/cover.webp`,
    `${DE}/cover-1.webp`,
    `${DE}/cover-2.webp`,
    `${DE}/bride.webp`,
  ],
  opening_title: "Welcome to Our Opening Night",
  opening_description:
    "With full hearts and the blessing of our families, we invite you to take your seat for the first act of our life together.",
  quote_text: "Love is not love which alters when it alteration finds.",
  quote_source: "William Shakespeare",
  sessions: [
    {
      name: "The Ceremony",
      date: "2027-06-19",
      time: "10.00 – 12.00 WIB",
      venue: "Teater Jakarta",
      address: "Taman Ismail Marzuki, Jl. Cikini Raya No. 73, Jakarta Pusat 10330",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "The Reception",
      date: "2027-06-19",
      time: "18.00 – 22.00 WIB",
      venue: "Teater Jakarta",
      address: "Taman Ismail Marzuki, Jl. Cikini Raya No. 73, Jakarta Pusat 10330",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "The First Hello",
      description:
        "A borrowed programme, a shared row of seats, and a conversation that ran long past the final curtain. We have been in the same story ever since.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "The Long Engagement",
      description:
        "Between cities and seasons we kept rehearsing the same promise, learning each other's lines until they felt like home.",
      image_url: `${DE}/cover-4.webp`,
    },
    {
      title: "Opening Night",
      description:
        "Now the house lights dim, the curtain rises, and we step on stage together for the part we have waited our whole lives to play.",
      image_url: `${DE}/cover-5.webp`,
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "09.30", description: "Doors open and guests are seated" },
    { time: "10.00", description: "The ceremony begins" },
    { time: "11.30", description: "Family portraits in the foyer" },
    { time: "18.00", description: "Reception and dinner service" },
    { time: "21.30", description: "The final bow and farewell" },
  ],
  dresscode_visible: true,
  dresscode: {
    title: "Black Tie in Burgundy",
    description:
      "We would be delighted if you joined us in the palette below, a quiet nod to the velvet curtains of our favourite theatre.",
    colors: [
      { hex: "#5c2018", name: "Burgundy" },
      { hex: "#c9a961", name: "Gold" },
      { hex: "#faf8f5", name: "Ivory" },
      { hex: "#3b2b27", name: "Espresso" },
    ],
  },
  template_content: {
    cover_kicker: "The Wedding of",
    open_button: "Tap to continue",
    welcome_invite: "Together with our families, we invite you to this important moment.",
    cover_apology: "We apologize for any misspelling of your name or title.",
    opening_kicker: "Prologue",
    quote_title: "Prologue",
    mempelai_kicker: "The Cast",
    profiles_intro: "Two families, one stage, and a lifetime of curtain calls.",
    parents_label: "Blessed By",
    story_kicker: "In Three Acts",
    love_story_title: "Our Story",
    story_intro: "The acts that brought us to opening night.",
    events_kicker: "The celebration will take place at",
    events_title: "The Venue",
    events_intro: "We would be honoured to have you with us as we say our vows.",
    events_note: "Doors open thirty minutes before the ceremony. Latecomers are seated between acts.",
    maps_label: "View location",
    save_date_label: "Save the Date",
    reveal_hint: "Scratch to discover the date",
    countdown_intro: "until the curtain rises",
    inviting_kicker: "With the blessing of",
    inviting_title: "Our Families",
    inviting_intro:
      "With deep gratitude we also present the families who extend this invitation alongside us.",
    rundown_kicker: "The Programme",
    rundown_title: "Order of the Day",
    rundown_intro: "How the evening will unfold, from the first arrival to the final bow.",
    gallery_kicker: "Gallery",
    gallery_title: "Scenes",
    gallery_intro: "Frames from the days that led us here, kept like programmes from a favourite show.",
    gallery_quote: "Every love story is beautiful, but ours is my favourite.",
    video_kicker: "The Film",
    video_title: "Our Film",
    video_intro: "The day as it happened, kept in motion.",
    gift_kicker: "Wedding Registry",
    gift_intro_title: "Gifts",
    gift_intro_description:
      "Your presence is the greatest gift. Should you wish to send a token of love, the details are below.",
    gift_signature: "With love and gratitude",
    gift_button: "Open the registry",
    copy_account_toast: "Account number copied",
    copy_address_toast: "Address copied",
    copy_address_button: "Copy address",
    dresscode_kicker: "Dress Code",
    dresscode_intro: "We would be delighted if you joined us in the palette below.",
    dresscode_note: "Please avoid white and burgundy, which are reserved for the couple.",
    wishes_kicker: "Wishes",
    wishes_title: "Curtain Call",
    wishes_intro: "Leave a wish, a prayer, or a memory for us to keep.",
    wishes_name_label: "Name",
    wishes_name_placeholder: "Your full name",
    wishes_message_label: "Message",
    wishes_message_placeholder: "Leave a wish for the couple",
    wishes_submit: "Send wishes",
    wishes_empty: "No wishes yet. Be the first.",
    closing_kicker: "Thank You",
    closing_message:
      "Thank you for being part of our story. Your presence, your prayers, and every warm wish you leave here mean more to us than we can say.",
    closing_see: "See you on opening night.",
  },
}

DEMO_PROPS_BY_CODE["silver-gelatin"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  // Aksaraa's own sample couple (dark-elegance set), never the reference's.
  // display_name is the editor/ops "Hashtag", rendered in the closing.
  display_name: "#AlbarnFaye2027",
  couple_initials: "A&A",
  estimated_wedding_date: "2027-06-26",
  guest_name: "The Reed Family",
  // Slot order is the editor's: Venue, Sampul, Gift, Dresscode.
  cover_photos: [`${DE}/cover-1.webp`, `${DE}/cover.webp`, `${DE}/cover-2.webp`, `${DE}/cover-6.webp`],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  gallery_photos: [
    `${DE}/cover-3.webp`, `${DE}/cover-4.webp`, `${DE}/cover-5.webp`, `${DE}/cover-6.webp`,
    `${DE}/cover.webp`, `${DE}/cover-1.webp`, `${DE}/cover-2.webp`, `${DE}/bride.webp`,
  ],
  sessions: [
    {
      name: "The Ceremony",
      date: "2027-06-26",
      time: "09.00 – 11.00",
      venue: "Kapel Santo Ignatius",
      address: "Jl. Cipete Raya No. 12, Jakarta Selatan",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "The Reception",
      date: "2027-06-26",
      time: "18.30 – 21.30",
      venue: "Grand Ballroom Lotus",
      address: "Jl. Gunung Sahari No. 7, Jakarta Utara",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "The First Frame",
      description:
        "We met over a borrowed camera and a roll of expired film. Neither of us could have known how much would develop from that afternoon.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "The Long Exposure",
      description:
        "Five years of quiet mornings, long drives and the same two cups of coffee. Somewhere in between, we stopped imagining a life apart.",
      image_url: `${DE}/cover-4.webp`,
    },
    {
      title: "The Next Chapter",
      description:
        "On a grey afternoon in June, we chose each other for good. Now we are asking you to be in the frame with us.",
      image_url: `${DE}/cover-5.webp`,
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "08.30", description: "Guests arrive at the chapel" },
    { time: "09.00", description: "The ceremony begins" },
    { time: "10.30", description: "Family photographs in the garden" },
    { time: "18.30", description: "The reception opens" },
    { time: "21.00", description: "Farewell" },
  ],
  dresscode_visible: true,
  dresscode: {
    title: "Ivory & Ink",
    description: "We would love to see you in tones of ivory, stone and soft black.",
    colors: [
      { hex: "#f4efe9", name: "Ivory" },
      { hex: "#d9d2c7", name: "Stone" },
      { hex: "#8c8578", name: "Ash" },
      { hex: "#111111", name: "Ink" },
    ],
  },
  template_content: {
    cover_kicker: "Dear",
    open_button: "Open Invitation",
    cover_apology: "We apologize for any misspelling of your name or title.",
    events_kicker: "The celebration will take place on",
    story_kicker: "Love story",
    gallery_kicker: "Wedding",
    mempelai_kicker: "The Couple",
    love_story_title: "Our Story",
    story_intro: "Three chapters, one long exposure.",
    events_title: "Venue",
    events_intro: "We look forward to welcoming you at:",
    events_note: "Please arrive fifteen minutes before the ceremony begins.",
    maps_label: "View Location",
    countdown_intro: "Counting down to our big day, only a little time left",
    inviting_kicker: "With the blessing of",
    inviting_title: "Our Families",
    inviting_intro:
      "With deep gratitude we also present the families who extend this invitation alongside us.",
    rundown_kicker: "The Programme",
    rundown_title: "Order of the Day",
    rundown_intro: "How the day will unfold, from the first arrival to the last farewell.",
    gallery_title: "Moments",
    gallery_intro: "Little snippets of our journey",
    video_title: "Our Film",
    video_intro: "The day as it happened, kept in motion.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Your blessings are the most beautiful gift to us. But should you wish to give a token of love, you may do so via:",
    gift_button: "Direct Transfer",
    gift_send_label: "Send Gift",
    gift_transfer_note: "Transfer directly to the account below:",
    gift_address_note: "Send your gift to the address below:",
    gift_signature: "With love and gratitude",
    copy_account_toast: "Account number copied",
    copy_address_toast: "Address copied",
    copy_address_button: "Copy address",
    dresscode_kicker: "Dresscode",
    dresscode_note: "Please avoid white and bright patterns.",
    wishes_title: "Wishes",
    wishes_intro: "Write your best prayers and wishes for us.",
    wishes_name_label: "Name",
    wishes_name_placeholder: "Your full name",
    wishes_message_label: "Message",
    wishes_message_placeholder: "Leave a wish for the couple",
    wishes_submit: "Send wishes",
    wishes_empty: "No wishes yet. Be the first.",
    closing_message:
      "Thank you for your prayers and presence. It is an honour for us to celebrate this day with you.",
    closing_see: "See you!",
  },
}

DEMO_PROPS_BY_CODE["film-roll"] = {
  ...DEMO_PROPS_BY_CODE.sandhya,
  slug: "demo",
  // Aksaraa's own sample couple (dark-elegance set), never the reference's.
  display_name: "#AlbarnFaye2027",
  couple_initials: "A&A",
  estimated_wedding_date: "2027-03-20",
  guest_name: "The Reed Family",
  cover_photos: [
    `${DE}/cover.webp`,
    `${DE}/cover-1.webp`,
    `${DE}/cover-2.webp`,
    `${DE}/cover-3.webp`,
    `${DE}/cover-4.webp`,
    `${DE}/cover-5.webp`,
    `${DE}/cover-6.webp`,
    `${DE}/groom.webp`,
    `${DE}/bride.webp`,
  ],
  groom_photo_url: [`${DE}/groom.webp`],
  bride_photo_url: [`${DE}/bride.webp`],
  gallery_photos: [
    `${DE}/cover-3.webp`,
    `${DE}/cover-4.webp`,
    `${DE}/cover-5.webp`,
    `${DE}/cover-6.webp`,
    `${DE}/cover-1.webp`,
    `${DE}/cover-2.webp`,
    `${DE}/bride.webp`,
    `${DE}/groom.webp`,
  ],
  opening_title: "Prologue",
  opening_description:
    "Before the credits roll and the lights come up, there was a first look, a first laugh, and a promise we kept rehearsing until it became a life.",
  quote_text: "Whatever our souls are made of, his and mine are the same.",
  quote_source: "Emily Brontë",
  sessions: [
    {
      name: "The Ceremony",
      date: "2027-03-20",
      time: "09.00 – 11.00",
      venue: "Kapel Santo Ignatius",
      address: "Jl. Cipete Raya No. 12, Jakarta Selatan",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
    {
      name: "The Reception",
      date: "2027-03-20",
      time: "18.30 – 21.30",
      venue: "Grand Ballroom Lotus",
      address: "Jl. Gunung Sahari No. 7, Jakarta Utara",
      maps_url: "https://maps.app.goo.gl/UPxWi9HU1w4A9R1j6",
    },
  ],
  stories: [
    {
      title: "The First Reel",
      description:
        "We met on a set neither of us was supposed to be on. One shared umbrella, one long wait between takes, and a conversation the director had to interrupt twice.",
      image_url: `${DE}/cover-3.webp`,
    },
    {
      title: "The Long Shoot",
      description:
        "Five years of early calls, late wraps and the same two cups of coffee. Somewhere between the outtakes we stopped imagining a life apart.",
      image_url: `${DE}/cover-4.webp`,
    },
    {
      title: "The Final Cut",
      description:
        "On a quiet morning in March we chose each other for good. Now we are asking you to be in the frame with us.",
      image_url: `${DE}/cover-5.webp`,
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "08.30", description: "Doors open, guests are seated" },
    { time: "09.00", description: "The ceremony begins" },
    { time: "10.30", description: "Portraits in the garden" },
    { time: "18.30", description: "The reception opens" },
    { time: "21.00", description: "Last dance and farewell" },
  ],
  dresscode_visible: true,
  dresscode: {
    title: "Black Tie, Warm Neutrals",
    description: "We would love to see you in ivory, stone and soft black, our palette for the evening.",
    colors: [
      { hex: "#faf7ef", name: "Ivory" },
      { hex: "#d6d3cc", name: "Stone" },
      { hex: "#8c8578", name: "Ash" },
      { hex: "#111111", name: "Ink" },
    ],
  },
  template_content: {
    cover_kicker: "The Wedding of",
    cover_title: "The Wedding of",
    open_button: "Enter",
    cover_apology: "Dear",
    opening_kicker: "Prologue",
    welcome_message:
      "Before the credits roll and the lights come up, there was a first look, a first laugh, and a promise we kept rehearsing until it became a life.",
    mempelai_kicker: "Starring",
    parents_label: "With the blessing of",
    story_kicker: "Scene",
    love_story_title: "Our Story",
    story_intro: "Three scenes that brought us to the same frame.",
    events_kicker: "Save the Date",
    events_title: "The Celebration",
    events_intro: "We would be honoured to have you with us as we say our vows.",
    events_note: "Save to calendar",
    maps_label: "Open Map",
    rundown_kicker: "The Programme",
    rundown_title: "Order of the Day",
    rundown_intro: "How the day will unfold, from the first arrival to the last farewell.",
    gallery_kicker: "Stills",
    gallery_title: "Precious Moments",
    gallery_quote: "Every love story is beautiful, but ours is our favourite.",
    video_kicker: "Action!",
    video_title: "Trailer",
    video_intro: "The day as it happened, kept in motion.",
    gift_kicker: "With Love",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Your blessings are the most beautiful gift to us. Should you wish to give a token of love, you may do so here.",
    gift_signature: "With love and gratitude",
    copy_account_toast: "Account number copied",
    copy_address_toast: "Address copied",
    copy_address_button: "Copy address",
    dresscode_kicker: "Dresscode",
    dresscode_note: "Please avoid white and bright patterns.",
    wishes_kicker: "Prayers & Wishes",
    wishes_title: "Wishes",
    wishes_intro: "Write your best prayers and wishes for us.",
    wishes_name_label: "Name",
    wishes_name_placeholder: "Your full name",
    wishes_message_label: "Message",
    wishes_message_placeholder: "Leave a wish for the couple",
    wishes_submit: "Send wishes",
    wishes_empty: "No wishes yet. Be the first.",
    inviting_kicker: "Also inviting",
    closing_kicker: "Thank You",
    closing_message:
      "It is an honour and a happiness for us to have you with us on our wedding day. Thank you for your prayers and your presence.",
    closing_see: "See you at the pictures.",
  },
}

DEMO_PROPS_BY_CODE["love-line"] = {
  ...DEMO_PROPS_BY_CODE["sandhya"],
  slug: "demo",
  display_name: "#AlbarnFaye2028",
  couple_initials: "A&A",
  groom_name: "Albarn",
  bride_name: "Faye",
  groom_full_name: "David Albarn",
  bride_full_name: "Faye Ashcroft",
  estimated_wedding_date: "2028-02-28",
  guest_name: "The Reed Family",
  groom_parents: "Bapak Bambang Prakoso & Ibu Sri Lestari",
  bride_parents: "Bapak Hadi Anindito & Ibu Ratna Sari",
  groom_instagram: "@david.albarn",
  bride_instagram: "@faye.ashcroft",
  opening_title: "",
  opening_description:
    "By the grace of God, we are getting married. Your presence and prayers will make the day so much happier.",
  quote_text:
    "And among His signs, He created for you spouses so that you may find tranquillity.",
  quote_source: "QS. Ar-Rum: 21",
  sessions: [
    {
      name: "Solemnisation",
      date: "2028-02-28",
      time: "15:00",
      venue: "Villa Mawar",
      address: "Jl. Bukit Indah No. 8, Bogor",
      maps_url: "https://maps.app.goo.gl/9bRvrJZZ1xcZSoqa6",
    },
  ],
  stories: [
    {
      title: "First met",
      description:
        "It began with a quick chat at a coffee shop, and we clicked so well that we lost track of time.",
    },
    {
      title: "Hanging out",
      description:
        "Rain, traffic jams and an umbrella far too small. It's all funny when you go through it together.",
    },
    {
      title: "Engagement",
      description: "One simple question, and the fastest answer ever given: yes.",
    },
    {
      title: "Towards halal",
      description:
        "Now we're ready to begin a new chapter, and you'll be there to witness it.",
    },
  ],
  rundown_visible: true,
  rundown: [
    { time: "15:00", description: "Solemnisation" },
    { time: "16:00", description: "Meet and greet" },
    { time: "18:00", description: "Dinner" },
    { time: "19:30", description: "Dance party" },
  ],
  dresscode_visible: true,
  dresscode: {
    title: "Dress Code",
    description:
      "Your presence is the greatest gift, but we'd love it if you dressed in our colour palette.",
    colors: [
      { hex: "#1B1B1B", name: "Ink" },
      { hex: "#6F7B5F", name: "Olive" },
      { hex: "#C9B99A", name: "Sand" },
      { hex: "#EFE5D6", name: "Cream" },
      { hex: "#B05A4F", name: "Terracotta" },
    ],
  },
  gift_accounts: [
    {
      provider_name: "BCA",
      account_number: "0660580697",
      account_name: "a/n Faye Ashcroft",
      type: "bank",
    },
    {
      provider_name: "Bank Central Asia (BCA)",
      account_number: "12132131231",
      account_name: "a/n David Albarn",
      type: "bank",
    },
  ],
  gift_address_name: "Albarn & Faye",
  gift_address: "Jl. Bukit Indah No. 8, Bogor, Jawa Barat 16143",
  inviting_families: [
    "Keluarga Besar Bapak Bambang Prakoso & Ibu Sri Lestari",
    "Keluarga Besar Bapak Hadi Anindito & Ibu Ratna Sari",
    "Sahabat serta kerabat Albarn & Faye",
  ],
  template_content: {
    ...DEMO_PROPS_BY_CODE["sandhya"].template_content,
    cover_apology: "We apologize for any misspelling of your name or title.",
    cover_kicker: "you're invited to our wedding",
    cover_guest_label: "Dear honoured guest",
    open_button: "Open Invitation",
    opening_kicker: "with grateful hearts",
    mempelai_kicker: "two people, one story",
    mempelai_title: "The Couple",
    person_one_label: "the one",
    person_two_label: "the beauty",
    parents_label_male: "son of",
    parents_label_female: "daughter of",
    story_kicker: "our journey",
    love_story_title: "Story",
    story_intro: "",
    events_kicker: "details of our big day",
    events_title: "Date & Venue",
    events_intro: "",
    maps_label: "Open Map",
    countdown_intro: "counting down",
    inviting_kicker: "with honour",
    inviting_title: "Turut Mengundang",
    inviting_intro: "",
    rundown_kicker: "programme",
    rundown_title: "Schedule",
    rundown_intro: "",
    gallery_kicker: "our moments",
    gallery_title: "Gallery",
    video_title: "Wedding Film",
    video_intro: "The day as it happened, kept in motion.",
    gift_intro_title: "Wedding Gift",
    gift_intro_description:
      "Your blessings are more than enough. If you'd like to give more, we'll receive it with deep gratitude.",
    gift_button: "Direct Transfer",
    gift_send_label: "Send Gift",
    gift_transfer_note: "Transfer directly to the account below:",
    gift_address_note: "Send your gift to the address below:",
    dresscode_kicker: "Dress Code",
    dresscode_intro:
      "Your presence is the greatest gift, but we'd love it if you dressed in our colour palette.",
    wishes_title: "Prayers & Wishes",
    wishes_intro: "Leave your best prayers and wishes for us.",
    wishes_name_label: "Your name",
    wishes_name_placeholder: "Your full name",
    wishes_message_label: "Your wish",
    wishes_message_placeholder: "ex. congrats for this event",
    wishes_submit: "Submit now",
    wishes_empty: "No wishes yet. Be the first.",
    copy_account_toast: "Account number copied",
    copy_address_toast: "Address copied",
    closing_message:
      "Thank you for being part of our story. See you on the big day!",
  },
}

// Ceriavite (kids) demo. One name, one parent line, "Walimatul Khitan" copy —
// the same props the `?event=` registration flow writes for a khitanan profile.
// Sample names/photos are Aksaraa's own; never the reference couple's.
DEMO_PROPS_BY_CODE["songket-marun"] = {
  slug: "demo",
  groom_name: "Raka",
  groom_full_name: "Raka Pratama",
  estimated_wedding_date: "2026-12-20",
  guest_name: "Tamu Undangan",
  cover_photos: [ASSETS.defaults.couple, ASSETS.defaults.couple, ASSETS.defaults.couple],
  couple_illustration_url: ASSETS.defaults.couple,
  groom_photo_url: [ASSETS.defaults.groom],
  groom_parents: "Bapak Hendra Pratama & Ibu Sari Dewi",
  opening_title: "Bismillahirrahmanirrahim",
  opening_description:
    "Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan walimatul khitan putra kami tercinta. Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.",
  quote_text:
    "Ya Tuhanku, anugerahkanlah kepadaku (seorang anak) yang termasuk orang-orang yang saleh.",
  quote_source: "QS. Ash-Shaffat: 100",
  sessions: [
    {
      name: "Walimatul Khitan",
      date: "2026-12-20",
      time: "10:00-14:00 WIB",
      venue: "Kediaman Bapak Hendra Pratama",
      address: "Jl. Melati No. 12, Medan Kota, Sumatera Utara",
      maps_url: "https://maps.google.com/?q=Medan",
    },
  ],
  gallery_photos: ASSETS.defaultGallery.slice(0, 6),
  gift_accounts: [
    { provider_name: "Bank Mandiri", account_number: "1234567890", account_name: "Hendra Pratama", type: "bank" },
  ],
  gift_address: "Jl. Melati No. 12, Medan Kota, Sumatera Utara",
  gift_address_name: "Hendra Pratama",
  gift_section_visible: true,
  event_type: "khitanan",
  subject_gender: "putra",
  event_labels: eventLabels("khitanan", "putra"),
  feature_gates: {
    story: false,
    gift_address: true,
    inviting_families: false,
    video: false,
    qr_code_book: false,
  },
  template_content: {
    closing_message:
      "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu. Atas kehadiran dan doanya kami ucapkan terima kasih.",
  },
}
