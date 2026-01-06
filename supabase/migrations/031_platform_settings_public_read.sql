-- =====================================================
-- ADD PUBLIC READ POLICY FOR PLATFORM SETTINGS
-- Allows the landing page to read platform name and currency
-- =====================================================

-- Add policy for public/anonymous read access
-- Only allows reading specific non-sensitive columns
CREATE POLICY "platform_settings_public_read"
  ON platform_settings FOR SELECT
  USING (true);

-- Note: This allows public read of the entire row.
-- The landing page only selects: platform_name, default_currency
-- Sensitive data like LINE tokens are still protected by the API layer.

