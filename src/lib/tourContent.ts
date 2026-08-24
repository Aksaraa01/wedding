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
    description: "Mulai perjalanan Anda di sini. Temukan koleksi undangan web premium dengan desain terbaik dan ubah sesuai dengan pernikahan Anda",
    target: "[data-tour='premium-web']",
    route: "dashboard",
  },
  {
    id: 2,
    title: "Pilih Tema",
    description: "Temukan berbagai pilihan tema yang telah kami pilih khusus untuk Anda. Setiap tema dirancang dengan tampilan elegan, sederhana, dan berkelas untuk membuat momen spesial Anda semakin berkesan.",
    target: "[data-tour='ganti-tema']",
    route: "editor",
  },
  {
    id: 3,
    title: "Pratinjau Tema",
    description: "Ketuk untuk melihat tampilan tema secara langsung. Dengan pratinjau interaktif, Anda bisa melihat dan menjelajahi setiap detail desain sebelum memilih tema yang Anda suka.",
    target: "[data-tour='template-preview']",
    route: "templates",
  },
  {
    id: 4,
    title: "Pilih Tema",
    description: "Ketika hati telah memilih, konfirmasikan koleksi yang paling selaras dengan visi hari bahagia Anda.",
    target: "[data-tour='pilih-koleksi']",
    route: "templates",
  },
  {
    id: 5,
    title: "Lengkapi Konten",
    description: "Lengkapi informasi pernikahan Anda, mulai dari nama, tanggal, lokasi, hingga kisah cinta. Isi setiap detail agar undangan terasa lebih personal dan sesuai dengan cerita Anda",
    target: "[data-tour='konten']",
    targetMobile: "[data-tour='konten-mobile']",
    route: "editor",
  },
  {
    id: 6,
    title: "Perbarui Undangan",
    description: "Periksa kembali setiap informasi yang sudah Anda isi. Pastikan semua perubahan tersimpan dengan baik sebelum melanjutkan ke tahap konfirmasi akhir.",
    target: "[data-tour='perbarui']",
    targetMobile: "[data-tour='perbarui']",
    route: "editor",
  },
  {
    id: 7,
    title: "Konfirmasi Akhir",
    description: "Periksa kembali semua informasi sebelum undangan diproses. Pastikan nama, tanggal, lokasi, dan detail lainnya sudah benar agar undangan siap digunakan untuk hari spesial Anda.",
    target: "[data-tour='konfirmasi']",
    targetMobile: "[data-tour='konfirmasi']",
    route: "editor",
  },
  {
    id: 8,
    title: "Umpan Balik Tambahan",
    description: "Punya permintaan atau keinginan khusus? Sampaikan kepada kami agar tim dapat menyesuaikan undangan sesuai dengan kebutuhan dan impian Anda.",
    target: "[data-tour='feedback']",
    targetMobile: "[data-tour='feedback']",
    route: "editor",
  },
  {
    id: 9,
    title: "Tahapan Lainnya",
    description: "Temukan informasi lainnya untuk membantu anda sampai hari bahagia Anda",
    target: "[data-tour='cara-memulai']",
    route: "dashboard",
  },
]
