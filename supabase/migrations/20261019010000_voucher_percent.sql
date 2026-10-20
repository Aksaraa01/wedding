-- Percentage vouchers + immutable redemption terms + manual voucher codes.
-- Additive only: the legacy 3-arg redeem/swap overloads stay available until
-- the app is deployed on the new signature (phase 2 drops them).

alter table public.vouchers
  add column if not exists discount_type text not null default 'amount',
  add column if not exists percent int,
  add column if not exists max_discount int,
  add column if not exists include_wa_blast boolean not null default true,
  add column if not exists include_express boolean not null default true,
  add column if not exists include_galeri boolean not null default true;
alter table public.vouchers drop constraint if exists vouchers_discount_type_check;
alter table public.vouchers
  add constraint vouchers_discount_type_check
  check (discount_type in ('amount', 'percent'));
alter table public.vouchers drop constraint if exists vouchers_discount_shape;
alter table public.vouchers
  add constraint vouchers_discount_shape
  check (
    (discount_type = 'amount' and amount >= 0 and percent is null and max_discount is null)
    or
    (discount_type = 'percent' and percent between 1 and 100 and (max_discount is null or max_discount > 0))
  );
-- Manual codes are free-form, but never whitespace and never longer than 64.
update public.vouchers
set code = upper(btrim(code))
where code <> upper(btrim(code));
do $$
declare
  bad_code text;
begin
  select code into bad_code
  from public.vouchers
  where code ~ '\s' or length(code) < 1 or length(code) > 64
  limit 1;
  if bad_code is not null then
    raise exception 'Voucher code "%" has whitespace or invalid length; fix it before migrating', bad_code;
  end if;
end $$;
create unique index if not exists vouchers_code_upper_unique
  on public.vouchers (upper(code));
alter table public.vouchers drop constraint if exists vouchers_code_format;
alter table public.vouchers
  add constraint vouchers_code_format
  check (code !~ '\s' and length(code) between 1 and 64);
alter table public.voucher_redemptions
  add column if not exists terms_snapshot jsonb,
  add column if not exists frozen_at timestamptz;
alter table public.voucher_redemptions drop constraint if exists voucher_redemptions_terms_object;
alter table public.voucher_redemptions
  add constraint voucher_redemptions_terms_object
  check (terms_snapshot is null or jsonb_typeof(terms_snapshot) = 'object');
-- Legacy rows had a fixed amount. Snapshot the amount actually applied to the
-- active profile (not the current voucher row, which may have been edited).
update public.voucher_redemptions r
set terms_snapshot = jsonb_build_object(
  'type', 'amount',
  'amount', case
    when r.status = 'active' then greatest(0, coalesce(p.voucher_discount, r.amount_applied, 0))
    else greatest(0, r.amount_applied)
  end,
  'include_wa_blast', true,
  'include_express', true,
  'include_galeri', true,
  'eligible_packages', case
    when jsonb_typeof(v.package_eligibility) = 'array' then v.package_eligibility
    else '[]'::jsonb
  end
)
from public.wedding_profiles p, public.vouchers v
where p.id = r.wedding_profile_id
  and v.id = r.voucher_id
  and r.terms_snapshot is null;
update public.voucher_redemptions r
set frozen_at = coalesce(r.frozen_at, now())
from public.wedding_profiles p
where p.id = r.wedding_profile_id
  and r.status = 'active'
  and p.payment_status <> 'UNPAID';
