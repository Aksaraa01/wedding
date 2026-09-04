-- Add client login PIN to users (6-digit). Backfill existing accounts to 123456.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pin character varying(10);

UPDATE public.users SET pin = '123456' WHERE pin IS NULL;
