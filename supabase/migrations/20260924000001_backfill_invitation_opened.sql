-- Backfill invitation_opened_at for guests who submitted RSVP before
-- opened-tracking existed on the RSVP routes. Submitting the RSVP form
-- proves the guest opened the invitation. Only rsvp_responded_at writers are
-- the two guest-facing RSVP form routes (scanner check-in never writes it),
-- so this is safe and truthful. Idempotent: only fills NULLs.

UPDATE public.guests
SET invitation_opened_at = rsvp_responded_at
WHERE rsvp_responded_at IS NOT NULL
  AND invitation_opened_at IS NULL;
