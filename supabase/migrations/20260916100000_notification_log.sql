CREATE TABLE IF NOT EXISTS notification_log (
  wedding_profile_id UUID PRIMARY KEY REFERENCES wedding_profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'wa_group',
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
