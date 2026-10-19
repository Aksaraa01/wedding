import type { TemplateProps } from "@/types/template"

// Per-template demo fixtures. Falls back to the generic DEMO_PROPS in
// /templates/[code]/preview when a code isn't listed here.
//
// `dark-split-rail` showcases the design with the real "Vincent & Felicia"
// couple already provisioned in production (read-only — no prod data is
// touched). Photos/track are public storage URLs from their profile.
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
    feature_gates: { story: true, gift_address: true, inviting_families: true, video: true, qr_code_book: true },
  },
}
