-- =================================================================================
-- FixIt3D Full Database Setup
-- Run this entire script in the Supabase SQL Editor to create all necessary tables.
-- =================================================================================

-- 1. Enable Extensions
-- CREATE EXTENSION IF NOT EXISTS postgis; -- Optional

-- 2. Models Table (Aggregated from MyMiniFactory, Thingiverse)
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  author TEXT,
  source TEXT NOT NULL,
  price TEXT,
  mode TEXT CHECK (mode IN ('spare-parts', 'hobby', 'auto', 'home')),
  category TEXT,
  brand TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS models_mode_idx ON models(mode);
CREATE INDEX IF NOT EXISTS models_source_idx ON models(source);
CREATE INDEX IF NOT EXISTS models_title_trgm_idx ON models USING GIN (to_tsvector('english', title));

-- 3. Masters Table (3D Printing Services)
CREATE TABLE IF NOT EXISTS masters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  contacts JSONB, -- Private contact info
  is_premium BOOLEAN DEFAULT FALSE,
  balance NUMERIC(10, 2) DEFAULT 0.00,
  source TEXT DEFAULT 'user', -- 'user' or 'osm'
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS masters_lat_lng_idx ON masters(lat, lng);
CREATE INDEX IF NOT EXISTS masters_premium_idx ON masters(is_premium);

-- 4. App Configuration (Affiliate Links)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Daily Stats (Analytics)
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  visits INTEGER DEFAULT 0,
  searches INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  clicks_affiliate INTEGER DEFAULT 0,
  revenue_est NUMERIC(10, 2) DEFAULT 0.00
);

-- 6. Admin Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================================
-- Row Level Security (RLS) Policies
-- =================================================================================

ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Models: Public Read
CREATE POLICY "Public models read" ON models FOR SELECT USING (true);

-- Masters: Service Role Only (Frontend uses API, API uses Service Role Key)
-- This protects 'contacts' from being scraped via Anon Key
CREATE POLICY "Service Role full access masters" ON masters FOR ALL USING (auth.role() = 'service_role');

-- Config: Public Read (for checking links), Admin Write
CREATE POLICY "Public read config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Admin write config" ON app_config FOR ALL USING (false); -- Block client writes

-- Stats & Logs: Admin Only (Service Role)
CREATE POLICY "Admin full access stats" ON daily_stats FOR ALL USING (false);
CREATE POLICY "Admin full access logs" ON admin_logs FOR ALL USING (false);

-- =================================================================================
-- RPC Functions (Atomic Operations)
-- =================================================================================

-- Atomic Increment for Daily Stats
CREATE OR REPLACE FUNCTION increment_daily_stat(col TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_stats (date, visits, searches, leads, clicks_affiliate)
  VALUES (CURRENT_DATE,
    CASE WHEN col = 'visits' THEN 1 ELSE 0 END,
    CASE WHEN col = 'searches' THEN 1 ELSE 0 END,
    CASE WHEN col = 'leads' THEN 1 ELSE 0 END,
    CASE WHEN col = 'clicks_affiliate' THEN 1 ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE
  SET
    visits = daily_stats.visits + CASE WHEN col = 'visits' THEN 1 ELSE 0 END,
    searches = daily_stats.searches + CASE WHEN col = 'searches' THEN 1 ELSE 0 END,
    leads = daily_stats.leads + CASE WHEN col = 'leads' THEN 1 ELSE 0 END,
    clicks_affiliate = daily_stats.clicks_affiliate + CASE WHEN col = 'clicks_affiliate' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
