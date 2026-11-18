# REA — AI Customer Service Aksaraa Wedding

Status: draft v1 — 2026-11-03
Scope: **internal Aksaraa saja** (bukan SaaS multi-tenant)
Channel: web widget + WhatsApp. **Pilot memakai nomor bot yang sudah ada**
(`pencatatan`, port 3001) dengan allowlist nomor uji; produksi pindah ke nomor
baru.

Referensi produk: Halo AI (haloai.co.id). Yang diambil: jawaban grounded,
self-check, handoff ke manusia, inbox, analytics. Yang **tidak** diambil: AI
voice, marketplace, IG DM, CRM pipeline, multi-tenant.

## Status implementasi (2026-11-03)

| Bagian | Status |
|---|---|
| Aturan batas + keputusan eskalasi | `src/lib/cs/policy.ts` — selesai |
| Verifikasi nomor terdaftar + OTP | `src/lib/cs/identity.ts` — selesai |
| Guard output (harga, klaim, PII, link) | `src/lib/cs/guard.ts` — selesai |
| Field pengisian data + validasi | `src/lib/cs/profileFields.ts` — selesai |
| Test deterministik + loop agent + SOP (166 kasus) | `npm run test:cs` — 166/166 lulus |
| Skema DB | `20261054000000_cs_agent` + `20261055000000_cs_leads` — sudah di lokal, staging, dan prod |
| Orchestrator LLM + tool | `src/lib/cs/orchestrator.ts`, `agentLoop.ts`, `tools.ts` — selesai |
| Route inbound `POST /api/cs/wa/inbound` | selesai |
| SOP sales: playbook, lead, rekomendasi paket | `src/lib/cs/playbook.ts`, `leads.ts`, migration `20261055000000` — selesai |
| Inbox ops `/ops/cs` (list, transkrip, lead, ambil alih, balas, tutup) | selesai |
| Widget web + `POST /api/cs/chat` | marketing-only (`src/lib/cs/widgetRoutes.ts`) + `/design`; prod masih `NEXT_PUBLIC_CS_WIDGET=0` |
| Batas voucher | semua pertanyaan voucher → tiket `voucher` + "cek dulu ke tim", AI tidak dijeda |
| Knowledge base + sitasi | `cs_documents`/`cs_chunks` (artikel + FAQ kurasi), `npm run cs:ingest`, sitasi deterministik |
| SOP & matriks eskalasi | `docs/CS_SOP.md` |
| Patch gateway nomor pilot | lihat `docs/CS_PILOT.md` |

---

## 0. Keputusan yang sudah dikunci

| # | Keputusan | Alasan |
|---|---|---|
| 1 | Melayani **calon klien (sales)** dan **klien existing (support)** | Guest concierge per undangan ditunda (biaya WA + risiko privasi tamu) |
| 2 | Satu tenant: Aksaraa | Tidak ada billing, onboarding, isolasi lintas vendor |
| 3 | **Pilot** memakai nomor bot `pencatatan` dengan allowlist nomor uji; **produksi** pindah ke nomor baru + gateway terpisah | Uji cepat tanpa pairing ulang; allowlist mencegah bot membalas klien asli selama percobaan |
| 4 | Orchestrator LLM hidup di app ini; gateway WA tetap tipis | Reuse auth ops, deploy, dan akses data; gateway hanya transport |
| 5 | Fakta angka (harga, tier, voucher, status) **selalu** lewat tool ke DB live | Tidak boleh ada harga hasil embedding/tebakan |
| 6 | Widget **tidak** dipasang di `/w/[slug]` | Invariant performa undangan (origin ~4 Mbps, tanpa CDN HTML) |

**Non-goals v1:** multi-tenant, AI voice/calling, IG DM, Shopee/Tokopedia,
guest concierge, proactive blast (sudah ada `wa_blast_schedules`), CRM pipeline.

---

## 1. Masalah & tujuan

CS Aksaraa sekarang manual: WA masuk ke satu nomor, dijawab bergiliran oleh ops.
Pertanyaan berulang mendominasi (harga paket, beda paket, template, cara daftar,
status produksi), sementara pertanyaan bernilai tinggi (komplain, refund,
perubahan tanggal) tenggelam.

Tujuan terukur (3 bulan setelah live):