-- ---------------------------------------------------------------------------
-- New RPC signatures. No defaults: PostgREST must never confuse them with the
-- legacy 3-arg overloads.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_voucher(
  p_code text,
  p_profile_id uuid,
  p_base int,
  p_wa_price int,
  p_express_price int,
  p_galeri_price int,
  p_employee_id uuid
)
returns table (out_discount int, out_voucher_id uuid, out_voucher_code text, out_terms jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.vouchers%rowtype;
  v_profile public.wedding_profiles%rowtype;
  v_elig text[];
  v_base bigint;
  v_discount bigint;
  v_terms jsonb;
begin
  if p_code is null or p_code = '' or p_code ~ '\s' then
    raise exception 'invalid' using errcode = 'P0001';
  end if;

  select * into v_profile
  from public.wedding_profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;
  if v_profile.payment_status <> 'UNPAID' then
    raise exception 'paid_profile' using errcode = 'P0001';
  end if;

  select * into v_row
  from public.vouchers
  where upper(code) = upper(p_code)
  for update;

  if not found then
    raise exception 'invalid' using errcode = 'P0001';
  end if;
  if not v_row.is_active then
    raise exception 'inactive' using errcode = 'P0001';
  end if;
  if v_row.used_count >= v_row.max_uses then
    raise exception 'exhausted' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(x), '{}') into v_elig
  from jsonb_array_elements_text(
    case when jsonb_typeof(v_row.package_eligibility) = 'array' then v_row.package_eligibility else '[]'::jsonb end
  ) as x;

  if array_length(v_elig, 1) is not null and not (v_profile.package_type = any (v_elig)) then
    raise exception 'ineligible' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.voucher_redemptions
    where wedding_profile_id = p_profile_id and status = 'active'
  ) then
    raise exception 'already_used' using errcode = 'P0001';
  end if;

  v_base := greatest(0, coalesce(p_base, 0))
    + case when v_row.include_wa_blast then greatest(0, coalesce(p_wa_price, 0)) else 0 end
    + case when v_row.include_express then greatest(0, coalesce(p_express_price, 0)) else 0 end
    + case when v_row.include_galeri OR v_profile.package_type = 'gt'
      then greatest(0, coalesce(p_galeri_price, 0)) else 0 end;

  if v_row.discount_type = 'amount' then
    v_discount := greatest(0, v_row.amount);
  else
    if v_row.percent is null or v_row.percent < 1 or v_row.percent > 100 then
      raise exception 'invalid' using errcode = 'P0001';
    end if;
    v_discount := (v_base * v_row.percent) / 100;
    if v_row.max_discount is not null then
      v_discount := least(v_discount, v_row.max_discount);
    end if;
  end if;

  v_discount := least(v_discount, 2147483647);
  if v_discount <= 0 then
    raise exception 'zero_discount' using errcode = 'P0001';
  end if;

  v_terms := jsonb_build_object(
    'type', v_row.discount_type,
    'amount', case when v_row.discount_type = 'amount' then v_discount else 0 end,
    'percent', v_row.percent,
    'max_discount', v_row.max_discount,
    'include_wa_blast', v_row.include_wa_blast,
    'include_express', v_row.include_express,
    'include_galeri', v_row.include_galeri,
    'eligible_packages', case
      when jsonb_typeof(v_row.package_eligibility) = 'array' then v_row.package_eligibility
      else '[]'::jsonb
    end
  );

  update public.vouchers
  set used_count = used_count + 1, updated_at = now()
  where id = v_row.id;

  begin
    insert into public.voucher_redemptions (
      voucher_id, wedding_profile_id, amount_applied, status, terms_snapshot
    )
    values (v_row.id, p_profile_id, v_discount::int, 'active', v_terms);
  exception when unique_violation then
    raise exception 'already_used' using errcode = 'P0001';
  end;

  insert into public.voucher_logs (voucher_id, action, details, changed_by_employee_id)
  values (
    v_row.id,
    'redeemed',
    'profil ' || p_profile_id::text || ' • paket ' || coalesce(v_profile.package_type, '-') || ' • potongan ' || v_discount::text,
    p_employee_id
  );

  return query select v_discount::int as out_discount, v_row.id as out_voucher_id, v_row.code as out_voucher_code, v_terms as out_terms;
