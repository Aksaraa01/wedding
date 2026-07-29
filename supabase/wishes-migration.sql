CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_profile_id UUID REFERENCES wedding_profiles(id) NOT NULL,
  guest_id UUID REFERENCES guests(id),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wishes_wedding_profile ON wishes(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);
