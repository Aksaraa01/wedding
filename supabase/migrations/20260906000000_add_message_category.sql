-- Store the couple's selected WhatsApp invitation-message template category
-- (nasional | international | muslim | kristen | budha | hindu).
ALTER TABLE public.wedding_profiles ADD COLUMN IF NOT EXISTS message_category text DEFAULT 'nasional';
UPDATE public.wedding_profiles SET message_category = 'nasional' WHERE message_category IS NULL;