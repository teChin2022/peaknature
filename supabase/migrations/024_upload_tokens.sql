-- =====================================================
-- Upload Tokens for Mobile Slip Upload
-- =====================================================
-- Allows desktop users to upload payment slips from their phone
-- by scanning a QR code

CREATE TABLE IF NOT EXISTS upload_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  -- Upload result
  slip_url TEXT,
  is_uploaded BOOLEAN DEFAULT FALSE,
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick token lookup
CREATE INDEX idx_upload_tokens_token ON upload_tokens(token);
CREATE INDEX idx_upload_tokens_expires ON upload_tokens(expires_at);

-- RLS policies
ALTER TABLE upload_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "upload_tokens_select_own"
  ON upload_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tokens
CREATE POLICY "upload_tokens_insert_own"
  ON upload_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens (for marking as uploaded)
CREATE POLICY "upload_tokens_update_own"
  ON upload_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "upload_tokens_delete_own"
  ON upload_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Allow anonymous access to upload (token-based auth)
-- This is needed for the mobile upload page
CREATE POLICY "upload_tokens_select_by_token"
  ON upload_tokens FOR SELECT
  TO anon
  USING (
    token IS NOT NULL 
    AND expires_at > NOW()
  );

CREATE POLICY "upload_tokens_update_by_token"
  ON upload_tokens FOR UPDATE
  TO anon
  USING (
    token IS NOT NULL 
    AND expires_at > NOW()
    AND is_uploaded = FALSE
  );

-- Cleanup function to remove expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_upload_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM upload_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

