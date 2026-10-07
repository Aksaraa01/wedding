-- Voucher title (mandatory, e.g. campaign name) + description (optional).
alter table public.vouchers
  add column if not exists title text not null default '',
  add column if not exists description text;
