-- F1: bank/e-wallet logo for gift accounts (WP image element shows bank logo).
ALTER TABLE public.gift_accounts
  ADD COLUMN IF NOT EXISTS provider_logo_url text;

-- F3: remove unused gift fields (toggles + address label/courier note).
-- Addresses are always shown; rekening always shown.
ALTER TABLE public.gift_accounts
  DROP COLUMN IF EXISTS is_active;

ALTER TABLE public.gift_addresses
  DROP COLUMN IF EXISTS label,
  DROP COLUMN IF EXISTS courier_note,
  DROP COLUMN IF EXISTS is_primary,
  DROP COLUMN IF EXISTS is_active;

-- Dropping is_active cascades the (wedding_profile_id, is_active) hot-path
-- indexes; replace them with plain wedding_profile_id indexes.
CREATE INDEX IF NOT EXISTS idx_gift_accounts_profile ON public.gift_accounts(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_gift_addresses_profile ON public.gift_addresses(wedding_profile_id);
