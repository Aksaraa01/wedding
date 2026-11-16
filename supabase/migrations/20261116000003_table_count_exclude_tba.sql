-- The dashboard "Meja" stat counted the schema default 'TBA' as a real table.
-- Flexible-link RSVPs are provisioned with that default, so every one of them
-- inflated the table count. Ignore the placeholder.

-- Additive view for dashboard fan-out: single RPC replaces 6 serial counts on guests/wishes (non-breaking, fallback to old queries).
create or replace function public.get_dashboard_counts(p_profile_id uuid)
returns json
language sql
stable
as $$
  select json_build_object(
    'guest_count', (select count(*) from public.guests where wedding_profile_id = p_profile_id),
    'table_count', (select count(distinct lower(trim(table_number))) from public.guests where wedding_profile_id = p_profile_id and table_number is not null and trim(table_number) <> '' and lower(trim(table_number)) <> 'tba'),
    'checked_in_count', (select count(*) from public.guests where wedding_profile_id = p_profile_id and is_checked_in = true),
    'checked_in_pax', (select coalesce(sum(coalesce(rsvp_pax_count, guest_count, 1)),0) from public.guests where wedding_profile_id = p_profile_id and is_checked_in = true),
    'rsvp_hadir_count', (select count(*) from public.guests where wedding_profile_id = p_profile_id and rsvp_status = 'HADIR'),
    'rsvp_hadir_pax', (select coalesce(sum(coalesce(rsvp_pax_count, guest_count, 1)),0) from public.guests where wedding_profile_id = p_profile_id and rsvp_status = 'HADIR'),
    'rsvp_total_pax', (select coalesce(sum(coalesce(guest_count,1)),0) from public.guests where wedding_profile_id = p_profile_id),
    'pending_wishes', (select count(*) from public.wishes where wedding_profile_id = p_profile_id and status = 'pending'),
    'total_wishes', (select count(*) from public.wishes where wedding_profile_id = p_profile_id)
  );
$$;
