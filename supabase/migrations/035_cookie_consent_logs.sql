-- Migration: Cookie Consent Logs
-- Store cookie consent records for GDPR compliance and audit

-- Create cookie_consent_logs table
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous users
  session_id TEXT, -- Browser session identifier
  
  -- Consent details
  consent_status TEXT NOT NULL CHECK (consent_status IN ('accepted', 'declined')),
  consent_categories JSONB DEFAULT '{}', -- For granular consent (analytics, marketing, etc.)
  
  -- Technical information
  ip_address INET, -- IP address
  user_agent TEXT, -- Browser user agent
  referrer TEXT, -- Page where consent was given
  page_url TEXT, -- Current page URL
  
  -- Geographic info (if available)
  country_code TEXT,
  region TEXT,
  
  -- Policy version
  privacy_policy_version TEXT DEFAULT '1.0',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_cookie_consent_created_at ON cookie_consent_logs(created_at DESC);
CREATE INDEX idx_cookie_consent_user_id ON cookie_consent_logs(user_id);
CREATE INDEX idx_cookie_consent_ip ON cookie_consent_logs(ip_address);
CREATE INDEX idx_cookie_consent_status ON cookie_consent_logs(consent_status);

-- Enable RLS
ALTER TABLE cookie_consent_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view consent logs
CREATE POLICY "cookie_consent_logs_select_super_admin" 
  ON cookie_consent_logs FOR SELECT 
  USING (public.is_super_admin());

-- Allow inserting consent logs from API (authenticated or anonymous via API)
CREATE POLICY "cookie_consent_logs_insert_public" 
  ON cookie_consent_logs FOR INSERT 
  WITH CHECK (true);

-- Only super_admin can delete
CREATE POLICY "cookie_consent_logs_delete_super_admin" 
  ON cookie_consent_logs FOR DELETE 
  USING (public.is_super_admin());

-- Create view for admin dashboard statistics
CREATE OR REPLACE VIEW cookie_consent_stats AS
SELECT 
  consent_status,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM cookie_consent_logs
GROUP BY consent_status, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant access to the view
GRANT SELECT ON cookie_consent_stats TO authenticated;

