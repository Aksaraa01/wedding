# CS vibe bench — 2026-11-03

Skor adalah heuristik (frasa AI, bullet, panjang, emoji, harga).
Penentu akhir tetap blind test bersama tim sales.

| Model | Latency | Biaya total | Kata (rata2) | Frasa AI | Harga salah | Kosong | Skor |
|---|---|---|---|---|---|---|---|
| anthropic/claude-haiku-5.5 | 2031 ms | $0.001265 | 33 | 0 | 0 | 0 | **100** |
| openai/gpt-6-luna | 3383 ms | $0.000885 | 22 | 0 | 0 | 0 | **99** |
| qwen/qwen3.8-flash | 9775 ms | $0.002392 | 20 | 0 | 1 | 0 | **98** |
| google/gemini-3.8-flash | 6974 ms | $0.028951 | 25 | 0 | 1 | 0 | **98** |
| deepseek/deepseek-v4.1-flash | 2867 ms | $0.002148 | 22 | 0 | 1 | 0 | **97** |
| z-ai/glm-5.3-flash | 2823 ms | $0.000251 | 32 | 0 | 1 | 0 | **97** |

## anthropic/claude-haiku-5.5

**harga** — klien: halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an

> Halo Kak, dengan budget sekitar 5 juta, pilihan Signature (Rp 2.500.000) atau Prestige (Rp 4.000.000) sama-sama masuk. Boleh tahu perkiraan jumlah tamu dan kebutuhan utama Kakak supaya saya bisa bantu memilih yang paling pas?

34 kata · 1 tanya · 0 emoji · 2744 ms · finish=stop · reasoning=136

**komplain** — klien: knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih

> Mohon maaf ya Kak, keterlambatannya bikin tidak nyaman. Saya cek dulu status pesanan dan jadwal cetak Kakak ke tim produksi, lalu saya kabari secepatnya. Boleh saya tahu nomor pesanan atau nama pemesan supaya bisa langsung saya cari?

37 kata · 1 tanya · 0 emoji · 1666 ms · finish=stop · reasoning=0

**teknis** — klien: kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple

> Untuk kebijakan link undangan per pasangan, aku belum punya info pastinya, jadi aku cek dulu ya, Kak. Boleh tahu paket yang Kakak pilih sudah Essential, Signature, atau Prestige?

28 kata · 1 tanya · 0 emoji · 2513 ms · finish=stop · reasoning=193

**android** — klien: kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul

> Maaf ya Kak, untuk undangan di HP Android jadul biasanya memang ada kendala aplikasi atau browser yang belum mendukung. Boleh Kak kirim tipe HP dan versi Android-nya, atau screenshot pesan error yang muncul, biar kami bisa cek dulu?

38 kata · 1 tanya · 0 emoji · 1500 ms · finish=stop · reasoning=0

**nego** — klien: mahal bgt ya kak, bisa kurang ga?

> Mohon maaf ya Kak, untuk diskon saya belum bisa memastikan, nanti saya cek dulu ke tim. Kalau budget Kakak lebih terbatas, ada paket Essential mulai Rp 1.500.000, boleh saya tahu kira-kira budget Kakak berapa?

34 kata · 1 tanya · 0 emoji · 2150 ms · finish=stop · reasoning=110

## openai/gpt-6-luna

**harga** — klien: halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an

> Dengan budget sekitar Rp5 juta, paket Prestige Rp4.000.000 masih masuk, Kak. Biar aku cek mana yang paling worth it untuk kebutuhan Kak, layanan apa yang paling diprioritaskan?

27 kata · 1 tanya · 0 emoji · 4820 ms · finish=stop · reasoning=193

**komplain** — klien: knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih

> Maaf banget ya, Kak, undangannya belum selesai padahal dijanjikan 3 hari. Aku cek dulu statusnya ke tim dan segera kabari Kak.

21 kata · 0 tanya · 0 emoji · 2773 ms · finish=stop · reasoning=54

**teknis** — klien: kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple

