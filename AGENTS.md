# Aksaraa Wedding — Agent Guide

## Stack
- **Framework:** Next.js 16.2.11 (Turbopack, standalone output)
- **Language:** TypeScript, React 19
- **Styling:** Tailwind CSS (custom design tokens)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase (anon key + service role key)
- **Fonts:** Playfair Display (headlines), Inter (body), Cormorant Garamond (accent)
- **Supabase CLI:** v2.110.0 (local dev, migrations)

## Supabase Environments

| Environment | Project Ref | URL | How to Start |
|---|---|---|---|
| **Local** | — | `http://127.0.0.1:54321` | `npx supabase start` |
| **Staging** | `jclolnjkjhyjilvymagr` | `https://jclolnjkjhyjilvymagr.supabase.co` | `supabase link --project-ref jclolnjkjhyjilvymagr` |
| **Production** | `ylmfgorryxzpdckkebnr` | `https://ylmfgorryxzpdckkebnr.supabase.co` | `supabase link --project-ref ylmfgorryxzpdckkebnr` |

## Key Conventions

### TypeScript & React
- Use `"use client"` for interactive client components; default to server components
- Prefer `function ComponentName()` over arrow functions
- Props typed with `interface ComponentNameProps`
- No JSDoc comments unless behavior is opaque

### Tailwind
- Custom tokens: `margin-mobile` (20px), `margin-desktop` (64px), `edge-margin-mobile` (24px), `edge-margin-desktop` (80px)
- Font size tokens: `label-caps`, `label-sm`, `headline-lg-mobile`, `font-headline-md`, `font-body-md`
- Brand colors: `brand-cream`, `brand-charcoal`, `brand-terracotta`, `brand-gold`, `brand-goldMuted`, `brand-slate`
- Material tokens: `background`, `on-surface`, `surface-variant`, `surface-container-highest`, `primary`, `on-primary`, etc.

### API Routes
- Location: `src/app/api/` with Next.js route handler convention
- Export `GET`, `POST`, `PUT`, `PATCH`, `DELETE` functions
- Use `supabaseAdmin` (service role) for server-side DB access; `supabase` (anon key) for client

### Database
- `inviting_families` is `TEXT` type (not JSONB) — `JSON.parse` on read, return `[]` if empty
- `wa_blast_tier` is cumulative additional capacity on top of package base (Prestige: 100)
- `rekening_bank` and `gift_shipping_address` deprecated — do not reference
- All migrations in `supabase/migrations/` directory
- Full schema defined in `20260730000000_init.sql`
- Seed data (packages, templates, tracks, etc.) in `supabase/seed.sql`

### Deployment
- Server: `103.93.135.176` (Biznet VPS, Ubuntu 22.04)
- PM2 process: `aksara-wedding` on port 3002
- Caddy reverse proxy: `wedding.aksaraa.com` + `*.wedding.aksaraa.com`
- Subdomain pattern: `{slug}.wedding.aksaraa.com` → `/w/{slug}`
- Node.js 22 via nvm (`/home/askaraa/.nvm/versions/node/v22.23.2/bin/node`)
- Ecosystem config at `/var/www/aksara-wedding/ecosystem.config.js`
- Standalone output: `.next/standalone/server.js` + `.next/standalone/.next/static/` + `.next/standalone/public/`
- PM2 env vars must be injected via ecosystem config (`.env.local` not loaded in standalone mode)

### Supabase Storage
- Bucket: `media`, folder prefix: `seeded/`
- Central asset config: `src/lib/assets.ts`
- All external images seeded to Supabase (no Google/Unsplash/Drive URLs)

### Git
- Commit directly to `origin main`
- No PR workflow

## Common Tasks

### Add a new page route
1. Create `src/app/<route>/page.tsx`
2. Use shared layout in `src/app/layout.tsx`
3. Follow font/color tokens from tailwind.config.ts
4. Use `Navigation` component for header

### Add an API route
1. Create `src/app/api/<name>/route.ts`
2. Export HTTP method functions
3. Use `supabaseAdmin` for DB access

### Add a database schema change

1. Make changes in local Supabase Studio (`http://127.0.0.1:54323`) or via SQL
2. Generate migration:
   ```bash
   npx supabase db diff -f describe_change
   ```
3. Test locally:
   ```bash
   npx supabase db reset
   ```
4. Push to staging first:
   ```bash
   npx supabase link --project-ref jclolnjkjhyjilvymagr
   npx supabase db push
   ```
5. Verify on staging, then push to production:
   ```bash
   npx supabase link --project-ref ylmfgorryxzpdckkebnr
   npx supabase db push
   ```
6. Commit migration file:
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add feature_x"
   git push
   ```

### Deploy
```bash
cd /var/www/aksara-wedding
npm run build
pm2 restart aksara-wedding --update-env
pm2 save
```

### Start local development

```bash
npx supabase start
npm run dev
```

Requires Docker Desktop running. Local Supabase Studio at `http://127.0.0.1:54323`.
