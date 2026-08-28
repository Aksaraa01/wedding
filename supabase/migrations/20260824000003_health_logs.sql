create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  latency_ms int not null,
  db_status text not null,
  uptime_seconds numeric
);
alter table public.health_logs enable row level security;
drop policy if exists "allow all" on public.health_logs;
create policy "allow all" on public.health_logs for all using (true) with check (true);
create index if not exists idx_health_logs_created_at on public.health_logs (created_at desc);
