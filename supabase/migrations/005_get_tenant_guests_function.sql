-- =====================================================
-- FUNCTION: Get guests for a tenant (bypasses RLS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_tenant_guests(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  tenant_id UUID,
  is_blocked BOOLEAN,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
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
    RAISE EXCEPTION 'Access denied: You do not have permission to view guests for this tenant';
  END IF;

  -- Return guests for the tenant
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.tenant_id,
    p.is_blocked,
    p.avatar_url,
    p.created_at
  FROM public.profiles p
  WHERE p.tenant_id = p_tenant_id
    AND p.role = 'guest'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_tenant_guests TO authenticated;

