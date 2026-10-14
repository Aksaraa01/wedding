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
  checker?: "weton"
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
<p>Tetapkan tanggal, budget, dan estimasi tamu. Amankan gedung/venue dan fotografer — dua vendor yang paling cepat penuh. Hitung estimasi dengan <a href="/kalkulator-budget">kalkulator budget pernikahan</a>. Mulai riset <a href="/templates">desain undangan pernikahan digital</a> agar gaya visual konsisten sejak awal.</p>
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
    slug: "cara-menghitung-weton-tanggal-baik",
    title: "Cara Menghitung Weton dan Memilih Tanggal Baik Pernikahan",
    description:
      "Panduan weton Jawa: arti pasaran Legi Pahing Pon Wage Kliwon, cara hitung neptu, plus kalkulator weton otomatis untuk tanggal akad dan resepsi.",
    category: "Tradisi",
    date: "2026-10-14",
    readMinutes: 5,
    body: `
<p>Banyak keluarga Jawa memakai <strong>weton</strong> sebagai salah satu pertimbangan memilih tanggal akad dan resepsi. Weton adalah kombinasi hari masehi (Senin–Minggu) dengan pasaran Jawa (Legi, Pahing, Pon, Wage, Kliwon) yang berputar setiap 5 hari.</p>
<h2>Cek weton tanggal Anda</h2>
<p>Masukkan tanggal rencana acara di bawah — weton dan neptunya terhitung otomatis:</p>`,
    checker: "weton",
  },
  {
    slug: "harga-undangan-digital-2026",
    title: "Harga Undangan Digital 2026: Perbandingan dan Tips Hemat",
    description:
      "Kisaran harga undangan pernikahan digital 2026, perbedaan paket basic vs premium, dan cara hemat jutaan rupiah tanpa mengorbankan kualitas.",
    category: "Harga",
    date: "2026-10-14",
    readMinutes: 6,
    body: `
<p>Harga <strong>undangan pernikahan digital</strong> bervariasi dari puluhan ribu hingga jutaan rupiah. Selisihnya terletak pada fitur: RSVP, buku tamu digital, galeri foto, wish wall, dan reminder WhatsApp.</p>
<h2>Patokan harga 2026</h2>
<p>Paket basic (undangan + RSVP) umumnya paling terjangkau; paket premium menambah buku tamu QR, galeri foto tamu, dan blast WhatsApp. Kompetitor mematok Rp49–149 ribu untuk fitur sekelasnya — bandingkan isi fiturnya, bukan cuma angkanya.</p>
<h2>Tips hemat terbesar</h2>
<p>Gabungkan kebutuhan dalam satu platform: undangan + buku tamu + galeri + reminder dalam satu paket selalu lebih murah daripada beli terpisah. Hitung dulu kebutuhan Anda dengan <a href="/kalkulator-budget">kalkulator budget</a>, lalu lihat <a href="/customize">halaman harga</a> untuk paket yang pas.</p>
<h2>Yang sering dilupakan</h2>
<p>Masa aktif link (pastikan aktif selamanya sebagai kenangan), batas revisi desain, dan apakah ganti template dikenakan biaya. Di Aksaraa, ganti template gratis kapan saja.</p>`,
  },
  {
    slug: "cara-menyebar-undangan-whatsapp",
    title: "Cara Menyebar Undangan via WhatsApp yang Sopan dan Efektif",
    description:
      "Etika dan teknik sebar undangan WhatsApp: tautan unik per tamu, waktu kirim terbaik, template pesan, dan follow-up RSVP otomatis.",
    category: "Panduan",
    date: "2026-10-14",
    readMinutes: 5,
    body: `
<p>WhatsApp adalah kanal utama sebaran <strong>undangan digital</strong> — tapi cara menyebarnya menentukan berapa banyak tamu yang benar-benar hadir.</p>
<h2>Gunakan tautan unik per tamu</h2>
<p>Jangan sebar satu link ke grup. Tautan unik berisi nama masing-masing tamu terasa personal, mencegah tamu tak diundang, dan membuat rekap RSVP akurat per nama.</p>
<h2>Waktu kirim terbaik</h2>
<p>Kirim undangan H-30 hingga H-21, lalu <a href="/reminder-tamu-vip">reminder otomatis</a> H-7 dan H-1. Pesan pembuka yang sopan menyebut nama tamu selalu dibuka lebih dulu daripada broadcast generik.</p>
<h2>Template pesan yang bekerja</h2>
<p>Salam pembuka + nama tamu + maksud undangan + tautan + penutup hangat. Hindari huruf kapital semua dan emoji berlebihan — kesopanan terbaca dari formatnya.</p>
<h2>Follow-up yang tidak mengganggu</h2>
<p>Satu pengingat cukup; dua maksimal. Sistem reminder otomatis memastikan tidak ada tamu terlewat tanpa Anda harus mengejar satu per satu.</p>`,
  },
  {
    slug: "tips-memilih-wedding-organizer",
    title: "7 Tips Memilih Wedding Organizer Agar Tidak Salah Pilih",
    description:
      "Cara memilih WO: portofolio sejenis, kontrak tertulis, chemistry, tools modern, dan red flag yang wajib dihindari.",
    category: "Wedding Planner",
    date: "2026-10-14",
    readMinutes: 6,
    body: `
<p><strong>Wedding organizer</strong> yang tepat membuat Anda menikmati hari-H; yang salah membuat Anda jadi koordinator dadakan. Tujuh tips ini membantu memilih dengan percaya diri.</p>
<h2>1. Minta portofolio acara sejenis</h2>
<p>WO adat Jawa belum tentu piawai adat Batak. Lihat dokumentasi acara dengan skala, adat, dan venue sejenis milik Anda.</p>
<h2>2. Wawancara chemistry-nya</h2>
<p>Anda akan intens berkomunikasi 3–6 bulan. Pilih tim yang responsif, jujur soal budget, dan tidak memaksakan vendor rekanan.</p>
<h2>3. Kontrak tertulis yang rinci</h2>
<p>Jumlah crew, jam kerja, rundown, overtime fee, dan apa yang tidak termasuk — semua di atas kertas bermeterai, bukan janji lisan.</p>
<h2>4. Pastikan melek tools digital</h2>
<p>WO modern memakai <a href="/qr-digital-buku-tamu">buku tamu digital</a> untuk rekap tamu dan <a href="/reminder-tamu-vip">reminder WhatsApp</a> agar tamu VIP hadir — bukan buku tulis dan telepon manual.</p>
<h2>5–7. Cek testimoni, waspadai DP besar, dan pastikan satu PIC khusus</h2>
<p>Hubungi 2–3 pengantin sebelumnya. Hindari DP di atas 50% tanpa milestone jelas. Dan pastikan ada satu nama PIC yang bertanggung jawab penuh atas acara Anda.</p>`,
  },
  {
    slug: "undangan-tanpa-foto-vs-foto",
    title: "Undangan Tanpa Foto vs Pakai Foto: Mana yang Cocok untuk Anda?",
    description:
      "Pertimbangan privasi, estetika, dan budaya dalam memilih template undangan tanpa foto atau dengan foto prewedding.",
    category: "Template",
    date: "2026-10-14",
    readMinutes: 4,
    body: `
<p>Salah satu keputusan desain terbesar: tampilkan foto prewedding atau tidak sama sekali. Keduanya valid — tergantung prioritas Anda.</p>
<h2>Alasan memilih tanpa foto</h2>
<p>Privasi (tidak ingin wajah tersebar di grup WhatsApp), belum sempat prewedding, atau selera minimalis yang mengutamakan tipografi. Lihat koleksi <a href="/templates/kategori/tanpa-foto">template tanpa foto</a> — ornamen dan tipografinya berdiri sendiri.</p>
<h2>Alasan memakai foto</h2>
<p>Tamu mengenali Anda sekilas (penting untuk tamu jauh), nuansa lebih personal, dan foto menjadi pusat estetika undangan. Galeri prewedding juga memperkaya halaman.</p>
<h2>Solusi tengah</h2>
<p>Pakai foto di halaman dalam tapi sampul tetap tipografi, atau sebaliknya. Semua <a href="/templates">template Aksaraa</a> bisa diganti kapan saja — mulai tanpa foto, tambah foto belakangan bila berubah pikiran.</p>`,
  },
  {
    slug: "ide-disposable-camera-pernikahan",    title: "Disposable Camera Pernikahan: Ide Galeri Foto dari Sudut Tamu",
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
