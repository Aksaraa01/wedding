-- Per-guest invited session scope (in-house invitation personalization).
-- null = invited to all sessions (dynamic). A subset is stored as 0-based
-- indexes into wedding_profiles.sessions at render time.
alter table public.guests
  add column if not exists invited_session_indexes integer[];

comment on column public.guests.invited_session_indexes is
  '0-based indexes into wedding_profiles.sessions; null means all sessions (dynamic).';
