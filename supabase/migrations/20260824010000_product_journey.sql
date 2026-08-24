alter table public.wedding_profiles add column if not exists has_seen_tour boolean not null default false;
