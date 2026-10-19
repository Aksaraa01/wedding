-- Clearance / lifecycle teardown.
-- Durations are DB-driven (edit the rows, no deploy): masa aktif per package +
-- galeri photo retention. Ops uses the Clearance console to remind and to
-- execute teardown (deactivate invitation + delete WP post/media + guest photos).

-- 1) Masa aktif per package, in months. NULL = no masa aktif (e.g. standalone
--    Galeri Tamu, which uses the photo-retention window instead).
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS active_period_months integer;

UPDATE public.packages SET active_period_months = 2  WHERE code = 'cetak_undangan_bonus';
UPDATE public.packages SET active_period_months = 12 WHERE code = 'bonus_full_custom';
UPDATE public.packages SET active_period_months = 3  WHERE code = 'essential';
UPDATE public.packages SET active_period_months = 6  WHERE code = 'signature';
UPDATE public.packages SET active_period_months = 12 WHERE code = 'prestige';
UPDATE public.packages SET active_period_months = 12 WHERE code = 'elite';
UPDATE public.packages SET active_period_months = 12
  WHERE code IN ('dgb_sistem', 'dgb_pro', 'dgb_premium', 'dgb_prestige');
UPDATE public.packages SET active_period_months = NULL WHERE code = 'gt';

-- 2) Key/value app config so durations/lead times are editable without a deploy.
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);

INSERT INTO public.app_settings (key, value, description) VALUES
  ('galeri_photo_retention_days', '7'::jsonb, 'Hari setelah acara berakhir sebelum foto tamu masuk masa hapus.'),
  ('clearance_reminder_days', '3'::jsonb, 'Hari sebelum tanggal hapus saat couple muncul di kolom pengingat (H-3).')
ON CONFLICT (key) DO NOTHING;

-- 3) Explicit markers set when Ops executes teardown. They drive the
--    "masa aktif berakhir" / "galeri berakhir" pages. Enforcement happens ONLY
--    after Ops executes (by design) — never purely from the computed date.
ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS invitation_disabled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS photos_cleared_at timestamp with time zone;

-- 4) Clearance action state (reminder + resumable/idempotent execution).
CREATE TABLE IF NOT EXISTS public.clearance_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wedding_profile_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('photos', 'invitation')),
  due_at date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reminded', 'executing', 'partial', 'done', 'failed')),
  steps jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error text,
  attempts integer NOT NULL DEFAULT 0,
  reminded_at timestamp with time zone,
  executed_at timestamp with time zone,
  executed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clearance_actions_pkey PRIMARY KEY (id),
  CONSTRAINT clearance_actions_wedding_profile_id_fkey
    FOREIGN KEY (wedding_profile_id) REFERENCES public.wedding_profiles(id),
  CONSTRAINT clearance_actions_executed_by_fkey
    FOREIGN KEY (executed_by) REFERENCES public.employees(id)
);

CREATE INDEX IF NOT EXISTS idx_clearance_actions_due
  ON public.clearance_actions(kind, due_at);
-- One action row per (profile, kind); retries update it in place (idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS uq_clearance_actions_profile_kind
  ON public.clearance_actions(wedding_profile_id, kind);
