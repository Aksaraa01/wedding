-- Follow-up to 20261018000000_clearance: enforce one clearance_actions row per
-- (profile, kind) so remind/execute/retry update in place instead of inserting
-- duplicates. Dedupe any rows created before the constraint existed.

DELETE FROM public.clearance_actions a
USING public.clearance_actions b
WHERE a.wedding_profile_id = b.wedding_profile_id
  AND a.kind = b.kind
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_clearance_actions_profile_kind
  ON public.clearance_actions(wedding_profile_id, kind);
