-- Ceriavite: more than one ananda per invitation.
--
-- One khitanan / aqiqah ceremony often introduces siblings. The list keeps the
-- per-child content (`name`, `full_name`, `photo_url`, `instagram`), while the
-- parent line stays SINGLE and shared in `groom_parents` — it is the same
-- Bapak/Ibu for every ananda, so it must never be repeated per child.
--
-- The first child is mirrored into the legacy first person slot (`groom_*`) by
-- PUT /api/dashboard/{id}/web-invitation on every save. Slug generation, couple
-- name resolution, OG copy, ops queue rows and every older reader keep working
-- with no second code path, and templates fall back to that slot when
-- `children` is empty (invitations created before this column render as before).
--
-- Shape: [{"name": "Raka", "full_name": "Raka Pratama",
--          "photo_url": "https://…", "instagram": "raka"}]
--
-- See docs/CERIAVITE.md.

ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS children jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.wedding_profiles.children IS
  'Ceriavite only: ordered list of ananda ({name, full_name, photo_url, instagram}). Parent name is shared via groom_parents. First entry mirrors groom_* for legacy readers.';
