-- Async sync queue for WordPress template create/edit (duplicate + patch).
-- The client enqueues a job and polls; the in-process worker picks jobs up and
-- fans out to WordPress. This keeps the HTTP request off the WP PHP-FPM hot path
-- (Phase 5 stress: 5 workers saturated, ~27s synchronous latency, 502s).

create table if not exists public.wp_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  wedding_profile_id uuid not null references public.wedding_profiles(id) on delete cascade,
  kind text not null check (kind in ('duplicate', 'patch')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  template_id uuid,
  attempts int not null default 0,
  last_error text,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz
);

create index wp_sync_jobs_status_idx on public.wp_sync_jobs (status, created_at);
create index wp_sync_jobs_profile_idx on public.wp_sync_jobs (wedding_profile_id, created_at);

-- Service-role only; keep anon clients away from job internals.
alter table public.wp_sync_jobs enable row level security;