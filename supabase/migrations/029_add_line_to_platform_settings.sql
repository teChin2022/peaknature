-- =====================================================
-- ADD LINE MESSAGING COLUMNS TO PLATFORM SETTINGS
-- For admin notifications via LINE
-- =====================================================

-- Add LINE columns if they don't exist
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS line_channel_access_token TEXT DEFAULT '';

ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(50) DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN platform_settings.line_channel_access_token IS 'LINE Messaging API channel access token for admin notifications';
COMMENT ON COLUMN platform_settings.line_user_id IS 'LINE User ID of the admin to receive notifications';

