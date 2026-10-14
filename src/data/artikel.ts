// Editorial content for /artikel — file-based (no DB), version-controlled.
// Body is author-controlled HTML (no user input): rendered as-is, and
// stripped to plain text for JSON-LD. Links use absolute paths.

export type Article = {
  slug: string
  title: string
  description: string
  category: string
  date: string
  readMinutes: number
  body: string
}

export const ARTICLES: Article[] = [
  {
    slug: "cara-membuat-undangan-pernikahan-digital",
    title: "Cara Membuat Undangan Pernikahan Digital dalam 15 Menit",
    description:
      "Panduan lengkap membuat undangan website pernikahan: pilih template, isi data mempelai dan acara, bagikan link WhatsApp, pantau RSVP.",
    category: "Panduan",
    date: "2026-10-14",
    readMinutes: 6,
    body: `
<p>Membuat <strong>undangan pernikahan digital</strong> kini semudah mengisi formulir. Tidak perlu jasa desain, tidak perlu cetak — dalam 15 menit undangan website Anda siap dibagikan lewat WhatsApp.</p>
<h2>1. Pilih template yang sesuai tema</h2>
<p>Mulai dari <a href="/templates">galeri template undangan pernikahan digital</a>: adat, modern minimalis, floral, elegansi dark, hingga tanpa foto. Setiap template sudah mobile-friendly dan bisa diganti kapan saja tanpa mengulang data.</p>
<h2>2. Isi data mempelai dan acara</h2>
<p>Lengkapi nama mempelai, foto, jadwal akad dan resepsi, lokasi dengan peta Google Maps, hingga kisah cinta (love story). Semua tersimpan otomatis di dashboard.</p>
<h2>3. Aktifkan RSVP dan amplop digital</h2>
<p>Tamu mengonfirmasi kehadiran langsung dari undangan, dan tanda kasih bisa dikirim via transfer bank atau e-wallet — tanpa amplop fisik.</p>
<h2>4. Bagikan dan pantau kehadiran</h2>
<p>Kirim tautan unik per tamu via WhatsApp, lalu pantau RSVP real-time. Untuk resepsi, lanjutkan dengan <a href="/qr-digital-buku-tamu">buku tamu digital QR</a> agar check-in tercatat otomatis.</p>
<h2>Berapa biayanya?</h2>
<p>Harga mengikuti paket dan fitur yang dipilih. Lihat <a href="/customize">halaman harga</a> untuk memilih paket undangan website, buku tamu, galeri foto tamu, dan add-on lainnya.</p>`,
  },
  {
    slug: "biaya-wedding-organizer-2026",
    title: "Biaya Wedding Organizer 2026 dan Cara Memilih WO yang Tepat",
    description:
      "Kisaran biaya wedding organizer di Indonesia 2026, perbedaan fullday vs akad-only, plus checklist memilih WO agar tidak salah pilih.",
    category: "Wedding Planner",
    date: "2026-10-14",
    readMinutes: 7,
    body: `
<p>Menggunakan jasa <strong>wedding organizer (WO)</strong> adalah keputusan besar — biayanya signifikan, dan kualitasnya menentukan kelancaran hari-H. Berikut panduan realistisnya.</p>
<h2>Kisaran biaya WO di 2026</h2>
<p>Untuk resepsi 200–500 tamu di kota besar, jasa WO umumnya berkisar belasan hingga puluhan juta rupiah tergantung cakupan: fullday (persiapan H-3 sampai beres acara) atau akad-only. Selalu minta rincian tertulis: jumlah crew, jam kerja, dan apa saja yang <em>tidak</em> termasuk.</p>
<h2>Fullday vs koordinasi hari-H</h2>
<p>WO fullday mendampingi sejak vendor hunting dan technical meeting. Koordinator hari-H (day coordinator) lebih hemat dan cocok bila konsep sudah matang — Anda hanya butuh eksekutor profesional di hari acara.</p>
<h2>Checklist memilih wedding organizer</h2>
<p>Portofolio acara sejenis, testimoni pengantin sebelumnya, kontrak tertulis yang jelas, satu PIC khusus untuk Anda, dan kesiapan tools modern: undangan digital dengan RSVP, <a href="/qr-digital-buku-tamu">buku tamu digital</a> untuk rekap tamu, dan <a href="/reminder-tamu-vip">reminder WhatsApp</a> agar tamu VIP tidak lupa hadir.</p>
<h2>Kolaborasi WO + undangan digital</h2>
<p>WO terbaik bekerja dengan data: tautan unik per tamu, nomor meja, dan rekap RSVP real-time membuat briefing crew jauh lebih presisi. Lihat <a href="/customize">paket Aksaraa</a> yang biasa dipakai WO rekanan kami.</p>`,
  },
  {
    slug: "checklist-persiapan-pernikahan-12-bulan",
    title: "Checklist Persiapan Pernikahan 12 Bulan hingga Hari-H",
    description:
      "Timeline persiapan nikah dari 12 bulan sampai hari-H: gedung, vendor, undangan, RSVP, buku tamu, dan gladi resik — tidak ada yang terlewat.",
    category: "Checklist",
    date: "2026-10-14",
    readMinutes: 8,
    body: `
<h2>12–9 bulan: fondasi</h2>
<p>Tetapkan tanggal, budget, dan estimasi tamu. Amankan gedung/venue dan fotografer — dua vendor yang paling cepat penuh. Mulai riset <a href="/templates">desain undangan pernikahan digital</a> agar gaya visual konsisten sejak awal.</p>
<h2>8–5 bulan: vendor inti</h2>
<p>MUA, dekorasi, katering, dan hiburan. Susun guest list sementara di spreadsheet — nama, nomor WhatsApp, kategori, dan alokasi meja. Data ini menjadi bahan undangan digital nantinya.</p>
<h2>4–2 bulan: undangan dan RSVP</h2>
<p>Finalisasi desain undangan website, isi seluruh data acara, dan sebarkan tautan unik per tamu. Buka RSVP online minimal 6–8 minggu sebelum hari-H agar katering bisa dihitung akurat.</p>
<h2>1 bulan–1 minggu: eksekusi</h2>
<p>Kirim <a href="/reminder-tamu-vip">reminder WhatsApp</a> H-7 dan H-1, finalisasi seating dengan data check-in, siapkan <a href="/qr-digital-buku-tamu">buku tamu digital</a> dan <a href="/galeri-kenangan-tamu">galeri foto tamu</a>, lalu gladi resik bersama WO dan seluruh vendor.</p>
<h2>Hari-H</h2>
<p>Nikmati acara. QR check-in mencatat kehadiran, layar sapa menyambut tamu, galeri terisi foto candid, dan wish wall menampung doa — semua berjalan otomatis.</p>`,
  },
  {
    slug: "ide-disposable-camera-pernikahan",
    title: "Disposable Camera Pernikahan: Ide Galeri Foto dari Sudut Tamu",
    description:
      "Tren disposable camera di resepsi: tamu memotret candid, foto tampil live. Cara kerja, penempatan QR, dan tips agar galeri penuh.",
    category: "Galeri Tamu",
    date: "2026-10-14",
    readMinutes: 5,
    body: `
<p>Tren <strong>disposable camera pernikahan</strong> lahir dari kejenuhan akan foto formal: tamu diberi kamera sekali pakai di setiap meja, dan hasil candid-nya jadi kenangan paling jujur. Versi digitalnya jauh lebih praktis.</p>
<h2>Cara kerja galeri foto tamu digital</h2>
<p>Tamu memindai QR di meja, memotret atau memilih foto dari HP, lalu mengunggah — foto tampil live di <a href="/galeri-kenangan-tamu">galeri kenangan tamu</a> dalam hitungan detik. Tanpa aplikasi, tanpa kamera fisik yang harus dicuci-cetak.</p>
<h2>Tips agar galeri penuh terisi</h2>
<p>Letakkan QR di setiap meja (bukan hanya pintu masuk), umumkan lewat MC di awal acara, tampilkan slideshow live agar tamu terpancing ikut mengunggah, dan sediakan hadiah kecil untuk foto terkreatif.</p>
<h2>Setelah acara</h2>
<p>Seluruh foto tersimpan di dashboard dan bisa diunduh sekaligus — bahan perfect untuk album, aftermovie, dan ucapan terima kasih. Lihat <a href="/customize">paket galeri foto tamu</a> untuk kuota yang sesuai jumlah tamu Anda.</p>`,
  },
]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}
