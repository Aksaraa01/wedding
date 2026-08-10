-- Hot-path indexes for faster loads: guest-facing invitation rendering,
-- dashboard aggregates, welcome/check-in, and reminder wires.

CREATE INDEX IF NOT EXISTS idx_gift_accounts_profile_active ON public.gift_accounts(wedding_profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gift_addresses_profile_active ON public.gift_addresses(wedding_profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_guest_photos_profile ON public.guest_photos(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_profile ON public.feedback_submissions(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_wa_blast_schedules_profile ON public.wa_blast_schedules(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_wishes_profile_source ON public.wishes(wedding_profile_id, source);
CREATE INDEX IF NOT EXISTS idx_wishes_guest ON public.wishes(guest_id);
CREATE INDEX IF NOT EXISTS idx_guests_profile_slug ON public.guests(wedding_profile_id, slug);