-- =====================================================
-- PLATFORM SETTINGS TABLE
-- Stores global platform configuration for super admins
-- =====================================================

-- Create platform_settings table (single row table)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- General Settings
  platform_name VARCHAR(255) DEFAULT 'Homestay Booking',
  support_email VARCHAR(255) DEFAULT 'support@homestay.com',
  default_currency VARCHAR(10) DEFAULT 'thb',
  default_timezone VARCHAR(50) DEFAULT 'gmt7',
  
  -- Email Configuration
  smtp_host VARCHAR(255) DEFAULT '',
  smtp_port INTEGER DEFAULT 587,
  from_email VARCHAR(255) DEFAULT '',
  from_name VARCHAR(255) DEFAULT 'Homestay Booking',
  
  -- Payment Settings (PromptPay)
  promptpay_name VARCHAR(255) DEFAULT '',
  promptpay_qr_url TEXT DEFAULT '',
  platform_fee_percent DECIMAL(5,2) DEFAULT 10.00,
  
  -- LINE Messaging Configuration
  line_channel_access_token TEXT DEFAULT '',
  line_user_id VARCHAR(50) DEFAULT '',
  
  -- Security Settings
  require_email_verification BOOLEAN DEFAULT true,
  require_2fa_admin BOOLEAN DEFAULT false,
  
  -- Notification Settings
  notify_new_tenant BOOLEAN DEFAULT true,
  notify_daily_summary BOOLEAN DEFAULT true,
  notify_errors BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings (only one row should exist)
INSERT INTO platform_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can view and modify platform settings
CREATE POLICY "platform_settings_select_super_admin"
  ON platform_settings FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "platform_settings_insert_super_admin"
  ON platform_settings FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE POLICY "platform_settings_update_super_admin"
  ON platform_settings FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS platform_settings_updated_at ON platform_settings;
CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_updated_at();
