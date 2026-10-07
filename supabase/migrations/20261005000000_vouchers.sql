-- Voucher discount system (50k campaign-ready, capped, package-scoped).
-- One voucher redemption per couple; discount locked at registration and
-- preserved across later package/add-on changes.

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  amount int not null default 50000 check (amount >= 0),
  max_uses int not null default 100 check (max_uses > 0),
  used_count int not null default 0 check (used_count >= 0),
  -- JSONB array of package codes; empty array = all packages.
  package_eligibility jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vouchers_code_idx on public.vouchers (code);
create index if not exists vouchers_active_idx on public.vouchers (is_active);

create table if not exists public.voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  wedding_profile_id uuid not null references public.wedding_profiles(id) on delete cascade,
  amount_applied int not null default 0,
  created_at timestamptz not null default now(),
  unique (wedding_profile_id)
);

create index if not exists voucher_redemptions_voucher_idx on public.voucher_redemptions (voucher_id);

create table if not exists public.voucher_logs (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.vouchers(id) on delete cascade,
  action text not null,
  details text,
  changed_by_employee_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists voucher_logs_voucher_idx on public.voucher_logs (voucher_id, created_at desc);

alter table public.wedding_profiles
  add column if not exists voucher_code text,
  add column if not exists voucher_discount int not null default 0;

-- Atomic redeem: checks + cap increment + redemption row in ONE transaction,
-- so concurrent registrations can never overshoot max_uses. Raises distinct
-- codes the API maps to messages: invalid | inactive | exhausted |
-- ineligible | already_used. Returns the discount amount on success.
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

  if exists (select 1 from public.voucher_redemptions where wedding_profile_id = p_profile_id) then
    raise exception 'already_used' using errcode = 'P0001';
  end if;

  update public.vouchers
  set used_count = used_count + 1, updated_at = now()
  where id = v_row.id;

  insert into public.voucher_redemptions (voucher_id, wedding_profile_id, amount_applied)
  values (v_row.id, p_profile_id, v_row.amount);

  insert into public.voucher_logs (voucher_id, action, details)
  values (v_row.id, 'redeemed', 'profil ' || p_profile_id::text || ' • paket ' || coalesce(p_package, '-') || ' • potongan ' || v_row.amount::text);

  return v_row.amount;
end;
$$;

-- Service-role only; all access goes through the API routes.
alter table public.vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.voucher_logs enable row level security;
