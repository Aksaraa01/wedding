-- Source image for the invitation link's social thumbnail (og:image).
--
-- Templates that render no cover slot (tanpa-foto or designs without a cover
-- photo) had no user-chosen image for WhatsApp/social link previews, so the OG
-- card fell back to the couple portrait/illustration. The editor and the ops
-- invitation editor now ask for a dedicated thumbnail in that case, or an
-- explicit "tanpa foto thumbnail" opt-out, before confirmation. When the
-- template does have cover slots this stays null and the first cover keeps
-- driving the thumbnail.
ALTER TABLE wedding_profiles
  ADD COLUMN IF NOT EXISTS link_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS link_thumbnail_disabled boolean NOT NULL DEFAULT false;
