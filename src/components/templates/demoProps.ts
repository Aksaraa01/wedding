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
      cover_apology: "We sincerely apologize for any misspelling of names and titles.",
      groom_child_order: "The Second Son of",
      bride_child_order: "The Daughter of",
      gallery_quote: "Every love story is beautiful, but ours is my favorite.",
      gift_intro_title: "A Token of Love",
      gift_intro_description:
        "Your presence is the greatest gift. If you would like to send a token of love, the details are below.",
      closing_message:
        "It would be an honor and a joy for us to have you present and to receive your blessing on our wedding day.",
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
      cover_kicker: "This Kids are\nGetting Married",
      profiles_intro: "Two hearts, one playlist, and zero agreement on what to eat.",
      story_intro: "From a chance meeting to a lifetime of choosing each other.",
      gallery_intro:
        "A handful of frames from the chapters we have lived together, kept like old photographs in a family album.",
      gallery_quote: "Somewhere between the first hello and every tomorrow, we found our forever.",
      gift_intro_title: "Wedding Gift",
      gift_intro_description:
        "Your presence is the greatest gift. If you would like to send a token of love, you can find the details below.",
      wishes_intro: "Leave a few kind words and prayers for the couple.",
      closing_message:
        "It would be an honour to share this day with you, and to keep writing our story surrounded by the people we love.",
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
        image_url: `${DE}/cover.webp`,
      },
      {
        title: "Toward Forever",
        description:
          "After many chapters together, we chose to walk hand in hand. Today we invite you to be part of the beginning of our journey.",
        image_url: `${DE}/cover-1.webp`,
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
      cover_apology: "We sincerely apologize for any misspelling of names and titles.",
      groom_child_order: "The Second Son of",
      bride_child_order: "The Daughter of",
      gallery_quote: "Every love story is beautiful, but ours is my favorite.",
      gift_intro_title: "A Token of Love",
      gift_intro_description:
        "Your presence is the greatest gift. If you would like to send a token of love, the details are below.",
      closing_message:
        "It would be an honor and a joy for us to have you present and to receive your blessing on our wedding day.",
    },
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
}
