-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default entry if not exists
INSERT INTO site_settings (id, content)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

-- Policies for Row Level Security (if needed, but server.ts uses service_role_key)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow service role update" ON site_settings FOR ALL USING (true);
