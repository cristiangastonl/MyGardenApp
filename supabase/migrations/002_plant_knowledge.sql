-- Plant Knowledge Cache
-- Shared table for all users with plant care information from APIs

CREATE TABLE IF NOT EXISTS plant_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  other_names TEXT[],
  image_url TEXT,

  -- Care info
  watering_frequency_days INTEGER,
  sunlight TEXT, -- 'full_sun', 'part_shade', 'full_shade'
  sun_hours_min INTEGER,
  sun_hours_max INTEGER,
  temp_min_c INTEGER,
  temp_max_c INTEGER,
  humidity TEXT, -- 'low', 'medium', 'high'
  indoor BOOLEAN,

  -- Additional info
  description TEXT,
  care_tips TEXT,

  -- Source tracking
  source TEXT NOT NULL, -- 'perenual', 'trefle', 'ai', 'manual'
  source_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_plant_knowledge_common_name
  ON plant_knowledge USING gin (to_tsvector('spanish', common_name));

CREATE INDEX IF NOT EXISTS idx_plant_knowledge_scientific_name
  ON plant_knowledge (scientific_name);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_plant_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plant_knowledge_updated_at
  BEFORE UPDATE ON plant_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_plant_knowledge_updated_at();

-- RLS: Anyone can read, only authenticated can insert
ALTER TABLE plant_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plant knowledge"
  ON plant_knowledge FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert plant knowledge"
  ON plant_knowledge FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Prevent duplicates by source
CREATE UNIQUE INDEX IF NOT EXISTS idx_plant_knowledge_source_unique
  ON plant_knowledge (source, source_id)
  WHERE source_id IS NOT NULL;