end;
$$;
create or replace function public.swap_voucher(
  p_code text,
  p_profile_id uuid,
  p_base int,
  p_wa_price int,
  p_express_price int,
  p_galeri_price int,
  p_employee_id uuid
)
returns table (
  out_discount int,
  out_voucher_id uuid,
  out_voucher_code text,
  out_terms jsonb,
  out_old_voucher_id uuid,
  out_old_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new public.vouchers%rowtype;
  v_profile public.wedding_profiles%rowtype;
  v_elig text[];
  v_base bigint;
  v_discount bigint;
  v_terms jsonb;
  v_old_redemption_id uuid;
  v_old_voucher_id uuid;
  v_old_code text;
begin
  if p_code is null or p_code = '' or p_code ~ '\s' then
    raise exception 'invalid' using errcode = 'P0001';
  end if;

  select * into v_profile
  from public.wedding_profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;
  if v_profile.payment_status <> 'UNPAID' then
    raise exception 'paid_profile' using errcode = 'P0001';
  end if;

  -- Lock the old redemption before the new voucher so concurrent swaps and
  -- releases always acquire voucher/redemption locks in the same order.
  select id, voucher_id into v_old_redemption_id, v_old_voucher_id
  from public.voucher_redemptions
  where wedding_profile_id = p_profile_id and status = 'active'
  for update;

  select * into v_new
  from public.vouchers
  where upper(code) = upper(p_code)
  for update;

  if not found then
    raise exception 'invalid' using errcode = 'P0001';
  end if;
  if not v_new.is_active then
    raise exception 'inactive' using errcode = 'P0001';
  end if;
  if v_new.used_count >= v_new.max_uses then
    raise exception 'exhausted' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(x), '{}') into v_elig
  from jsonb_array_elements_text(
    case when jsonb_typeof(v_new.package_eligibility) = 'array' then v_new.package_eligibility else '[]'::jsonb end
  ) as x;

  if array_length(v_elig, 1) is not null and not (v_profile.package_type = any (v_elig)) then
    raise exception 'ineligible' using errcode = 'P0001';
  end if;

  if v_old_voucher_id = v_new.id then
    raise exception 'same_voucher' using errcode = 'P0001';
  end if;

  v_base := greatest(0, coalesce(p_base, 0))
    + case when v_new.include_wa_blast then greatest(0, coalesce(p_wa_price, 0)) else 0 end
    + case when v_new.include_express then greatest(0, coalesce(p_express_price, 0)) else 0 end
    + case when v_new.include_galeri OR v_profile.package_type = 'gt'
      then greatest(0, coalesce(p_galeri_price, 0)) else 0 end;

  if v_new.discount_type = 'amount' then
    v_discount := greatest(0, v_new.amount);
  else
    if v_new.percent is null or v_new.percent < 1 or v_new.percent > 100 then
      raise exception 'invalid' using errcode = 'P0001';
    end if;
    v_discount := (v_base * v_new.percent) / 100;
    if v_new.max_discount is not null then
      v_discount := least(v_discount, v_new.max_discount);
    end if;
  end if;

  v_discount := least(v_discount, 2147483647);
  if v_discount <= 0 then
    raise exception 'zero_discount' using errcode = 'P0001';
  end if;

  v_terms := jsonb_build_object(
    'type', v_new.discount_type,
    'amount', case when v_new.discount_type = 'amount' then v_discount else 0 end,
    'percent', v_new.percent,
    'max_discount', v_new.max_discount,
    'include_wa_blast', v_new.include_wa_blast,
    'include_express', v_new.include_express,
    'include_galeri', v_new.include_galeri,
    'eligible_packages', case
      when jsonb_typeof(v_new.package_eligibility) = 'array' then v_new.package_eligibility
      else '[]'::jsonb
    end
  );

  if v_old_redemption_id is not null then
    update public.voucher_redemptions
    set status = 'released', released_at = now(), released_by_employee_id = p_employee_id
    where id = v_old_redemption_id and status = 'active';

    update public.vouchers
    set used_count = greatest(0, used_count - 1), updated_at = now()
    where id = v_old_voucher_id;

    select code into v_old_code from public.vouchers where id = v_old_voucher_id;

    insert into public.voucher_logs (voucher_id, action, details, changed_by_employee_id)
    values (v_old_voucher_id, 'released', 'diganti — slot dikembalikan ke pool', p_employee_id);
  end if;

  update public.vouchers
  set used_count = used_count + 1, updated_at = now()
  where id = v_new.id;

  begin
    insert into public.voucher_redemptions (
      voucher_id, wedding_profile_id, amount_applied, status, terms_snapshot
    )
    values (v_new.id, p_profile_id, v_discount::int, 'active', v_terms);
  exception when unique_violation then
    raise exception 'already_used' using errcode = 'P0001';
  end;

  insert into public.voucher_logs (voucher_id, action, details, changed_by_employee_id)
  values (
    v_new.id,
    'redeemed',
    'profil ' || p_profile_id::text || ' • paket ' || coalesce(v_profile.package_type, '-') || ' • potongan ' || v_discount::text || ' (ganti)',
    p_employee_id
  );

  return query select v_discount::int as out_discount, v_new.id as out_voucher_id, v_new.code as out_voucher_code, v_terms as out_terms, v_old_voucher_id as out_old_voucher_id, v_old_code as out_old_code;
