# SOP CS Aksaraa (agent web + WhatsApp)

Sumber kebenaran perilaku agent. Kalau aturan di sini berubah, ubah juga
`src/lib/cs/policy.ts` (`BOUNDARIES` + `decide()`), `src/lib/cs/replies.ts`,
`src/lib/cs/prompt.ts`, dan test di `npm run test:cs`.

Boundary yang di-hardcode di kode:

| Lapis | File | Isi |
|---|---|---|
| Batas tertulis (masuk system prompt) | `policy.ts` → `BOUNDARIES` | Harga hanya dari tool, tanpa janji refund/tanggal, tanpa data tamu sebelum verifikasi, voucher tidak diputuskan agent |
| Routing intent | `policy.ts` → `classify()` + `decide()` | intent → answer / tool / playbook / verify / escalate / refuse |
| Guard output | `guard.ts` → `validateReply()` | angka tanpa bukti, klaim (nett/gratis/garansi/diskon/ETA/unlimited), PII, link di luar allowlist, kebocoran kode voucher, >1 pertanyaan, >90 kata → fallback |
| Kebijakan layanan | `cs_settings.guardrails` | jawaban estimasi waktu (bisa diubah tanpa deploy) |

## Satu nomor pengirim untuk pesan ke klien

Semua pesan ke klien (balasan AI, balasan tim dari `/ops/cs`, OTP/PIN, konfirmasi
foto) keluar lewat **gateway CS** (`CS_WA_SEND_URL` → nomor **6281161613071**,
proses PM2 `aksaraa-cs-wa-real` di port `3102`). Nomor lama `6281265781778`
sudah dipensiunkan (`aksaraa-cs-wa` dihentikan, sesinya tidak di-logout).

- `WA_SCHOOL_API_URL` (gateway bot sekolah di :3001) **tidak boleh** dipakai
  untuk pesan klien: klien akan menerima balasan dari nomor asing. Kode hanya
  memakai jalur itu kalau `CS_WA_SEND_URL` belum diset sama sekali.
- Gateway CS mewajibkan header `x-cs-secret` di semua endpoint; tanpa header
  semua kiriman ditolak 401.
- `POST /send` menerima `{ jid, phone, message }`. `jid` (chat `@lid`) dipakai
  lebih dulu karena nomor mentah tidak selalu bisa di-resolve.
- Gateway menjawab `{ ok: true }` hanya kalau benar-benar terkirim; `{ error }`
  diperlakukan gagal oleh app, jadi UI menampilkan "gateway gagal mengirim"
  alih-alih mengaku terkirim.

## Toggle AI per percakapan (ambil alih manual)

Setiap percakapan punya satu pemilik: `bot` atau `human` (`cs_conversations.status`).
Tombol **AI aktif / AI dijeda** di `/ops/cs` adalah satu-satunya kontrol.

- **AI dijeda** = `status = human`. AI tidak membalas pesan baru maupun pesan
  yang sedang diproses; pesan klien tetap tersimpan supaya tim melihatnya.
- **Membalas dari WhatsApp** (HP atau WhatsApp Web, termasuk lampiran) menjeda
  AI **10 menit** untuk percakapan itu (`ai_paused_until`), dan pesannya
  disimpan sebagai pesan keluar (`model = human:wa`) — bukan ucapan klien.
- Balasan tim dari `/ops/cs` (`model = human:ops`) juga menjeda AI **10 menit**.
- Jeda itu **direset setiap balasan manusia berikutnya** (sliding), jadi selama
  tim aktif membalas, bot tetap diam.
- Setelah 10 menit, AI menyala lagi saat pesan klien berikutnya masuk. Pesan
  klien yang datang di dalam jendela jeda tetap tersimpan, tidak dibalas.
- Durasi bisa diubah tanpa deploy lewat env `CS_HUMAN_COOLDOWN_MIN` (default 10).
- **Jeda yang lebih lama menang:** kalau percakapan sedang dalam jeda eskalasi
  4 jam, balasan manusia tidak memperpendeknya.
- **Toggle AI dijeda dan claim tetap permanen** (`ai_paused_until = null`), tidak
  auto-nyala — itu satu-satunya cara mengunci percakapan selama tim menangani.
- **AI aktif** = `status = bot`. Balasan otomatis jalan lagi; tidak ada balasan
  susulan untuk pesan lama.
- Perubahan toggle dicatat di `cs_audit` (`ai_off` / `ai_on`) beserta sumbernya;
  balasan manusia mencatat `paused_until` + `auto_resume: true`.
- `/ops/cs` menampilkan sisa waktunya: "AI dijeda · 8 mnt" (otomatis) vs
  "AI dijeda" (manual/permanen).
- Gateway punya blok 120 detik terakhir: kalau manusia membalas saat bot sedang
  menyusun jawaban, balasan bot dibatalkan sebelum dikirim.

