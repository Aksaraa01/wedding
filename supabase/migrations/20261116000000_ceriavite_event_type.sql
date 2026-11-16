-- Ceriavite: event families on the wedding platform.
--
-- The invitation data model is unchanged. A kids event (khitanan, aqiqah,
-- ulang tahun) stores the child in the first person slot (`groom_*`) and leaves
-- the second slot empty; `resolveCoupleName()` already collapses to one name.
-- `subject_gender` is a copy attribute only ("Putra Kami" vs "Putri Kami") and
-- must never decide which column holds the child.
--
-- `web_templates.event_type` holds the event FAMILY ('wedding' | 'kids'), not
-- the specific rite: one khitanan template serves khitanan, aqiqah and ulang
-- tahun alike, so the gallery filter is family-level while a profile keeps the
-- exact rite. Every existing row is 'wedding' by default.
--
-- See docs/CERIAVITE.md.

ALTER TABLE public.wedding_profiles
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'wedding',
  ADD COLUMN IF NOT EXISTS subject_gender text;

ALTER TABLE public.wedding_profiles
  DROP CONSTRAINT IF EXISTS wedding_profiles_event_type_check,
  ADD CONSTRAINT wedding_profiles_event_type_check
    CHECK (event_type = ANY (ARRAY['wedding'::text, 'khitanan'::text, 'aqiqah'::text, 'birthday'::text]));

ALTER TABLE public.wedding_profiles
  DROP CONSTRAINT IF EXISTS wedding_profiles_subject_gender_check,
  ADD CONSTRAINT wedding_profiles_subject_gender_check
    CHECK (subject_gender IS NULL OR subject_gender = ANY (ARRAY['putra'::text, 'putri'::text]));

ALTER TABLE public.web_templates
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'wedding';

ALTER TABLE public.web_templates
  DROP CONSTRAINT IF EXISTS web_templates_event_type_check,
  ADD CONSTRAINT web_templates_event_type_check
    CHECK (event_type = ANY (ARRAY['wedding'::text, 'kids'::text]));

CREATE INDEX IF NOT EXISTS wedding_profiles_event_type_idx
  ON public.wedding_profiles USING btree (event_type);

CREATE INDEX IF NOT EXISTS web_templates_event_type_idx
  ON public.web_templates USING btree (event_type);
