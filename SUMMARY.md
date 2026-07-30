# Aksaraa Wedding — Project Summary

**Platform pernikahan digital** — menyediakan web-invitation interaktif, QR guestbook, wish wall, galeri foto tamu, reminder VIP, dan dashboard manajemen untuk vendor pernikahan dan pasangan.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (Turbopack, standalone) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS dengan custom design tokens |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase anon key + service role key |
| Deployment | Biznet VPS, PM2, Caddy reverse proxy |

## Routes

### Landing Pages (Public)
| Route | Halaman |
|-------|---------|
| `/hero` | Halaman utama brand |
| `/customize` | Kustomisasi paket wedding |
| `/register` | Pendaftaran |
| `/login` | Login pengguna |
| `/premium-web-invitation` | Landing web invitation |
| `/qr-digital-buku-tamu` | Landing QR guestbook |
| `/virtual-wish-wall` | Landing wish wall interaktif |
| `/galeri-kenangan-tamu` | Landing galeri foto tamu |
| `/reminder-tamu-vip` | Landing reminder VIP |

### Dashboard (Authenticated)
| Route | Halaman |
|-------|---------|
| `/dashboard/[id]` | Dashboard utama |
| `/dashboard/[id]/web-invitation` | Web invitation management |
| `/dashboard/[id]/web-invitation/editor` | Editor undangan digital |
| `/dashboard/[id]/web-invitation/feedback` | Feedback submissions |
| `/dashboard/[id]/guests` | Manajemen tamu |
| `/dashboard/[id]/qr-guestbook` | QR guestbook |
| `/dashboard/[id]/galeri-kenangan` | Galeri kenangan |
| `/dashboard/[id]/wish-wall` | Wish wall |
| `/dashboard/[id]/amplop-digital` | Amplop digital (gift) |
| `/dashboard/[id]/reminder-tamu-vip` | WA blast reminder |
| `/dashboard/[id]/reservation-automation` | Reservasi otomatis |
| `/dashboard/[id]/media` | Media management |

### Wedding Pages (Per Couple)
| Route | Halaman |
|-------|---------|
| `/w/[slug]` | Web-invitation publik per pasangan |
| `/welcome/[token]` | Welcome page tamu |

### Operator
| Route | Halaman |
|-------|---------|
| `/ops` | Dashboard operator |
| `/ops/login` | Login operator |

### System
| Route | Halaman |
|-------|---------|
| `/q/[token]` | QR redirect |
| `/scanner/[slug]` | QR scanner |
| `/led/[slug]` | LED display |
| `/demo/[code]` | Demo mode |
| `/problem` | Error page |

## API Endpoints (36 routes)
Auth, guest management, check-in, wishes, photos, gifts, packages, web templates, media upload, audio proxy, ops queue, scanner, registration, feedback.

## Database Schema
- `wedding_profiles` — profil pernikahan per pasangan
- `users` — pengguna platform
- `guests` — daftar tamu (with QR tokens, check-in)
- `wishes` — ucapan tamu
- `packages` — paket layanan (Essential, Signature, Prestige)
- `package_features` — fitur per paket
- `web_templates` — template undangan (5 themes)
- `web_tracks` — musik latar (7 tracks)
- `gift_accounts` — rekening hadiah
- `gift_addresses` — alamat pengiriman hadiah
- `employees` — staf operator
- `ops_queue` — antrian pekerjaan operator
- `feedback_submissions` — feedback pengguna
- `guest_photos` — foto yang diunggah tamu

## Deployment
- **Server:** `103.93.135.176` (Biznet VPS, Ubuntu 22.04)
- **PM2:** `aksara-wedding` (port 3002)
- **Domain:** `wedding.aksaraa.com`
- **Subdomain per couple:** `{slug}.wedding.aksaraa.com`
- **Reverse proxy:** Caddy dengan HTTPS otomatis
- **Node.js:** v22.23.2 via nvm

## Key Decisions
- `inviting_families` disimpan sebagai `TEXT`, di-`JSON.parse` saat read
- Kuota WA blast = 100 (base Prestige) + `wa_blast_tier` (kumulatif)
- Semua gambar eksternal dimigrasi ke Supabase Storage (`media/seeded/`)
- Standalone output — env vars diinject via PM2 ecosystem config
- `rekening_bank` dan `gift_shipping_address` sudah deprecated
