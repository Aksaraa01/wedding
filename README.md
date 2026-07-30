# Aksaraa Wedding

Platform pernikahan digital naratif — ubah janji suci dan perjalanan cinta menjadi kisah digital interaktif yang memikat.

## Fitur Utama

- **Web Invitation** — undangan digital interaktif dengan 5 template premium
- **QR Digital Buku Tamu** — scan QR untuk absensi tamu real-time
- **Virtual Wish Wall** — dinding harapan digital interaktif
- **Galeri Kenangan Tamu** — galeri foto yang diunggah tamu
- **Reminder Tamu VIP** — broadcast WhatsApp otomatis ke tamu VIP
- **Amplop Digital** — informasi rekening hadiah digital
- **Dashboard Pasangan** — manajemen tamu, statistik RSVP, kontrol undangan
- **Dashboard Operator** — antrian pekerjaan, assignment, tracking progress

## Tech Stack

| Teknologi | Versi |
|-----------|-------|
| Next.js | 16.2.11 (Turbopack) |
| React | 19.2.8 |
| TypeScript | ~5.8 |
| Tailwind CSS | ~4.1 |
| Supabase | ^2.110.8 |
| PostgreSQL | (Supabase) |

## Memulai

### Prasyarat
- Node.js 22+
- npm 10+
- Akun Supabase (URL + anon key + service role key)

### Instalasi

```bash
npm install
cp .env.example .env.local
# Isi .env.local dengan kredensial Supabase
npm run dev
```

### Build

```bash
npm run build
# Output standalone di .next/standalone/
```

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key untuk client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key untuk server-side |

## Struktur Proyek

```
src/
  app/          # Next.js App Router (routes, API, pages)
  components/   # Shared components (Navigation, Footer, Hero, etc.)
  lib/          # Utilities (supabase client, DB helpers, assets config)
supabase/       # Database migrations
public/         # Static assets
scripts/        # Utility scripts (asset seeding)
```

### Routes Utama

| Route | Deskripsi |
|-------|-----------|
| `/hero` | Landing page utama |
| `/customize` | Kustomisasi paket |
| `/register` | Registrasi pengguna |
| `/login` | Login pengguna |
| `/dashboard/[id]` | Dashboard pasangan |
| `/w/[slug]` | Web-invitation per pasangan |

## Deployment

Server otomatis dengan PM2 di port 3002, reverse proxy Caddy dengan HTTPS.

```bash
cd /var/www/aksara-wedding
npm run build
pm2 restart aksara-wedding --update-env
pm2 save
```

Domain: [wedding.aksaraa.com](https://wedding.aksaraa.com)
Subdomain per couple: `{slug}.wedding.aksaraa.com`

## Lisensi

Proprietary — Hak cipta Aksaraa.
