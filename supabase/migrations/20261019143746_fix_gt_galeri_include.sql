SET local check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.redeem_voucher (
  p_code          text,
  p_profile_id    uuid,
  p_base          integer,
  p_wa_price      integer,
  p_express_price integer,
  p_galeri_price  integer,
  p_employee_id   uuid
)
  RETURNS TABLE (
    out_discount     integer,
    out_voucher_id   uuid,
    out_voucher_code text,
    out_terms        jsonb
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
    + case when v_row.include_galeri then greatest(0, coalesce(p_galeri_price, 0)) else 0 end;

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
$function$;
CREATE OR REPLACE FUNCTION public.swap_voucher (
  p_code          text,
  p_profile_id    uuid,
  p_base          integer,
  p_wa_price      integer,
  p_express_price integer,
  p_galeri_price  integer,
  p_employee_id   uuid
)
  RETURNS TABLE (
    out_discount       integer,
    out_voucher_id     uuid,
    out_voucher_code   text,
    out_terms          jsonb,
    out_old_voucher_id uuid,
    out_old_code       text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
    + case when v_new.include_galeri then greatest(0, coalesce(p_galeri_price, 0)) else 0 end;

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
$function$;
