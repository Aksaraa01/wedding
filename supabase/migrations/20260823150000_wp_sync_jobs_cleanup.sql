alter table public.wp_sync_jobs drop constraint wp_sync_jobs_kind_check;
alter table public.wp_sync_jobs add constraint wp_sync_jobs_kind_check check (kind in ('duplicate','patch','cleanup'));
alter table public.wp_sync_jobs add column if not exists payload jsonb;