| KPI | Target |
|---|---|
| Containment (selesai tanpa handoff) | ≥ 60% bulan 1, ≥ 75% bulan 3 |
| First response time | < 10 detik, 24/7 |
| Salah harga terkirim | **0** (audit harian 20 sampel) |
| Handoff yang seharusnya bisa dijawab | < 10% |
| CSAT ("jawaban ini membantu?") | ≥ 4.3 / 5 |
| Biaya LLM per percakapan | < Rp 1.000 |

---

## 2. Aktor & alur

### 2.1 Calon klien (belum punya akun)
Landing page → widget "Tanya CS" → tanya paket/harga/template → agent menjawab
dengan tool harga → CTA `/register?template=CODE` atau `/templates` → kalau ragu
atau minta nego → handoff ke ops.

### 2.2 Klien existing
Dashboard → "Hubungkan WhatsApp CS" → dapat kode 6 karakter (10 menit) → kirim
kode ke nomor CS → `cs_contacts.wedding_profile_id` terisi → agent boleh
memanggil tool `my_profile_status` / `my_guest_summary`.

Tanpa verifikasi, agent **tidak** boleh membocorkan status, nomor tamu, alamat,
atau data hadiah — hanya jawaban generik + tautan dashboard.

### 2.3 Ops
`/ops/cs` → daftar percakapan (bot / human / closed) → buka transkrip + alasan
eskalasi → ambil alih (status `human`, AI pause) → balas dari inbox (lewat nomor
CS baru) → lepas kembali ke bot.

### 2.4 Alur eskalasi
```
trigger (minta manusia | 2x tidak terjawab | refund/komplain | negatif | data sensitif)
  → insert cs_escalations + cs_conversations.status='human' + ai_paused_until
  → ping grup ops (reuse notifyGroup / nomor bot lama)
  → ops balas dari inbox atau dari HP (fromMe → AI tetap diam)
```

---

## 3. Arsitektur

```
Landing / Templates / Dashboard        WhatsApp (pilot: nomor lama + allowlist)
        │                                     │
        │  POST /api/cs/chat (SSE)            │  gateway Baileys
        │                                     │  (PM2: aksaraa-cs-wa, :3101)
        └──────────────┬──────────────────────┘
                       │  x-cs-gateway-secret
                       ▼
              /api/cs/wa/inbound  (di app ini, Node runtime)
                       │
                       ▼
              Agent orchestrator
                ├── tools (server-side, read-only, tervalidasi)
                │     price_book · packages · templates · vouchers
                │     my_profile_status · my_guest_summary (butuh verifikasi)
                ├── RAG (cs_chunks, pgvector) FAQ / artikel / kebijakan
                ├── guardrail + self-check (angka wajib dari tool)
                └── handoff → cs_escalations + ping grup ops
                       │
              cs_contacts · cs_conversations · cs_messages
              cs_usage · cs_unanswered · cs_settings
```

**Kenapa gateway dipisah:** socket Baileys harus hidup terus, sedangkan proses
Next di-restart setiap deploy. Gateway tidak boleh berisi logika bisnis — dia
hanya: terima pesan → normalize → POST ke app → kirim balasan. Kalau app error,
gateway mengirim fallback ("CS kami akan membalas sebentar lagi") dan menandai
percakapan untuk eskalasi.

**Kenapa nomor dipisah:** bot `pencatatan` (port 3001) tetap dipakai untuk
notifikasi grup dan blast. Nomor CS baru hanya untuk percakapan CS. Kalau nomor
CS kena ban, blast & notifikasi tetap hidup.

---

## 4. Model data

Migrasi baru: `supabase/migrations/20261054000000_cs_agent.sql`
(versi harus unik — **catatan: `20261045000000` saat ini duplikat**,
`adat_bugis` vs `cinnabar_seal`; bereskan dulu sebelum `db push`, lihat AGENTS.md).

