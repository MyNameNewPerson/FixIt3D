-- Enable PostGIS if needed for advanced geo-queries (optional, but good for lat/lng)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Models Table (Aggregated from Thingiverse, MyMiniFactory, etc.)
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY, -- External ID or UUID
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL, -- Link to original source
  image_url TEXT,
  author TEXT,
  source TEXT NOT NULL, -- e.g., 'MyMiniFactory', 'Thingiverse'
  price TEXT, -- 'free' or price string
  mode TEXT CHECK (mode IN ('spare-parts', 'hobby', 'auto', 'home')),
  category TEXT,
  brand TEXT,
  tags TEXT[], -- Array of strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast searching
CREATE INDEX IF NOT EXISTS models_mode_idx ON models(mode);
CREATE INDEX IF NOT EXISTS models_source_idx ON models(source);
CREATE INDEX IF NOT EXISTS models_title_trgm_idx ON models USING GIN (to_tsvector('english', title));

-- Masters Table (3D Printing Services)
CREATE TABLE IF NOT EXISTS masters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  contacts JSONB, -- Store phone, email, whatsapp, telegram here
  is_premium BOOLEAN DEFAULT FALSE,
  balance NUMERIC(10, 2) DEFAULT 0.00, -- Internal currency for leads
  source TEXT DEFAULT 'user', -- 'user' or 'osm'
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for geospatial lookups (simple lat/lng box)
CREATE INDEX IF NOT EXISTS masters_lat_lng_idx ON masters(lat, lng);
CREATE INDEX IF NOT EXISTS masters_premium_idx ON masters(is_premium);

-- Enable Row Level Security (RLS) - Optional for now, but recommended
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read models
CREATE POLICY "Public models are viewable by everyone" ON models
  FOR SELECT USING (true);

-- Policy: Masters are ONLY viewable by Service Role (via our backend API)
-- We remove the "public" policy and only allow service role.
-- If frontend tries to query directly, it will fail (returning 0 rows).
-- The API uses the SERVICE_ROLE_KEY to bypass RLS and filter data securely.
CREATE POLICY "Service Role full access masters" ON masters
  FOR ALL USING (auth.role() = 'service_role');
