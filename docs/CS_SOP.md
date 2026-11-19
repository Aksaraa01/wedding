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

## Toggle AI per percakapan (ambil alih manual)

Setiap percakapan punya satu pemilik: `bot` atau `human` (`cs_conversations.status`).
Tombol **AI aktif / AI dijeda** di `/ops/cs` adalah satu-satunya kontrol.

- **AI dijeda** = `status = human`. AI tidak membalas pesan baru maupun pesan
  yang sedang diproses; pesan klien tetap tersimpan supaya tim melihatnya.
- **Membalas dari WhatsApp** (HP atau WhatsApp Web, termasuk lampiran) otomatis
  mematikan AI untuk percakapan itu, dan pesannya disimpan sebagai pesan keluar
  (`model = human:wa`) — bukan sebagai ucapan klien.
- **AI aktif** = `status = bot`. Balasan otomatis jalan lagi; tidak ada balasan
  susulan untuk pesan lama.
- Balasan tim dari `/ops/cs` ditandai `model = human:ops`, dan otomatis menjeda AI.
- Perubahan toggle dicatat di `cs_audit` (`ai_off` / `ai_on`) beserta sumbernya.
- Gateway punya blok 120 detik terakhir: kalau manusia membalas saat bot sedang
  menyusun jawaban, balasan bot dibatalkan sebelum dikirim.

## Matriks topik

| Topik | Perilaku | Alasan / prioritas |
|---|---|---|
| Harga, paket, bandingkan vendor | jawab lewat tool (`quote`, `list_packages`) | — |
| Template spesifik ("ada yang adat batak?", "rekomendasi elegan") | tool `list_templates` — sebut maksimal beberapa contoh | — |
| **Minta SEMUA template / "lihat di mana" / daftar / galeri** | **balasan tetap dari kode: `https://wedding.aksaraa.com/templates`** (Ceriavite: `https://ceriavite.aksaraa.com`) | jangan kirim 3–8 link preview dan jangan sebut "ada N template" dari cuplikan tool |
| Estimasi waktu, pertanyaan teknis, undangan cetak | jawab dari kebijakan | — |
| Rekomendasi paket, nego pertama, pilih paket, cara daftar | playbook (qualify / objection / cta) | — |
| Nego berulang | eskalasi | `discount` · normal |
| **Voucher / kode promo / potongan khusus** | **"Boleh aku cek dulu ya Kak…" + tiket ke tim** | `voucher` · normal · **AI tidak dijeda** |
| Status undangan / isi data, belum terverifikasi | minta verifikasi nomor dulu | — |
| Status undangan / isi data, nomor terverifikasi tapi profil tidak ada | eskalasi | `no_profile` · normal |
| Minta manusia / telepon | eskalasi | `human_requested` · high |
| Refund / pembatalan | eskalasi | `refund` · high |
| Ubah data undangan (nama, foto, rekening, nomor) | verifikasi PIN dulu → eskalasi | `data_change` · normal |
| Ubah tanggal | eskalasi | `reschedule` · high |
| Komplain | eskalasi | `complaint` · high |
| Bukti bayar / invoice / DP / cicilan | eskalasi | `payment` · normal |
| "Cara bayar?" (belum klaim) | jawab nomor tim + link WhatsApp | `contact` (tanpa tiket) |
| Politik, saham, judi, pinjol, medis | tolak sopan | — |
| Tidak jelas + marah atau 2× gagal | eskalasi | `low_confidence` · normal |
| Guard menolak output model | fallback "aku cek dulu ke tim" + eskalasi | `low_confidence` · normal |

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

- "Cara bayar" dijawab deterministik: nomor tim `6281161613071` + tautan
  `wa.me` (tidak membuat tiket).
- Klaim sudah bayar / minta invoice / tagihan tetap jadi tiket `payment`.
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