> Bisa, Kak. Nanti satu link undangan bisa mencantumkan dua nama tamu yang datang bersama 😊

15 kata · 0 tanya · 1 emoji · 1708 ms · finish=stop · reasoning=0

**android** — klien: kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul

> Maaf ya Kak, aku bantu cek. Boleh kirim screenshot tampilan atau pesan error yang muncul di HP ortu?

18 kata · 1 tanya · 0 emoji · 3747 ms · finish=stop · reasoning=121

**nego** — klien: mahal bgt ya kak, bisa kurang ga?

> Paham Kak, aku cek dulu ya apakah ada opsi yang lebih sesuai budget. Kira-kira budget yang Kak siapkan berapa?

19 kata · 1 tanya · 0 emoji · 3249 ms · finish=stop · reasoning=111

## qwen/qwen3.8-flash

**harga** — klien: halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an

> Prestige Rp 4.000.000 biasanya paling pas buat budget Kakak kalau mau paket yang lebih premium. Kakak mau aku bantu cek ketersediaan tanggal Desember 2026? 😊

25 kata · 1 tanya · 1 emoji · 5244 ms · finish=stop · reasoning=208

**komplain** — klien: knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih

> Mohon maaf Kak, aku cek dulu status undangan yang DP 2 minggu lalu ya. Boleh kirim nomor pesanan atau nama acara biar aku lacak?

24 kata · 1 tanya · 0 emoji · 6969 ms · finish=stop · reasoning=302

**teknis** — klien: kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple

> Aku cek dulu ya Kak untuk aturan 1 link undangan bisa dipakai couple atau tidak. Kakak pakai paket Essential, Signature, atau Prestige?

22 kata · 1 tanya · 0 emoji · 11048 ms · finish=stop · reasoning=302

**android** — klien: kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul

> Kak bisa kirim link atau screenshot error-nya? Biar aku bantu cek dulu ya 🙏

14 kata · 1 tanya · 1 emoji · 12945 ms · finish=stop · reasoning=296

**nego** — klien: mahal bgt ya kak, bisa kurang ga?

> Harga paket Aksaraa sudah sesuai masing-masing ya Kak. Kakak sedang cek paket yang mana? 😊

15 kata · 1 tanya · 1 emoji · 10606 ms · finish=stop · reasoning=597

## google/gemini-3.8-flash

**harga** — klien: halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an

> Halo Kak! Dengan budget 5 juta, paket Prestige seharga Rp 4.000.000 paling worth it dan fiturnya paling lengkap. Acaranya nanti rencananya diadakan di kota mana nih, Kak? 😊

28 kata · 1 tanya · 1 emoji · 6652 ms · finish=stop · reasoning=610

**komplain** — klien: knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih

> Halo Kak, mohon maaf banget ya atas keterlambatan dan ketidaknyamanannya. Boleh tolong infokan nama pemesan atau nomor invoicenya biar langsung aku bantu cek ke tim sekarang? 🙏

27 kata · 1 tanya · 1 emoji · 4760 ms · finish=stop · reasoning=467

**teknis** — klien: kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple

> Bisa banget Kak, nanti penulisan nama di undangannya bisa langsung digabung untuk berdua. Rencananya ada berapa banyak tamu yang mau diundang nih, Kak? 😊

24 kata · 1 tanya · 1 emoji · 10325 ms · finish=stop · reasoning=858

**android** — klien: kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul

> Halo Kak, mohon maaf ya atas kendalanya. Boleh diinfokan saat dibuka tampilannya seperti apa atau ada pesan error tertentu Kak? 🙏

21 kata · 1 tanya · 1 emoji · 6975 ms · finish=stop · reasoning=600

**nego** — klien: mahal bgt ya kak, bisa kurang ga?

> Harga paket kami saat ini sudah nett ya, Kak, tapi kami ada pilihan paket Essential mulai dari Rp 1.500.000. Boleh tahu sebelumnya Kakak lagi tertarik dengan paket yang mana?

29 kata · 1 tanya · 0 emoji · 9823 ms · finish=stop · reasoning=476

