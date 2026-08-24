export type TourStep = {
  id: number
  title: string
  description: string
  target: string
  targetMobile?: string
  route: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Edit Undangan Web",
    description: "Mulailah perjalanan Anda di sini. Koleksi undangan web premium kami dirancang dengan estetika quiet luxury — setiap detail mencerminkan keanggunan yang abadi.",
    target: "[data-tour='premium-web']",
    route: "dashboard",
  },
  {
    id: 2,
    title: "Lihat Pilihan Tema",
    description: "Jelajahi kurasi eksklusif kami. Setiap tema adalah mahakarya editorial yang dirancang untuk merayakan kisah cinta Anda dengan kemewahan yang tenang.",
    target: "[data-tour='ganti-tema']",
    route: "editor",
  },
  {
    id: 3,
    title: "Pratinjau Tema",
    description: "Sentuh untuk merasakan kehalusan setiap detail. Pratinjau interaktif memungkinkan Anda menelusuri setiap lekuk desain sebelum menentukan pilihan.",
    target: "[data-tour='template-preview']",
    route: "templates",
  },
  {
    id: 4,
    title: "Pilih Koleksi Ini",
    description: "Ketika hati telah memilih, konfirmasikan koleksi yang paling selaras dengan visi hari bahagia Anda.",
    target: "[data-tour='pilih-koleksi']",
    route: "templates",
  },
  {
    id: 5,
    title: "Lengkapi Konten",
    description: "Sempurnakan narasi Anda. Isi setiap detail pernikahan — dari sampul hingga kisah cinta — untuk undangan yang benar-benar personal.",
    target: "[data-tour='konten']",
    targetMobile: "[data-tour='konten-mobile']",
    route: "editor",
  },
  {
    id: 6,
    title: "Perbarui Undangan",
    description: "Setiap pembaruan Anda simpan dengan presisi. Pastikan setiap sentuhan tersimpan sempurna sebelum melangkah ke konfirmasi akhir.",
    target: "[data-tour='perbarui']",
    targetMobile: "[data-tour='perbarui']",
    route: "editor",
  },
  {
    id: 7,
    title: "Konfirmasi Akhir",
    description: "Tinjauan terakhir sebelum karya Anda diproses. Pastikan setiap aksara telah terukir dengan sempurna untuk hari yang dinanti.",
    target: "[data-tour='konfirmasi']",
    targetMobile: "[data-tour='konfirmasi']",
    route: "editor",
  },
  {
    id: 8,
    title: "Umpan Balik Tambahan",
    description: "Ruang khusus untuk permintaan istimewa Anda. Bagikan visi bespoke agar tim kurator kami dapat menyempurnakan undangan sesuai impian Anda.",
    target: "[data-tour='feedback']",
    targetMobile: "[data-tour='feedback']",
    route: "editor",
  },
]
