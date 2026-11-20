# Pilot AI CS di nomor bot yang sudah ada

Tujuan: menguji alur CS AI memakai **nomor `pencatatan`** (port 3001) tanpa
memasang nomor baru, tanpa mengganggu grup yang sudah jalan, dan tanpa pernah
membalas klien asli.

Batas keamanan:

- Hanya nomor di `CS_TEST_NUMBERS` yang dibalas.
- Hanya pesan **1:1** (`@s.whatsapp.net`), bukan grup.
- Kill switch `CS_INBOUND_ENABLED=0` mematikan forwarding tanpa restart aplikasi.
- Logika grup (`processMessage`, sheets, absensi) tidak disentuh.

## 1. Env di proses `pencatatan`

Tambahkan ke `/home/askaraa/pencatatan/.env`:

```
CS_INBOUND_ENABLED=1
CS_INBOUND_URL=http://127.0.0.1:3002/api/cs/wa/inbound
CS_INBOUND_SECRET=<sama dengan env app wedding>
CS_TEST_NUMBERS=62812xxxxxxx,62813xxxxxxx
```

`CS_TEST_NUMBERS` diisi nomor HP tim yang dipakai untuk uji. Kalau kosong,
**tidak ada** pesan yang diteruskan (fail closed).

## 2. Patch `src/baileys/client.ts`

Tambahkan sebelum `handleIncoming`:

```ts
const CS_ENABLED = process.env.CS_INBOUND_ENABLED === "1"
const CS_URL = process.env.CS_INBOUND_URL || ""
const CS_SECRET = process.env.CS_INBOUND_SECRET || ""
const CS_ALLOW = new Set(
  (process.env.CS_TEST_NUMBERS || "")
    .split(",")
    .map((s) => s.replace(/\D/g, ""))
    .filter(Boolean),
)

async function forwardToCs(
  sock: WASocket,
  msg: WAMessage,
  jid: string,
  text: string,
): Promise<boolean> {
  if (!CS_ENABLED || !CS_URL || !CS_SECRET) return false
  const phone = (jid.split("@")[0] || "").replace(/\D/g, "")
  if (!CS_ALLOW.has(phone)) return false

  const res = await fetch(CS_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-cs-secret": CS_SECRET },
    body: JSON.stringify({
      wa_message_id: msg.key.id,
      from: jid,
      push_name: msg.pushName || "",
      text,
      timestamp: Number(msg.messageTimestamp || 0),
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) return false

  const data = await res.json().catch(() => null)
  const replies = Array.isArray(data?.replies) ? data.replies : []
  for (const reply of replies) {
    if (reply?.typing) await sock.sendPresenceUpdate("composing", jid)

    if (typeof reply?.text === "string" && reply.text.trim()) {
      await sock.sendMessage(jid, { text: reply.text })
    }

    const media = Array.isArray(reply?.media) ? reply.media : []
    for (const item of media) {
      if (!item || typeof item.url !== "string") continue
      if (item.type === "image") {
        await sock.sendMessage(jid, {
          image: { url: item.url },
          caption: typeof item.caption === "string" ? item.caption : undefined,
        })
      } else if (item.type === "document") {
        await sock.sendMessage(jid, {
          document: { url: item.url },
          mimetype: typeof item.mimetype === "string" ? item.mimetype : "application/pdf",
          fileName:
            typeof item.filename === "string"
              ? item.filename
              : typeof item.fileName === "string"
                ? item.fileName
                : "dokumen.pdf",
        })
      }
    }
  }
  return true
}
```

Di dalam `handleIncoming`, **sebelum** filter grup:

```ts
  const remoteJid = msg.key.remoteJid
  if (!remoteJid) return

  if (!remoteJid.endsWith("@g.us")) {
    const text = getMessageText(msg)
    if (text) {
      try {
        if (await forwardToCs(sock, msg, remoteJid, text)) return
      } catch (e) {
        logError("[CS] forward failed", e)
      }
    }
    return
  }

  // ... kode grup yang sudah ada, tidak diubah
```

## 3. Deploy pilot

```bash
ssh askaraa@103.93.135.176
cd /home/askaraa/pencatatan
# edit .env dan src/baileys/client.ts
npm run build
pm2 restart pencatatan --update-env
pm2 logs pencatatan --lines 50
```

Catatan: `pm2 restart` di sini tidak membaca ulang `.env`. Kalau env baru tidak
terbaca, pakai `pm2 delete pencatatan && pm2 start dist/index.js --name pencatatan`
lalu `pm2 save` — atau jalankan lewat ecosystem bila sudah ada.

## 4. Uji

1. Dari nomor **di luar** allowlist: kirim "tes" → tidak ada balasan, log tidak
   menampilkan forward.