### Kill switch AI (semua percakapan)

Di `/ops/cs` ada satu tombol **"AI Bot (semua)"**:

- **Matikan AI untuk semua** → `cs_settings.enabled = false`. Bot berhenti di
  WhatsApp dan widget web sekaligus. Pesan klien **tetap disimpan** dan muncul
  di daftar, tetapi tidak dibalas dan status percakapan **tidak diubah**.
- **Nyalakan AI untuk semua** → `cs_settings.enabled = true`. Setiap percakapan
  **kembali ke status terakhirnya**: `bot` membalas lagi, `human` tetap diam
  (termasuk jeda manual), `closed` tetap selesai.
- Berlaku seketika (cache pengaturan dibersihkan saat tombol ditekan).
- Setiap perubahan dicatat di `cs_audit` (`ai_global_on` / `ai_global_off`).
- Ini berbeda dari toggle per percakapan: toggle per percakapan tetap tersimpan
  dan tidak diubah oleh kill switch.

## Matriks topik

| Topik | Perilaku | Alasan / prioritas |
|---|---|---|
| Harga, paket, bandingkan vendor | jawab lewat tool (`quote`, `list_packages`) | — |
| Template per kategori/daerah ("template adat ada apa aja?", "ada yang batak?") | **balasan tetap dari DB: daftar desain kategori itu + link kategorinya** | lihat [Katalog pertanyaan klien](#a-template--desain) |
| Template terbaru / paling populer | balasan tetap dari DB: rak `created_at` / `popular_rank` | idem |
| "Template saya apa?" | verifikasi dulu → nama template dari profil | — |
| "Bisa ganti template?" | tiket `data_change`; tidak menjanjikan penggantian | idem |
| **Minta SEMUA template / "lihat di mana" / daftar / galeri** | **balasan tetap dari kode: `https://wedding.aksaraa.com/templates`** (Ceriavite: `https://ceriavite.aksaraa.com`) | jangan kirim 3–8 link preview dan jangan sebut "ada N template" dari cuplikan tool |
| Estimasi waktu, pertanyaan teknis, undangan cetak | jawab dari kebijakan | — |
| Rekomendasi paket, nego pertama, pilih paket, cara daftar | playbook (qualify / objection / cta) | — |
| Nego berulang | eskalasi | `discount` · normal |
| **Voucher / kode promo / potongan khusus** | **"Boleh aku cek dulu ya Kak…" + tiket ke tim** | `voucher` · normal · **AI tidak dijeda** |
| Status undangan / isi data, belum terverifikasi | konfirmasi identitas ("nomor ini terdaftar sebagai …?") → PIN | lihat [alur status](#alur-status-undangan) |
| Status undangan, sudah terverifikasi | balasan tetap: tayang/belum + paket/pembayaran + tanggal + tautan sesuai mode | **K/D** |
| Minta tautan undangan | Fleksibel → tautan + `?to=`; Terbatas → dashboard (tautan per tamu) | **K** |
| Status undangan / isi data, nomor terverifikasi tapi profil tidak ada | eskalasi | `no_profile` · normal |
| Minta manusia / telepon | eskalasi | `human_requested` · high |
| Refund / pembatalan | eskalasi | `refund` · high |
| Ubah data undangan (nama, foto, rekening, nomor) | verifikasi PIN dulu → eskalasi | `data_change` · normal |
| Ubah tanggal | eskalasi | `reschedule` · high |
| Komplain | eskalasi | `complaint` · high |
| Bukti bayar / invoice / DP / cicilan / "mau bayar" / "pelunasan" / nomor rekening | balasan tetap berisi rekening resmi **+ tiket** `payment` (AI tidak dijeda) | `payment` · normal |
| Klaim sudah transfer ("sudah tf", "ini buktinya") | eskalasi, AI dijeda 4 jam | `payment` · normal |
| Politik, saham, judi, pinjol, medis | tolak sopan | — |
| Tidak jelas + marah atau 2× gagal | eskalasi | `low_confidence` · normal |
| Guard menolak output model | fallback "aku cek dulu ke tim" + eskalasi | `low_confidence` · normal |

## Katalog pertanyaan klien (jawaban yang sudah ditentukan)

Bagian ini yang dipakai kalau klien bertanya hal spesifik. Setiap baris punya
satu jawaban yang benar; jangan mengarang di luar itu.

Sumber jawaban:

| Kode | Arti | Contoh |
|---|---|---|
| **K** | balasan tetap dari kode, model tidak dipakai | galeri, kategori template, nomor tim |
| **D** | dibaca dari database (nama desain, paket, status) | daftar template adat, harga |
| **B** | knowledge base + sitasi | cara pakai buku tamu, masa aktif |
| **T** | tiket ke tim (AI dijeda 4 jam, kecuali voucher) | refund, nego, ubah tanggal |

Lima aturan yang tidak boleh dilanggar:

1. **Nama template selalu dari database.** Model tidak boleh menyebut nama desain
   dari ingatan — nama karangan langsung terlihat klien saat dibuka.
2. **"Template X ada apa aja?" bukan permintaan seluruh galeri.** Jawab daftar
   desain kategori itu + link kategorinya. Jangan balas "semua template ada di
   galeri" dan jangan kirim 2–3 link preview.
3. **"Semua template"** baru dijawab satu link galeri, tanpa menyebut jumlah dari
   cuplikan tool.
4. Bot **tidak pernah** menjanjikan penggantian template, penghapusan data,
   perubahan tanggal, atau refund. Itu tiket tim.
5. **Harga hanya dari tool** `quote_price`. KB dan model tidak menyebut nominal.

### A. Template & desain

| Klien menulis | Jawaban yang benar | Sumber |
|---|---|---|
| "template adat ada apa aja kk?" | daftar desain adat/tradisional (maks 8 nama) + `…/templates/kategori/adat` + tawaran bantu pilihkan | **D** |
| "ada template batak?" / "horas" | daftar desain Batak (alias: horas) | **D** |
| "template jawa / minang / padang / melayu / bugis / dayak / banjar / bali / betawi / palembang / tionghoa" | daftar desain daerah itu; `padang`→Minang, `cina/chinese`→Tionghoa | **D** |
| "template tanpa foto ada?" / "yang nggak pakai foto" | daftar desain `no_photo` + `…/templates/kategori/tanpa-foto` | **D** |
| "yang pakai foto" / "ada fotonya?" | daftar desain dengan foto | **D** |
| "template elegan / floral / modern / minimalis" | daftar kategori itu + halaman kategorinya | **D** |
| "yang minang dong" (tanpa kata "template") | tetap daftar Minang — konteksnya percakapan template | **D** |
| "template terbaru apa aja?" | rak **terbaru** (urut `created_at`), maks 8 nama | **D** |
| "template paling populer?" / "favorit?" | rak **populer** (`popular_rank` 1–10) | **D** |
| "semua template / daftar / list / lihat di mana" | satu link galeri `https://wedding.aksaraa.com/templates` + info filter kategori & dengan/tanpa foto | **K** |
| "template premium itu apa?" / "bedanya basic sama premium?" | filter **paket** di galeri: Basic = bonus cetak undangan, Premium = perlu paket berbayar. Bukan tingkatan kualitas, bukan paket Buku Tamu Digital | **K** |
| "template untuk khitanan / aqiqah / ulang tahun?" | katalog anak: `https://ceriavite.aksaraa.com` | **K** |
| "undangan saya template apa?" | perlu verifikasi dulu, lalu sebut template dari profil (`profile_status`) | **D** |
| "bisa ganti template setelah daftar?" | balasan tetap: tidak bisa diganti sendiri dari halaman undangan, tim yang memproses; tawarkan "balas **minta tim**" (memicu `human_request`), bukan tiket otomatis | **K** |
| "template saya bisa diganti?" | sama; jangan pernah bilang "sudah aku ganti" | **K** |
| "template bisa custom desain?" | custom desain dikonsultasikan ke tim; jangan sebut harga custom | **T** |
| "template bisa ganti warna / ubah isi sendiri?" | isi (nama, foto, jadwal, rekening) diubah dari editor; perubahan struktur/warna = tim | **B/T** |
| "template ini bisa dipakai paket Essential/Signature?" | cocokkan `package_eligibility`; kalau desain tidak eligible, sebut desain lain yang eligible | **D** |
| "ada contoh undangan yang sudah jadi?" | arahkan ke galeri (setiap kartu punya preview) | **K** |
| "template ada RSVP / amplop digital / maps / countdown / musik?" | jawab dari KB fitur undangan; jangan mengarang fitur yang tidak ada di desain itu | **B** |
| "template bahasa Inggris ada?" | sebut kalau ada di katalog; kalau tidak yakin, jangan mengarang — tawarkan bantu carikan | **B/D** |

**Contoh jawaban yang salah (jangan diulang).** Pertanyaan
"template adat ada apa aja kk?" pernah dijawab dengan:

> Semua template undangan pernikahan bisa dilihat di galeri ini: …
> Di sana bisa disaring per kategori (adat, modern, elegan, floral) …

Itu tidak menjawab pertanyaan: klien minta **daftar desain adat**, bukan
petunjuk cara memfilter. Sekarang pertanyaan itu masuk `templateAnswerKind()`
= `category` dan dijawab dengan nama desain dari database.

### B. Harga & paket

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "harganya berapa?" | `quote_price` untuk paket yang relevan; sebut apa yang termasuk | **D** |
| "paket apa saja?" / "bedanya paket?" | `list_packages`, bandingkan isi bukan hanya harga | **D** |
| "ada yang lebih murah?" / "paket paling murah?" | sebut paket terendah yang eligible + isinya | **D** |
| "harga sudah termasuk cetak?" | jawab dari isi paket (bonus cetak hanya di paket tertentu) | **D** |
| "bisa nego?" (pertama) | playbook objection; jangan memutuskan potongan | **T** kalau berulang |
| "harga naik tahun depan?" | jangan berspekulasi; tawarkan tim | **T** |
| "harga untuk 2 acara / akad + resepsi?" | `quote_price` untuk paket yang mendukung 2 sesi | **D** |

### C. Pembayaran

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "cara bayar?" (belum klaim) | nomor tim **6281161613071** + tautan `wa.me` | **K** |
| "sudah transfer, ini buktinya" | tiket `payment`; jangan menyatakan lunas | **T** |
| "minta invoice / tagihan" | tiket `payment` | **T** |
| "bisa cicil / DP?" | tiket `payment` | **T** |
| "rekening atas nama siapa?" | nomor tim; jangan menyebut nomor rekening perusahaan dari ingatan | **K** |
| "status pembayaran saya?" | verifikasi dulu → status dari profil; kalau tidak ada bukti, tiket | **D/T** |

### D. Voucher, promo, diskon

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "ada voucher / promo?" | "Boleh aku cek dulu ya Kak…" + tiket `voucher` (AI **tidak** dijeda) | **T** |
| "kode X valid?" | jangan menilai valid/tidak; tiket | **T** |
| "voucher bisa digabung?" | boleh jelaskan mekanisme umum (satu voucher per profil, tidak digabung) | **B** |
| "diskon khusus / nego" | playbook; berulang → tiket `discount` | **T** |

### E. Refund, batal, ubah tanggal

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "mau refund" / "batalkan" | tiket `refund` · high; jangan menjanjikan nominal | **T** |
| "ganti tanggal acara" | tiket `reschedule` · high | **T** |
| "undangan sudah aktif, bisa dibatalkan?" | tiket `refund` | **T** |
| "pindah ke pasangan/template lain" | tiket `data_change` | **T** |

### F. Registrasi, akun, login

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "cara daftar?" | alur registrasi + link `/register` | **B** |
| "lupa PIN" | verifikasi nomor terdaftar; PIN dari pendaftaran; kalau tetap gagal → tim | **T** |
| "nomor saya ganti" | tiket `data_change` (nomor adalah identitas akun) | **T** |
| "akun saya tidak bisa dibuka" | cek nomor terdaftar dulu; bukan akun ini → minta nomor terdaftar | **B/T** |
| "boleh daftar pakai email?" | jawab dari alur registrasi yang berlaku | **B** |

### G. Isi & kirim data undangan

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "bantu isi undangan" | alur "Bantu Isi Undangan" (lihat bagian bawah) | **D** |
| "apa saja yang sudah terisi?" | read-back dari profil yang terverifikasi saja | **D** |
| "hapus foto / ganti nama" | verifikasi → tiket `data_change` (bot tidak menghapus) | **T** |
| "tambah sesi acara" | bagian Acara pada alur isi undangan | **D** |
| "alamat hadiah kosong, emang boleh?" | boleh; alamat opsional, rekening tetap tampil | **B** |
| "foto saya lebih dari slot template" | konfirmasi foto mana yang dipakai, jangan buang diam-diam | **D** |

### H. Link undangan & domain

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "link undangan saya mana?" | lihat [Status undangan & permintaan tautan](#status-undangan--permintaan-tautan): Fleksibel → tautan + `?to=`; Terbatas → dashboard (tautan per tamu) | **K** |
| "bisa pakai domain sendiri?" | jawab dari kebijakan; kalau tidak ada di KB → tim | **B/T** |
| "link saya error / tidak bisa dibuka" | cek status publish; kalau tetap gagal → tiket `technical` | **D/T** |
| "link untuk tamu bagaimana?" | Fleksibel: `?to=Nama%20Tamu` (nama bebas). Terbatas: tautan per tamu dari dashboard | **K** |

### I. Tamu, RSVP, buku tamu QR

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "cara kirim ke tamu?" | link + `?to=` per tamu, atau daftar tamu di dashboard | **B** |
| "RSVP-nya ke mana?" | masuk dashboard, bisa diekspor | **B** |
| "buku tamu QR cara pakainya?" | PIN kios + scanner; jawab dari KB | **B** |
| "tamu tidak bisa buka link" | cek salah ketik/`?to=`; kalau masih gagal → tiket `technical` | **B/T** |
| "bisa import tamu dari Excel?" | jawab dari fitur yang ada; jangan mengarang | **B** |

### J. Fitur undangan

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "ada musiknya?" | musik latar tersedia; baru diputar setelah tamu membuka undangan | **B** |
| "bisa video YouTube?" | bagian Video (bisa dimatikan) | **B** |
| "ada maps / lokasi?" | lokasi acara + tombol peta | **B** |
| "amplop digital / rekening?" | bagian Hadiah (bisa dimatikan) | **B** |
| "hitung mundur?" | jawab sesuai template; jangan menjanjikan di semua desain | **B** |
| "bisa bahasa Indonesia & Inggris?" | jawab dari template yang mendukung | **B** |

### K. Cetak

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "undangan cetak termasuk?" | bonus cetak hanya pada paket/desain tertentu | **D** |
| "berapa lembar cetaknya?" | dari isi paket | **D** |
| "bisa tambah cetak?" | tiket | **T** |
| "desain cetak sama dengan web?" | jawab dari kebijakan; kalau tidak yakin → tim | **B/T** |

### L. WA blast

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "bisa blast WhatsApp?" | kuota tambahan per paket (kumulatif) | **D** |
| "kuota saya berapa?" | dari profil/paket | **D** |
| "blast gagal / nomor tidak terdaftar" | tiket `technical` | **T** |

### M. Publikasi & revisi

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "sudah bisa dipublish?" | sebut penghalang tayang: konten yang kosong → undangan belum dikonfirmasi. Pembayaran disebut terpisah (tidak memblokir konfirmasi) | **D** |
| "status feedback / revisi saya?" / "sudah berapa kali revisi?" | ringkasan `feedback_submissions`: total, selesai/sedang dikerjakan/menunggu, ronde terakhir, item terakhir + tautan kirim masukan baru | **D** |
| "saya mau kasih masukan" | arahkan ke `/dashboard/{id}/web-invitation/feedback/new` (CS tidak membuat masukan) | **K** |
| "publish sekarang" | bot **tidak** mempublish; klien menekan Konfirmasi di editor (`?review=1`) | **K** |
| "masih bisa diubah setelah publish?" | ya, dari editor; perubahan tampil setelah disimpan | **B** |
| "berapa lama revisi?" | dari kebijakan; jangan menjanjikan tanggal | **B** |

### N. Teknis

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| "foto tidak muncul" | minta cek ulang + sebutkan langkah; kalau tetap → tiket `technical` | **B/T** |
| "musik tidak jalan di iPhone" | musik baru aktif setelah tamu menyentuh layar (kebijakan browser) | **B** |
| "halaman lambat" | jelaskan pemuatan pertama; kalau ekstrem → tiket | **B/T** |
| "data saya hilang" | verifikasi → tiket high; jangan menyatakan data aman/hilang | **T** |

### O. Di luar cakupan

| Klien menulis | Jawaban | Sumber |
|---|---|---|
| politik, saham, judi, pinjol, medis | tolak sopan, arahkan ke topik undangan | **K** |
| "kalian perusahaan apa?" | profil singkat Aksaraa | **B** |
| "mau kerja sama / jadi reseller" | tiket | **T** |
| acara anak (khitanan/aqiqah/ultah) | Ceriavite (`https://ceriavite.aksaraa.com`) | **K** |

### Status revisi / masukan undangan

Intent `feedback_status` (kata kunci: feedback, revisi, masukan, perbaikan
undangan, "berapa kali revisi"). Butuh verifikasi seperti permintaan data lain.

- Sumber: `feedback_submissions` **milik profil yang terikat** — jangan pernah
  menyebut masukan pasangan lain. Deskripsi bebas tidak dibacakan ulang; yang
  disebut hanya area, status, tanggal, dan ronde.
- Balasan menyebut: total masukan, `selesai` / `sedang dikerjakan` / `menunggu`,
  jumlah ronde revisi, item terakhir, dan tautan
  `/dashboard/{id}/web-invitation/feedback/new`.
- Item yang masih terbuka ≥ 3 hari → tawarkan `minta tim` (jangan menjanjikan
  tanggal selesai, jangan bilang "sudah aku perbaiki").
- Ringkasan status undangan ikut menyebut **"Revisi: N sedang diproses"**, jadi
  klien tidak perlu bertanya dua kali.
- Masukan yang sudah `resolved` tidak bisa diubah; jika hasil belum sesuai,
  klien diminta mengirim masukan baru.

## Yang dilakukan setiap eskalasi

1. Baris `cs_escalations` (status `open`, ada alasan + prioritas + ringkasan).
2. `cs_conversations.escalated_at` diisi.
3. **Kecuali `voucher`**: status percakapan jadi `human` dan AI dijeda 4 jam.
   Voucher sengaja hanya membuat tiket supaya klien tetap bisa dibantu soal
   paket/template di percakapan yang sama.
4. Baris `cs_audit`.
5. Notifikasi WhatsApp ke **koordinator CS** (`CS_ESCALATION_TARGET`, default
   `6281161613071`), berisi alasan dalam bahasa manusia + ringkasan 4 giliran
   percakapan terakhir (Klien/CS), bukan hanya satu pesan terakhir.

Tiket `voucher` yang masih `open` tidak dibuat ulang pada pesan berikutnya
(satu tiket per percakapan), supaya grup ops tidak dibanjiri pesan.

## Status undangan & permintaan tautan

Dua pertanyaan yang paling sering masuk, dan keduanya **tidak boleh** dijawab
dari tebakan model.

### Alur status undangan

1. Klien menulis "status undangan saya?", "sudah jadi belum?", "sudah aktif?",
   "sudah bisa dipublish?" → intent `status`.
2. **Belum terverifikasi → jangan menjawab isinya dulu.** CS mengonfirmasi
   identitas lebih dulu, karena nomor pengirim bukan bukti pemilik akun:
   > Nomor ini terdaftar sebagai *Rafi & Novi*. Betul ini akun Kakak?
3. Balas **"ya"** → CS meminta **PIN undangan** (6 angka; PIN pendaftaran
   `users.pin`, `scanner_pin` lama tetap diterima). Maksimal 3 percobaan per
   10 menit, lalu disambungkan ke tim.
4. Balas **"bukan"** → tidak ada data yang dibuka. CS meminta nomor WhatsApp
   yang dipakai saat registrasi (jalur OTP), bukan menebak pasangan lain.
5. Setelah PIN benar → CS mengirim konfirmasi verifikasi **dan langsung
   menjawab pertanyaan yang tadi tertunda** (status/tautan, maksimal 15 menit
   ke belakang), jadi klien tidak perlu mengetik ulang pertanyaannya.
6. Jawaban status berasal dari database:
   - undangan sudah tayang / belum tayang (atau sudah ditutup),
   - paket + status pembayaran (`belum ada pembayaran` / `DP sudah masuk` / `lunas`),
   - tanggal acara,
   - tautan sesuai **mode tautan** (lihat di bawah),
   - kalau belum tayang: **daftar penghalang tayang**, hanya dua:
     1. konten yang masih kosong (`getPublishBlockers`), mis. Profil Mempelai,
        Galeri Foto, Kutipan,
     2. **undangan belum dikonfirmasi** (tombol *Konfirmasi* di pratinjau).
     Kalau konten sudah lengkap, CS cukup bilang "tinggal konfirmasi".
   - **Pembayaran BUKAN penghalang.** Konfirmasi tetap bisa dilakukan saat
     `UNPAID` maupun `PARTIAL_DP`. CS menyebutnya sebagai catatan terpisah
     ("pembayaran belum lunas, undangan tetap bisa dikonfirmasi sekarang;
     pelunasan diurus dengan tim — balas **cara bayar**"), bukan sebagai alasan
     undangan tidak bisa tayang. Jangan pernah menulis "belum bisa tayang karena
     belum bayar".

Bot **tidak pernah** mempublish undangan dan tidak pernah menyatakan undangan
sudah aktif kalau `is_published` masih false.

### Permintaan tautan undangan

Intent `invitation_link` (bukan `technical`). Jawabannya bergantung kolom
`wedding_profiles.guest_link_strict`:

| Mode | Perilaku tautan | Jawaban CS |
|---|---|---|
| **Terbatas** (`guest_link_strict = true`, default) | `?to=` hanya terbuka untuk tamu yang terdaftar; nama bebas → halaman tidak ditemukan | **Jangan kirim satu tautan untuk dibagikan.** Arahkan ke dashboard → **Undangan dan QR Tamu** → salin tautan/QR **per tamu**. Sebutkan juga bahwa mode bisa diubah ke Fleksibel di halaman yang sama kalau klien mau satu tautan umum |
| **Fleksibel** (`guest_link_strict = false`) | Nama apa pun boleh; tamu yang RSVP otomatis tercatat | Kirim tautan utama + contoh `?to=Budi%20%26%20Ani`. Ingatkan spasi = `%20`, `&` = `%26` (tanpa encode, nama setelah `&` bisa hilang). Nama yang tampil mengikuti tulisan di tautan |

Aturan tambahan:

- Tautan selalu dibangun dari slug profil yang terikat ke percakapan
  (`coupleUrl()`), bukan dari pesan klien — jangan pernah menyalin slug yang
  dikirim klien ke dalam tautan.
- Undangan belum tayang → sebut penghalangnya lebih dulu, jangan kirim tautan
  seolah sudah bisa dibuka.
- Undangan sudah ditutup (`invitation_disabled_at`) → tautan mati; tawarkan
  "minta tim".
- "Link undangan saya error / tidak bisa dibuka di Android" **bukan**
  permintaan tautan: itu `technical`, jawab dari KB, dan eskalasi kalau tetap
  gagal.
- "Link pembayaran / info pembayaran" bukan permintaan tautan undangan →
  intent `payment` (nomor tim `6281161613071`).

## Verifikasi PIN untuk permintaan data

Agent tidak punya tool yang mengubah data. Permintaan ubah data diverifikasi
dengan **PIN undangan** (`wedding_profiles.scanner_pin`, 4–6 angka):

- Belum terverifikasi → agent meminta PIN (fallback: nomor WhatsApp terdaftar
  untuk alur OTP lama).
- PIN benar → kontak ditandai terverifikasi, permintaan lanjut jadi tiket
  `data_change`.
- PIN salah → dihitung (audit `pin_failed`), maksimal 3 kali dalam 10 menit;
  setelah itu agent berhenti mencoba dan menyambungkan ke tim.
- Agent **tidak pernah** menyatakan data sudah diganti/diubah/dihapus. Guard
  menolak klaim seperti itu (`action_claim`), karena hanya tim/dashboard yang
  bisa melakukannya.

## Aturan voucher

- Semua pertanyaan voucher diteruskan ke tim, termasuk "ada promo apa saja?".
- Agent tidak menyebut kode, nominal potongan, masa berlaku, atau kuota.
- Agent tidak menyatakan voucher valid/tidak valid untuk paket tertentu.
- Agent boleh menjelaskan mekanisme umum: dipakai saat registrasi, satu voucher
  per profil, tidak bisa digabung.
- Agent tidak meminta kode voucher ke klien.

## Knowledge base & sitasi

Jawaban untuk pertanyaan non-harga (teknis, produk, kebijakan) diambil dari
knowledge base di `cs_documents` / `cs_chunks`:

- Sumber: artikel `/artikel` (`src/data/artikel.ts`) + FAQ kurasi
  (`src/data/csKnowledge.ts`).
- Ingest ulang setelah teks berubah: `npm run cs:ingest` (dengan env Supabase
  yang dituju).
- Nominal rupiah dibuang saat ingest (diganti `[nominal sesuai paket]`) supaya
  harga hanya pernah datang dari tool.
- Retrieval bersifat leksikal + sinonim (`src/lib/cs/knowledge.ts`), korpus
  di-cache 5 menit (`src/lib/cs/retrieval.ts`).
- Sitasi ditambahkan sistem, bukan model: balasan yang memakai sumber diakhiri
  `Sumber: <judul> (<url>)` dari potongan teratas.
- Kalau tidak ada potongan yang cocok, agent menjawab dari kebijakan seperti
  biasa (tanpa baris sumber).

## Pengisian data lewat CS

- Agent mengumpulkan field konten satu per satu (`save_draft_field`) ke
  `cs_profile_drafts`, lalu membacakan ringkasan.
- Setelah klien setuju, agent memanggil `apply_profile_draft` (confirm=true):
  field ditulis ke `wedding_profiles`, draft jadi `submitted`, perubahan dicatat
  di `cs_audit`. Kalau profil punya `active_wp_post_id`, patch WordPress
  diantrikan (`wp_sync_jobs`).
- Field uang/paket/tanggal/template tidak pernah ditulis lewat CS
  (`FORBIDDEN_FIELDS`); permintaan seperti itu tetap jadi tiket tim.
- `/ops/cs` menampilkan draft yang sedang dikumpulkan + tautan "Buka editor
  pasangan", jadi draft setengah jalan tetap bisa dilihat manusia.

## Pembayaran

- Pertanyaan pembayaran ("mau bayar", "cara bayar", "pelunasan", "nomor
  rekening", "mau transfer") dijawab **deterministik** oleh
  `paymentInstructionsReply()` — rekening hanya boleh datang dari kode, bukan
  dari model atau KB:

  | Bank | Nomor | Atas nama |
  |---|---|---|
  | BRI | 108901019687509 | M RAFI ALHARIRI |
  | BCA | 4410040111 | M RAFI ALHARIRI |

  Balasan juga meminta bukti transfer dan mengingatkan bahwa **pelunasan**
  harus ke **M RAFI ALHARIRI**.
- **Pembayaran tidak mensyaratkan akun.** Klien yang belum terdaftar tetap
  boleh transfer; balasannya menambahkan "belum punya akun, itu tidak masalah —
  pembayaran tetap bisa dilakukan" lalu tautan pendaftaran
  (`https://wedding.aksaraa.com/register`, anak: `https://ceriavite.aksaraa.com/daftar`)
  supaya pembayarannya tercatat di akun. Klien yang sudah punya profil tidak
  disuruh daftar lagi.
- Setiap pertanyaan pembayaran **membuat tiket `payment`** supaya muncul di
  filter **Perlu** di `/ops/cs`, tetapi **AI tidak dijeda** (pola yang sama
  dengan voucher): klien biasanya langsung lanjut bertanya soal paket.
- Klaim sudah bayar / minta invoice / tagihan tetap eskalasi dengan jeda AI
  4 jam.
- Nomor rekening di dalam balasan tidak boleh dianggap PII nomor HP — guard
  membuang nomor yang menempel pada label bank sebelum memeriksa.
- Widget punya tombol WhatsApp di header chat menuju nomor tim.

## Alur "Bantu Isi Undangan"

Dipicu oleh intent isi/ubah data (`data_collection`/`data_change`).

1. **Web**: wajib login (cookie couple). Tamu anonim diarahkan ke `/login`.
   **WhatsApp**: nomor terdaftar → **PIN dari pendaftaran** (`users.pin`, 6 digit;
   `scanner_pin` lama tetap diterima). Salah 3×/10 menit → sambungkan tim.
2. **Template**: kalau belum ada, agent mengirim daftar template yang eligible
   (aktif, event_type cocok, package_eligibility sesuai paket) dan meminta nama
   template. Nama dicocokkan exact → partial; ambigu → sebutkan kandidat.
   In-house dipasang langsung; WP memakai rantai duplicate (409 kalau rantai
   lain masih jalan) dan agent menunggu job selesai.
3. **Data**: agent berjalan per bagian mengikuti `getPublishBlockers`
   (`profil → acara → galeri → kutipan → kisah cinta → video → turut mengundang`
   dst), satu pertanyaan per pesan. Validasi memakai validator editor
   (`profileFields`), jadi format tanggal/jam/link sama.
   - Sesi acara & kisah cinta ditanya sub-field satu per satu, lalu disimpan
     sebagai array setelah lolos `validateField`.
   - Foto lewat tombol upload di widget (`POST /api/cs/upload`, hanya saat
     `pendingUpload`), atau media WhatsApp (gateway harus meneruskan
     `media_url`; file diunduh ke storage kita, bukan URL WA).
   - Setiap jawaban langsung ditulis ke `wedding_profiles` + patch WP bila ada
     `active_wp_post_id`, dan dicatat di `cs_audit`.
4. **Pratinjau**: `https://wedding.aksaraa.com/preview/{id}` (belum tayang).
5. **Konfirmasi**: "sudah oke?" → belum: sebutkan bagian, agent mengulang bagian
   itu; sudah: agent mengirim tautan **pratinjau editor** (`/dashboard/{id}/web-invitation/editor?review=1`,
langsung membuka layar pratinjau + tombol Konfirmasi, bukan form isi)
   dengan instruksi login → pratinjau → tombol **Konfirmasi**.
   Jangan memakai `/dashboard/{id}/web-invitation` (itu hanya halaman hub berisi
   kartu feedback/templates/editor, tanpa tombol publikasi).
   **Agent tidak pernah mempublikasikan sendiri.**
6. **Hadiah** (rekening/alamat) sengaja tidak diisi lewat chat: agent
   mengarahkan ke dashboard karena menyangkut uang.

State flow disimpan di `cs_profile_drafts.draft.__onboarding` (tanpa migration)
dan bisa dilanjutkan kapan saja dengan "bantu isi undangan".

## Ops membalas percakapan web

- `POST /api/ops/cs` `action: "reply"` sekarang menerima percakapan `web`
  (tanpa nomor): balasan disimpan dan diambil widget lewat
  `GET /api/cs/chat?conversationId=…&since=…` (polling 5 detik).
- WhatsApp tetap memakai gateway (`CS_WA_SEND_URL` → default gateway lama).
- Re-engagement anonim hanya mungkin kalau nomor WA diminta dengan consent;
  tanpa nomor, tiket ditutup setelah sehari.

## Permukaan widget

Widget hanya muncul di halaman marketing (allowlist di
`src/lib/cs/widgetRoutes.ts`): `/hero`, `/templates` (+ kategori),
`/premium-web-invitation`, `/qr-digital-buku-tamu`, `/virtual-wish-wall`,
`/reminder-tamu-vip`, `/galeri-kenangan-tamu`, `/fitur` (+ sub), `/artikel`
(+ slug), `/portofolio` (+ slug), `/checklist-nikah`, `/kalkulator-budget`,
`/design`.

Tidak pernah tampil di: `/w/[slug]`, `/preview`, `/scanner`, `/qr*`, `/led`,
`/g`, `/q`, `/welcome`, `/dashboard`, `/ops`, `/register`, `/login`,
`/customize`, `/daftar`.

Kill switch: `NEXT_PUBLIC_CS_WIDGET=0` saat build (mematikan widget),
`cs_settings.enabled=false` di DB (mematikan agent tanpa deploy).
