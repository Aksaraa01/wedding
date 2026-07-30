-- Editor: template data columns for wedding_profiles
ALTER TABLE wedding_profiles
    ADD COLUMN IF NOT EXISTS couple_illustration_url TEXT,
    ADD COLUMN IF NOT EXISTS grayscale BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS groom_full_name TEXT,
    ADD COLUMN IF NOT EXISTS bride_full_name TEXT,
    ADD COLUMN IF NOT EXISTS groom_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS bride_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS groom_parents TEXT,
    ADD COLUMN IF NOT EXISTS bride_parents TEXT,
    ADD COLUMN IF NOT EXISTS groom_instagram TEXT;

-- Template media bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('template-media', 'template-media', true)
ON CONFLICT (id) DO NOTHING;

-- Stories JSONB column for love story milestones
ALTER TABLE wedding_profiles
    ADD COLUMN IF NOT EXISTS stories JSONB DEFAULT '[]'::jsonb;

-- Gallery photos array (max 5MB per photo) + drop video_url
ALTER TABLE wedding_profiles
    ADD COLUMN IF NOT EXISTS gallery_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE wedding_profiles
    DROP COLUMN IF EXISTS gallery_video_url;
