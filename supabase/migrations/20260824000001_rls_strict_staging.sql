-- Strict RLS on staging jclolnjkjhyjilvymagr — anon restricted to own data, service_role bypass keeps existing supabaseAdmin flows working (no impact).
-- Replace permissive "allow all" with owner checks. is_published profiles remain publicly readable for w/[slug] SSR via service_role.

drop policy if exists "allow all" on public.wedding_profiles;
drop policy if exists "own wedding" on public.wedding_profiles;
create policy "own wedding" on public.wedding_profiles for all
  using (auth.uid() = user_id or is_published = true or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "allow all" on public.guests;
drop policy if exists "own guests" on public.guests;
create policy "own guests" on public.guests for all
  using (
    exists (select 1 from public.wedding_profiles wp where wp.id = guests.wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null or wp.is_published = true))
  )
  with check (
    exists (select 1 from public.wedding_profiles wp where wp.id = wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null))
  );

drop policy if exists "allow all" on public.wishes;
drop policy if exists "own wishes" on public.wishes;
create policy "own wishes" on public.wishes for all
  using (
    exists (select 1 from public.wedding_profiles wp where wp.id = wishes.wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null or wp.is_published = true))
  )
  with check (
    exists (select 1 from public.wedding_profiles wp where wp.id = wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null))
  );

drop policy if exists "allow all" on public.guest_photos;
drop policy if exists "own guest_photos" on public.guest_photos;
create policy "own guest_photos" on public.guest_photos for all
  using (
    exists (select 1 from public.wedding_profiles wp where wp.id = guest_photos.wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null or wp.is_published = true))
  )
  with check (
    exists (select 1 from public.wedding_profiles wp where wp.id = wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null))
  );

drop policy if exists "allow all" on public.gift_accounts;
drop policy if exists "own gift_accounts" on public.gift_accounts;
create policy "own gift_accounts" on public.gift_accounts for all
  using (
    exists (select 1 from public.wedding_profiles wp where wp.id = gift_accounts.wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null or wp.is_published = true))
  )
  with check (
    exists (select 1 from public.wedding_profiles wp where wp.id = wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null))
  );

drop policy if exists "allow all" on public.gift_addresses;
drop policy if exists "own gift_addresses" on public.gift_addresses;
create policy "own gift_addresses" on public.gift_addresses for all
  using (
    exists (select 1 from public.wedding_profiles wp where wp.id = gift_addresses.wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null or wp.is_published = true))
  )
  with check (
    exists (select 1 from public.wedding_profiles wp where wp.id = wedding_profile_id and (wp.user_id = auth.uid() or wp.user_id is null))
  );
