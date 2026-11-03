-- Lead + pipeline untuk CS sales. Satu lead per kontak.
-- Fakta disimpan terpisah dari percakapan supaya sales dapat ringkasan,
-- bukan menelusuri transkrip.

create table if not exists public.cs_leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references public.cs_contacts(id) on delete cascade,
  wedding_profile_id uuid references public.wedding_profiles(id) on delete set null,
  stage text not null default 'new'
    check (stage in ('new', 'qualifying', 'recommending', 'objection', 'cta', 'handoff', 'support')),
  wedding_date date,
  wedding_date_approx boolean not null default false,
  city text,
  guest_count integer check (guest_count is null or (guest_count > 0 and guest_count <= 5000)),
  budget_band text check (budget_band is null or budget_band in ('under_1m', '1_3m', '3_6m', '6_10m', 'above_10m')),
  need text check (need is null or need in ('undangan', 'buku_tamu', 'galeri', 'belum_tahu')),
  package_interest text,
  template_interest text,
  objection_count integer not null default 0,
  qualify_asked integer not null default 0,
  opt_out boolean not null default false,
  owner uuid references public.employees(id),
  next_action_at timestamptz,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cs_leads_stage_idx on public.cs_leads (stage, updated_at desc);
create index if not exists cs_leads_next_action_idx on public.cs_leads (next_action_at)
  where next_action_at is not null;

alter table public.cs_leads enable row level security;
-- Tanpa policy: hanya service role yang bisa membaca/menulis.
