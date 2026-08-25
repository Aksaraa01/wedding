-- Staging shadow RLS — additive permissive, service_role bypasses RLS so existing supabaseAdmin flows keep working.
-- This enables RLS but allows all for anon/authenticated, so no existing feature breaks. Tighten to auth.uid=user_id later.
-- Apply ONLY to staging jclolnjkjhyjilvymagr via `supabase link --project-ref jclolnjkjhyjilvymagr && supabase db push` after verifying.

alter table public.wedding_profiles enable row level security;
alter table public.guests enable row level security;
alter table public.wishes enable row level security;
alter table public.guest_photos enable row level security;
alter table public.gift_accounts enable row level security;
alter table public.gift_addresses enable row level security;

drop policy if exists "allow all" on public.wedding_profiles;
create policy "allow all" on public.wedding_profiles for all using (true) with check (true);

drop policy if exists "allow all" on public.guests;
create policy "allow all" on public.guests for all using (true) with check (true);

drop policy if exists "allow all" on public.wishes;
create policy "allow all" on public.wishes for all using (true) with check (true);

drop policy if exists "allow all" on public.guest_photos;
create policy "allow all" on public.guest_photos for all using (true) with check (true);

drop policy if exists "allow all" on public.gift_accounts;
create policy "allow all" on public.gift_accounts for all using (true) with check (true);

drop policy if exists "allow all" on public.gift_addresses;
create policy "allow all" on public.gift_addresses for all using (true) with check (true);
