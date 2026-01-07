-- =====================================================
-- ADMIN TENANT MANAGEMENT FUNCTIONS
-- =====================================================
-- These functions allow super_admin to manage tenants
-- Uses SECURITY DEFINER to bypass RLS

-- Function to update tenant (for admin approval, deactivation, etc.)
CREATE OR REPLACE FUNCTION public.admin_update_tenant(
  p_tenant_id UUID,
  p_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_tenant RECORD;
  v_result JSONB;
BEGIN
  -- Verify caller is super_admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Update tenant with provided fields
  UPDATE public.tenants
  SET
    is_active = COALESCE((p_updates->>'is_active')::BOOLEAN, is_active),
    name = COALESCE(p_updates->>'name', name),
    slug = COALESCE(p_updates->>'slug', slug),
    primary_color = COALESCE(p_updates->>'primary_color', primary_color),
    plan = COALESCE(p_updates->>'plan', plan)
  WHERE id = p_tenant_id
  RETURNING * INTO v_tenant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;

  -- Return updated tenant as JSONB
  SELECT jsonb_build_object(
    'id', v_tenant.id,
    'name', v_tenant.name,
    'slug', v_tenant.slug,
    'is_active', v_tenant.is_active,
    'plan', v_tenant.plan,
    'primary_color', v_tenant.primary_color
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (actual auth check is inside function)
GRANT EXECUTE ON FUNCTION public.admin_update_tenant(UUID, JSONB) TO authenticated;


-- Function to delete tenant (for admin rejection)
CREATE OR REPLACE FUNCTION public.admin_delete_tenant(
  p_tenant_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Verify caller is super_admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Super admin required';
  END IF;

  -- Delete the tenant (CASCADE will handle related records)
  DELETE FROM public.tenants WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (actual auth check is inside function)
GRANT EXECUTE ON FUNCTION public.admin_delete_tenant(UUID) TO authenticated;


-- =====================================================
-- ALSO FIX: Ensure is_super_admin function is correct
-- =====================================================
-- Recreate to ensure it's using the right implementation
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