## deepseek/deepseek-v4.1-flash

**harga** — klien: halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an

> Halo Kak, untuk budget 5jt-an paket Prestige Rp4.000.000 masih masuk, tapi paling worth-nya tergantung prioritas Kak. Kak lebih prioritas ke bagian apa?

22 kata · 1 tanya · 0 emoji · 6098 ms · finish=stop · reasoning=585

**komplain** — klien: knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih

> Maaf banget ya Kak atas keterlambatannya, saya paham ini bikin Kakak nggak nyaman. Saya cek dulu ke tim produksi soal pesanan Kakak, boleh info nama pemesan atau nomor ordernya?

29 kata · 1 tanya · 0 emoji · 2368 ms · finish=stop · reasoning=51

**teknis** — klien: kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple

> Aku cek dulu ya Kak, untuk satu link apakah bisa dipakai dua nama sekaligus. Kira-kira ada berapa tamu couple yang mau Kakak undang?

23 kata · 1 tanya · 0 emoji · 1953 ms · finish=stop · reasoning=270

**android** — klien: kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul

> Waduh, maaf ya Kak. Boleh info merek dan versi Android HP ortu? Nanti aku cek solusinya.

16 kata · 1 tanya · 0 emoji · 1748 ms · finish=stop · reasoning=229

**nego** — klien: mahal bgt ya kak, bisa kurang ga?

> Baik Kak, untuk potongan harga saya cek dulu ya. Boleh tahu paket mana yang Kakak minati?

16 kata · 1 tanya · 0 emoji · 4725 ms · finish=stop · reasoning=689

## z-ai/glm-5.3-flash

**harga** — klien: halo kak, paket yg paling worth it yg mana ya? aku nikah des 2026, budget 5jt an

> Halo Kak! Dari paket kami, Signature Rp 2.500.000 biasanya paling pas di tengang tuh, masuk budget Kaki dengan nyaman. Boleh tahu Kak lebih prioritize apa untuk pernikahan December 2026 nanti, biar aku bisa kasih rekomendasi yang paling cocok?

38 kata · 1 tanya · 0 emoji · 2285 ms · finish=stop · reasoning=75

**komplain** — klien: knp undangan aku blm jadi? udh 2 minggu dari DP katanya 3 hari, ini gmn sih

> Mohon maaf banget ya Kak atas keterlambatannya, ini bukan standar pelayanan kami dan aku pahami banget rasa frustrasinya. Aku akan langsung cek status pesanan dan desain undangannya sekarang, lalu kabari Kak hari ini juga soal kapan pasti bisa selesai. Boleh aku tahu nomor pesanan atau nama pemesannya, Kak?

48 kata · 1 tanya · 0 emoji · 1683 ms · finish=stop · reasoning=0

**teknis** — klien: kak, 1 link undangan bisa buat 2 orang ga? soalnya tamuku banyak yg couple

> Sebentar ya Kak, aku cek dulu ke tim soal satu link undangan untuk tamu couple, biar jawabannya akurat. Nanti langsung aku kabari ya Kak.

24 kata · 0 tanya · 0 emoji · 2923 ms · finish=stop · reasoning=293

**android** — klien: kak ini undangan aku kok ga bisa dibuka ya di hp ortu? hp nya android jadul

> Maaf banget Kak, ada kendala di HP ortunya ya 🙏 Coba dijelasin dulu, pas dibuka munculnya gimana — blank, loading lama, atau ada tulisan error tertentu? Biar aku bisa cek dan bantu solusinya yang pas.

35 kata · 1 tanya · 1 emoji · 3036 ms · finish=stop · reasoning=204

**nego** — klien: mahal bgt ya kak, bisa kurang ga?

> Untuk paket Essential sendiri sudah mulai dari Rp 1.500.000 Kak, dan harganya sudah paling best value dengan semua fiturnya. Kalau boleh tahu, kira-kira budget Kakak di angka berapa ya? Nanti aku cek paket mana yang paling cocok.

37 kata · 1 tanya · 0 emoji · 1879 ms · finish=stop · reasoning=37
