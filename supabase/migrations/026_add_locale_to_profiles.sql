-- Add locale column to profiles for language preference
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'th';

-- Add comment
COMMENT ON COLUMN profiles.locale IS 'User preferred language (th, en)';

