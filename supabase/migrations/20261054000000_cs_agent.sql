-- AI Customer Service (CS) — skema dasar.
--
-- Prinsip:
--   * semua akses lewat service role; RLS aktif tanpa policy = anon ditolak.
--   * kode verifikasi disimpan sebagai hash, bukan plaintext.
--   * field yang menyentuh uang/tanggal tidak pernah ditulis dari percakapan.

create extension if not exists vector;

-- Satu baris per nomor WhatsApp / sesi web yang pernah menghubungi CS.
create table if not exists public.cs_contacts (
  id uuid primary key default gen_random_uuid(),
  wa_jid text unique,
  phone text,
  name text,
  user_id uuid references public.users(id),
  wedding_profile_id uuid references public.wedding_profiles(id),
  verified_at timestamptz,
  blocked boolean not null default false,
  notes text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists cs_contacts_phone_idx on public.cs_contacts (phone);
create index if not exists cs_contacts_profile_idx on public.cs_contacts (wedding_profile_id);

create table if not exists public.cs_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.cs_contacts(id) on delete cascade,
  channel text not null check (channel in ('web', 'wa')),
  status text not null default 'bot' check (status in ('bot', 'human', 'closed')),
  ai_paused_until timestamptz,
  assigned_to uuid references public.employees(id),
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  message_count integer not null default 0,
  strike_count integer not null default 0,
  intent text,
  sentiment text,
  escalated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cs_conversations_open_idx
  on public.cs_conversations (status, last_inbound_at desc);

create table if not exists public.cs_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.cs_conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  wa_message_id text unique,
  body text,
  media_type text,
  media_url text,
  intent text,
  tool_calls jsonb,
  tool_result jsonb,
  guard jsonb,
  model text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists cs_messages_conversation_idx
  on public.cs_messages (conversation_id, created_at);

-- Kode verifikasi: yang disimpan hanya sha256(code + salt).
create table if not exists public.cs_verify_codes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.cs_contacts(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cs_verify_codes_contact_idx
  on public.cs_verify_codes (contact_id, created_at desc);

-- Draft pengisian data oleh pasangan. Disimpan terpisah supaya percakapan
-- setengah jadi tidak pernah menimpa profil yang sudah publish.
create table if not exists public.cs_profile_drafts (
  id uuid primary key default gen_random_uuid(),
  wedding_profile_id uuid not null unique references public.wedding_profiles(id) on delete cascade,
  contact_id uuid references public.cs_contacts(id) on delete set null,
  draft jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'awaiting_confirm', 'submitted')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.cs_escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.cs_conversations(id) on delete cascade,
  reason text not null,
  summary text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'open' check (status in ('open', 'claimed', 'done')),
  claimed_by uuid references public.employees(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists cs_escalations_open_idx
  on public.cs_escalations (status, created_at desc);

-- Pertanyaan yang gagal dijawab: bahan perbaikan KB tiap minggu.
create table if not exists public.cs_unanswered (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.cs_conversations(id) on delete set null,
  question text not null,
  reason text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Satu baris konfigurasi agent.
create table if not exists public.cs_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default true,
  model text not null default 'anthropic/claude-haiku-5.5',
  persona text,
  temperature numeric not null default 0.7,
  max_reply_words integer not null default 90,
  business_hours jsonb,
  guardrails jsonb,
  updated_at timestamptz not null default now()
);

insert into public.cs_settings (id)
values (1)
on conflict (id) do nothing;

-- Pengetahuan prosa (FAQ/artikel/kebijakan). Angka tidak di-embed.
create table if not exists public.cs_documents (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('faq', 'page', 'article', 'manual')),
  title text not null,
  url text,
  checksum text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.cs_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.cs_documents(id) on delete cascade,
  heading text,
  content text not null,
  embedding vector(1536),
  token_count integer,
  updated_at timestamptz not null default now()
);

create index if not exists cs_chunks_embedding_idx
  on public.cs_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Pemakaian harian untuk biaya dan evaluasi.
create table if not exists public.cs_usage (
  day date not null,
  channel text not null,
  inbound integer not null default 0,
  outbound integer not null default 0,
  llm_calls integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_idr numeric not null default 0,
  primary key (day, channel)
);

-- Audit setiap perubahan penting (verifikasi, patch profil, override guard).
create table if not exists public.cs_audit (
  id bigserial primary key,
  actor text not null,
  action text not null,
  subject text,
  detail jsonb,
  created_at timestamptz not null default now()
);

alter table public.cs_contacts enable row level security;
alter table public.cs_conversations enable row level security;
alter table public.cs_messages enable row level security;
alter table public.cs_verify_codes enable row level security;
alter table public.cs_profile_drafts enable row level security;
alter table public.cs_escalations enable row level security;
alter table public.cs_unanswered enable row level security;
alter table public.cs_settings enable row level security;
alter table public.cs_documents enable row level security;
alter table public.cs_chunks enable row level security;
alter table public.cs_usage enable row level security;
alter table public.cs_audit enable row level security;

-- Tanpa policy, anon dan authenticated tidak bisa membaca apa pun.
-- Service role (server) melewati RLS.