```sql
create extension if not exists vector;

create table cs_contacts (
  id uuid primary key default gen_random_uuid(),
  wa_jid text unique,                 -- 628xx@s.whatsapp.net (hasil resolve LID)
  phone text,
  name text,
  user_id uuid references users(id),
  wedding_profile_id uuid references wedding_profiles(id),
  verified_at timestamptz,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  blocked boolean default false,
  notes text
);

create table cs_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references cs_contacts(id),
  channel text not null check (channel in ('web','wa')),
  status text not null default 'bot' check (status in ('bot','human','closed')),
  ai_paused_until timestamptz,
  assigned_to uuid references employees(id),
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  message_count int default 0,
  intent text,
  sentiment text,
  escalated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now()
);

create table cs_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references cs_conversations(id),
  direction text not null check (direction in ('in','out')),
  role text not null check (role in ('user','assistant','system','tool')),
  wa_message_id text unique,          -- idempotency: event reconnect tidak dobel
  body text,
  media_type text,
  media_url text,
  tool_calls jsonb,
  tool_result jsonb,
  model text,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  error text,
  created_at timestamptz default now()
);

create table cs_documents (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('faq','page','article','manual')),
  title text not null,
  url text,
  checksum text not null,
  active boolean default true,
  updated_at timestamptz default now()
);

create table cs_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references cs_documents(id) on delete cascade,
  heading text,
  content text not null,
  embedding vector(1536),
  token_count int,
  updated_at timestamptz default now()
);
create index on cs_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Kode 6 karakter untuk menautkan nomor WA ke akun pasangan (sekali pakai).
create table cs_verify_codes (
  code text primary key,
  user_id uuid not null references users(id),
  wedding_profile_id uuid not null references wedding_profiles(id),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table cs_escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references cs_conversations(id),
  reason text not null,
  summary text,
  status text not null default 'open' check (status in ('open','claimed','done')),
  claimed_by uuid references employees(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table cs_unanswered (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references cs_conversations(id),
  question text not null,
  reason text,
  resolved boolean default false,
  created_at timestamptz default now()
);

create table cs_settings (
  id smallint primary key default 1 check (id = 1),
  persona text,
  model text not null,
  temperature numeric default 0.3,
  guardrails jsonb,
  business_hours jsonb,
  widget_enabled boolean default true,
  updated_at timestamptz default now()
);

create table cs_usage (
  day date not null,
  channel text not null,
  inbound int default 0,
  outbound int default 0,
  llm_calls int default 0,
  input_tokens int default 0,
  output_tokens int default 0,
  cost_idr numeric default 0,
  primary key (day, channel)
);
```

Akses: **service role saja**. Tidak ada policy anon. Halaman ops memakai
`requireOps` yang sudah ada.

Retensi: `cs_messages` 90 hari, media 30 hari, `cs_usage` agregat permanen.
Job harian di `/api/cron` (sudah ada) menghapus yang kedaluwarsa.

---

## 5. Sumber pengetahuan

### 5.1 Prosa (RAG)
| Sumber | Cara ambil |
|---|---|
| FAQ landing (10 halaman `SeoFaq`) | ekstrak array `items` saat build → JSON |
| `src/app/fitur/*` | crawl build lokal, ambil main text |
| `src/app/artikel/[slug]` | idem, dari `sitemap.ts` |
| Kebijakan (refund, ubah tanggal, revisi) | **manual input** — belum ada di repo |
| Panduan klien (`dashboard/[id]/instruksi`) | crawl |

Script `scripts/cs-ingest.mjs`:
1. kumpulkan dokumen (`docs`), hitung checksum;
2. yang berubah saja → chunk per heading 400–700 token, overlap 80;
3. embed → upsert `cs_chunks`;
4. dokumen yang hilang → `active = false`, chunk dihapus.

Jangan meng-embed harga/tier/template: itu tool. Embedding boleh menyebut
"Signature punya X", tapi angka hidup selalu dari tool.

### 5.2 Tool (server-side, read-only)
| Tool | Sumber | Aturan |
|---|---|---|
| `list_packages()` | `packages`, `package_features` | harga dari `getPriceBook()` |
| `quote(package, wa_tier, express, galeri_tier, voucher)` | `calcTotalWithVoucherBook()` | satu-satunya cara agent menyebut angka |
| `list_templates(category?, has_photos?, limit?)` | `web_templates` + `templateCategory` | kembalikan nama + `demo_url` |
| `check_voucher(code)` | `vouchers` | valid/tidak + besar diskon |
| `my_profile_status()` | `wedding_profiles` | **hanya** bila `verified_at` |
| `my_guest_summary()` | `guests` | **hanya** bila `verified_at`; tanpa nomor HP |
| `create_handoff(reason, summary)` | `cs_escalations` | selalu boleh |

Aturan keras:
- LLM tidak pernah menulis SQL, tidak fetch URL sembarang.
- Semua argumen divalidasi (enum/kode), bukan string bebas.
- `quote` dipanggil walau user hanya "kira-kira berapa" — agent tidak boleh
  menghitung sendiri.

---

## 6. Perilaku agent

