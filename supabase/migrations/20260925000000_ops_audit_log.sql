-- Database-level audit trail for status/payment changes.
-- Catches EVERY writer (app routes, dashboard SQL editor, one-off scripts),
-- unlike ops_queue_status_log which only rows written by app code reach.
-- Rows are tiny (~300 bytes); ~10-20 rows per couple lifecycle.

CREATE TABLE IF NOT EXISTS public.ops_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  table_name text NOT NULL,
  row_id uuid NOT NULL,
  column_name text NOT NULL,
  old_value text,
  new_value text,
  actor text NOT NULL DEFAULT 'unknown',
  CONSTRAINT ops_audit_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ops_audit_log_row
  ON public.ops_audit_log (table_name, row_id, at DESC);

-- Service-role only (all reads go through API routes with supabaseAdmin).
ALTER TABLE public.ops_audit_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.log_status_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col text := TG_ARGV[0];
  old_v text;
  new_v text;
  claims text := current_setting('request.jwt.claims', true);
  who text := 'unknown';
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF col = 'status' THEN
    old_v := OLD.status;
    new_v := NEW.status;
  ELSIF col = 'payment_status' THEN
    old_v := OLD.payment_status;
    new_v := NEW.payment_status;
  ELSE
    RETURN NEW;
  END IF;
  IF old_v IS NOT DISTINCT FROM new_v THEN
    RETURN NEW;
  END IF;
  -- PostgREST/service-role writes carry the role claim; direct SQL shows the
  -- postgres role. Shared service key can't name the human — the app-level
  -- ops_queue_status_log (with employee) remains the primary trail.
  BEGIN
    IF claims IS NOT NULL AND claims <> '' THEN
      who := COALESCE((claims::json ->> 'role'), 'unknown');
    ELSE
      who := session_user;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    who := session_user;
  END;
  INSERT INTO public.ops_audit_log (table_name, row_id, column_name, old_value, new_value, actor)
  VALUES (TG_TABLE_NAME, NEW.id, col, old_v, new_v, who);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_ops_queue_status ON public.ops_queue;
CREATE TRIGGER trg_audit_ops_queue_status
  AFTER UPDATE OF status ON public.ops_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_audit('status');

DROP TRIGGER IF EXISTS trg_audit_wedding_payment ON public.wedding_profiles;
CREATE TRIGGER trg_audit_wedding_payment
  AFTER UPDATE OF payment_status ON public.wedding_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_audit('payment_status');
