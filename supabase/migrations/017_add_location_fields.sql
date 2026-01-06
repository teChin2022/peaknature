-- Migration: Add location fields to profiles
-- Province, district, and sub_district for guest demographics

-- Add location columns to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS sub_district TEXT;

-- Create index for statistics queries
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(district);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_province ON profiles(tenant_id, province);

-- Function to get guest demographics by province for a tenant
CREATE OR REPLACE FUNCTION get_guest_demographics_by_province(p_tenant_id UUID)
RETURNS TABLE (
  province TEXT,
  guest_count BIGINT,
  booking_count BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.province,
    COUNT(DISTINCT p.id) as guest_count,
    COUNT(b.id) as booking_count,
    COALESCE(SUM(b.total_price), 0) as total_revenue
  FROM profiles p
  LEFT JOIN bookings b ON b.user_id = p.id AND b.tenant_id = p_tenant_id AND b.status IN ('confirmed', 'completed')
  WHERE p.tenant_id = p_tenant_id
    AND p.province IS NOT NULL
  GROUP BY p.province
  ORDER BY guest_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_guest_demographics_by_province TO authenticated;

