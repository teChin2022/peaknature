-- =====================================================
-- FUNCTION: Get bookings for a tenant with guest info (bypasses RLS for profile join)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_tenant_bookings(
  p_tenant_id UUID,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  room_id UUID,
  user_id UUID,
  check_in DATE,
  check_out DATE,
  guests INT,
  total_price DECIMAL,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  room_name TEXT,
  guest_full_name TEXT,
  guest_email TEXT,
  guest_phone TEXT
) AS $$
BEGIN
  -- Verify the caller is a host for this tenant or a super_admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'host' 
      AND profiles.tenant_id = p_tenant_id
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view bookings for this tenant';
  END IF;

  -- Return bookings with guest and room info
  RETURN QUERY
  SELECT 
    b.id,
    b.tenant_id,
    b.room_id,
    b.user_id,
    b.check_in,
    b.check_out,
    b.guests,
    b.total_price,
    b.status,
    b.notes,
    b.created_at,
    r.name as room_name,
    p.full_name as guest_full_name,
    p.email as guest_email,
    p.phone as guest_phone
  FROM public.bookings b
  LEFT JOIN public.rooms r ON b.room_id = r.id
  LEFT JOIN public.profiles p ON b.user_id = p.id
  WHERE b.tenant_id = p_tenant_id
    AND (p_status IS NULL OR b.status = p_status)
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_tenant_bookings TO authenticated;

