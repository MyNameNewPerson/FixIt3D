-- Admin & Config Schema

-- 1. App Configuration (Affiliate Links, Site Settings)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial affiliate links
INSERT INTO app_config (key, value, description) VALUES
('filament_pla', 'https://www.aliexpress.com/wholesale?SearchText=PLA+filament', 'Affiliate link for PLA'),
('filament_petg', 'https://www.aliexpress.com/wholesale?SearchText=PETG+filament', 'Affiliate link for PETG'),
('bearing_608', 'https://www.aliexpress.com/wholesale?SearchText=608ZZ+bearing', 'Affiliate link for 608ZZ Bearings'),
('arduino', 'https://www.aliexpress.com/wholesale?SearchText=Arduino+Nano', 'Affiliate link for Arduino')
ON CONFLICT (key) DO NOTHING;

-- 2. Daily Stats (Aggregated Metrics)
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  visits INTEGER DEFAULT 0,
  searches INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  clicks_affiliate INTEGER DEFAULT 0,
  revenue_est NUMERIC(10, 2) DEFAULT 0.00
);

-- 3. Admin Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only service_role (backend) can write
CREATE POLICY "Public read config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Admin write config" ON app_config FOR ALL USING (false); -- Block client writes
CREATE POLICY "Admin full access stats" ON daily_stats FOR ALL USING (false); -- Block client writes

-- 4. RPC Functions (Atomic Increments)
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
