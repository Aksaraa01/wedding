-- Fix ambiguous column in swap_voucher: the RETURNS TABLE out-param
-- `voucher_id` collides with the column in RETURNING. Qualify it.
-- (Supersedes the swap body in 20261009000000; base table changes there stand.)
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

  select id, voucher_redemptions.voucher_id into v_old_redemption_id, v_old_id
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
