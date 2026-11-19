// Knowledge base CS: fakta produk yang boleh dijawab agent tanpa tool.
//
// Aturan penulisan:
// - TIDAK ada nominal harga, nomor HP, atau janji tanggal. Harga hanya dari tool.
// - Satu chunk = satu topik; heading dipakai untuk sitasi.
// - Kalau topiknya wewenang ops (voucher, refund, ubah tanggal), jangan
//   dijawab di sini: biarkan policy yang mengeskalasi (lihat docs/CS_SOP.md).

export type CsKnowledgeEntry = {
  key: string
  title: string
  url: string
  chunks: { heading: string; content: string }[]
}

export const CS_KNOWLEDGE: CsKnowledgeEntry[] = [
  {
    key: "cara-daftar",
    title: "Cara daftar undangan digital",
    url: "https://wedding.aksaraa.com/register",
    chunks: [
      {
        heading: "Alur pendaftaran",
        content:
          "Daftar lewat halaman registrasi, pilih template, lalu isi data mempelai dan acara. Setelah pembayaran terverifikasi, undangan bisa diisi sendiri dari dashboard atau dibantu tim.",
      },
      {
        heading: "Yang perlu disiapkan",
        content:
          "Nama panggilan kedua mempelai, tanggal acara, lokasi akad dan resepsi, foto, serta nomor WhatsApp aktif. Nama panggilan dipakai untuk alamat undangan, jadi pilih yang mudah diingat.",
      },
    ],
  },
  {
    key: "pilih-template",
    title: "Memilih dan mengganti template",
    url: "https://wedding.aksaraa.com/templates",
    chunks: [
      {
        heading: "Ganti template",
        content:
          "Template bisa diganti dari dashboard tanpa mengulang data yang sudah diisi. Data mempelai, acara, dan tamu ikut pindah ke template baru.",
      },
      {
        heading: "Preview sebelum memilih",
        content:
          "Setiap template punya pratinjau langsung di galeri template, termasuk versi tanpa foto. Tamu membuka undangan dari HP, jadi selalu cek pratinjau di layar ponsel.",
      },
    ],
  },
  {
    key: "isi-data",
    title: "Mengisi data undangan",
    url: "https://wedding.aksaraa.com/fitur/undangan-digital",
    chunks: [
      {
        heading: "Isi sendiri atau dibantu tim",
        content:
          "Kalau data diisi sendiri, undangan selesai dalam hitungan menit setelah data lengkap. Kalau dibantu tim, waktunya menyesuaikan antrian pengerjaan dan tim mengabari perkiraan selesainya.",
      },
      {
        heading: "Bagian yang bisa diisi",
        content:
          "Data mempelai, jadwal akad dan resepsi, lokasi dengan peta, love story, galeri foto, musik, rekening atau alamat hadiah, serta kutipan ayat atau doa.",
      },
    ],
  },
  {
    key: "publish-link",
    title: "Menerbitkan undangan dan link tamu",
    url: "https://wedding.aksaraa.com/fitur/link-unik",
    chunks: [
      {
        heading: "Alamat undangan",
        content:
          "Setiap pasangan mendapat alamat undangan sendiri berbentuk subdomain, misalnya namapasangan.wedding.aksaraa.com. Alamat ini dibuat sekali saat pendaftaran dan tidak berubah walau nama di undangan diedit.",
      },
      {
        heading: "Link unik per tamu",
        content:
          "Undangan bisa dibagikan dengan link umum atau link unik per tamu yang menampilkan nama tamu di halaman pembuka. Link unik dibuat dari daftar tamu di dashboard.",
      },
    ],
  },
  {
    key: "revisi",
    title: "Revisi undangan setelah terbit",
    url: "https://wedding.aksaraa.com/fitur/undangan-digital",
    chunks: [
      {
        heading: "Edit kapan saja",
        content:
          "Setelah undangan terbit, data masih bisa diedit dari dashboard dan perubahan langsung terlihat oleh tamu. Tidak perlu membuat ulang undangan atau link baru.",
      },
    ],
  },
  {
    key: "rsvp",
    title: "RSVP dan konfirmasi kehadiran",
    url: "https://wedding.aksaraa.com/fitur/rsvp-otomatis",
    chunks: [
      {
        heading: "Cara kerja RSVP",
        content:
          "Tamu mengonfirmasi kehadiran langsung dari undangan. Jawaban masuk ke dashboard secara real-time, lengkap dengan jumlah orang yang hadir, sehingga jumlah kursi dan konsumsi bisa dihitung.",
      },
    ],
  },
  {
    key: "buku-tamu-qr",
    title: "Buku tamu digital dengan QR",
    url: "https://wedding.aksaraa.com/qr-digital-buku-tamu",
    chunks: [
      {
        heading: "Check-in tamu",
        content:
          "Petugas memindai QR tamu dari HP atau tablet. Kehadiran tercatat otomatis, tamu tanpa QR bisa dicari dari daftar nama, dan rekap kehadiran bisa dilihat langsung dari dashboard.",
      },
    ],
  },
  {
    key: "galeri-tamu",
    title: "Galeri foto dari tamu",
    url: "https://wedding.aksaraa.com/galeri-kenangan-tamu",
    chunks: [
      {
        heading: "Foto dan selfie tamu",
        content:
          "Tamu bisa mengunggah foto ke galeri undangan, termasuk mode kamera langsung dari HP. Foto terkumpul di dashboard dan bisa diunduh setelah acara.",
      },
    ],
  },
  {
    key: "wish-wall",
    title: "Doa dan harapan tamu",
    url: "https://wedding.aksaraa.com/virtual-wish-wall",
    chunks: [
      {
        heading: "Ucapan tamu",
        content:
          "Tamu dapat menulis doa dan harapan dari undangan. Ucapan tampil di halaman wish wall dan tersimpan di dashboard sebagai kenangan setelah acara.",
      },
    ],
  },
  {
    key: "reminder-vip",
    title: "Reminder WhatsApp untuk tamu VIP",
    url: "https://wedding.aksaraa.com/reminder-tamu-vip",
    chunks: [
      {
        heading: "Pengingat otomatis",
        content:
          "Reminder WhatsApp membantu mengingatkan tamu VIP dan tamu yang belum mengonfirmasi kehadiran. Pengingat dijadwalkan dari dashboard dan dikirim ke nomor tamu yang tersimpan.",
      },
    ],
  },
  {
    key: "amplop-digital",
    title: "Amplop digital dan hadiah",
    url: "https://wedding.aksaraa.com/fitur/amplop-digital",
    chunks: [
      {
        heading: "Hadiah tanpa amplop fisik",
        content:
          "Tamu dapat mengirim tanda kasih lewat transfer bank atau e-wallet dari dalam undangan. Rekening dan alamat pengiriman hadiah diatur sendiri oleh pasangan di dashboard.",
      },
    ],
  },
  {
    key: "wa-blast",
    title: "WA blast undangan",
    url: "https://wedding.aksaraa.com/fitur/reminder-wa",
    chunks: [
      {
        heading: "Kirim undangan massal",
        content:
          "WA blast mengirim undangan ke banyak tamu sekaligus dengan nama tamu yang berbeda-beda. Kapasitas tambahan dibeli terpisah dari paket, dan sisa kapasitas terlihat di dashboard.",
      },
    ],
  },
  {
    key: "express",
    title: "Pengerjaan express",
    url: "https://wedding.aksaraa.com/premium-web-invitation",
    chunks: [
      {
        heading: "Pengerjaan dipercepat",
        content:
          "Express adalah add-on untuk mempercepat pengerjaan saat dibantu tim. Add-on ini tidak termasuk dalam harga paket dan dipilih terpisah saat pemesanan.",
      },
    ],
  },
  {
    key: "undangan-cetak",
    title: "Undangan cetak atau fisik",
    url: "https://wedding.aksaraa.com/fitur/undangan-digital",
    chunks: [
      {
        heading: "Hanya undangan digital",
        content:
          "Aksaraa hanya menyediakan undangan digital berbentuk website. Tidak ada undangan cetak atau fisik, termasuk kartu dan amplop kertas.",
      },
    ],
  },
  {
    key: "musik",
    title: "Musik latar undangan",
    url: "https://wedding.aksaraa.com/fitur/undangan-digital",
    chunks: [
      {
        heading: "Lagu latar",
        content:
          "Undangan bisa memutar musik latar yang dipilih dari daftar lagu yang tersedia. Musik baru diputar setelah tamu membuka undangan, jadi tidak membebani halaman pembuka.",
      },
    ],
  },
  {
    key: "status",
    title: "Mengecek status undangan",
    url: "https://wedding.aksaraa.com/dashboard",
    chunks: [
      {
        heading: "Progres pengerjaan",
        content:
          "Status undangan, kelengkapan data, dan status pembayaran terlihat di dashboard. Kalau pengerjaan dibantu tim, progres mengikuti antrian pengerjaan.",
      },
    ],
  },
  {
    key: "ceriavite",
    title: "Ceriavite — undangan acara anak",
    url: "https://ceriavite.aksaraa.com",
    chunks: [
      {
        heading: "Apa itu Ceriavite",
        content:
          "Ceriavite adalah produk undangan digital Aksaraa untuk khitanan, aqiqah, dan ulang tahun. Pendaftaran dan galeri desainnya ada di ceriavite.aksaraa.com, bukan di halaman pernikahan.",
      },
      {
        heading: "Fitur Ceriavite",
        content:
          "Ceriavite mencakup website undangan premium, RSVP, kolom ucapan dan doa, tautan unik per tamu, serta kolom transfer dan alamat hadiah. Ceriavite tidak memiliki kisah cinta dan video sinematik seperti paket pernikahan.",
      },
      {
        heading: "Alamat undangan Ceriavite",
        content:
          "Undangan Ceriavite tetap memakai alamat {nama}.wedding.aksaraa.com, dan datanya diisi dari dashboard yang sama setelah pendaftaran di ceriavite.aksaraa.com/daftar.",
      },
    ],
  },
  {
    key: "voucher",
    title: "Voucher dan kode promo",
    url: "https://wedding.aksaraa.com/premium-web-invitation",
    chunks: [
      {
        heading: "Pemeriksaan voucher oleh tim",
        content:
          "Voucher dan kode promo diperiksa langsung oleh tim. Agent tidak menyebut kode, nominal potongan, atau sisa kuota, dan tidak menjanjikan kode bisa dipakai.",
      },
    ],
  },
  {
    key: "refund",
    title: "Pembatalan dan perubahan tanggal",
    url: "https://wedding.aksaraa.com/premium-web-invitation",
    chunks: [
      {
        heading: "Wewenang tim",
        content:
          "Pembatalan, refund, dan perubahan tanggal acara ditangani tim, bukan agent. Siapkan nama pemesan dan nomor pesanan supaya tim bisa langsung memeriksa.",
      },
    ],
  },
]