2. Dari nomor allowlist: kirim "halo" → masuk ke `/api/cs/wa/inbound`, dibalas.
3. Kirim 3 pesan beruntun → app harus menggabung (debounce di app, bukan di bot).
4. Balas manual dari HP → AI berhenti untuk kontak itu (deteksi `fromMe`).
5. Set `CS_INBOUND_ENABLED=0` → tidak ada balasan.

## 5. Rollback

Kembalikan `handleIncoming` ke versi sebelumnya (atau set
`CS_INBOUND_ENABLED=0`), lalu `npm run build && pm2 restart pencatatan`.
Tidak ada perubahan database di sisi bot, jadi rollback aman.

## 6. Endpoint yang sudah ada

`POST /api/cs/wa/inbound` (di app wedding, port 3002):

- wajib header `x-cs-secret` = `CS_INBOUND_SECRET`
- idempotensi lewat `cs_messages.wa_message_id` (unique)
- rate limit 30 pesan/menit per nomor
- debounce `CS_DEBOUNCE_MS` (default 2500): 3 pesan beruntun → 1 balasan
- verifikasi: nomor terdaftar → kode 6 digit dikirim ke nomor itu
- balasan dikembalikan sebagai `{ replies: [{ text, typing, media? }] }`
  - `media` (opsional, khusus WhatsApp): array lampiran `{ type: "image"|"document", url, filename?, caption?, mimetype? }`
  - untuk intent paket/harga di WhatsApp, CS mengirim teks singkat + 4 foto paket (Essential/Signature/Prestige/Elite) + pricelist PDF (visual-first)

Env tambahan di app:

```
CS_INBOUND_SECRET=<acak, 32+ karakter>
CS_DEBOUNCE_MS=2500
OPENROUTER_API_KEY=sk-or-v1-...
```

Uji tanpa WhatsApp:

```bash
curl -s -X POST http://127.0.0.1:3002/api/cs/wa/inbound \
  -H 'content-type: application/json' \
  -H "x-cs-secret: $CS_INBOUND_SECRET" \
  -d '{"wa_message_id":"test-1","from":"62812xxxxxxx@s.whatsapp.net","push_name":"Tes","text":"berapa harga signature?"}' | jq
```

Hasil yang diharapkan: `replies` berisi satu balasan dengan harga dari tool,
bukan angka karangan.

## 7. Inbox ops

`/ops/cs` (login ops, role admin/sales):

- daftar percakapan: semua / perlu / tim / selesai, cari nama-nomor-pesan
- detail: transkrip, kartu lead (tanggal, kota, tamu, budget, paket, keberatan)
- banner eskalasi berisi ringkasan lead
- Ambil alih, Lepas ke bot, Tutup, dan balas langsung (⌘/Ctrl+Enter)

## 8. Yang belum ada

- Widget web + `POST /api/cs/chat`.
- Pengiriman OTP lewat gateway baru (sekarang memakai `/send` bot yang ada).
- Tombol "kirim ulang kode" (sekarang harus kirim nomor lagi).


---

## 9. Status staging (2026-11-03)

Dua migrasi CS sudah diterapkan ke staging lewat Management API dan versinya
tercatat di `supabase_migrations.schema_migrations`:

- `20261054000000` — `cs_agent`
- `20261055000000` — `cs_leads`

Verifikasi: 13 tabel `cs_*` ada, `cs_settings` aktif dengan model
`anthropic/claude-haiku-5.5`.

### Jangan `db push` ke staging dulu

Staging masih tertinggal **19 migrasi** (sebagian besar pendaftaran template:
adat_palembang, adat_jawa, manjari, minang_royal, navy_love, iris, adat_dayak,
adat_banjar, dst). `db push` akan menjalankan semuanya dan bisa menimpa
`preview_image_url` / `sort_order` yang sudah diedit ops.

Yang dipakai sekarang: apply manual per migrasi + catat versinya, seperti yang
dilakukan untuk dua migrasi CS.

### Divergensi versi 20261045000000

Staging mencatat `45000000 = cinnabar_seal`. Repo sekarang:

```
20261045000000_cinnabar_seal.sql   (lebih lama, sudah ada di staging)
20261045000001_adat_bugis.sql      (lebih baru, BELUM ada di staging)
```

`adat-bugis` belum terdaftar di staging. Saat mau dipasang, jalankan migrasi
`20261045000001` saja (jangan `db push`), setelah memastikan row `adat-bugis`
belum ada. Local dev sempat mencatat versi 45000000 sebagai `adat_bugis`; itu
tidak memengaruhi staging dan akan rapi lagi setelah `db reset` lokal.
