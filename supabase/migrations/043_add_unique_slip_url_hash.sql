-- Migration: Add UNIQUE constraint on slip_url_hash to prevent race conditions
-- This ensures the same slip cannot be used twice, even with concurrent requests

-- Add unique constraint on slip_url_hash
ALTER TABLE verified_slips 
ADD CONSTRAINT unique_slip_url_hash UNIQUE (slip_url_hash);

-- This will fail if there are duplicate slip_url_hash values in the table.
-- If it fails, run this first to clean up duplicates:
-- DELETE FROM verified_slips a USING verified_slips b 
-- WHERE a.id > b.id AND a.slip_url_hash = b.slip_url_hash;

