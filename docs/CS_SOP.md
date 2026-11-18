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

## Matriks topik

| Topik | Perilaku | Alasan / prioritas |
|---|---|---|
| Harga, paket, template, bandingkan vendor | jawab lewat tool (`quote`, `list_packages`, `list_templates`) | — |
| Estimasi waktu, pertanyaan teknis, undangan cetak | jawab dari kebijakan | — |
| Rekomendasi paket, nego pertama, pilih paket, cara daftar | playbook (qualify / objection / cta) | — |
| Nego berulang | eskalasi | `discount` · normal |
| **Voucher / kode promo / potongan khusus** | **"Boleh aku cek dulu ya Kak…" + tiket ke tim** | `voucher` · normal · **AI tidak dijeda** |
| Status undangan / isi data, belum terverifikasi | minta verifikasi nomor dulu | — |
| Status undangan / isi data, nomor terverifikasi tapi profil tidak ada | eskalasi | `no_profile` · normal |
| Minta manusia / telepon | eskalasi | `human_requested` · high |
| Refund / pembatalan | eskalasi | `refund` · high |
| Ubah tanggal | eskalasi | `reschedule` · high |
| Komplain | eskalasi | `complaint` · high |
| Bukti bayar / invoice / DP / cicilan | eskalasi | `payment` · normal |
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
5. Ping grup ops via WhatsApp (`WA_TARGET_GROUP_JID`).

Tiket `voucher` yang masih `open` tidak dibuat ulang pada pesan berikutnya
(satu tiket per percakapan), supaya grup ops tidak dibanjiri pesan.

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
