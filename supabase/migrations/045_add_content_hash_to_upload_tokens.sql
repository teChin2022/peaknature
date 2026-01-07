-- Migration: Add slip_content_hash column to upload_tokens table
-- This stores the SHA-256 hash of the image content for duplicate detection

-- Add the new column
ALTER TABLE upload_tokens ADD COLUMN IF NOT EXISTS slip_content_hash TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_upload_tokens_content_hash ON upload_tokens(slip_content_hash);

-- Comment
COMMENT ON COLUMN upload_tokens.slip_content_hash IS 'SHA-256 hash of the slip image content for duplicate detection';

