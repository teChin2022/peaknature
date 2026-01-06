-- =====================================================
-- ALLOW HOST REGISTRATION - Additional RLS Policies
-- =====================================================

-- Allow hosts to view their own tenant (even if inactive/pending)
CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (
    id = public.get_my_tenant_id()
  );

-- =====================================================
-- FUNCTION: Create tenant for registration (bypasses RLS)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_tenant_for_registration(
  p_name TEXT,
  p_slug TEXT,
  p_plan TEXT DEFAULT 'free'
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, slug, plan, is_active)
  VALUES (p_name, p_slug, p_plan, false)
  RETURNING id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_tenant_for_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_for_registration TO anon;

-- =====================================================
-- FUNCTION: Set user as host for a tenant (bypasses RLS)
-- Handles race condition where profile might not exist yet
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_user_as_host(
  p_user_id UUID,
  p_tenant_id UUID,
  p_full_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing profile
  UPDATE public.profiles
  SET 
    role = 'host',
    tenant_id = p_tenant_id,
    full_name = COALESCE(p_full_name, full_name)
  WHERE id = p_user_id;
  
  -- If no row was updated, the profile doesn't exist yet - insert it
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
    SELECT 
      p_user_id,
      email,
      COALESCE(p_full_name, ''),
      'host',
      p_tenant_id
    FROM auth.users
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_user_as_host TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_as_host TO anon;