**Persona:** "Aksaraa Wedding CS" — Bahasa Indonesia, hangat, ringkas, tanpa
emoji berlebihan, menyapa "Kak". Code-switching (ID/EN) diikuti. Maksimal 3
kalimat + 1 CTA per balasan WhatsApp (satu bubble, hemat biaya).

**Guardrail:**
1. Angka (harga, diskon, jumlah tamu, tanggal) wajib berasal dari hasil tool pada
   giliran yang sama. Post-check: ekstrak semua angka di balasan → harus ada di
   `tool_result`; kalau tidak → regenerate sekali, lalu fallback eskalasi.
2. Tidak menjanjikan tanggal jadi, refund, atau diskon di luar tool.
3. Tidak membandingkan dengan kompetitor, tidak memberi nasihat hukum/agama.
4. Data pasangan/tamu hanya setelah verifikasi; nomor HP tamu selalu dimask.
5. Konten hasil RAG diperlakukan sebagai **data**, bukan instruksi (anti prompt
   injection). System prompt menegaskan hierarki: system > tool > user > retrieved.
6. Maksimal 2 balasan tanpa kemajuan → eskalasi.
7. Pertanyaan di luar topik (politik, medis, dll) → tolak sopan + arahkan ke CS
   manusia bila perlu.

**Kapan eskalasi:** minta manusia, refund/komplain, ubah tanggal/paket, data
sensitif, 2x gagal, sentimen negatif, atau user marah.

**Takeover manusia:** balasan manual dari HP terdeteksi sebagai `fromMe` →
`ai_paused_until = now() + 4 jam`. Ops juga bisa pause permanen dari inbox.

---

## 7. WhatsApp channel (pilot nomor lama → produksi nomor baru)

### 7.1 Gateway `aksaraa-cs-wa`
Repo/folder terpisah di VPS: `/var/www/aksaraa-cs-wa` (bukan di dalam
`pencatatan`, bukan folder auth yang sama). PM2 app sendiri, port `3101`.

Endpoint:
```
POST /send        { to, text }          (header x-cs-gateway-secret)
POST /presence    { to, state }         (composing/paused)
GET  /status      { ready, phone }
GET  /qr          (HTML, hanya dengan secret)
GET  /health
```
Inbound: `messages.upsert` (type `notify`) → filter `!fromMe` → **hapus filter
`@g.us`** → debounce 4 detik → normalize LID→PN → `POST /api/cs/wa/inbound` →
kirim balasan yang dikembalikan app (maks 20 detik; timeout → fallback + eskalasi).

### 7.2 Kesiapan operasional nomor
- SIM/eSIM khusus; WhatsApp Business App **tidak** dipasang di HP yang sama.
- Pairing lewat `/qr` di balik secret, atau pairing code.
- Warm-up 1–2 minggu: chat internal, volume kecil, balasan manusiawi.
- Profil nomor: nama "Aksaraa Wedding CS", foto, jam operasional.
- Nomor lama **tetap** untuk grup ops & blast (`WA_SCHOOL_API_URL`).
- Kontrak risiko: Baileys tidak resmi. Kalau nomor kena ban, nomor cadangan
  sudah disiapkan dan widget web tetap jalan.

### 7.3 Biaya & batas
Baileys: tanpa biaya per pesan. Tetap dibatasi:
- maks 3 balasan otomatis beruntun per kontak tanpa pesan baru;
- rate limit per nomor (mis. 20 pesan/menit) → hindari pola bot;
- tidak mengirim pesan inisiatif (blast tetap lewat jalur lama).

---

## 8. Web widget

- Komponen client `src/components/cs/CsWidget.tsx`, di-mount hanya di
  `landing`, `templates`, `premium-web-invitation`, `fitur/*`, `dashboard`.
- **Tidak** di `w/[slug]`, `preview`, `scanner` (invariant performa).
- Lazy: tombol floating → panel baru memuat JS chat saat diklik.
- Streaming via `POST /api/cs/chat` (SSE), `runtime = "nodejs"`.
- Identitas: anon session cookie (`cs_session`), rate limit per IP memakai
  `src/lib/rateLimit.ts`.
- Tombol "Hubungkan akun" untuk klien existing (kode 6 karakter).
- Ikon baru harus masuk subset Material Symbols di `src/app/layout.tsx`
  (`scripts/check-material-icons.mjs` jalan di deploy guard).

---

## 9. Ops inbox

`/ops/cs` (server component + client chat panel):
- list: open/human/closed, filter "perlu perhatian", urut `last_inbound_at`;
- detail: transkrip, tool calls (collapsible), alasan eskalasi, tombol
  Ambil Alih / Lepas / Tutup / Blokir;
