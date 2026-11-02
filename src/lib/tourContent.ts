export type TourStep = {
  id: number
  title: string
  description: string
  target: string
  targetMobile?: string
  route: string
  // Optional gate: step is skipped when the package selection lacks this feature.
  feature?: "premium_web" | "unique_link_generator" | "reservation_automation" | "wish_wall" | "qr_code_book"
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Lihat Undangan",
    description: "Ketuk Lihat Undangan untuk melihat hasil undangan web Anda secara langsung, di HP maupun laptop. Tampilannya otomatis menyesuaikan kedua perangkat.",
    target: "[data-tour='lihat-undangan']",
    route: "dashboard",
    feature: "premium_web",
  },
  {
    id: 2,
    title: "Pilih Tema",
    description: "Temukan berbagai pilihan tema yang telah kami pilih khusus untuk Anda. Setiap tema dirancang dengan tampilan elegan, sederhana, dan berkelas untuk membuat momen spesial Anda semakin berkesan.",
    target: "[data-tour='ganti-tema']",
    route: "editor",
    feature: "premium_web",
  },
  {
    id: 3,
    title: "Pratinjau Tema",
    description: "Ketuk untuk melihat tampilan tema secara langsung. Dengan pratinjau interaktif, Anda bisa melihat dan menjelajahi setiap detail desain sebelum memilih tema yang Anda suka.",
    target: "[data-tour='template-preview']",
    route: "templates",
    feature: "premium_web",
  },
  {
    id: 4,
    title: "Pilih Tema",
    description: "Ketika hati telah memilih, konfirmasikan koleksi yang paling selaras dengan visi hari bahagia Anda.",
    target: "[data-tour='pilih-koleksi']",
    route: "templates",
    feature: "premium_web",
  },
  {
    id: 5,
    title: "Lengkapi Konten",
    description: "Lengkapi informasi pernikahan Anda, mulai dari nama, tanggal, lokasi, hingga kisah cinta. Isi setiap detail agar undangan terasa lebih personal dan sesuai dengan cerita Anda",
    target: "[data-tour='konten']",
    targetMobile: "[data-tour='konten']",
    route: "editor",
    feature: "premium_web",
  },
  {
    id: 6,
    title: "Perbarui Undangan",
    description: "Periksa kembali setiap informasi yang sudah Anda isi. Pastikan semua perubahan tersimpan dengan baik sebelum melanjutkan ke tahap konfirmasi akhir.",
    target: "[data-tour='perbarui']",
    targetMobile: "[data-tour='perbarui']",
    route: "editor",
    feature: "premium_web",
  },
  {
    id: 7,
    title: "Konfirmasi Akhir",
    description: "Periksa kembali semua informasi sebelum undangan diproses. Pastikan nama, tanggal, lokasi, dan detail lainnya sudah benar agar undangan siap digunakan untuk hari spesial Anda.",
    target: "[data-tour='konfirmasi']",
    targetMobile: "[data-tour='konfirmasi']",
    route: "editor",
    feature: "premium_web",
  },
  {
    id: 8,
    title: "Umpan Balik Tambahan",
    description: "Punya permintaan atau keinginan khusus? Sampaikan kepada kami agar tim dapat menyesuaikan undangan sesuai dengan kebutuhan dan impian Anda.",
    target: "[data-tour='feedback']",
    targetMobile: "[data-tour='feedback']",
    route: "editor",
    feature: "premium_web",
  },
  {
    id: 9,
    title: "Ambil Tautan di Undangan Tamu",
    description: "Setelah undangan dikonfirmasi, ketuk tombol Undangan Tamu di bagian atas. Di sinilah tautan personal setiap tamu dibuat dan siap dibagikan.",
    target: "[data-tour='undangan-tamu']",
    route: "dashboard",
    feature: "unique_link_generator",
  },
  {
    id: 10,
    title: "Pilih Tipe Tautan: Terbatas / Fleksibel",
    description: "Pilih Terbatas jika hanya tamu terdaftar yang boleh membuka undangan, atau Fleksibel jika satu tautan umum boleh dibuka siapa pun dengan nama apa pun.",
    target: "[data-tour='link-mode']",
    route: "qr-guestbook",
    feature: "unique_link_generator",
  },
  {
    id: 11,
    title: "Atur Template Pesan Undangan",
    description: "Pilih dan sesuaikan Template Pesan Undangan sesuai gaya bahasa Anda. Template ini terkirim bersama tautan ke setiap tamu, tinggal salin dan bagikan via WhatsApp.",
    target: "[data-tour='template-pesan']",
    route: "qr-guestbook",
    feature: "unique_link_generator",
  },
  {
    id: 12,
    title: "Tambah Tamu dari Sini",
    description: "Ketuk Tambah Tamu untuk menambah tamu. Anda akan diarahkan ke halaman daftar tamu, isi nama, nomor WhatsApp, dan meja, maka tautan undangannya langsung aktif.",
    target: "[data-tour='tambah-tamu']",
    route: "qr-guestbook",
    feature: "unique_link_generator",
  },
  {
    id: 13,
    title: "Tambah Tamu Manual",
    description: "Gunakan Tambah / Tambah Tamu untuk mengisi tamu satu per satu. Cocok untuk tamu penting yang datanya dilengkapi manual.",
    target: "[data-tour='tambah-tamu-manual']",
    route: "guests",
  },
  {
    id: 14,
    title: "Import Excel untuk Tamu Banyak",
    description: "Punya daftar tamu dalam jumlah besar? Ketuk Import Excel untuk mengunggah semuanya sekaligus memakai template .xlsx. Cepat, tanpa input manual satu per satu.",
    target: "[data-tour='import-excel']",
    route: "guests",
  },
  {
    id: 15,
    title: "Pantau Reservasi Tamu",
    description: "Di Reservasi Tamu, pantau siapa yang sudah membuka undangan dan konfirmasi hadir secara real-time. Estimasi pax membantu persiapan katering dan kursi.",
    target: "[data-tour='reservasi']",
    route: "reservation-automation",
    feature: "reservation_automation",
  },
  {
    id: 16,
    title: "Kelola Doa & Harapan Tamu",
    description: "Semua ucapan dan doa tamu terkumpul di Doa & Harapan Tamu. Saring pesan dari dasbor moderasi, lalu tampilkan yang terbaik di layar acara.",
    target: "[data-tour='wish-wall']",
    route: "wish-wall",
    feature: "wish_wall",
  },
  {
    id: 17,
    title: "Sambut dengan Buku Tamu Digital",
    description: "Pada hari-H, buka Buku Tamu Digital. Usher cukup memindai QR tamu dari HP, kehadiran tercatat otomatis, tanpa alat tambahan.",
    target: "[data-tour='buku-tamu']",
    route: "qr-live",
    feature: "qr_code_book",
  },
  {
    id: 18,
    title: "Tahapan Lainnya",
    description: "Temukan informasi lainnya untuk membantu anda sampai hari bahagia Anda",
    target: "[data-tour='cara-memulai']",
    route: "dashboard",
  },
]
