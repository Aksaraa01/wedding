CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  pin VARCHAR(6) NOT NULL,
  role VARCHAR(50) DEFAULT 'ops',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ops_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_profile_id UUID REFERENCES wedding_profiles(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sla_started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  assigned_to UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_queue_id UUID REFERENCES ops_queue(id) NOT NULL,
  wedding_profile_id UUID REFERENCES wedding_profiles(id) NOT NULL,
  feature_key VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'butuh_tindakan',
  client_note TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ops_queue_status ON ops_queue(status);
CREATE INDEX IF NOT EXISTS idx_ops_queue_wedding_profile ON ops_queue(wedding_profile_id);
CREATE INDEX IF NOT EXISTS idx_feature_actions_queue ON feature_actions(ops_queue_id);
CREATE INDEX IF NOT EXISTS idx_feature_actions_wedding_profile ON feature_actions(wedding_profile_id);

ALTER TABLE guests ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1;

INSERT INTO employees (name, phone_number, pin, role)
SELECT 'Admin', '+628123456789', '123456', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone_number = '+628123456789');
INSERT INTO employees (name, phone_number, pin, role)
SELECT 'Sales', '+628100000011', '111111', 'sales'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone_number = '+628100000011');
INSERT INTO employees (name, phone_number, pin, role)
SELECT 'Creative', '+628100000022', '222222', 'creative'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE phone_number = '+628100000022');
