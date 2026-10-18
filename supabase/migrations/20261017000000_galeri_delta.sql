-- Galeri delta staging: top-up for paid Galeri (undangan add-on, gt, dgb).
-- Staged delta + prev snapshot allow Ops to pay/unpay with quota+total revert.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS galeri_topup_photos_per_guest int,
  ADD COLUMN IF NOT EXISTS galeri_topup_guest_count int,
  ADD COLUMN IF NOT EXISTS additional_tier text,
  ADD COLUMN IF NOT EXISTS galeri_prev_photos int,
  ADD COLUMN IF NOT EXISTS galeri_prev_guests int,
  ADD COLUMN IF NOT EXISTS galeri_prev_tier text,
  ADD COLUMN IF NOT EXISTS galeri_prev_price int,
  ADD COLUMN IF NOT EXISTS additional_cost int DEFAULT 0 CHECK (additional_cost >= 0),
  ADD COLUMN IF NOT EXISTS additional_payment_status text CHECK (additional_payment_status IN ('UNPAID','PAID')) DEFAULT 'UNPAID';

CREATE INDEX IF NOT EXISTS idx_profiles_additional_unpaid
  ON public.wedding_profiles(additional_payment_status) WHERE additional_cost > 0;
