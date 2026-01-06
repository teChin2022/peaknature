-- Migration: Prevent Payment Slip Reuse
-- Store verified slip transaction references to prevent duplicate usage

-- ============================================================================
-- 1. CREATE VERIFIED SLIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS verified_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trans_ref TEXT,                   -- Transaction reference from EasySlip (nullable for non-EasySlip)
  slip_url_hash TEXT NOT NULL,      -- Hash of slip URL for duplicate detection
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  slip_url TEXT,
  easyslip_data JSONB,
  
  -- Allow duplicate trans_ref if null, but unique otherwise
  CONSTRAINT unique_trans_ref_if_not_null UNIQUE (trans_ref)
);

-- Index for checking duplicates
CREATE INDEX IF NOT EXISTS idx_verified_slips_trans_ref ON verified_slips(trans_ref);
CREATE INDEX IF NOT EXISTS idx_verified_slips_slip_url_hash ON verified_slips(slip_url_hash);
CREATE INDEX IF NOT EXISTS idx_verified_slips_tenant ON verified_slips(tenant_id);

-- ============================================================================
-- 2. RLS POLICIES - Allow authenticated users to check duplicates
-- ============================================================================
ALTER TABLE verified_slips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role only" ON verified_slips;
DROP POLICY IF EXISTS "Anyone can check duplicates" ON verified_slips;
DROP POLICY IF EXISTS "Authenticated can insert" ON verified_slips;

-- Allow anyone to SELECT (check for duplicates)
CREATE POLICY "Anyone can check duplicates" ON verified_slips
  FOR SELECT USING (true);

-- Allow authenticated users to INSERT
CREATE POLICY "Authenticated can insert" ON verified_slips
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON verified_slips TO anon;
GRANT SELECT, INSERT ON verified_slips TO authenticated;

-- ============================================================================
-- 3. FUNCTION TO CHECK DUPLICATE SLIP BY URL HASH
-- ============================================================================
CREATE OR REPLACE FUNCTION check_slip_duplicate_by_hash(p_slip_url_hash TEXT)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  original_booking_id UUID,
  verified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as is_duplicate,
    vs.booking_id as original_booking_id,
    vs.verified_at
  FROM verified_slips vs
  WHERE vs.slip_url_hash = p_slip_url_hash
  LIMIT 1;
  
  -- If no rows returned, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_slip_duplicate_by_hash TO authenticated;
GRANT EXECUTE ON FUNCTION check_slip_duplicate_by_hash TO anon;