end;
$$;
create or replace function public.release_voucher(
  p_profile_id uuid,
  p_employee_id uuid
)
returns table (out_voucher_id uuid, out_voucher_code text, out_previous_discount int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_red public.voucher_redemptions%rowtype;
  v_code text;
begin
  select * into v_red
  from public.voucher_redemptions
  where wedding_profile_id = p_profile_id and status = 'active'
  for update;

  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  select code into v_code from public.vouchers where id = v_red.voucher_id;

  update public.voucher_redemptions
  set status = 'released', released_at = now(), released_by_employee_id = p_employee_id
  where id = v_red.id and status = 'active';

  update public.vouchers
  set used_count = greatest(0, used_count - 1), updated_at = now()
  where id = v_red.voucher_id;

  insert into public.voucher_logs (voucher_id, action, details, changed_by_employee_id)
  values (v_red.voucher_id, 'released', 'dilepas dari profil ' || p_profile_id::text, p_employee_id);

  return query select v_red.voucher_id as out_voucher_id, v_code as out_voucher_code, v_red.amount_applied as out_previous_discount;
end;
$$;
create or replace function public.freeze_voucher(
  p_profile_id uuid,
  p_discount int,
  p_total int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_red public.voucher_redemptions%rowtype;
  v_frozen int;
begin
  select * into v_red
  from public.voucher_redemptions
  where wedding_profile_id = p_profile_id and status = 'active'
  for update;

  if not found then
    return null;
  end if;

  if v_red.frozen_at is not null then
    select voucher_discount into v_frozen
    from public.wedding_profiles
    where id = p_profile_id;
    return greatest(0, coalesce(nullif(v_frozen, 0), v_red.amount_applied));
  end if;

  update public.voucher_redemptions
  set frozen_at = now()
  where id = v_red.id;

  update public.wedding_profiles
  set voucher_discount = greatest(0, coalesce(nullif(p_discount, 0), v_red.amount_applied)),
      total_project_cost = greatest(0, coalesce(p_total, total_project_cost))
  where id = p_profile_id;

  return greatest(0, coalesce(nullif(p_discount, 0), v_red.amount_applied));
end;
$$;
-- Service-role only. Security-definer functions bypass RLS, so PUBLIC execute
-- would let anyone with the anon key redeem/swap directly via PostgREST.
revoke execute on function public.redeem_voucher(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.swap_voucher(text, uuid, text) from public, anon, authenticated;
revoke execute on function public.redeem_voucher(text, uuid, int, int, int, int, uuid) from public, anon, authenticated;
revoke execute on function public.swap_voucher(text, uuid, int, int, int, int, uuid) from public, anon, authenticated;
revoke execute on function public.release_voucher(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.freeze_voucher(uuid, int, int) from public, anon, authenticated;
grant execute on function public.redeem_voucher(text, uuid, int, int, int, int, uuid) to service_role;
grant execute on function public.swap_voucher(text, uuid, int, int, int, int, uuid) to service_role;
grant execute on function public.release_voucher(uuid, uuid) to service_role;
grant execute on function public.freeze_voucher(uuid, int, int) to service_role;
-- Phase 2 (run only after the app is deployed on the new signatures):
-- drop function public.redeem_voucher(text, uuid, text);
-- drop function public.swap_voucher(text, uuid, text);
