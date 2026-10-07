-- Released/swapped redemptions stay as history rows instead of being deleted,
-- so "which couples ever used a code" is queryable without parsing log text.
-- Exactly one ACTIVE redemption per couple is enforced by a partial unique index.
alter table public.voucher_redemptions
  add column if not exists status text not null default 'active' check (status in ('active', 'released')),
  add column if not exists released_at timestamptz,
  add column if not exists released_by_employee_id uuid;

-- Replace the blanket unique constraint with an active-only one.
alter table public.voucher_redemptions drop constraint if exists voucher_redemptions_wedding_profile_id_key;
drop index if exists public.voucher_redemptions_active_unique;
create unique index if not exists voucher_redemptions_active_unique
  on public.voucher_redemptions (wedding_profile_id) where status = 'active';

create index if not exists voucher_redemptions_status_idx on public.voucher_redemptions (voucher_id, status);

-- Idempotency + race safety (revised redeem/swap over status rows):
-- 1. already_used checks ACTIVE rows only; the partial unique index above is
--    the backstop — a concurrent double-redeem surfaces as unique-violation,
--    mapped here to 'already_used' instead of leaking SQL text.
-- 2. Every row this logic touches is row-locked first (voucher FOR UPDATE,
--    active redemption FOR UPDATE), so concurrent swap/release/redeem on the
--    same couple serialize instead of double-counting the cap.
-- 3. Cap increments/decrements happen only on rows this call transitioned
--    (GET DIAGNOSTICS row count), never blindly.
create or replace function public.redeem_voucher(p_code text, p_profile_id uuid, p_package text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.vouchers%rowtype;
  v_elig text[];
begin
  if p_code is null or btrim(p_code) = '' then
    raise exception 'invalid' using errcode = 'P0001';
  end if;

  select * into v_row from public.vouchers
  where upper(code) = upper(btrim(p_code))
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
  from jsonb_array_elements_text(case when jsonb_typeof(v_row.package_eligibility) = 'array' then v_row.package_eligibility else '[]'::jsonb end) as x;
  if array_length(v_elig, 1) is not null and not (p_package = any (v_elig)) then
    raise exception 'ineligible' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.voucher_redemptions where wedding_profile_id = p_profile_id and status = 'active') then
    raise exception 'already_used' using errcode = 'P0001';
  end if;

  update public.vouchers
  set used_count = used_count + 1, updated_at = now()
  where id = v_row.id;

  begin
    insert into public.voucher_redemptions (voucher_id, wedding_profile_id, amount_applied, status)
    values (v_row.id, p_profile_id, v_row.amount, 'active');
  exception when unique_violation then
    raise exception 'already_used' using errcode = 'P0001';
  end;

  insert into public.voucher_logs (voucher_id, action, details)
  values (v_row.id, 'redeemed', 'profil ' || p_profile_id::text || ' • paket ' || coalesce(p_package, '-') || ' • potongan ' || v_row.amount::text);

  return v_row.amount;
end;
$$;

create or replace function public.swap_voucher(p_code text, p_profile_id uuid, p_package text)
returns table (voucher_id uuid, amount int, old_voucher_id uuid, old_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new public.vouchers%rowtype;
  v_old_id uuid;
  v_elig text[];
  v_old_redemption_id uuid;
  v_released int := 0;
begin
  if p_code is null or btrim(p_code) = '' then
    raise exception 'invalid' using errcode = 'P0001';
  end if;

  select * into v_new from public.vouchers
  where upper(code) = upper(btrim(p_code))
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
  from jsonb_array_elements_text(case when jsonb_typeof(v_new.package_eligibility) = 'array' then v_new.package_eligibility else '[]'::jsonb end) as x;
  if array_length(v_elig, 1) is not null and not (p_package = any (v_elig)) then
    raise exception 'ineligible' using errcode = 'P0001';
  end if;

  -- Release the current ACTIVE redemption first (row-locked: concurrent swaps
  -- serialize here). Only a real transition decrements the old cap.
  select id, voucher_id into v_old_redemption_id, v_old_id
  from public.voucher_redemptions
  where wedding_profile_id = p_profile_id and status = 'active'
  for update;

  if v_old_redemption_id is not null then
    update public.voucher_redemptions
    set status = 'released', released_at = now()
    where id = v_old_redemption_id and status = 'active';
    get diagnostics v_released = row_count;
    if v_released > 0 then
      update public.vouchers
      set used_count = greatest(0, used_count - 1), updated_at = now()
      where id = v_old_id;
      insert into public.voucher_logs (voucher_id, action, details)
      values (v_old_id, 'released', 'diganti — slot dikembalikan ke pool');
    end if;
  end if;

  update public.vouchers
  set used_count = used_count + 1, updated_at = now()
  where id = v_new.id;

  begin
    insert into public.voucher_redemptions (voucher_id, wedding_profile_id, amount_applied, status)
    values (v_new.id, p_profile_id, v_new.amount, 'active');
  exception when unique_violation then
    raise exception 'already_used' using errcode = 'P0001';
  end;

  insert into public.voucher_logs (voucher_id, action, details)
  values (v_new.id, 'redeemed', 'profil ' || p_profile_id::text || ' • paket ' || coalesce(p_package, '-') || ' • potongan ' || v_new.amount::text || ' (ganti)');

  return query select v_new.id, v_new.amount, v_old_id, (select code from public.vouchers where id = v_old_id);
end;
$$;
