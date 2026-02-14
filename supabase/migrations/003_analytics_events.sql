-- Analytics events table (privacy-first: anonymous device_id, no user_id)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  app_version TEXT,
  platform TEXT
);

-- Indices for querying
CREATE INDEX idx_analytics_event_name_created ON analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_device_created ON analytics_events (device_id, created_at);

-- RLS: insert-only (anyone can insert, nobody can read/update/delete from client)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON analytics_events
  FOR INSERT
  WITH CHECK (true);