- balas dari inbox → gateway `/send`;
- canned replies dari `cs_settings`/tabel kecil;
- tautan ke `/ops/antrian/[id]` bila topiknya produksi.
- Realtime: polling 5 detik (`useVisiblePoll` sudah ada) — tidak perlu websocket.

Notifikasi grup ops saat eskalasi memakai `notifyGroup` (nomor bot lama). Jangan
duplikasi logika kirim.

---

## 10. Identitas & data klien existing

Dua jalur:
1. **Kode verifikasi** (utama): dashboard → generate `cs_verify_codes` (6 char,
   expiry 10 menit, sekali pakai) → user kirim ke nomor CS → cocokkan → set
   `cs_contacts.wedding_profile_id`, `verified_at`.
2. **Magic link**: dari widget setelah login dashboard (cookie sesi app).

Tool status hanya aktif bila `verified_at` tidak null **dan** `wedding_profile_id`
milik user tersebut. Tool mengembalikan ringkasan (status, blocker, jumlah tamu,
RSVP), tidak pernah daftar tamu mentah atau nomor HP.

---

## 11. Strategi test — memastikan test case-nya benar

Lima lapis, dari yang paling murah dan deterministik:

1. **L1 — guard deterministik (tanpa LLM).** `npm run test:cs`
   (`scripts/cs-safety-test.mjs`), 65 kasus, wajib 100%. Menguji klasifikasi
   intent, keputusan eskalasi, verifikasi nomor, guard harga/klaim/PII/link, dan
   validasi field. Ini yang mencegah regresi paling berbahaya.
2. **L2 — golden conversation (LLM + tool mock).** Untuk tiap kasus: pesan
   klien + fixture hasil tool, lalu assert: tool yang dipanggil benar, semua
   angka di balasan ada di fixture, keputusan eskalasi sesuai, guard lolos.
3. **L3 — LLM-as-judge untuk tone.** Rubrik: panjang, satu pertanyaan, empati,
   tidak ada frasa AI. Judge **tidak** menilai fakta (itu tugas L1/L2).
4. **L4 — blind test manusia.** 30 pertanyaan, jawaban AI vs sales, acak.
   Target < 40% terdeteksi AI.
5. **L5 — produksi.** `cs_unanswered` tiap minggu + audit 20 sampel harga/hari.

Cara memastikan test case-nya sendiri benar:

- Ekspektasi harga diambil dari `getPriceBook()` saat test berjalan, bukan
  ditulis manual — kalau harga DB berubah, test ikut berubah.
- Kasus negatif wajib ada (harga salah, nomor orang lain, ubah paket, tanggal
  di masa lalu). Tanpa kasus negatif, test tidak membuktikan apa pun.
- Setiap bug produksi menjadi satu test baru **sebelum** diperbaiki.
- Model yang diuji tidak boleh menjadi penentu kebenaran jawabannya sendiri.

Eval set 100 pertanyaan (40 harga/paket, 20 template, 15 teknis, 10 status, 10
komplain, 5 di luar topik) diambil dari riwayat WA sales yang dianonimkan.
Gate: regresi harga = blokir deploy.

---

## 12. Keamanan, privasi, kepatuhan

- Secret: `CS_GATEWAY_SECRET` (gateway↔app), `CS_LLM_API_KEY`, `CS_ADMIN_TOKEN`.
  Tidak ada key di client.
- Log: nomor HP dimask; body pesan disimpan di `cs_messages` (bukan log PM2).
- PII: retensi 90 hari; endpoint hapus per kontak; jangan kirim PII ke provider
  LLM di luar yang perlu (kirim ringkasan, bukan dump).
- Provider LLM: pilih yang punya zero-retention / tidak melatih dari data API.
- UU PDP: banner widget + privacy policy diperbarui; percakapan service boleh
  dibalas tanpa opt-in marketing; pesan inisiatif butuh opt-in.
- PSE Komdigi: karena ini layanan internal + widget di situs sendiri, cek dengan
  legal apakah wajib daftar; jangan dijadikan blocker teknis.
- Audit: setiap tool call + hasilnya tersimpan di `cs_messages.tool_calls`,
  bisa direplay.

---

## 13. Deployment

Tambahan env (prod & staging):
```
CS_GATEWAY_URL=http://127.0.0.1:3101
CS_GATEWAY_SECRET=...
CS_LLM_API_KEY=...
CS_MODEL=...            # dipilih di P0
CS_EMBED_MODEL=...
CS_EMBED_DIM=1536
```

Langkah:
1. Migrasi: staging → verifikasi → prod (`db push`), setelah duplikat
   `20261045000000` dibereskan.
2. `npm run build` + `npm run deploy` seperti biasa (app utama).
3. Gateway: deploy terpisah `scripts/deploy-cs-wa.sh` (tarball + `pm2 startOrRestart
   ecosystem.config.js --only aksaraa-cs-wa --update-env`). **`npm run deploy`
   tidak mengelola proses ini** — dokumentasikan di AGENTS.md.
4. Tambahkan app ke `ecosystem.config.js` VPS (env dari file yang sama).
5. Smoke: `/api/cs/health`, kirim pesan uji dari 2 nomor, cek inbox ops.
6. RAM: gateway ±120–180 MB; total VPS sekarang 3.9 GB dengan 2.4 GB available
   → aman untuk satu socket.

---

## 14. Fase & estimasi

| Fase | Isi | Durasi |
|---|---|---|
| **P0** | REA final, eval set 100 pertanyaan, pilih model + embedding, spike RAG di 20 pertanyaan | 3–4 hari |
| **P1** | Migrasi + tool + RAG + `/api/cs/chat` + widget + `/ops/cs` dasar + eskalasi | 1.5–2 minggu |
| **P2** | Inbound 1:1 di nomor pilot (allowlist), debounce, LID, media/voice, takeover, fallback; lalu pindah ke nomor baru + gateway terpisah | 1–1.5 minggu |
| **P3** | Verifikasi klien existing, `my_profile_status`, analytics, retensi, hardening guardrail | 1 minggu |

Widget bisa live di akhir P1 (±2 minggu) tanpa menunggu WhatsApp. WhatsApp live
setelah warm-up nomor selesai.

---

## 15. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Harga salah | Kepercayaan & sengketa | tool-only + post-check angka + eval gate |
| Ban nomor Baileys | CS mati mendadak | nomor cadangan, widget tetap jalan, volume manusiawi |
| Prompt injection dari pesan/FAQ | Agent keluar jalur | hierarki instruksi, konten=RAG data, tidak ada tool bebas |
| Kebocoran data tamu | UU PDP | verifikasi wajib, masking, retensi, audit |
| Gateway mati saat deploy | Pesan tidak terjawab | proses terpisah, health check, fallback message |
| Scope creep (voice, IG, multi-tenant) | Tidak pernah live | non-goals di §0 |
| Data drift harga/template | Jawaban usang | selalu baca live, tidak di-embed |
| Widget memperlambat undangan | Konversi turun | tidak dipasang di `/w/[slug]`, lazy load |

---

## 16. Kriteria terima

- [ ] 100 pertanyaan eval lulus: harga 100% persis, 0 halusinasi angka.
- [ ] Widget muncul di landing/templates/dashboard, tidak di `/w/[slug]`.
- [ ] Escalasi membuat baris `cs_escalations` + ping grup ops < 10 detik.
- [ ] Ops bisa ambil alih, balas, dan melepas kembali tanpa AI menimpa.
- [ ] Balasan manual dari HP menghentikan AI 4 jam.
- [ ] Pesan duplikat saat reconnect tidak mengirim balasan ganda.
- [ ] Voice note ditranskripsi atau dieskalasi (tidak diabaikan diam-diam).
- [ ] Klien existing terverifikasi bisa tanya status; yang belum terverifikasi tidak.
- [ ] Retensi 90 hari berjalan; hapus per kontak berfungsi.
- [ ] Deploy gateway terpisah terdokumentasi dan tidak mengganggu `npm run deploy`.
- [ ] Biaya per percakapan tercatat di `cs_usage`.

---

## 17. Keputusan terbuka

1. Provider & model LLM (butuh yang kuat di Bahasa Indonesia + function calling;
   bandingkan minimal 2 kandidat di eval set P0).
2. Jam operasional & siapa pemegang inbox `/ops/cs` (satu orang atau rotasi).
3. Isi kebijakan refund/ubah tanggal/revisi — **belum ada di repo**, harus dari
   bisnis sebelum agent boleh menjawab topik itu (selain eskalasi).
4. Nama tampilan nomor + foto profil + apakah widget langsung tampil di landing
   atau hanya di halaman tertentu.
5. Apakah agent boleh mengirim tautan pembayaran/registrasi langsung, atau hanya
   tautan halaman.
